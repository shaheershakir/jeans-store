import { desc, eq, inArray, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  adminUsers,
  auditLog,
  banners,
  categories,
  collections,
  couponCategories,
  couponProducts,
  couponRedemptions,
  coupons,
  customers,
  inventoryMovements,
  notifications,
  orders,
  productReviews,
  productVariants,
  products,
  promotions,
  refunds,
  returnItems,
  returnRequests,
  reviewHelpfulVotes,
  reviewImages,
  roles,
  shipments,
  sizeChartMeasurements,
  sizeCharts,
  storeSettings
} from '../db/schema.js'

const SETTINGS_ID = 'default'
let memoryState: Record<string, unknown> = {}

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
    taxRate: row?.taxRate ?? 0,
    orderPrefix: row?.orderPrefix ?? 'TG',
    returnWindowDays: row?.returnWindowDays ?? 7,
    cancellationAllowedAfter: row?.cancellationAllowedAfter ?? 'Processing',
    defaultShippingMethod: row?.defaultShippingMethod ?? 'Standard',
    notify: {
      email: row?.notifyEmail ?? true,
      orderUpdates: row?.notifyOrderUpdates ?? true,
      inventoryAlerts: row?.notifyInventoryAlerts ?? true,
      reviewAlerts: row?.notifyReviewAlerts ?? true
    }
  }
}

export async function getAdminState(): Promise<Record<string, unknown>> {
  if (!isDatabaseConfigured() || !db) {
    if (process.env.NODE_ENV === 'production') throw new Error('Admin state database is not configured.')
    return structuredClone(memoryState)
  }

  const [
    collectionRows,
    roleRows,
    couponRows,
    couponProductRows,
    couponCategoryRows,
    promotionRows,
    bannerRows,
    reviewRows,
    sizeChartRows,
    measurementRows,
    shipmentRows,
    movementRows,
    auditRows,
    notificationRows,
    returnRows,
    returnItemRows,
    refundRows,
    settings
  ] = await Promise.all([
    db.select().from(collections).orderBy(collections.sortOrder),
    db.select().from(roles).orderBy(roles.id),
    db.select().from(coupons).orderBy(coupons.id),
    db.select().from(couponProducts),
    db.select().from(couponCategories),
    db.select().from(promotions).orderBy(promotions.id),
    db.select().from(banners).orderBy(banners.sortOrder),
    db.select().from(productReviews).orderBy(desc(productReviews.createdAt)),
    db.select().from(sizeCharts).orderBy(sizeCharts.id),
    db.select().from(sizeChartMeasurements),
    db.select().from(shipments).orderBy(desc(shipments.createdAt)),
    db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)),
    db.select().from(returnRequests).orderBy(desc(returnRequests.requestedAt)),
    db.select().from(returnItems),
    db.select().from(refunds).orderBy(desc(refunds.createdAt)),
    getSettings()
  ])

  const productIdsByCoupon = new Map<number, number[]>()
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

  const itemsByReturn = new Map<number, typeof returnItemRows>()
  for (const row of returnItemRows) {
    const list = itemsByReturn.get(row.returnId) ?? []
    list.push(row)
    itemsByReturn.set(row.returnId, list)
  }

  return {
    collections: collectionRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      status: row.status
    })),
    returns: returnRows.map((row) => ({
      id: row.id,
      number: row.number,
      orderId: row.orderId,
      customerId: row.customerId,
      items: (itemsByReturn.get(row.id) ?? []).map((item) => ({
        id: item.id,
        productId: item.productId ?? 0,
        variantId: item.variantId ?? 0,
        productName: item.productName,
        variantLabel: item.variantLabel ?? '',
        sku: item.sku ?? '',
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.lineTotal
      })),
      reason: row.reason,
      details: row.details ?? '',
      status: row.status,
      amount: row.amount,
      requestedAt: iso(row.requestedAt),
      updatedAt: iso(row.updatedAt)
    })),
    refunds: refundRows.map((row) => ({
      id: row.id,
      number: row.number,
      orderId: row.orderId,
      returnId: row.returnId,
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
      timesUsed: row.timesUsed
    })),
    promotions: promotionRows.map((row) => ({
      id: row.id,
      title: row.title,
      target: row.target,
      targetId: row.targetId ?? '',
      discountType: row.discountType,
      discountValue: row.discountValue,
      startsAt: iso(row.startsAt),
      endsAt: iso(row.endsAt),
      status: row.status,
      createdAt: iso(row.createdAt)
    })),
    banners: bannerRows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? '',
      ctaLabel: row.ctaLabel ?? '',
      link: row.link ?? '',
      image: row.imageUrl ?? '',
      startsAt: iso(row.startsAt),
      endsAt: iso(row.endsAt),
      status: row.status,
      order: row.sortOrder
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
      fit: row.fit,
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
      productId: row.productId ?? 0,
      variantId: row.variantId ?? 0,
      sku: row.sku ?? '',
      type: row.type,
      delta: row.delta,
      before: row.before,
      after: row.after,
      reason: row.reason ?? '',
      reference: row.reference ?? '',
      userId: row.actorAdminId,
      userName: row.actorName ?? '',
      createdAt: iso(row.createdAt)
    })),
    auditLog: auditRows.map((row) => ({
      id: row.id,
      userId: row.adminUserId ?? 0,
      userName: row.actorName ?? '',
      action: row.action,
      entity: row.entity ?? '',
      entityId: row.entityId ?? '',
      detail: row.detail ?? '',
      at: iso(row.createdAt)
    })),
    notifications: notificationRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body ?? '',
      at: iso(row.createdAt),
      read: row.isRead
    })),
    settings,
    roles: roleRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      permissions: row.permissions
    }))
  }
}

