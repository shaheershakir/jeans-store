import { desc, eq, inArray, notInArray, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  auditLog,
  categories,
  collections,
  couponCategories,
  couponProducts,
  couponRedemptions,
  coupons,
  customerAddresses,
  customers,
  payments,
  inventoryMovements,
  notifications,
  orders,
  productReviews,
  productVariants,
  products,
  refunds,
  shipments,
  sizeChartMeasurements,
  sizeCharts,
  storeSettings
} from '@jeans-store/db'

const SETTINGS_ID = 'default'
let memoryState: Record<string, unknown> = {}

export function _resetMemoryStateForTesting(): void {
  memoryState = {}
}

function iso(value: Date | string | null | undefined): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function dateOrNull(value: unknown): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function numberOrZero(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringOrEmpty(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

async function getSettings(): Promise<Record<string, unknown>> {
  const [row] = await db!.select().from(storeSettings).where(eq(storeSettings.id, SETTINGS_ID))
  return {
    storeName: row?.storeName ?? 'TEESGARAGE',
    supportEmail: row?.supportEmail ?? '',
    supportPhone: row?.supportPhone ?? '',
    address: row?.address ?? '',
    currency: row?.currency ?? 'INR',
    orderPrefix: row?.orderPrefix ?? 'TG'
  }
}

export async function getAdminState(): Promise<Record<string, unknown>> {
  if (!isDatabaseConfigured() || !db) {
    if (process.env.NODE_ENV === 'production') throw new Error('Admin state database is not configured.')
    return structuredClone(memoryState)
  }

  const [
    collectionRows,
    couponRows,
    couponProductRows,
    couponCategoryRows,
    reviewRows,
    sizeChartRows,
    measurementRows,
    shipmentRows,
    movementRows,
    auditRows,
    notificationRows,
    refundRows,
    customerRows,
    addressRows,
    paymentRows,
    settings
  ] = await Promise.all([
    db.select().from(collections).orderBy(collections.sortOrder),
    db.select().from(coupons).orderBy(coupons.id),
    db.select().from(couponProducts),
    db.select().from(couponCategories),
    db.select().from(productReviews).orderBy(desc(productReviews.createdAt)),
    db.select().from(sizeCharts).orderBy(sizeCharts.id),
    db.select().from(sizeChartMeasurements),
    db.select().from(shipments).orderBy(desc(shipments.createdAt)),
    db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(200),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(200),
    db.select().from(refunds).orderBy(desc(refunds.createdAt)),
    db.select().from(customers).orderBy(customers.id),
    db.select().from(customerAddresses),
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    getSettings()
  ])

  const productIdsByCoupon = new Map<number, string[]>()
  for (const row of couponProductRows) {
    const list = productIdsByCoupon.get(row.couponId) ?? []
    list.push(row.productId)
    productIdsByCoupon.set(row.couponId, list)
  }
  const categoryIdsByCoupon = new Map<number, number[]>()
  for (const row of couponCategoryRows) {
    const list = categoryIdsByCoupon.get(row.couponId) ?? []
    list.push(row.categoryId)
    categoryIdsByCoupon.set(row.couponId, list)
  }

  const measurementsByChart = new Map<number, typeof measurementRows>()
  for (const row of measurementRows) {
    const list = measurementsByChart.get(row.sizeChartId) ?? []
    list.push(row)
    measurementsByChart.set(row.sizeChartId, list)
  }

  const addressesByCustomer = new Map<number, Array<{
    id: number
    label: 'Home' | 'Work'
    line1: string
    line2: string
    city: string
    state: string
    pincode: string
    phone: string
  }>>()

  for (const addr of addressRows) {
    const list = addressesByCustomer.get(addr.customerId) ?? []
    list.push({
      id: addr.id,
      label: (addr.label === 'Work' ? 'Work' : 'Home') as 'Home' | 'Work',
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone ?? ''
    })
    addressesByCustomer.set(addr.customerId, list)
  }

  return {
    collections: collectionRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      status: row.status
    })),
    customers: customerRows.map((row) => {
      const addrs = addressesByCustomer.get(row.id) ?? []
      const defaultAddr = addrs[0]
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? '',
        city: defaultAddr?.city ?? '',
        state: defaultAddr?.state ?? '',
        pincode: defaultAddr?.pincode ?? '',
        joinedAt: iso(row.createdAt),
        addresses: addrs
      }
    }),
    refunds: refundRows.map((row) => ({
      id: row.id,
      number: row.number,
      orderId: row.orderId,
      customerId: row.customerId ?? 0,
      amount: row.amount,
      reason: row.reason ?? '',
      method: row.method,
      status: row.status,
      createdAt: iso(row.createdAt),
      processedAt: row.processedAt ? iso(row.processedAt) : null
    })),
    coupons: couponRows.map((row) => ({
      id: row.id,
      code: row.code,
      type: row.type,
      value: row.value,
      minOrderValue: row.minOrderValue,
      maxDiscount: row.maxDiscount,
      startsAt: iso(row.startsAt),
      endsAt: iso(row.endsAt),
      usageLimit: row.usageLimit,
      perCustomerLimit: row.perCustomerLimit,
      productIds: productIdsByCoupon.get(row.id) ?? [],
      categoryIds: categoryIdsByCoupon.get(row.id) ?? [],
      isActive: row.isActive,
      timesUsed: (row as any).timesUsed ?? 0
    })),
    reviews: reviewRows.map((row) => ({
      id: row.id,
      customerId: row.customerId ?? 0,
      productId: row.productId,
      rating: row.rating,
      title: row.title ?? '',
      content: row.content,
      status: row.status,
      verified: row.isVerifiedPurchase,
      createdAt: iso(row.createdAt),
      response: row.merchantResponse,
      respondedAt: row.respondedAt ? iso(row.respondedAt) : null
    })),
    sizeCharts: sizeChartRows.map((row) => ({
      id: row.id,
      categoryId: row.categoryId,
      description: row.description ?? '',
      measurements: (measurementsByChart.get(row.id) ?? []).map((measurement) => ({
        size: Number(measurement.size),
        waist: measurement.waist ?? 0,
        hip: measurement.hip ?? 0,
        inseam: measurement.inseam ?? 0,
        thigh: measurement.thigh ?? 0
      }))
    })),
    shipments: shipmentRows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      carrier: row.carrier,
      trackingNumber: row.trackingNumber,
      status: row.status,
      shippedAt: row.shippedAt ? iso(row.shippedAt) : null,
      eta: iso(row.eta)
    })),
    inventoryMovements: movementRows.map((row) => ({
      id: row.id,
      productId: row.productId ?? '',
      variantId: row.variantId ?? 0,
      sku: row.sku ?? '',
      type: row.type,
      delta: row.delta,
      before: row.before,
      after: row.after,
      reason: row.reason ?? '',
      reference: row.reference ?? '',
      userId: 0,
      userName: row.actorName ?? '',
      createdAt: iso(row.createdAt)
    })),
    auditLog: auditRows.map((row) => ({
      id: row.id,
      userId: 0,
      userName: row.actorName ?? '',
      action: row.action,
      entity: row.entity ?? '',
      entityId: row.entityId ?? '',
      detail: row.detail ?? '',
      at: iso(row.createdAt)
    })),
    payments: paymentRows.map((row) => ({
      id: row.id,
      orderId: row.orderId ?? 0,
      method: (row.method === 'COD' ? 'COD' : 'Razorpay') as any,
      amount: row.amount,
      status: (row.status === 'Captured' || row.status === 'Paid' ? 'Paid' : row.status === 'Failed' ? 'Failed' : 'Pending') as any,
      gateway: row.gateway,
      gatewayFee: null,
      settled: row.status === 'Captured' || row.status === 'Paid',
      createdAt: iso(row.createdAt),
      settledAt: row.verifiedAt ? iso(row.verifiedAt) : null
    })),
    notifications: notificationRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body ?? '',
      at: iso(row.createdAt),
      read: row.isRead
    })),
    settings
  }
}

