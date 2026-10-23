import { sql } from 'drizzle-orm'
import type { DbExecutor } from '../db/types.js'

/**
 * Inventory invariant
 * -------------------
 *   stock    = physical units on hand (includes units held by reservations)
 *   reserved = units held by active reservations
 *   available = stock - reserved
 *
 * Reserving increments `reserved` atomically and is guarded by
 * `stock - reserved >= quantity`. Confirming decrements both `stock` and
 * `reserved`. Releasing only decrements `reserved`. Every mutation is a single
 * conditional UPDATE, so concurrent checkouts cannot pass an application-level
 * read-then-write race.
 */
export class ReservationUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReservationUnavailableError'
  }
}

export interface ReservationItem {
  productId: number
  variantId: number
  quantity: number
  isFreeSize?: boolean
  sku?: string
}

export interface ReservationRow {
  id: number
  orderId: number | null
  gatewayOrderId: string | null
  productId: number | null
  variantId: number | null
  quantity: number
  status: string
  expiresAt: Date
}

interface VariantStockRow {
  id: number
  product_id: number
  sku: string | null
  stock: number
  reserved: number
}

function mapReservation(row: Record<string, unknown>): ReservationRow {
  return {
    id: Number(row.id),
    orderId: row.order_id === null ? null : Number(row.order_id),
    gatewayOrderId: row.gateway_order_id === null ? null : String(row.gateway_order_id),
    productId: row.product_id === null ? null : Number(row.product_id),
    variantId: row.variant_id === null ? null : Number(row.variant_id),
    quantity: Number(row.quantity),
    status: String(row.status),
    expiresAt: new Date(String(row.expires_at))
  }
}

async function insertMovement(
  executor: DbExecutor,
  input: {
    productId: number | null
    variantId: number | null
    orderId?: number | null
    reservationId?: number | null
    sku?: string | null
    type: 'RESERVATION' | 'SALE' | 'RELEASE' | 'RETURN'
    delta: number
    before: number
    after: number
    reason: string
    reference: string
    dedupeKey: string
  }
): Promise<void> {
  await executor.execute(sql`
    INSERT INTO inventory_movements
      (product_id, variant_id, order_id, reservation_id, sku, type, delta, before, after, reason, reference, dedupe_key)
    VALUES
      (${input.productId}, ${input.variantId}, ${input.orderId ?? null}, ${input.reservationId ?? null},
       ${input.sku ?? null}, ${input.type}, ${input.delta}, ${input.before}, ${input.after},
       ${input.reason}, ${input.reference}, ${input.dedupeKey})
    ON CONFLICT DO NOTHING
  `)
}

async function productVariantCount(executor: DbExecutor, productId: number, activeOnly = false): Promise<number> {
  const result = activeOnly
    ? await executor.execute(sql`
        SELECT count(*)::int AS count FROM product_variants
        WHERE product_id = ${productId} AND status = 'Active'
      `)
    : await executor.execute(sql`
        SELECT count(*)::int AS count FROM product_variants WHERE product_id = ${productId}
      `)
  return Number((result.rows[0] as { count: number } | undefined)?.count ?? 0)
}

async function applyReservation(executor: DbExecutor, item: ReservationItem): Promise<VariantStockRow[]> {
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    throw new ReservationUnavailableError('Reservation quantity must be a positive integer.')
  }

  if (item.isFreeSize) {
    const updated = await executor.execute(sql`
      UPDATE product_variants
      SET reserved = reserved + ${item.quantity}, updated_at = now()
      WHERE product_id = ${item.productId}
        AND status = 'Active'
        AND stock - reserved >= ${item.quantity}
      RETURNING id, product_id, sku, stock, reserved
    `)
    const expected = await productVariantCount(executor, item.productId, true)
    if (expected === 0 || updated.rows.length !== expected) {
      throw new ReservationUnavailableError('This product does not have enough shared stock.')
    }
    return updated.rows as unknown as VariantStockRow[]
  }

  const updated = await executor.execute(sql`
    UPDATE product_variants
    SET reserved = reserved + ${item.quantity}, updated_at = now()
    WHERE id = ${item.variantId}
      AND product_id = ${item.productId}
      AND status = 'Active'
      AND stock - reserved >= ${item.quantity}
    RETURNING id, product_id, sku, stock, reserved
  `)
  if (updated.rows.length === 0) {
    throw new ReservationUnavailableError('This size does not have enough available stock.')
  }
  return updated.rows as unknown as VariantStockRow[]
}