async function resetSequences(): Promise<void> {
  const tables = [
    'collections',
    'coupons',
    'promotions',
    'banners',
    'product_reviews',
    'size_charts',
    'shipments',
    'inventory_movements',
    'audit_log',
    'notifications',
    'roles',
    'return_requests',
    'refunds'
  ]
  for (const table of tables) {
    await db!.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true)`
      )
    )
  }
}

export async function saveAdminState(data: Record<string, unknown>): Promise<void> {
  if (!isDatabaseConfigured() || !db) {
    if (process.env.NODE_ENV === 'production') throw new Error('Admin state database is not configured.')
    memoryState = structuredClone(data)
    return
  }

  const arrays = (key: string): Array<Record<string, any>> =>
    Array.isArray(data[key]) ? (data[key] as Array<Record<string, any>>) : []
  const settings = (data.settings ?? {}) as Record<string, any>

  const [
    orderRows,
    customerRows,
    productRows,
    categoryRows,
    variantRows,
    adminUserRows
  ] = await Promise.all([
    db.select({ id: orders.id, customerId: orders.customerId }).from(orders),
    db.select({ id: customers.id }).from(customers),
    db.select({ id: products.id }).from(products),
    db.select({ id: categories.id }).from(categories),
    db.select({ id: productVariants.id, productId: productVariants.productId }).from(productVariants),
    db.select({ id: adminUsers.id }).from(adminUsers)
  ])
  const orderById = new Map(orderRows.map((row) => [row.id, row]))
  const customerIds = new Set(customerRows.map((row) => row.id))
  const productIds = new Set(productRows.map((row) => row.id))
  const categoryIds = new Set(categoryRows.map((row) => row.id))
  const variantProductById = new Map(variantRows.map((row) => [row.id, row.productId]))
  const variantIds = new Set(variantRows.map((row) => row.id))
  const adminUserIds = new Set(adminUserRows.map((row) => row.id))

  await db.delete(refunds)
  await db.delete(returnItems)
  await db.delete(returnRequests)
  await db.delete(couponProducts)
  await db.delete(couponCategories)
  await db.delete(couponRedemptions)
  await db.delete(coupons)
  await db.delete(promotions)
  await db.delete(banners)
  await db.delete(reviewImages)
  await db.delete(reviewHelpfulVotes)
  await db.delete(productReviews)
  await db.delete(sizeChartMeasurements)
  await db.delete(sizeCharts)
  await db.delete(shipments)
  await db.delete(inventoryMovements)
  await db.delete(auditLog)
  await db.delete(notifications)

  const roleValues = arrays('roles').map((role) => ({
    id: numberOrZero(role.id),
    name: stringOrEmpty(role.name),
    description: stringOrEmpty(role.description) || null,
    permissions: Array.isArray(role.permissions) ? role.permissions.map(String) : []
  }))
  for (const role of roleValues) {
    if (!role.id || !role.name) continue
    await db
      .insert(roles)
      .values(role)
      .onConflictDoUpdate({
        target: roles.id,
        set: { name: role.name, description: role.description, permissions: role.permissions }
      })
  }

  const collectionValues = arrays('collections').map((collection, index) => ({
    id: numberOrZero(collection.id),
    name: stringOrEmpty(collection.name),
    slug: stringOrEmpty(collection.slug),
    description: stringOrEmpty(collection.description) || null,
    status: collection.status === 'Inactive' ? 'Inactive' : 'Active',
    sortOrder: index
  }))
  if (collectionValues.length > 0) await db.insert(collections).values(collectionValues)

  const couponValues = arrays('coupons').map((coupon) => ({
    id: numberOrZero(coupon.id),
    code: stringOrEmpty(coupon.code),
    type: coupon.type === 'fixed' ? 'fixed' : 'percentage',
    value: numberOrZero(coupon.value),
    minOrderValue: numberOrZero(coupon.minOrderValue),
    maxDiscount: coupon.maxDiscount === null || coupon.maxDiscount === undefined ? null : numberOrZero(coupon.maxDiscount),
    startsAt: dateOrNull(coupon.startsAt),
    endsAt: dateOrNull(coupon.endsAt),
    usageLimit: coupon.usageLimit === null || coupon.usageLimit === undefined ? null : numberOrZero(coupon.usageLimit),
    perCustomerLimit: numberOrZero(coupon.perCustomerLimit) || 1,
    isActive: coupon.isActive !== false,
    timesUsed: numberOrZero(coupon.timesUsed)
  }))
  if (couponValues.length > 0) {
    await db.insert(coupons).values(couponValues)
    const productLinks: Array<{ couponId: number; productId: number }> = []
    const categoryLinks: Array<{ couponId: number; categoryId: number }> = []
    for (const coupon of arrays('coupons')) {
      const couponId = numberOrZero(coupon.id)
      for (const productId of Array.isArray(coupon.productIds) ? coupon.productIds : []) {
        if (productIds.has(Number(productId))) productLinks.push({ couponId, productId: Number(productId) })
      }
      for (const categoryId of Array.isArray(coupon.categoryIds) ? coupon.categoryIds : []) {
        if (categoryIds.has(Number(categoryId))) categoryLinks.push({ couponId, categoryId: Number(categoryId) })
      }
    }
    if (productLinks.length > 0) await db.insert(couponProducts).values(productLinks)
    if (categoryLinks.length > 0) await db.insert(couponCategories).values(categoryLinks)
  }

  const promotionValues = arrays('promotions').map((promotion) => ({
    id: numberOrZero(promotion.id),
    title: stringOrEmpty(promotion.title),
    target: stringOrEmpty(promotion.target) || 'Product',
    targetId: promotion.targetId === null || promotion.targetId === undefined ? null : String(promotion.targetId),
    discountType: promotion.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: numberOrZero(promotion.discountValue),
    startsAt: dateOrNull(promotion.startsAt),
    endsAt: dateOrNull(promotion.endsAt),
    status: stringOrEmpty(promotion.status) || 'Scheduled'
  }))
  if (promotionValues.length > 0) await db.insert(promotions).values(promotionValues)

  const bannerValues = arrays('banners').map((banner) => ({
    id: numberOrZero(banner.id),
    title: stringOrEmpty(banner.title),
    subtitle: stringOrEmpty(banner.subtitle) || null,
    ctaLabel: stringOrEmpty(banner.ctaLabel) || null,
    link: stringOrEmpty(banner.link) || null,
    imageUrl: stringOrEmpty(banner.image) || null,
    startsAt: dateOrNull(banner.startsAt),
    endsAt: dateOrNull(banner.endsAt),
    status: stringOrEmpty(banner.status) || 'Scheduled',
    sortOrder: numberOrZero(banner.order)
  }))
  if (bannerValues.length > 0) await db.insert(banners).values(bannerValues)

  const reviewValues = arrays('reviews')
    .filter((review) => productIds.has(Number(review.productId)))
    .map((review) => ({
      id: numberOrZero(review.id),
      productId: Number(review.productId),
      customerId: customerIds.has(Number(review.customerId)) ? Number(review.customerId) : null,
      reviewerName: 'Customer',
      reviewerEmail: null,
      rating: Math.min(5, Math.max(1, numberOrZero(review.rating) || 5)),
      title: stringOrEmpty(review.title) || null,
      content: stringOrEmpty(review.content),
      isVerifiedPurchase: Boolean(review.verified),
      status: stringOrEmpty(review.status) || 'Pending',
      merchantResponse: review.response ? String(review.response) : null,
      respondedAt: dateOrNull(review.respondedAt),
      createdAt: dateOrNull(review.createdAt) ?? new Date()
    }))
  if (reviewValues.length > 0) await db.insert(productReviews).values(reviewValues)

  await db.execute(sql`
    UPDATE products p
    SET
      rating_average = COALESCE((
        SELECT AVG(r.rating)::real
        FROM product_reviews r
        WHERE r.product_id = p.id AND r.status = 'Approved'
      ), 0),
      review_count = (
        SELECT COUNT(*)::int
        FROM product_reviews r
        WHERE r.product_id = p.id AND r.status = 'Approved'
      )
  `)

  const sizeChartValues = arrays('sizeCharts').map((chart) => ({
    fit: stringOrEmpty(chart.fit),
    description: stringOrEmpty(chart.description) || null
  }))
  for (let index = 0; index < sizeChartValues.length; index++) {
    const chart = sizeChartValues[index]
    if (!chart.fit) continue
    const [created] = await db
      .insert(sizeCharts)
      .values(chart)
      .onConflictDoUpdate({ target: sizeCharts.fit, set: { description: chart.description } })
      .returning({ id: sizeCharts.id })
    const measurements = Array.isArray(arrays('sizeCharts')[index].measurements)
      ? arrays('sizeCharts')[index].measurements
      : []
    if (measurements.length > 0) {
      await db.insert(sizeChartMeasurements).values(
        measurements.map((measurement: Record<string, any>) => ({
          sizeChartId: created.id,
          size: String(measurement.size ?? ''),
          chest: measurement.chest === undefined ? null : numberOrZero(measurement.chest),
          waist: numberOrZero(measurement.waist),
          hip: numberOrZero(measurement.hip),
          inseam: numberOrZero(measurement.inseam),
          thigh: numberOrZero(measurement.thigh),
          length: measurement.length === undefined ? null : numberOrZero(measurement.length),
          shoulder: measurement.shoulder === undefined ? null : numberOrZero(measurement.shoulder)
        }))
      )
    }
  }

  const movementValues = arrays('inventoryMovements').map((movement) => {
    const requestedVariantId = Number(movement.variantId)
    const variantId = variantIds.has(requestedVariantId) ? requestedVariantId : null
    const requestedProductId = Number(movement.productId)
    const productIdFromVariant = variantId ? variantProductById.get(variantId) ?? null : null
    const productId =
      productIdFromVariant ?? (productIds.has(requestedProductId) ? requestedProductId : null)
    return {
      id: numberOrZero(movement.id),
      productId,
      variantId,
      sku: stringOrEmpty(movement.sku) || null,
      type: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'RESERVATION', 'RELEASE'].includes(movement.type)
        ? movement.type
        : 'ADJUSTMENT',
      delta: numberOrZero(movement.delta),
      before: numberOrZero(movement.before),
      after: numberOrZero(movement.after),
      reason: stringOrEmpty(movement.reason) || null,
      reference: stringOrEmpty(movement.reference) || null,
      actorAdminId: adminUserIds.has(Number(movement.userId)) ? Number(movement.userId) : null,
      actorName: stringOrEmpty(movement.userName) || null,
      createdAt: dateOrNull(movement.createdAt) ?? new Date()
    }
  })
  if (movementValues.length > 0) await db.insert(inventoryMovements).values(movementValues)

  const auditValues = arrays('auditLog').map((entry) => ({
    id: numberOrZero(entry.id),
    adminUserId: adminUserIds.has(Number(entry.userId)) ? Number(entry.userId) : null,
    actorName: stringOrEmpty(entry.userName) || null,
    action: stringOrEmpty(entry.action) || 'action',
    entity: stringOrEmpty(entry.entity) || null,
    entityId: stringOrEmpty(entry.entityId) || null,
    detail: stringOrEmpty(entry.detail) || null,
    createdAt: dateOrNull(entry.at) ?? new Date()
  }))
  if (auditValues.length > 0) await db.insert(auditLog).values(auditValues)

  const notificationValues = arrays('notifications').map((notification) => ({
    id: numberOrZero(notification.id),
    adminUserId: null,
    type: ['low-stock', 'order', 'payment', 'review', 'system'].includes(notification.type)
      ? notification.type
      : 'system',
    title: stringOrEmpty(notification.title),
    body: stringOrEmpty(notification.body) || null,
    isRead: Boolean(notification.read),
    createdAt: dateOrNull(notification.at) ?? new Date()
  }))
  if (notificationValues.length > 0) await db.insert(notifications).values(notificationValues)

  const shipmentValues = arrays('shipments')
    .filter((shipment) => orderById.has(Number(shipment.orderId)))
    .map((shipment) => ({
      id: numberOrZero(shipment.id),
      orderId: Number(shipment.orderId),
      carrier: stringOrEmpty(shipment.carrier) || 'Manual',
      trackingNumber: stringOrEmpty(shipment.trackingNumber) || `TG-${shipment.orderId}-${shipment.id}`,
      status: stringOrEmpty(shipment.status) || 'Pending',
      shippedAt: dateOrNull(shipment.shippedAt),
      eta: dateOrNull(shipment.eta),
      deliveredAt: shipment.status === 'Delivered' ? (dateOrNull(shipment.shippedAt) ?? new Date()) : null
    }))
  if (shipmentValues.length > 0) await db.insert(shipments).values(shipmentValues)

  const returnValues = arrays('returns')
    .filter((request) => orderById.has(Number(request.orderId)))
    .map((request) => {
      const order = orderById.get(Number(request.orderId))!
      return {
        id: numberOrZero(request.id),
        number: stringOrEmpty(request.number) || `RET-${request.id}`,
        orderId: order.id,
        customerId: customerIds.has(Number(request.customerId)) ? Number(request.customerId) : order.customerId,
        reason: stringOrEmpty(request.reason) || 'Return requested',
        details: stringOrEmpty(request.details) || null,
        status: stringOrEmpty(request.status) || 'Requested',
        amount: numberOrZero(request.amount),
        requestedAt: dateOrNull(request.requestedAt) ?? new Date(),
        updatedAt: dateOrNull(request.updatedAt) ?? new Date()
      }
    })
  if (returnValues.length > 0) {
    await db.insert(returnRequests).values(returnValues)
    const itemValues: Array<Record<string, unknown>> = []
    for (const request of arrays('returns')) {
      if (!orderById.has(Number(request.orderId))) continue
      for (const item of Array.isArray(request.items) ? request.items : []) {
        const requestedVariantId = Number(item.variantId)
        const variantId = variantIds.has(requestedVariantId) ? requestedVariantId : null
        const requestedProductId = Number(item.productId)
        const productId =
          (variantId ? variantProductById.get(variantId) ?? null : null) ??
          (productIds.has(requestedProductId) ? requestedProductId : null)
        itemValues.push({
          returnId: numberOrZero(request.id),
          productId,
          variantId,
          sku: stringOrEmpty(item.sku) || null,
          productName: stringOrEmpty(item.productName) || 'Item',
          variantLabel: stringOrEmpty(item.variantLabel) || null,
          unitPrice: numberOrZero(item.price),
          quantity: numberOrZero(item.quantity) || 1,
          lineTotal: numberOrZero(item.total),
          reason: stringOrEmpty(request.reason) || null
        })
      }
    }
    if (itemValues.length > 0) await db.insert(returnItems).values(itemValues as any)
  }

  const returnIds = new Set(returnValues.map((request) => request.id))
  const refundValues = arrays('refunds')
    .filter((refund) => orderById.has(Number(refund.orderId)))
    .map((refund) => {
      const order = orderById.get(Number(refund.orderId))!
      return {
        id: numberOrZero(refund.id),
        number: stringOrEmpty(refund.number) || `REF-${refund.id}`,
        orderId: order.id,
        returnId: returnIds.has(Number(refund.returnId)) ? Number(refund.returnId) : null,
        customerId: customerIds.has(Number(refund.customerId)) ? Number(refund.customerId) : order.customerId,
        amount: numberOrZero(refund.amount),
        reason: stringOrEmpty(refund.reason) || null,
        method: stringOrEmpty(refund.method) || 'Razorpay',
        status: stringOrEmpty(refund.status) || 'Pending',
        createdAt: dateOrNull(refund.createdAt) ?? new Date(),
        processedAt: dateOrNull(refund.processedAt)
      }
    })
  if (refundValues.length > 0) await db.insert(refunds).values(refundValues)

  await db
    .insert(storeSettings)
    .values({
      id: SETTINGS_ID,
      storeName: stringOrEmpty(settings.storeName) || 'TEESGARAGE',
      supportEmail: stringOrEmpty(settings.supportEmail) || null,
      supportPhone: stringOrEmpty(settings.supportPhone) || null,
      address: stringOrEmpty(settings.address) || null,
      currency: stringOrEmpty(settings.currency) || 'INR',
      taxRate: numberOrZero(settings.taxRate),
      orderPrefix: stringOrEmpty(settings.orderPrefix) || 'TG',
      returnWindowDays: numberOrZero(settings.returnWindowDays) || 7,
      cancellationAllowedAfter: stringOrEmpty(settings.cancellationAllowedAfter) || 'Processing',
      defaultShippingMethod: stringOrEmpty(settings.defaultShippingMethod) || 'Standard',
      notifyEmail: settings.notify?.email !== false,
      notifyOrderUpdates: settings.notify?.orderUpdates !== false,
      notifyInventoryAlerts: settings.notify?.inventoryAlerts !== false,
      notifyReviewAlerts: settings.notify?.reviewAlerts !== false,
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
        taxRate: numberOrZero(settings.taxRate),
        orderPrefix: stringOrEmpty(settings.orderPrefix) || 'TG',
        returnWindowDays: numberOrZero(settings.returnWindowDays) || 7,
        cancellationAllowedAfter: stringOrEmpty(settings.cancellationAllowedAfter) || 'Processing',
        defaultShippingMethod: stringOrEmpty(settings.defaultShippingMethod) || 'Standard',
        notifyEmail: settings.notify?.email !== false,
        notifyOrderUpdates: settings.notify?.orderUpdates !== false,
        notifyInventoryAlerts: settings.notify?.inventoryAlerts !== false,
        notifyReviewAlerts: settings.notify?.reviewAlerts !== false,
        updatedAt: new Date()
      }
    })

  await resetSequences()
}
