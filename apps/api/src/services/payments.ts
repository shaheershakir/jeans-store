import { sql } from 'drizzle-orm'
import { payments } from '@jeans-store/db'
import { db, isDatabaseConfigured } from '../db/index.js'
import type { DbExecutor } from '../db/types.js'
import { confirmReservations } from './inventory.js'

export class PaymentError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 409) {
    super(message)
    this.name = 'PaymentError'
    this.statusCode = statusCode
  }
}

export interface PaymentAttempt {
  id: number
  orderId: number | null
  orderNumber: string | null
  amount: number
  amountRefunded: number
  currency: string
  status: string
  gateway: string
  gatewayOrderId: string | null
  gatewayPaymentId: string | null
  idempotencyKey: string | null
}

function mapAttempt(row: Record<string, unknown>): PaymentAttempt {
  return {
    id: Number(row.id),
    orderId: row.order_id === null ? null : Number(row.order_id),
    orderNumber: row.order_number === null ? null : String(row.order_number),
    amount: Number(row.amount),
    amountRefunded: Number(row.amount_refunded ?? 0),
    currency: String(row.currency ?? 'INR'),
    status: String(row.status),
    gateway: String(row.gateway),
    gatewayOrderId: row.gateway_order_id === null ? null : String(row.gateway_order_id),
    gatewayPaymentId: row.gateway_payment_id === null ? null : String(row.gateway_payment_id),
    idempotencyKey: row.idempotency_key === null ? null : String(row.idempotency_key)
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asPaise(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined
}

/** Creates (or safely reuses) a payment attempt before an order exists. */
export async function createPaymentAttempt(input: {
  orderNumber: string
  amount: number
  currency?: string
  gatewayOrderId: string
  method?: string
  idempotencyKey?: string
}): Promise<PaymentAttempt> {
  if (!isDatabaseConfigured() || !db) {
    throw new PaymentError('Payment database is not configured.', 503)
  }

  const [inserted] = await db
    .insert(payments)
    .values({
      orderNumber: input.orderNumber,
      amount: Math.max(0, Math.round(input.amount)),
      currency: input.currency ?? 'INR',
      gateway: 'razorpay',
      gatewayOrderId: input.gatewayOrderId,
      method: input.method ?? 'Razorpay',
      status: 'Pending',
      idempotencyKey: input.idempotencyKey ?? null
    })
    .onConflictDoNothing()
    .returning()

  if (inserted) return mapAttempt(inserted as unknown as Record<string, unknown>)

  const existing = await findAttemptByGatewayOrderId(db, input.gatewayOrderId)
  if (!existing) throw new PaymentError('Could not record the payment attempt.', 500)
  return existing
}

export async function findAttemptByGatewayOrderId(
  executor: DbExecutor,
  gatewayOrderId: string
): Promise<PaymentAttempt | undefined> {
  const result = await executor.execute(sql`
    SELECT * FROM payments WHERE gateway = 'razorpay' AND gateway_order_id = ${gatewayOrderId} LIMIT 1
  `)
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? mapAttempt(row) : undefined
}

export async function findAttemptByGatewayPaymentId(
  executor: DbExecutor,
  gatewayPaymentId: string
): Promise<PaymentAttempt | undefined> {
  const result = await executor.execute(sql`
    SELECT * FROM payments WHERE gateway = 'razorpay' AND gateway_payment_id = ${gatewayPaymentId} LIMIT 1
  `)
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? mapAttempt(row) : undefined
}

export async function markAttemptFailed(
  executor: DbExecutor,
  input: { gatewayOrderId?: string; gatewayPaymentId?: string; reason: string }
): Promise<void> {
  if (input.gatewayOrderId) {
    await executor.execute(sql`
      UPDATE payments
      SET status = 'Failed', failure_reason = ${input.reason}, updated_at = now()
      WHERE gateway = 'razorpay'
        AND gateway_order_id = ${input.gatewayOrderId}
        AND status IN ('Pending', 'Authorized')
    `)
  }
  if (input.gatewayPaymentId) {
    await executor.execute(sql`
      UPDATE payments
      SET gateway_payment_id = ${input.gatewayPaymentId}, status = 'Failed',
          failure_reason = ${input.reason}, updated_at = now()
      WHERE gateway = 'razorpay'
        AND gateway_payment_id = ${input.gatewayPaymentId}
        AND status IN ('Pending', 'Authorized')
    `)
  }
}

/**
 * Idempotently finalises a verified payment against an existing order:
 * validates the amount, marks the payment paid, confirms inventory and writes
 * an audit event. Safe to call from both the browser verification route and
 * duplicate webhooks.
 */
export async function confirmOrderPayment(
  executor: DbExecutor,
  input: {
    orderId: number
    amount: number
    gatewayOrderId?: string | null
    gatewayPaymentId: string
    actorName?: string
  }
): Promise<{ orderId: number; changed: boolean }> {
  const orderResult = await executor.execute(sql`
    SELECT id, total, payment_status, status, handoff_type
    FROM orders WHERE id = ${input.orderId} FOR UPDATE
  `)
  const order = orderResult.rows[0] as
    | {
        id: number
        total: number
        payment_status: string
        status: string
        handoff_type: string
      }
    | undefined
  if (!order) throw new PaymentError('Order not found.', 404)
  if (Number(order.total) !== Math.round(input.amount)) {
    throw new PaymentError('Captured payment amount does not match the order total.')
  }

  const paymentResult = await executor.execute(sql`
    SELECT * FROM payments
    WHERE gateway = 'razorpay'
      AND (gateway_order_id = ${input.gatewayOrderId ?? null} OR gateway_payment_id = ${input.gatewayPaymentId})
    ORDER BY id
    LIMIT 1
    FOR UPDATE
  `)
  let payment = paymentResult.rows[0] as Record<string, unknown> | undefined

  if (!payment) {
    const inserted = await executor.execute(sql`
      INSERT INTO payments
        (order_id, order_number, method, amount, currency, status, gateway, gateway_order_id, gateway_payment_id, settled_at, verified_at)
      SELECT ${input.orderId}, order_number, 'Razorpay', ${Math.round(input.amount)}, 'INR', 'Paid',
             'razorpay', ${input.gatewayOrderId ?? null}, ${input.gatewayPaymentId}, now(), now()
      FROM orders WHERE id = ${input.orderId}
      RETURNING *
    `)
    payment = inserted.rows[0] as Record<string, unknown> | undefined
  }
  if (!payment) throw new PaymentError('Could not record the payment.', 500)

  const existingPaymentOrderId = payment.order_id === null ? null : Number(payment.order_id)
  if (existingPaymentOrderId !== null && existingPaymentOrderId !== input.orderId) {
    throw new PaymentError('This payment is already linked to another order.')
  }
  const existingGatewayPaymentId = asString(payment.gateway_payment_id)
  if (existingGatewayPaymentId && existingGatewayPaymentId !== input.gatewayPaymentId) {
    throw new PaymentError('This payment attempt is already linked to another gateway payment.')
  }

  const wasPaid = order.payment_status === 'Paid' || order.payment_status === 'Refunded'

  await executor.execute(sql`
    UPDATE payments
    SET order_id = ${input.orderId},
        gateway_payment_id = ${input.gatewayPaymentId},
        status = CASE WHEN status = 'Refunded' THEN status ELSE 'Paid' END,
        settled_at = COALESCE(settled_at, now()),
        verified_at = COALESCE(verified_at, now()),
        failure_reason = NULL,
        updated_at = now()
    WHERE id = ${Number(payment.id)}
  `)

  await executor.execute(sql`
    UPDATE orders
    SET payment_status = CASE WHEN payment_status = 'Refunded' THEN payment_status ELSE 'Paid' END,
        status = CASE WHEN status = 'Pending' THEN 'Confirmed' ELSE status END,
        updated_at = now()
    WHERE id = ${input.orderId}
  `)

  await confirmReservations(executor, { orderId: input.orderId })

  if (!wasPaid) {
    await executor.execute(sql`
      INSERT INTO order_events (order_id, kind, status, note, is_internal, actor_name, created_at)
      VALUES (${input.orderId}, 'payment', 'Paid', ${`Payment verified (${input.gatewayPaymentId})`}, false, ${input.actorName ?? 'System'}, now())
    `)
  }

  return { orderId: input.orderId, changed: !wasPaid }
}

export interface WebhookResult {
  duplicate: boolean
  status: 'Processed' | 'Ignored' | 'Unmatched' | 'Failed'
  message?: string
}

/**
 * Records and processes a Razorpay webhook inside one transaction. The unique
 * (provider, event_id) index makes duplicate deliveries safe. Unmatched events
 * are retained for manual reconciliation rather than silently dropped.
 */
export async function processRazorpayWebhook(
  payload: Record<string, unknown>,
  headers: { eventId: string; eventType: string }
): Promise<WebhookResult> {
  if (!isDatabaseConfigured() || !db) {
    throw new PaymentError('Payment database is not configured.', 503)
  }

  return db.transaction(async (tx) => {
    const executor = tx as unknown as DbExecutor
    const insertResult = await executor.execute(sql`
      INSERT INTO payment_events (provider, event_id, event_type, gateway_order_id, gateway_payment_id, payload, status, attempts)
      VALUES ('razorpay', ${headers.eventId}, ${headers.eventType}, NULL, NULL, ${JSON.stringify(payload)}::jsonb, 'Received', 1)
      ON CONFLICT (provider, event_id) DO NOTHING
      RETURNING id, status
    `)

    let eventRow = insertResult.rows[0] as { id: number; status: string } | undefined
    if (!eventRow) {
      const existing = await executor.execute(sql`
        SELECT id, status FROM payment_events
        WHERE provider = 'razorpay' AND event_id = ${headers.eventId}
        FOR UPDATE
      `)
      const row = existing.rows[0] as { id: number; status: string } | undefined
      if (!row) return { duplicate: true, status: 'Ignored' as const }
      if (row.status === 'Processed' || row.status === 'Ignored' || row.status === 'Unmatched') {
        return {
          duplicate: true,
          status: row.status as WebhookResult['status']
        }
      }
      eventRow = row
      await executor.execute(sql`
        UPDATE payment_events SET attempts = attempts + 1, status = 'Received' WHERE id = ${row.id}
      `)
    }

    const eventPayload = asRecord(payload.payload)
    const paymentEntity = asRecord(asRecord(eventPayload.payment).entity)
    const orderEntity = asRecord(asRecord(eventPayload.order).entity)
    const refundEntity = asRecord(asRecord(eventPayload.refund).entity)

    const gatewayOrderId =
      asString(paymentEntity.order_id) ?? asString(orderEntity.id) ?? asString(refundEntity.order_id)
    const gatewayPaymentId = asString(paymentEntity.id) ?? asString(refundEntity.payment_id)

    await executor.execute(sql`
      UPDATE payment_events
      SET gateway_order_id = ${gatewayOrderId ?? null}, gateway_payment_id = ${gatewayPaymentId ?? null}
      WHERE id = ${eventRow.id}
    `)

    const eventType = headers.eventType

    try {
      const result = await tx.transaction(async (innerTx) => {
        const executor = innerTx as unknown as DbExecutor

        let status: WebhookResult['status'] = 'Ignored'
        let message: string | undefined

        if (eventType === 'payment.captured' || eventType === 'order.paid') {
          const attempt = gatewayOrderId ? await findAttemptByGatewayOrderId(executor, gatewayOrderId) : undefined
          const amountPaise = asPaise(paymentEntity.amount) ?? asPaise(orderEntity.amount_paid)
          if (!attempt) {
            status = 'Unmatched'
            message = 'Captured payment has no matching internal payment attempt.'
          } else {
            if (amountPaise !== undefined && Math.round(attempt.amount * 100) !== amountPaise) {
              throw new PaymentError('Webhook amount does not match the recorded payment attempt.')
            }
            if (!gatewayPaymentId) {
              status = 'Unmatched'
              message = 'Captured payment event is missing the gateway payment id.'
            } else if (attempt.orderId) {
              await confirmOrderPayment(executor, {
                orderId: attempt.orderId,
                amount: attempt.amount,
                gatewayOrderId,
                gatewayPaymentId,
                actorName: 'Razorpay webhook'
              })
              status = 'Processed'
            } else {
              await executor.execute(sql`
              UPDATE payments
              SET status = 'Paid', gateway_payment_id = ${gatewayPaymentId ?? null},
                  verified_at = now(), settled_at = COALESCE(settled_at, now()), updated_at = now()
              WHERE id = ${attempt.id}
                AND status IN ('Pending', 'Authorized', 'Paid')
            `)
              status = 'Unmatched'
              message = 'Payment captured before the order was verified.'
            }
          }
        } else if (eventType === 'payment.failed') {
          if (!gatewayOrderId && !gatewayPaymentId) {
            status = 'Ignored'
          } else {
            await markAttemptFailed(executor, {
              gatewayOrderId,
              gatewayPaymentId,
              reason: asString(paymentEntity.error_description) ?? 'Razorpay reported the payment as failed.'
            })
            status = 'Processed'
          }
        } else if (eventType === 'payment.authorized') {
          if (gatewayOrderId) {
            await executor.execute(sql`
            UPDATE payments
            SET status = 'Authorized', gateway_payment_id = COALESCE(gateway_payment_id, ${gatewayPaymentId ?? null}),
                updated_at = now()
            WHERE gateway = 'razorpay' AND gateway_order_id = ${gatewayOrderId}
              AND status IN ('Pending', 'Authorized')
          `)
            status = 'Processed'
          }
        } else if (eventType.startsWith('refund.')) {
          const refundResult = await applyRefundWebhook(executor, {
            eventType,
            refundEntity,
            gatewayPaymentId
          })
          status = refundResult.status
          message = refundResult.message
        }

        return { status, message }
      })

      await executor.execute(sql`
        UPDATE payment_events
        SET status = ${result.status}, last_error = ${result.message ?? null},
            processed_at = ${result.status === 'Failed' ? null : new Date()}
        WHERE id = ${eventRow.id}
      `)
      return {
        duplicate: false,
        status: result.status,
        message: result.message
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed.'
      await executor.execute(sql`
        UPDATE payment_events
        SET status = 'Failed', last_error = ${message}, attempts = attempts + 1
        WHERE id = ${eventRow.id}
      `)
      return { duplicate: false, status: 'Failed', message }
    }
  })
}

async function applyRefundWebhook(
  executor: DbExecutor,
  input: {
    eventType: string
    refundEntity: Record<string, unknown>
    gatewayPaymentId?: string
  }
): Promise<{ status: WebhookResult['status']; message?: string }> {
  const gatewayRefundId = asString(input.refundEntity.id)
  const paymentId = asString(input.refundEntity.payment_id) ?? input.gatewayPaymentId
  const amount = asPaise(input.refundEntity.amount)
  if (!gatewayRefundId || !paymentId || amount === undefined) {
    return {
      status: 'Ignored',
      message: 'Refund event is missing an id, payment id or amount.'
    }
  }

  const paymentResult = await executor.execute(sql`
    SELECT * FROM payments WHERE gateway = 'razorpay' AND gateway_payment_id = ${paymentId} LIMIT 1 FOR UPDATE
  `)
  const payment = paymentResult.rows[0] as Record<string, unknown> | undefined
  if (!payment) {
    return {
      status: 'Unmatched',
      message: 'Refund references an unknown payment.'
    }
  }
  const paymentIdInternal = Number(payment.id)
  const paymentAmount = Number(payment.amount)
  // Internal money is integer rupees. Floor (never round up) so a fractional
  // paise refund can never be recorded as more than the gateway refunded and
  // cannot push the refund total above the captured amount.
  const amountInr = Math.floor(amount / 100)
  const status =
    input.eventType === 'refund.processed' ? 'Processed' : input.eventType === 'refund.failed' ? 'Failed' : 'Pending'

  const existing = await executor.execute(sql`
    SELECT id FROM refunds WHERE method = 'Razorpay' AND gateway_refund_id = ${gatewayRefundId} FOR UPDATE
  `)
  const existingId = existing.rows[0] ? Number((existing.rows[0] as { id: number }).id) : null

  if (existingId) {
    await executor.execute(sql`
      UPDATE refunds
      SET status = ${status},
          processed_at = ${status === 'Processed' ? new Date() : null},
          failure_reason = ${status === 'Failed' ? 'Razorpay reported the refund as failed.' : null},
          updated_at = now()
      WHERE id = ${existingId}
    `)
  } else {
    const orderId = payment.order_id === null ? null : Number(payment.order_id)
    if (!orderId) {
      return {
        status: 'Unmatched',
        message: 'Refund payment is not linked to an order.'
      }
    }
    const refundCount = await executor.execute(
      sql`SELECT count(*)::int AS count FROM refunds WHERE order_id = ${orderId}`
    )
    const sequence = Number((refundCount.rows[0] as { count: number } | undefined)?.count ?? 0) + 1
    await executor.execute(sql`
      INSERT INTO refunds
        (number, order_id, customer_id, payment_id, amount, reason, method, status, gateway_refund_id, processed_at, created_at, updated_at)
      SELECT ${`RZP-REF-${orderId}-${sequence}`}, ${orderId}, customer_id, ${paymentIdInternal}, ${amountInr},
             'Razorpay refund', 'Razorpay', ${status}, ${gatewayRefundId},
             ${status === 'Processed' ? new Date() : null}, now(), now()
      FROM orders WHERE id = ${orderId}
    `)
  }

  const processedSum = await executor.execute(sql`
    SELECT COALESCE(sum(amount), 0)::int AS total
    FROM refunds WHERE payment_id = ${paymentIdInternal} AND status = 'Processed'
  `)
  const refunded = Number((processedSum.rows[0] as { total: number } | undefined)?.total ?? 0)
  if (refunded > paymentAmount) {
    throw new PaymentError('Processed refunds exceed the captured payment amount.')
  }

  await executor.execute(sql`
    UPDATE payments SET amount_refunded = ${refunded}, updated_at = now() WHERE id = ${paymentIdInternal}
  `)
  if (payment.order_id !== null) {
    const orderId = Number(payment.order_id)
    await executor.execute(sql`
      UPDATE orders
      SET payment_status = ${refunded >= paymentAmount ? 'Refunded' : 'Paid'}, updated_at = now()
      WHERE id = ${orderId}
    `)
    await executor.execute(sql`
      INSERT INTO order_events (order_id, kind, status, note, is_internal, actor_name, created_at)
      VALUES (${orderId}, 'refund', ${status}, ${`Razorpay refund ${gatewayRefundId} (${status})`}, true, 'Razorpay webhook', now())
    `)
  }

  return { status: 'Processed' }
}