async function releaseStock(
  executor: DbExecutor,
  item: {
    productId: number
    variantId: number
    quantity: number
    isFreeSize?: boolean
  }
): Promise<VariantStockRow[]> {
  if (item.isFreeSize) {
    const updated = await executor.execute(sql`
      UPDATE product_variants
      SET reserved = reserved - ${item.quantity}, updated_at = now()
      WHERE product_id = ${item.productId}
        AND status = 'Active'
        AND reserved >= ${item.quantity}
      RETURNING id, product_id, sku, stock, reserved
    `)
    const expected = await productVariantCount(executor, item.productId, true)
    if (expected === 0 || updated.rows.length !== expected) {
      throw new ReservationUnavailableError('Reserved stock is inconsistent for this product.')
    }
    return updated.rows as unknown as VariantStockRow[]
  }

  const updated = await executor.execute(sql`
    UPDATE product_variants
    SET reserved = reserved - ${item.quantity}, updated_at = now()
    WHERE id = ${item.variantId}
      AND reserved >= ${item.quantity}
    RETURNING id, product_id, sku, stock, reserved
  `)
  if (updated.rows.length === 0) {
    throw new ReservationUnavailableError('Reserved stock is inconsistent for this size.')
  }
  return updated.rows as unknown as VariantStockRow[]
}

async function confirmStock(
  executor: DbExecutor,
  item: {
    productId: number
    variantId: number
    quantity: number
    isFreeSize?: boolean
  }
): Promise<VariantStockRow[]> {
  if (item.isFreeSize) {
    const updated = await executor.execute(sql`
      UPDATE product_variants
      SET stock = stock - ${item.quantity}, reserved = reserved - ${item.quantity}, updated_at = now()
      WHERE product_id = ${item.productId}
        AND status = 'Active'
        AND stock >= ${item.quantity}
        AND reserved >= ${item.quantity}
      RETURNING id, product_id, sku, stock, reserved
    `)
    const expected = await productVariantCount(executor, item.productId, true)
    if (expected === 0 || updated.rows.length !== expected) {
      throw new ReservationUnavailableError('This product no longer has enough stock to complete the order.')
    }
    return updated.rows as unknown as VariantStockRow[]
  }

  const updated = await executor.execute(sql`
    UPDATE product_variants
    SET stock = stock - ${item.quantity}, reserved = reserved - ${item.quantity}, updated_at = now()
    WHERE id = ${item.variantId}
      AND stock >= ${item.quantity}
      AND reserved >= ${item.quantity}
    RETURNING id, product_id, sku, stock, reserved
  `)
  if (updated.rows.length === 0) {
    throw new ReservationUnavailableError('This size no longer has enough stock to complete the order.')
  }
  return updated.rows as unknown as VariantStockRow[]
}

async function getReservationForUpdate(executor: DbExecutor, id: number): Promise<ReservationRow | undefined> {
  const result = await executor.execute(sql`
    SELECT * FROM inventory_reservations WHERE id = ${id} FOR UPDATE
  `)
  const row = result.rows[0] as Record<string, unknown> | undefined
  return row ? mapReservation(row) : undefined
}

async function confirmOne(executor: DbExecutor, reservation: ReservationRow): Promise<boolean> {
  if (reservation.status === 'confirmed') return false
  if (reservation.status !== 'active') {
    throw new ReservationUnavailableError(`Reservation ${reservation.id} is ${reservation.status}.`)
  }
  if (!reservation.productId || !reservation.variantId) {
    throw new ReservationUnavailableError('Reservation is missing its product or variant reference.')
  }

  const item: ReservationItem = {
    productId: reservation.productId,
    variantId: reservation.variantId,
    quantity: reservation.quantity,
    // A free-size reservation mirrors the quantity across every size variant.
    isFreeSize: false
  }

  // The reservation row stores the requested variant. Free-size products are
  // detected from the catalog at confirmation time so a later flag change does
  // not silently split shared inventory.
  const productResult = await executor.execute(sql`
    SELECT is_free_size FROM products WHERE id = ${reservation.productId} FOR UPDATE
  `)
  item.isFreeSize = Boolean((productResult.rows[0] as { is_free_size?: boolean } | undefined)?.is_free_size)

  const variants = await confirmStock(executor, item)
  const updated = await executor.execute(sql`
    UPDATE inventory_reservations
    SET status = 'confirmed', confirmed_at = now(), updated_at = now()
    WHERE id = ${reservation.id} AND status = 'active'
    RETURNING id
  `)
  if (updated.rows.length === 0) {
    throw new ReservationUnavailableError('Reservation changed while it was being confirmed.')
  }

  for (const variant of variants) {
    await insertMovement(executor, {
      productId: variant.product_id,
      variantId: variant.id,
      orderId: reservation.orderId,
      reservationId: reservation.id,
      sku: variant.sku,
      type: 'SALE',
      delta: -reservation.quantity,
      before: variant.stock + reservation.quantity,
      after: variant.stock,
      reason: 'Order inventory confirmed',
      reference: reservation.orderId ? `order:${reservation.orderId}` : `reservation:${reservation.id}`,
      dedupeKey: `reservation:${reservation.id}:confirm:${variant.id}`
    })
  }
  return true
}