async function resetSequences(client: any = db): Promise<void> {
  const tables = [
    'collections',
    'coupons',
    'product_reviews',
    'size_charts',
    'shipments',
    'inventory_movements',
    'audit_log',
    'notifications',
    'refunds'
  ]
  for (const table of tables) {
    try {
      await client.execute(
        sql.raw(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`
        )
      )
    } catch {
      // In SQLite or non-Postgres test environments setval is not available
    }
  }
}

export async function saveAdminState(data: Record<string, unknown>): Promise<void> {
  if (!isDatabaseConfigured() || !db) {
    if (process.env.NODE_ENV === 'production') throw new Error('Admin state database is not configured.')
    const previous = (memoryState ?? {}) as Record<string, any>
    const next = structuredClone(data) as Record<string, any>

    // Append-only lists: merge without duplicating by id
    const mergeAppendOnly = (key: string) => {
      const prevList = Array.isArray(previous[key]) ? previous[key] : []
      const nextList = Array.isArray(next[key]) ? next[key] : []
      const seenIds = new Set(nextList.map((item: any) => item.id).filter(Boolean))
      const preserved = prevList.filter((item: any) => !seenIds.has(item.id))
      next[key] = [...preserved, ...nextList]
    }

    // Operational entities: upsert by id / key
    const mergeOperational = (key: string, idField = 'id') => {
      const prevList = Array.isArray(previous[key]) ? previous[key] : []
      const nextList = Array.isArray(next[key]) ? next[key] : []
      const nextMap = new Map(nextList.map((item: any) => [item[idField], item]))
      const merged = prevList.map((item: any) => nextMap.get(item[idField]) ?? item)
      for (const item of nextList) {
        if (!prevList.some((p: any) => p[idField] === item[idField])) {
          merged.push(item)
        }
      }
      next[key] = merged
    }

    mergeAppendOnly('auditLog')
    mergeAppendOnly('inventoryMovements')
    mergeAppendOnly('notifications')

    mergeOperational('collections')
    mergeOperational('coupons')
    mergeOperational('reviews')
    mergeOperational('shipments')
    mergeOperational('refunds')
    mergeOperational('sizeCharts', 'categoryId')

    memoryState = next
    return
  }

  const arrays = (key: string): Array<Record<string, any>> =>
    Array.isArray(data[key]) ? (data[key] as Array<Record<string, any>>) : []
  const settings = (data.settings ?? {}) as Record<string, any>

  await db.transaction(async (tx) => {
    const [
      orderRows,
      customerRows,
      productRows,
      categoryRows,
      variantRows
    ] = await Promise.all([
      tx.select({ id: orders.id, customerId: orders.customerId }).from(orders),
      tx.select({ id: customers.id }).from(customers),
      tx.select({ id: products.id }).from(products),
      tx.select({ id: categories.id }).from(categories),
      tx.select({ id: productVariants.id, productId: productVariants.productId }).from(productVariants)
    ])
    const orderById = new Map(orderRows.map((row) => [row.id, row]))
    const customerIds = new Set(customerRows.map((row) => row.id))
    const productIds = new Set(productRows.map((row) => row.id))
    const categoryIds = new Set(categoryRows.map((row) => row.id))
    const variantProductById = new Map(variantRows.map((row) => [row.id, row.productId]))
    const variantIds = new Set(variantRows.map((row) => row.id))

    if (Array.isArray(data.collections)) {
      const incomingCollectionIds = arrays('collections')
        .map((c) => numberOrZero(c.id))
        .filter((id) => id > 0)
      if (incomingCollectionIds.length > 0) {
        await tx.delete(collections).where(notInArray(collections.id, incomingCollectionIds))
      } else {
        await tx.delete(collections)
      }
    }

    const collectionValues = arrays('collections').map((collection, index) => ({
      id: numberOrZero(collection.id),
      name: stringOrEmpty(collection.name),
      slug: stringOrEmpty(collection.slug),
      description: stringOrEmpty(collection.description) || null,
      status: collection.status === 'Inactive' ? ('Inactive' as const) : ('Active' as const),
      sortOrder: index
    }))
    for (const collection of collectionValues) {
      if (!collection.name || !collection.slug) continue
      if (collection.id > 0) {
        await tx
          .insert(collections)
          .values(collection)
          .onConflictDoUpdate({
            target: collections.id,
            set: {
              name: collection.name,
              slug: collection.slug,
              description: collection.description,
              status: collection.status,
              sortOrder: collection.sortOrder,
              updatedAt: new Date()
            }
          })
      } else {
        const { id: _ignored, ...colWithoutId } = collection
        const [existingCol] = await tx
          .select({ id: collections.id })
          .from(collections)
          .where(eq(sql`lower(${collections.slug})`, collection.slug.toLowerCase()))
        if (existingCol) {
          await tx
            .update(collections)
            .set({
              name: collection.name,
              description: collection.description,
              status: collection.status,
              sortOrder: collection.sortOrder,
              updatedAt: new Date()
            })
            .where(eq(collections.id, existingCol.id))
        } else {
          await tx.insert(collections).values(colWithoutId)
        }
      }
    }

    if (Array.isArray(data.coupons)) {
      const incomingCouponIds = arrays('coupons')
        .map((c) => numberOrZero(c.id))
        .filter((id) => id > 0)
      if (incomingCouponIds.length > 0) {
        await tx.delete(coupons).where(notInArray(coupons.id, incomingCouponIds))
      } else {
        await tx.delete(coupons)
      }
    }

    for (const coupon of arrays('coupons')) {
      const couponId = numberOrZero(coupon.id)
      const code = stringOrEmpty(coupon.code).trim().toLowerCase()
      if (!code) continue

      const rawType = coupon.type === 'fixed' ? ('fixed' as const) : ('percentage' as const)
      const rawValue = Math.round(numberOrZero(coupon.value))
      const value = rawType === 'percentage' ? Math.min(100, rawValue) : rawValue
      if (value <= 0) continue

      const rawMaxDiscount =
        coupon.maxDiscount === null || coupon.maxDiscount === undefined ? null : Math.round(numberOrZero(coupon.maxDiscount))
      const rawUsageLimit =
        coupon.usageLimit === null || coupon.usageLimit === undefined ? null : Math.floor(numberOrZero(coupon.usageLimit))
      const startsAt = dateOrNull(coupon.startsAt)
      let endsAt = dateOrNull(coupon.endsAt)
      if (startsAt && endsAt && endsAt <= startsAt) endsAt = null

      const couponData = {
        code,
        type: rawType,
        value,
        minOrderValue: Math.max(0, Math.round(numberOrZero(coupon.minOrderValue))),
        maxDiscount: rawMaxDiscount !== null && rawMaxDiscount > 0 ? rawMaxDiscount : null,
        startsAt,
        endsAt,
        usageLimit: rawUsageLimit !== null && rawUsageLimit > 0 ? rawUsageLimit : null,
        perCustomerLimit: Math.max(1, Math.floor(numberOrZero(coupon.perCustomerLimit)) || 1),
        isActive: coupon.isActive !== false
      }

      let effectiveCouponId = couponId
      if (couponId > 0) {
        const [upserted] = await tx
          .insert(coupons)
          .values({ id: couponId, ...couponData })
          .onConflictDoUpdate({
            target: coupons.id,
            set: {
              code: couponData.code,
              type: couponData.type,
              value: couponData.value,
              minOrderValue: couponData.minOrderValue,
              maxDiscount: couponData.maxDiscount,
              startsAt: couponData.startsAt,
              endsAt: couponData.endsAt,
              usageLimit: couponData.usageLimit,
              perCustomerLimit: couponData.perCustomerLimit,
              isActive: couponData.isActive,
              updatedAt: new Date()
            }
          })
          .returning({ id: coupons.id })
        if (upserted?.id) effectiveCouponId = upserted.id
      } else {
        const [existingCoupon] = await tx
          .select({ id: coupons.id })
          .from(coupons)
          .where(eq(sql`lower(${coupons.code})`, couponData.code.toLowerCase()))
        if (existingCoupon) {
          await tx
            .update(coupons)
            .set({
              type: couponData.type,
              value: couponData.value,
              minOrderValue: couponData.minOrderValue,
              maxDiscount: couponData.maxDiscount,
              startsAt: couponData.startsAt,
              endsAt: couponData.endsAt,
              usageLimit: couponData.usageLimit,
              perCustomerLimit: couponData.perCustomerLimit,
              isActive: couponData.isActive,
              updatedAt: new Date()
            })
            .where(eq(coupons.id, existingCoupon.id))
          effectiveCouponId = existingCoupon.id
        } else {
          const [created] = await tx.insert(coupons).values(couponData).returning({ id: coupons.id })
          if (created?.id) effectiveCouponId = created.id
        }
      }

      if (effectiveCouponId > 0) {
        await tx.delete(couponProducts).where(eq(couponProducts.couponId, effectiveCouponId))
        await tx.delete(couponCategories).where(eq(couponCategories.couponId, effectiveCouponId))

        const productLinks: Array<{ couponId: number; productId: string }> = []
        for (const productId of Array.isArray(coupon.productIds) ? coupon.productIds : []) {
          const normalizedProductId = String(productId)
          if (productIds.has(normalizedProductId)) {
            productLinks.push({ couponId: effectiveCouponId, productId: normalizedProductId })
          }
        }
        if (productLinks.length > 0) await tx.insert(couponProducts).values(productLinks)

        const categoryLinks: Array<{ couponId: number; categoryId: number }> = []
        for (const catId of Array.isArray(coupon.categoryIds) ? coupon.categoryIds : []) {
          const normalizedCatId = Number(catId)
          if (categoryIds.has(normalizedCatId)) {
            categoryLinks.push({ couponId: effectiveCouponId, categoryId: normalizedCatId })
          }
        }
        if (categoryLinks.length > 0) await tx.insert(couponCategories).values(categoryLinks)
      }
    }

    // Reviews: sync deletions, upsert, and recompute products rating & review count
    if (Array.isArray(data.reviews)) {
      const incomingReviewIds = arrays('reviews')
        .map((r) => numberOrZero(r.id))
        .filter((id) => id > 0)
      if (incomingReviewIds.length > 0) {
        await tx.delete(productReviews).where(notInArray(productReviews.id, incomingReviewIds))
      } else {
        await tx.delete(productReviews)
      }
    }

    for (const review of arrays('reviews')) {
      const productId = stringOrEmpty(review.productId)
      if (!productIds.has(productId)) continue
      const reviewId = numberOrZero(review.id)
      const reviewData = {
        productId,
        customerId: customerIds.has(Number(review.customerId)) ? Number(review.customerId) : null,
        reviewerName: stringOrEmpty(review.reviewerName) || 'Customer',
        reviewerEmail: stringOrEmpty(review.reviewerEmail) || null,
        rating: Math.min(5, Math.max(1, Math.round(numberOrZero(review.rating)) || 5)),
        title: stringOrEmpty(review.title) || null,
        content: stringOrEmpty(review.content) || 'Great purchase!',
        isVerifiedPurchase: Boolean(review.verified ?? review.isVerifiedPurchase),
        status: ['Pending', 'Approved', 'Rejected', 'Hidden'].includes(review.status)
          ? review.status
          : 'Approved',
        merchantResponse: stringOrEmpty(review.response ?? review.merchantResponse) || null,
        respondedAt: dateOrNull(review.respondedAt),
        createdAt: dateOrNull(review.createdAt) ?? new Date()
      }

      if (reviewId > 0) {
        await tx
          .insert(productReviews)
          .values({ id: reviewId, ...reviewData })
          .onConflictDoUpdate({
            target: productReviews.id,
            set: {
              rating: reviewData.rating,
              title: reviewData.title,
              content: reviewData.content,
              status: reviewData.status,
              merchantResponse: reviewData.merchantResponse,
              respondedAt: reviewData.respondedAt,
              updatedAt: new Date()
            }
          })
      } else {
        await tx.insert(productReviews).values(reviewData)
      }
    }

    if (Array.isArray(data.reviews)) {
      await tx.execute(sql`
        UPDATE products p
        SET
          review_count = stats.cnt,
          rating_average = stats.avg_rating
        FROM (
          SELECT
            p2.id AS product_id,
            COUNT(pr.id)::int AS cnt,
            COALESCE(ROUND(AVG(pr.rating)::numeric, 2)::real, 0) AS avg_rating
          FROM products p2
          LEFT JOIN product_reviews pr ON pr.product_id = p2.id AND pr.status = 'Approved'
          GROUP BY p2.id
        ) stats
        WHERE p.id = stats.product_id
      `)
    }

    // Size charts: upsert chart, replace scoped measurements
    for (const chart of arrays('sizeCharts')) {
      const categoryId = Number(chart.categoryId)
      if (!categoryIds.has(categoryId)) continue
      const [chartRow] = await tx
        .insert(sizeCharts)
        .values({
          categoryId,
          description: stringOrEmpty(chart.description) || null
        })
        .onConflictDoUpdate({
          target: sizeCharts.categoryId,
          set: {
            description: stringOrEmpty(chart.description) || null,
            updatedAt: new Date()
          }
        })
        .returning({ id: sizeCharts.id })

      if (chartRow?.id) {
        await tx.delete(sizeChartMeasurements).where(eq(sizeChartMeasurements.sizeChartId, chartRow.id))
        const measurements = Array.isArray(chart.measurements) ? chart.measurements : []
        if (measurements.length > 0) {
          await tx.insert(sizeChartMeasurements).values(
            measurements.map((measurement: Record<string, any>) => ({
              sizeChartId: chartRow.id,
              size: String(measurement.size ?? ''),
              chest: measurement.chest === undefined ? null : numberOrZero(measurement.chest),
              waist: numberOrZero(measurement.waist),
              hip: numberOrZero(measurement.hip),
              inseam: numberOrZero(measurement.inseam),
              thigh: numberOrZero(measurement.thigh),
              length: measurement.length === undefined ? null : numberOrZero(measurement.length)
            }))
          )
        }
      }
    }

    // Append-only: inventory movements
    for (const movement of arrays('inventoryMovements')) {
      const movementId = numberOrZero(movement.id)
      const requestedVariantId = Number(movement.variantId)
      const variantId = variantIds.has(requestedVariantId) ? requestedVariantId : null
      const requestedProductId = stringOrEmpty(movement.productId)
      const productIdFromVariant = variantId ? variantProductById.get(variantId) ?? null : null
      const productId =
        productIdFromVariant ?? (productIds.has(requestedProductId) ? requestedProductId : null)

      const delta = Math.round(numberOrZero(movement.delta))
      const before = Math.max(0, Math.round(numberOrZero(movement.before)))
      const after = before + delta
      // The balance check requires after = before + delta. A movement that would
      // drive stock negative is not a valid ledger entry.
      if (after < 0) continue

      const movData = {
        productId,
        variantId,
        sku: stringOrEmpty(movement.sku) || null,
        type: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'RESERVATION', 'RELEASE'].includes(movement.type)
          ? movement.type
          : 'ADJUSTMENT',
        delta,
        before,
        after,
        reason: stringOrEmpty(movement.reason) || null,
        reference: stringOrEmpty(movement.reference) || null,
        actorName: stringOrEmpty(movement.userName) || null,
        createdAt: dateOrNull(movement.createdAt) ?? new Date()
      }

      if (movementId > 0) {
        await tx
          .insert(inventoryMovements)
          .values({ id: movementId, ...movData })
          .onConflictDoNothing({ target: inventoryMovements.id })
      } else {
        await tx.insert(inventoryMovements).values(movData)
      }
    }

    // Append-only: audit log
    for (const entry of arrays('auditLog')) {
      const auditId = numberOrZero(entry.id)
      const auditData = {
        actorName: stringOrEmpty(entry.userName) || null,
        action: stringOrEmpty(entry.action) || 'action',
        entity: stringOrEmpty(entry.entity) || null,
        entityId: stringOrEmpty(entry.entityId) || null,
        detail: stringOrEmpty(entry.detail) || null,
        createdAt: dateOrNull(entry.at) ?? new Date()
      }

      if (auditId > 0) {
        await tx
          .insert(auditLog)
          .values({ id: auditId, ...auditData })
          .onConflictDoNothing({ target: auditLog.id })
      } else {
        await tx.insert(auditLog).values(auditData)
      }
    }

    // Notifications: upsert
    for (const notification of arrays('notifications')) {
      const notifId = numberOrZero(notification.id)
      const notifData = {
        type: ['low-stock', 'order', 'payment', 'review', 'system'].includes(notification.type)
          ? notification.type
          : 'system',
        title: stringOrEmpty(notification.title),
        body: stringOrEmpty(notification.body) || null,
        isRead: Boolean(notification.read),
        createdAt: dateOrNull(notification.at) ?? new Date()
      }

      if (notifId > 0) {
        await tx
          .insert(notifications)
          .values({ id: notifId, ...notifData })
          .onConflictDoUpdate({
            target: notifications.id,
            set: {
              isRead: notifData.isRead,
              title: notifData.title,
              body: notifData.body
            }
          })
      } else {
        await tx.insert(notifications).values(notifData)
      }
    }

    // Shipments: upsert
    for (const shipment of arrays('shipments')) {
      const orderId = Number(shipment.orderId)
      if (!orderById.has(orderId)) continue
      const shipmentId = numberOrZero(shipment.id)
      const shipData = {
        orderId,
        carrier: stringOrEmpty(shipment.carrier) || 'Manual',
        trackingNumber: stringOrEmpty(shipment.trackingNumber) || `TG-${orderId}-${shipment.id || Date.now()}`,
        status: stringOrEmpty(shipment.status) || 'Pending',
        shippedAt: dateOrNull(shipment.shippedAt),
        eta: dateOrNull(shipment.eta),
        deliveredAt: shipment.status === 'Delivered' ? (dateOrNull(shipment.shippedAt) ?? new Date()) : null
      }

      if (shipmentId > 0) {
        await tx
          .insert(shipments)
          .values({ id: shipmentId, ...shipData })
          .onConflictDoUpdate({
            target: shipments.id,
            set: {
              orderId: shipData.orderId,
              carrier: shipData.carrier,
              trackingNumber: shipData.trackingNumber,
              status: shipData.status,
              shippedAt: shipData.shippedAt,
              eta: shipData.eta,
              deliveredAt: shipData.deliveredAt,
              updatedAt: new Date()
            }
          })
      } else {
        await tx.insert(shipments).values(shipData)
      }
    }

    // Refunds: upsert
    for (const refund of arrays('refunds')) {
      const orderId = Number(refund.orderId)
      if (!orderById.has(orderId)) continue
      const refundId = numberOrZero(refund.id)
      const order = orderById.get(orderId)!
      const refData = {
        number: stringOrEmpty(refund.number) || `REF-${refund.id || Date.now()}`,
        orderId: order.id,
        customerId: customerIds.has(Number(refund.customerId)) ? Number(refund.customerId) : order.customerId,
        amount: numberOrZero(refund.amount),
        reason: stringOrEmpty(refund.reason) || null,
        method: stringOrEmpty(refund.method) || 'Razorpay',
        status: stringOrEmpty(refund.status) || 'Pending',
        createdAt: dateOrNull(refund.createdAt) ?? new Date(),
        processedAt: dateOrNull(refund.processedAt)
      }

      if (refundId > 0) {
        await tx
          .insert(refunds)
          .values({ id: refundId, ...refData })
          .onConflictDoUpdate({
            target: refunds.id,
            set: {
              orderId: refData.orderId,
              customerId: refData.customerId,
              amount: refData.amount,
              reason: refData.reason,
              method: refData.method,
              status: refData.status,
              processedAt: refData.processedAt
            }
          })
      } else {
        await tx.insert(refunds).values(refData)
      }
    }

    await tx
      .insert(storeSettings)
      .values({
        id: SETTINGS_ID,
        storeName: stringOrEmpty(settings.storeName) || 'TEESGARAGE',
        supportEmail: stringOrEmpty(settings.supportEmail) || null,
        supportPhone: stringOrEmpty(settings.supportPhone) || null,
        address: stringOrEmpty(settings.address) || null,
        currency: stringOrEmpty(settings.currency) || 'INR',
        orderPrefix: stringOrEmpty(settings.orderPrefix) || 'TG',
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: {
          storeName: stringOrEmpty(settings.storeName) || 'TEESGARAGE',
          supportEmail: stringOrEmpty(settings.supportEmail) || null,
          supportPhone: stringOrEmpty(settings.supportPhone) || null,
          address: stringOrEmpty(settings.address) || null,
          currency: stringOrEmpty(settings.currency) || 'INR',
          orderPrefix: stringOrEmpty(settings.orderPrefix) || 'TG',
          updatedAt: new Date()
        }
      })

    await resetSequences(tx)
  })
}
