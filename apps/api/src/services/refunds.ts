import { sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import type { DbExecutor } from '../db/types.js'

export class RefundError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'RefundError'
    this.statusCode = statusCode
  }
}

export interface RefundRecord {
  id: number
  number: string
  orderId: number
  paymentId: number | null
  amount: number
  status: string
  method: string
}

function mapRefund(row: Record<string, unknown>): RefundRecord {
  return {
    id: Number(row.id),
    number: String(row.number),
    orderId: Number(row.order_id),
    paymentId: row.payment_id === null ? null : Number(row.payment_id),
    amount: Number(row.amount),
    status: String(row.status),
    method: String(row.method)
  }
}

/**
 * Creates a refund request. The order and payment rows are locked, and the
 * pending + processed refund total may never exceed the amount captured for
 * the selected payment. This is a cross-row invariant that a CHECK constraint
 * cannot enforce safely.
 */
export async function createRefund(input: {
  orderId: number
  amount: number
  reason?: string
  method?: string
  gatewayRefundId?: string | null
  idempotencyKey?: string | null
  actorName?: string
}): Promise<RefundRecord> {
  if (!isDatabaseConfigured() || !db) throw new RefundError('Refund database is not configured.', 503)
  const amount = Math.round(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new RefundError('Refund amount must be greater than zero.')

  return db.transaction(async (tx) => {
    const executor = tx as unknown as DbExecutor

    const orderResult = await executor.execute(sql`
      SELECT id, customer_id, total, payment_status FROM orders WHERE id = ${input.orderId} FOR UPDATE
    `)
    const order = orderResult.rows[0] as
      | {
          id: number
          customer_id: number
          total: number
          payment_status: string
        }
      | undefined
    if (!order) throw new RefundError('Order not found.', 404)

    const paymentResult = await executor.execute(sql`
      SELECT * FROM payments
      WHERE order_id = ${input.orderId} AND status IN ('Paid', 'Refunded')
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `)
    const payment = paymentResult.rows[0] as Record<string, unknown> | undefined
    const captured = payment ? Number(payment.amount) : Number(order.total)
    if (!payment && order.payment_status !== 'Paid' && order.payment_status !== 'Refunded') {
      throw new RefundError('Only paid orders can be refunded.', 409)
    }

    // Replays must return the original refund before the eligibility check:
    // a completed refund already counts against the captured amount, so the
    // same request would otherwise look like an over-refund.
    if (input.idempotencyKey) {
      const existing = await executor.execute(sql`
        SELECT * FROM refunds WHERE idempotency_key = ${input.idempotencyKey} LIMIT 1
      `)
      const row = existing.rows[0] as Record<string, unknown> | undefined
      if (row) return mapRefund(row)
    }

    const committed = await executor.execute(sql`
      SELECT COALESCE(sum(amount), 0)::int AS total
      FROM refunds
      WHERE order_id = ${input.orderId} AND status IN ('Pending', 'Processed')
    `)
    const alreadyCommitted = Number((committed.rows[0] as { total: number } | undefined)?.total ?? 0)
    if (alreadyCommitted + amount > captured) {
      throw new RefundError('Refund exceeds the amount still eligible for refund.', 409)
    }

    const countResult = await executor.execute(sql`
      SELECT count(*)::int AS count FROM refunds WHERE order_id = ${input.orderId}
    `)
    const sequence = Number((countResult.rows[0] as { count: number } | undefined)?.count ?? 0) + 1
    const number = `REF-${input.orderId}-${sequence}-${Date.now().toString().slice(-6)}`

    const inserted = await executor.execute(sql`
      INSERT INTO refunds
        (number, order_id, customer_id, payment_id, amount, reason, method, status,
         gateway_refund_id, idempotency_key, created_at, updated_at)
      VALUES
        (${number}, ${input.orderId}, ${order.customer_id},
         ${payment ? Number(payment.id) : null}, ${amount}, ${input.reason ?? null},
         ${input.method ?? 'Manual'}, 'Pending', ${input.gatewayRefundId ?? null},
         ${input.idempotencyKey ?? null}, now(), now())
      RETURNING *
    `)

    await executor.execute(sql`
      INSERT INTO order_events (order_id, kind, status, note, is_internal, actor_name, created_at)
      VALUES (${input.orderId}, 'refund', 'Pending', ${`Refund ${number} requested for ₹${amount}`},
              true, ${input.actorName ?? 'Administrator'}, now())
    `)

    return mapRefund(inserted.rows[0] as Record<string, unknown>)
  })
}

export async function updateRefundStatus(input: {
  refundId: number
  status: 'Processed' | 'Failed'
  failureReason?: string
  actorName?: string
}): Promise<RefundRecord> {
  if (!isDatabaseConfigured() || !db) throw new RefundError('Refund database is not configured.', 503)

  return db.transaction(async (tx) => {
    const executor = tx as unknown as DbExecutor
    const result = await executor.execute(sql`
      SELECT * FROM refunds WHERE id = ${input.refundId} FOR UPDATE
    `)
    const refund = result.rows[0] as Record<string, unknown> | undefined
    if (!refund) throw new RefundError('Refund not found.', 404)
    if (refund.status === input.status) return mapRefund(refund)

    const amount = Number(refund.amount)
    const orderId = Number(refund.order_id)
    const paymentId = refund.payment_id === null ? null : Number(refund.payment_id)

    if (input.status === 'Processed' && paymentId) {
      const paymentResult = await executor.execute(sql`
        SELECT * FROM payments WHERE id = ${paymentId} FOR UPDATE
      `)
      const payment = paymentResult.rows[0] as Record<string, unknown> | undefined
      if (!payment) throw new RefundError('Linked payment not found.', 409)
      const captured = Number(payment.amount)
      const refunded = Number(payment.amount_refunded ?? 0)
      if (refunded + amount > captured) {
        throw new RefundError('Refund exceeds the captured payment amount.', 409)
      }
      await executor.execute(sql`
        UPDATE payments SET amount_refunded = amount_refunded + ${amount}, updated_at = now()
        WHERE id = ${paymentId}
      `)
      const totalRefunded = refunded + amount
      await executor.execute(sql`
        UPDATE orders
        SET payment_status = ${totalRefunded >= captured ? 'Refunded' : 'Paid'}, updated_at = now()
        WHERE id = ${orderId}
      `)
    }

    const updated = await executor.execute(sql`
      UPDATE refunds
      SET status = ${input.status},
          processed_at = ${input.status === 'Processed' ? new Date() : null},
          failure_reason = ${input.status === 'Failed' ? (input.failureReason ?? 'Refund failed.') : null},
          updated_at = now()
      WHERE id = ${input.refundId} AND status = 'Pending'
      RETURNING *
    `)
    if (!updated.rows[0]) throw new RefundError('Refund has already been finalised.', 409)

    await executor.execute(sql`
      INSERT INTO order_events (order_id, kind, status, note, is_internal, actor_name, created_at)
      VALUES (${orderId}, 'refund', ${input.status}, ${`Refund ${String(refund.number)} marked ${input.status}`},
              true, ${input.actorName ?? 'Administrator'}, now())
    `)

    return mapRefund(updated.rows[0] as Record<string, unknown>)
  })
}