/**
 * Reserves inventory for a checkout. `orderId` and `gatewayOrderId` are both
 * optional so a Razorpay checkout can hold stock before the order exists, but
 * at least one reference is required by the table.
 */
export async function reserveInventory(
  executor: DbExecutor,
  options: {
    orderId?: number | null
    gatewayOrderId?: string | null
    reservationKeyPrefix: string
    items: ReservationItem[]
    ttlSeconds?: number
    reason?: string
  }
): Promise<{ reservations: ReservationRow[]; reused: boolean }> {
  if (!options.orderId && !options.gatewayOrderId) {
    throw new ReservationUnavailableError('A reservation needs an order or gateway order reference.')
  }
  if (options.items.length === 0) return { reservations: [], reused: false }

  if (options.gatewayOrderId) {
    const existing = await executor.execute(sql`
      SELECT * FROM inventory_reservations
      WHERE gateway_order_id = ${options.gatewayOrderId} AND status = 'active'
      ORDER BY id
    `)
    if (existing.rows.length > 0) {
      const rows = existing.rows.map((row) => mapReservation(row as Record<string, unknown>))
      const expected = new Map<string, number>()
      for (const item of options.items) {
        const key = `${item.productId}:${item.variantId}`
        expected.set(key, (expected.get(key) ?? 0) + item.quantity)
      }
      const actual = new Map<string, number>()
      for (const row of rows) {
        const key = `${row.productId}:${row.variantId}`
        actual.set(key, (actual.get(key) ?? 0) + row.quantity)
      }
      const matches =
        expected.size === actual.size && [...expected].every(([key, quantity]) => actual.get(key) === quantity)
      if (!matches) {
        throw new ReservationUnavailableError('A different cart is already reserved for this payment.')
      }
      return { reservations: rows, reused: true }
    }
  }

  const expiresAt = new Date(Date.now() + (options.ttlSeconds ?? 20 * 60) * 1000)
  const reservations: ReservationRow[] = []

  for (const [index, item] of options.items.entries()) {
    const reservationKey = `${options.reservationKeyPrefix}:${index}`
    const existingResult = await executor.execute(sql`
      SELECT * FROM inventory_reservations WHERE reservation_key = ${reservationKey} FOR UPDATE
    `)
    const existingRow = existingResult.rows[0] as Record<string, unknown> | undefined
    if (existingRow) {
      const existing = mapReservation(existingRow)
      if (existing.status === 'active') {
        reservations.push(existing)
        continue
      }
      throw new ReservationUnavailableError('This checkout has already been submitted.')
    }

    const variants = await applyReservation(executor, item)
    const inserted = await executor.execute(sql`
      INSERT INTO inventory_reservations
        (order_id, gateway_order_id, reservation_key, product_id, variant_id, quantity, status, expires_at)
      VALUES
        (${options.orderId ?? null}, ${options.gatewayOrderId ?? null}, ${reservationKey},
         ${item.productId}, ${item.variantId}, ${item.quantity}, 'active', ${expiresAt})
      RETURNING *
    `)
    const row = mapReservation(inserted.rows[0] as Record<string, unknown>)
    reservations.push(row)

    for (const variant of variants) {
      await insertMovement(executor, {
        productId: variant.product_id,
        variantId: variant.id,
        orderId: options.orderId ?? null,
        reservationId: row.id,
        sku: variant.sku ?? item.sku ?? null,
        type: 'RESERVATION',
        delta: 0,
        before: variant.stock,
        after: variant.stock,
        reason: options.reason ?? 'Checkout inventory reserved',
        reference: options.gatewayOrderId ? `gateway:${options.gatewayOrderId}` : `order:${options.orderId}`,
        dedupeKey: `reservation:${row.id}:reserve:${variant.id}`
      })
    }
  }

  return { reservations, reused: false }
}

/** Confirms every active reservation for an order (or gateway order). */
export async function confirmReservations(
  executor: DbExecutor,
  options: {
    orderId?: number | null
    gatewayOrderId?: string | null
    /** When provided, the active holds must match this cart exactly. */
    expectedItems?: ReservationItem[]
  }
): Promise<number> {
  if (!options.orderId && !options.gatewayOrderId) return 0

  const rows = options.gatewayOrderId
    ? await executor.execute(sql`
        SELECT * FROM inventory_reservations
        WHERE gateway_order_id = ${options.gatewayOrderId} AND status = 'active'
        ORDER BY id
        FOR UPDATE
      `)
    : await executor.execute(sql`
        SELECT * FROM inventory_reservations
        WHERE order_id = ${options.orderId} AND status = 'active'
        ORDER BY id
        FOR UPDATE
      `)

  if (options.expectedItems && rows.rows.length > 0) {
    const expected = new Map<string, number>()
    for (const item of options.expectedItems) {
      const key = `${item.productId}:${item.variantId}`
      expected.set(key, (expected.get(key) ?? 0) + item.quantity)
    }
    const actual = new Map<string, number>()
    for (const raw of rows.rows) {
      const reservation = mapReservation(raw as Record<string, unknown>)
      const key = `${reservation.productId}:${reservation.variantId}`
      actual.set(key, (actual.get(key) ?? 0) + reservation.quantity)
    }
    const matches =
      expected.size === actual.size && [...expected].every(([key, quantity]) => actual.get(key) === quantity)
    if (!matches) {
      throw new ReservationUnavailableError('The reserved cart no longer matches this order.')
    }
  }

  let confirmed = 0
  for (const raw of rows.rows) {
    const reservation = mapReservation(raw as Record<string, unknown>)
    if (options.orderId && reservation.orderId === null) {
      await executor.execute(sql`
        UPDATE inventory_reservations SET order_id = ${options.orderId}, updated_at = now()
        WHERE id = ${reservation.id}
      `)
      reservation.orderId = options.orderId
    }
    if (await confirmOne(executor, reservation)) confirmed += 1
  }
  return confirmed
}

async function releaseOne(
  executor: DbExecutor,
  reservation: ReservationRow,
  status: 'released' | 'expired',
  reason: string
): Promise<boolean> {
  if (reservation.status !== 'active') return false
  if (!reservation.productId || !reservation.variantId) {
    throw new ReservationUnavailableError('Reservation is missing its product or variant reference.')
  }

  const productResult = await executor.execute(sql`
    SELECT is_free_size FROM products WHERE id = ${reservation.productId} FOR UPDATE
  `)
  const isFreeSize = Boolean((productResult.rows[0] as { is_free_size?: boolean } | undefined)?.is_free_size)
  const variants = await releaseStock(executor, {
    productId: reservation.productId,
    variantId: reservation.variantId,
    quantity: reservation.quantity,
    isFreeSize
  })

  const updated = await executor.execute(sql`
    UPDATE inventory_reservations
    SET status = ${status}, released_at = now(), release_reason = ${reason}, updated_at = now()
    WHERE id = ${reservation.id} AND status = 'active'
    RETURNING id
  `)
  if (updated.rows.length === 0) return false

  for (const variant of variants) {
    await insertMovement(executor, {
      productId: variant.product_id,
      variantId: variant.id,
      orderId: reservation.orderId,
      reservationId: reservation.id,
      sku: variant.sku,
      type: 'RELEASE',
      delta: 0,
      before: variant.stock,
      after: variant.stock,
      reason,
      reference: reservation.orderId ? `order:${reservation.orderId}` : `reservation:${reservation.id}`,
      dedupeKey: `reservation:${reservation.id}:release:${variant.id}`
    })
  }
  return true
}

export async function releaseReservations(
  executor: DbExecutor,
  options: {
    orderId?: number | null
    gatewayOrderId?: string | null
    reason?: string
    status?: 'released' | 'expired'
  }
): Promise<number> {
  if (!options.orderId && !options.gatewayOrderId) return 0
  const rows = options.orderId
    ? await executor.execute(sql`
        SELECT * FROM inventory_reservations
        WHERE order_id = ${options.orderId} AND status = 'active'
        ORDER BY id FOR UPDATE
      `)
    : await executor.execute(sql`
        SELECT * FROM inventory_reservations
        WHERE gateway_order_id = ${options.gatewayOrderId} AND status = 'active'
        ORDER BY id FOR UPDATE
      `)

  let released = 0
  for (const raw of rows.rows) {
    const reservation = mapReservation(raw as Record<string, unknown>)
    if (
      await releaseOne(executor, reservation, options.status ?? 'released', options.reason ?? 'Reservation released')
    ) {
      released += 1
    }
  }
  return released
}

/**
 * Returns confirmed order units to stock when an order is cancelled or
 * returned. Only quantities that were actually sold are restored: a pending
 * order whose hold is merely released must not increase physical stock.
 *
 * Each restored variant is locked, its dedupe movement is inserted first, and
 * the stock update only runs when that movement is new. Concurrent or repeated
 * cancellations therefore cannot inflate stock.
 */
export async function restockOrder(executor: DbExecutor, orderId: number, reason = 'Order cancelled'): Promise<number> {
  const itemResult = await executor.execute(sql`
    SELECT oi.product_id, oi.variant_id, oi.quantity, p.is_free_size
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ${orderId} AND oi.variant_id IS NOT NULL
    ORDER BY oi.id
  `)

  const confirmedResult = await executor.execute(sql`
    SELECT variant_id, sum(quantity)::int AS quantity
    FROM inventory_reservations
    WHERE order_id = ${orderId} AND status = 'confirmed' AND variant_id IS NOT NULL
    GROUP BY variant_id
  `)
  const confirmedByVariant = new Map<number, number>()
  for (const raw of confirmedResult.rows) {
    const row = raw as { variant_id: number; quantity: number }
    confirmedByVariant.set(Number(row.variant_id), Number(row.quantity))
  }

  const reservationResult = await executor.execute(sql`
    SELECT count(*)::int AS count FROM inventory_reservations WHERE order_id = ${orderId}
  `)
  const hasReservations = Number((reservationResult.rows[0] as { count: number } | undefined)?.count ?? 0) > 0

  async function restoreVariant(variantId: number, quantity: number): Promise<boolean> {
    const locked = await executor.execute(sql`
      SELECT id, product_id, sku, stock FROM product_variants WHERE id = ${variantId} FOR UPDATE
    `)
    const variant = locked.rows[0] as { id: number; product_id: number; sku: string | null; stock: number } | undefined
    if (!variant) return false

    const before = Number(variant.stock)
    const dedupeKey = `order:${orderId}:restock:${variant.id}`
    const movement = await executor.execute(sql`
      INSERT INTO inventory_movements
        (product_id, variant_id, order_id, sku, type, delta, before, after, reason, reference, dedupe_key)
      VALUES
        (${variant.product_id}, ${variant.id}, ${orderId}, ${variant.sku}, 'RETURN', ${quantity},
         ${before}, ${before + quantity}, ${reason}, ${`order:${orderId}`}, ${dedupeKey})
      ON CONFLICT DO NOTHING
      RETURNING id
    `)
    if (movement.rows.length === 0) return false

    await executor.execute(sql`
      UPDATE product_variants SET stock = stock + ${quantity}, updated_at = now()
      WHERE id = ${variant.id}
    `)
    return true
  }

  let restored = 0
  for (const raw of itemResult.rows) {
    const item = raw as {
      product_id: number
      variant_id: number
      quantity: number
      is_free_size: boolean
    }
    // Legacy orders created before reservations were tracked have no rows at
    // all; their stock was deducted directly, so restore the sold items.
    const quantity = hasReservations ? (confirmedByVariant.get(Number(item.variant_id)) ?? 0) : Number(item.quantity)
    if (quantity <= 0) continue

    if (item.is_free_size) {
      const variants = await executor.execute(sql`
        SELECT id FROM product_variants
        WHERE product_id = ${item.product_id} AND status = 'Active'
        ORDER BY id
      `)
      for (const row of variants.rows) {
        if (await restoreVariant(Number((row as { id: number }).id), quantity)) restored += 1
      }
    } else if (await restoreVariant(Number(item.variant_id), quantity)) {
      restored += 1
    }
  }
  return restored
}

/**
 * Releases expired holds. Call opportunistically before reservations and from
 * the maintenance script; `FOR UPDATE SKIP LOCKED` keeps concurrent sweepers
 * from blocking each other.
 */
export async function expireReservations(executor: DbExecutor, limit = 100): Promise<number> {
  const rows = await executor.execute(sql`
    SELECT * FROM inventory_reservations
    WHERE status = 'active' AND expires_at <= now()
    ORDER BY expires_at
    LIMIT ${Math.max(1, Math.min(limit, 1000))}
    FOR UPDATE SKIP LOCKED
  `)

  let expired = 0
  for (const raw of rows.rows) {
    const reservation = mapReservation(raw as Record<string, unknown>)
    if (await releaseOne(executor, reservation, 'expired', 'Checkout reservation expired')) {
      expired += 1
    }
  }
  return expired
}
