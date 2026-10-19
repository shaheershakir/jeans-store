import type {
  AdminUser,
  AppNotification,
  AuditLogEntry,
  Banner,
  Category,
  Collection,
  Coupon,
  Customer,
  DbState,
  Fit,
  InventoryMovement,
  Order,
  PaymentRecord,
  Product,
  ProductStatus,
  Promotion,
  Refund,
  ReturnRequest,
  ReturnStatus,
  Review,
  ReviewStatus,
  Shipment,
  ShippingZone,
  SizeChart,
  StoreSettings,
  Variant,
  MovementType,
  NavigationItem,
  HomepageConfig,
} from '@/lib/types'
import { ROLE_DEFS } from '@/lib/permissions'
import { mulberry32, pick, randInt, isoDaysAgo, isoDaysAhead } from '@/lib/utils'
import { PRODUCT_SPECS, alternateColor } from '@/data/product-specs'
import { buildCustomers } from '@/data/names'
import { CARRIERS } from '@/lib/constants'
import {
  generateBaseSku,
  generateProductScopedSku,
  getCategoryCode,
  getProductTypeCode,
  formatProductCode,
} from '@/lib/sku'

const SEED = 20260830
const NOW = Date.now()
export const DATA_VERSION = 6


export const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
  'https://images.unsplash.com/photo-1542272604-787c3835535d',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
  'https://images.unsplash.com/photo-1548883354-7622d03aca27',
  'https://images.unsplash.com/photo-1582552938357-32b906df40cb',
  'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec',
  'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5',
  'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495',
]

function img(i: number, w = 800): string {
  return `${IMAGE_POOL[i % IMAGE_POOL.length]}?auto=format&fit=crop&w=${w}&q=80`
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const BRAND_CODE: Record<string, string> = { TEESGARAGE: 'TG' }
const COLOR_CODE: Record<string, string> = {
  Blue: 'BLU',
  'Dark Blue': 'DBL',
  'Light Blue': 'LBL',
  Black: 'BLK',
  Grey: 'GRY',
  White: 'WHT',
}

const CATEGORIES: Category[] = [
  { id: 1, name: 'Stripes', slug: 'stripes', description: 'Classic horizontal and vertical striped t-shirts.', parentId: null },
  { id: 2, name: 'Fullsleeve', slug: 'fullsleeve', description: 'Full sleeve heavyweight and ribbed t-shirts.', parentId: null },
  { id: 3, name: 'Drsleeve', slug: 'drsleeve', description: 'Drop shoulder loose and boxy cut tees.', parentId: null },
  { id: 4, name: 'Printed tees', slug: 'printed-tees', description: 'Screen printed and graphic streetwear tees.', parentId: null },
  { id: 5, name: 'Ringer tees', slug: 'ringer-tees', description: 'Vintage style contrast rib collar and cuff tees.', parentId: null },
  { id: 6, name: 'Henley', slug: 'henley', description: 'Button placket waffle and jersey knit tees.', parentId: null },
  { id: 7, name: 'Trackpants', slug: 'trackpants', description: 'Athletic, training and tapered trackpants.', parentId: null },
  { id: 8, name: 'Sweatpants', slug: 'sweatpants', description: 'Heavyweight fleece and French terry sweatpants.', parentId: null },
]

const COLLECTIONS: Collection[] = [
  { id: 1, name: 'New Arrivals', slug: 'new-arrivals', description: 'Fresh apparel drops from this season.', status: 'Active' },
  { id: 2, name: 'Bestsellers', slug: 'bestsellers', description: 'Customer-favorite tees and bottoms.', status: 'Active' },
  { id: 3, name: 'Everyday Essentials', slug: 'everyday-essentials', description: 'Easy-to-wear pieces for daily rotation.', status: 'Active' },
  { id: 4, name: 'Streetwear', slug: 'streetwear', description: 'Relaxed fits and graphic apparel.', status: 'Active' },
  { id: 5, name: 'Seasonal Edit', slug: 'seasonal-edit', description: 'Apparel selected for the season.', status: 'Active' },
]

function sizeRangeFor(category: string): Array<string | number> {
  return category === 'trackpants' || category === 'sweatpants'
    ? [28, 30, 32, 34, 36, 38, 40]
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL']
}

let globalVariantId = 1
let globalImageId = 1
const globalSeedSkus = new Set<string>()

function buildProduct(
  rand: () => number,
  spec: (typeof PRODUCT_SPECS)[number],
  index: number,
  now: number
): Product {
  const status: ProductStatus = index % 9 === 7 ? 'Draft' : index % 13 === 11 ? 'Archived' : 'Active'
  const sizes = sizeRangeFor(spec.category)
  const colors = [spec.color, alternateColor(spec.color)]
  const productId = index + 1
  const category = CATEGORIES.find((c) => c.slug === spec.category) ?? CATEGORIES[3]
  const categoryId = category.id
  const categorySlug = category.slug
  const variants: Variant[] = []

  for (let ci = 0; ci < colors.length; ci++) {
    const color = colors[ci]
    for (const size of sizes) {
      const roll = rand()
      let stock: number
      if (roll < 0.08) stock = 0
      else if (roll < 0.2) stock = randInt(rand, 1, 6)
      else stock = randInt(rand, 16, 150)
      if (size === 28 || size === 40 || ci === 1) stock = Math.max(0, stock - randInt(rand, 0, 12))
      const id = globalVariantId++
      const price = spec.basePrice

      const baseSku = generateBaseSku({ category: categorySlug, productType: spec.fit, color, size })
      const finalSku = globalSeedSkus.has(baseSku)
        ? generateProductScopedSku({ category: categorySlug, productType: spec.fit, color, size, productId })
        : baseSku
      globalSeedSkus.add(finalSku)

      variants.push({
        id,
        productId,
        sku: finalSku,
        size,
        color,
        price,
        stock,
        reserved: stock > 0 ? randInt(rand, 0, Math.min(4, stock)) : 0,
        reorderPoint: randInt(rand, 6, 14),
        weight: spec.category === 'trackpants' || spec.category === 'sweatpants' ? randInt(rand, 600, 800) : randInt(rand, 250, 450),
        barcode: `890${String(10000000000 + id * 7919).slice(0, 11)}`,
        status: status === 'Active' ? 'Active' : 'Active',
      })
    }
  }

  const compareAtPrice = index % 3 === 0 && status === 'Active' ? Math.round(spec.basePrice * 1.25) : null
  const createdAt = isoDaysAgo(randInt(rand, 60, 420), now)
  const mainImage = img(index)
  const image = mainImage

  return {
    id: productId,
    name: spec.name,
    slug: `${slugify(spec.name)}-${spec.fit.toLowerCase()}`,
    sku: `${getCategoryCode(categorySlug)}-${getProductTypeCode(spec.fit)}-${formatProductCode(productId)}`,
    description: spec.blurb,
    brand: spec.brand,
    categoryId,

    collectionId: index % 7 === 0 ? 2 : index % 4 === 0 ? 4 : index % 5 === 0 ? 5 : 1,
    fit: spec.fit,
    gender: spec.gender,
    rise: spec.rise,
    material: spec.material,
    wash: spec.wash,
    inseam: pick(rand, [30, 32]),
    price: spec.basePrice,
    compareAtPrice,
    costPrice: Math.round(spec.basePrice * 0.52),
    taxRate: 18,
    status,
    featured: index % 7 === 0,
    weightGrams: spec.category === 'trackpants' || spec.category === 'sweatpants' ? 650 : 350,
    views: randInt(rand, 900, 19000),
    wishlists: randInt(rand, 40, 950),
    image,
    images: [
      { id: globalImageId++, url: img(index, 800), alt: `${spec.name} front`, order: 0 },
      { id: globalImageId++, url: img(index + 3, 800), alt: `${spec.name} back`, order: 1 },
      { id: globalImageId++, url: img(index + 6, 800), alt: `${spec.name} detail`, order: 2 },
    ],
    variants,
    createdAt,
    updatedAt: createdAt,
  }
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

function weightedPick<T>(rand: () => number, items: T[], weight: (t: T) => number): T {
  const sum = items.reduce((acc, it) => acc + weight(it), 0) || 1
  let r = rand() * sum
  for (const it of items) {
    r -= weight(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

let orderSeq = 2000

interface OrderGen {
  orders: Order[]
  payments: PaymentRecord[]
  shipments: Shipment[]
  refundsToCreate: { order: Order; amount: number; reason: string }[]
}

interface GenCtx {
  orderId: number
  evId: number
  payId: number
  shipId: number
}

/** Builds a single order + its supporting records. */
function buildOneOrder(
  rand: () => number,
  products: Product[],
  customers: Customer[],
  now: number,
  ctx: GenCtx
): {
  order: Order | null
  payment: PaymentRecord | null
  shipment: Shipment | null
  refund: { order: Order; amount: number; reason: string } | null
} {
  const ageDays = Math.pow(rand(), 1.75) * 205
  const createdAt = new Date(now - ageDays * 86400000).toISOString()
  const frequent = customers.filter((_, i) => i % 3 === 0)
  const customer = rand() < 0.42 ? pick(rand, frequent) : pick(rand, customers)

  let fulfillment: Order['fulfillmentStatus']
  if (ageDays < 1) fulfillment = pick(rand, ['Pending', 'Confirmed', 'Processing', 'Shipped'])
  else if (ageDays < 3)
    fulfillment = pick(rand, ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'])
  else if (ageDays < 9)
    fulfillment = pick(rand, ['Shipped', 'Out for Delivery', 'Delivered', 'Delivered', 'Delivered'])
  else fulfillment = 'Delivered'
  if (rand() < 0.045 && ageDays > 4) fulfillment = 'Cancelled'

  const methodRoll = rand()
  const paymentMethod: Order['paymentMethod'] =
    methodRoll < 0.33
      ? 'COD'
      : methodRoll < 0.62
        ? 'UPI'
        : methodRoll < 0.79
          ? 'Card'
          : methodRoll < 0.91
            ? 'Net Banking'
            : 'Wallet'

  const product = weightedPick(rand, products, (p) => p.views * (rand() * 3 + 0.5))
  const activeVariants = product.variants.filter((v) => v.status === 'Active')
  const variant = pick(rand, activeVariants.length ? activeVariants : product.variants)
  const qty = rand() < 0.16 ? 2 : 1
  const itemTotal = variant.price * qty

  const multiLine = rand() < 0.22
  let variant2: Variant | null = null
  let product2: Product | null = null
  let qty2 = 0
  if (multiLine) {
    const candidate = weightedPick(rand, products, (p) => p.views * rand())
    if (candidate !== product) {
      const v2s = candidate.variants.filter((v) => v.status === 'Active')
      if (v2s.length) {
        product2 = candidate
        variant2 = pick(rand, v2s)
        qty2 = rand() < 0.2 ? 2 : 1
      }
    }
  }

  const subtotal = itemTotal + (variant2 ? variant2.price * qty2 : 0)
  const useCoupon = rand() < 0.18
  const discount = useCoupon && subtotal >= 1499 ? Math.round(subtotal * (rand() < 0.5 ? 0.1 : 0.15)) : 0
  const shippingFee = 99
  const tax = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + shippingFee + tax

  const address = customer.addresses[0]
  if (!address) {
    ctx.orderId++
    return { order: null, payment: null, shipment: null, refund: null }
  }
  const orderNumber = `IN-${orderSeq++}`

  const timeline: Order['timeline'] = []
  const at = (daysOffset: number, hoursOffset = 0) =>
    new Date(now - (ageDays - daysOffset) * 86400000 + hoursOffset * 3600000).toISOString()

  timeline.push({
    id: ctx.evId++,
    status: 'Order placed',
    note: 'Order created by customer',
    at: at(0),
    by: 'Customer',
  })
  if (paymentMethod !== 'COD') {
    timeline.push({
      id: ctx.evId++,
      status: 'Payment confirmed',
      note: `Prepaid via ${paymentMethod}`,
      at: at(0.03, 4),
      by: 'Payment gateway',
    })
  }

  const chain: Order['fulfillmentStatus'][] = []
  if (fulfillment === 'Cancelled') {
    chain.push('Cancelled')
  } else {
    const wizard: Partial<Record<Order['fulfillmentStatus'], Order['fulfillmentStatus'][]>> = {
      Pending: ['Pending'],
      Confirmed: ['Confirmed'],
      Processing: ['Processing'],
      Shipped: ['Shipped'],
      'Out for Delivery': ['Shipped', 'Out for Delivery'],
      Delivered: ['Shipped', 'Out for Delivery', 'Delivered'],
    }
    chain.push(...(wizard[fulfillment] ?? ['Delivered']))
  }

  for (let s = 0; s < chain.length; s++) {
    const status = chain[s]
    const dayOffset =
      status === 'Delivered'
        ? ageDays
        : status === 'Out for Delivery'
          ? 3 + s
          : 2 + s * 0.6
    const hours = [0.05, 2, 14][s] ?? 4
    timeline.push({
      id: ctx.evId++,
      status,
      note: status === 'Shipped' || status === 'Out for Delivery' ? 'Handed to courier partner' : '',
      at: at(dayOffset, hours),
      by: s % 2 === 0 ? 'Operations' : 'System',
    })
  }

  const items: Order['items'] = [
    {
      id: ctx.orderId * 10 + 1,
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantLabel: `${variant.size}W · ${variant.color}`,
      sku: variant.sku,
      quantity: qty,
      price: variant.price,
      total: itemTotal,
    },
  ]
  if (variant2 && product2 && qty2 > 0) {
    items.push({
      id: ctx.orderId * 10 + 2,
      productId: product2.id,
      variantId: variant2.id,
      productName: product2.name,
      variantLabel: `${variant2.size}W · ${variant2.color}`,
      sku: variant2.sku,
      quantity: qty2,
      price: variant2.price,
      total: variant2.price * qty2,
    })
  }

  const prepaid = paymentMethod !== 'COD'
  const paymentStatus: Order['paymentStatus'] = prepaid
    ? fulfillment === 'Cancelled'
      ? 'Refunded'
      : 'Paid'
    : fulfillment === 'Cancelled'
      ? 'Failed'
      : fulfillment === 'Delivered'
        ? 'Paid'
        : 'Pending'

  const transactionId =
    paymentStatus === 'Paid' || paymentStatus === 'Refunded'
      ? `TXN${pad(30000 + ctx.orderId * 17, 8)}${Math.floor(rand() * 900) + 100}`
      : null

  const order: Order = {
    id: ctx.orderId,
    number: orderNumber,
    customerId: customer.id,
    items,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    paymentMethod,
    paymentStatus,
    transactionId,
    fulfillmentStatus: fulfillment,
    shippingAddress: address,
    carrier:
      fulfillment === 'Shipped' || fulfillment === 'Out for Delivery' || fulfillment === 'Delivered'
        ? pick(rand, CARRIERS)
        : null,
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    timeline,
    notes: [],
    createdAt,
    updatedAt: createdAt,
  }

  if (order.carrier) {
    order.trackingNumber = `IN${pad(ctx.orderId + 4000, 8)}${Math.floor(rand() * 90 + 10)}`
    order.shippedAt = at(2)
    if (fulfillment === 'Delivered') order.deliveredAt = at(ageDays)
  }

  const gateway =
    paymentMethod === 'COD'
      ? 'COD'
      : paymentMethod === 'UPI'
        ? rand() < 0.5
          ? 'PhonePe'
          : 'Razorpay'
        : paymentMethod === 'Card'
          ? 'Razorpay'
          : 'CCAvenue'

  const payment: PaymentRecord = {
    id: ctx.payId++,
    orderId: order.id,
    method: paymentMethod,
    amount: total,
    status: paymentStatus,
    gateway,
    gatewayFee: paymentMethod === 'COD' ? 0 : Math.round(total * 0.018),
    settled: paymentStatus === 'Paid' && rand() < 0.72,
    createdAt,
    settledAt: null,
  }
  if (payment.settled) payment.settledAt = at(0.5)

  let shipment: Shipment | null = null
  if (order.carrier) {
    shipment = {
      id: ctx.shipId++,
      orderId: order.id,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber ?? '',
      status: fulfillment === 'Delivered' ? 'Delivered' : 'In Transit',
      shippedAt: order.shippedAt,
      eta: at(ageDays < 5 ? 2 : 5),
    }
  }

  const refund =
    fulfillment === 'Cancelled' && prepaid
      ? { order, amount: total, reason: 'Order cancelled before shipment' }
      : null

  ctx.orderId++
  return { order, payment, shipment, refund }
}

function buildOrders(rand: () => number, products: Product[], customers: Customer[], now: number): OrderGen {
  const orders: Order[] = []
  const payments: PaymentRecord[] = []
  const shipments: Shipment[] = []
  const refundsToCreate: { order: Order; amount: number; reason: string }[] = []
  const ctx: GenCtx = { orderId: 0, evId: 0, payId: 0, shipId: 0 }

  for (let i = 0; i < 142; i++) {
    const built = buildOneOrder(rand, products, customers, now, ctx)
    if (!built.order || !built.payment) continue
    orders.push(built.order)
    payments.push(built.payment)
    if (built.shipment) shipments.push(built.shipment)
    if (built.refund) refundsToCreate.push(built.refund)
  }

  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { orders, payments, shipments, refundsToCreate }
}

/* ------------------------------------------------------------------ */
/* Customers, returns & refunds                                        */
/* ------------------------------------------------------------------ */

const STREETS = ['MG Road', 'Banjara Hills', 'FC Road', 'Park Street', 'Connaught Place', 'Ring Road', 'Church Street', 'Jubilee Hills']
const LANDMARKS = ['Near City Mall', 'Opp. Metro Station', 'Above HDFC Bank', 'Near Bus Depot', '']

function buildCustomersWithAddresses(rand: () => number, now: number): Customer[] {
  const base = buildCustomers(rand, now)
  let addrId = 1
  return base.map((c) => {
    const home: Customer['addresses'][number] = {
      id: addrId++,
      label: 'Home',
      line1: `Flat ${randInt(rand, 1, 120)}, ${pick(rand, STREETS)}`,
      line2: pick(rand, LANDMARKS),
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      phone: c.phone,
    }
    const addresses = [home]
    if (rand() < 0.35) {
      addresses.push({
        id: addrId++,
        label: 'Work',
        line1: `Suite ${randInt(rand, 100, 900)}, ${pick(rand, STREETS)}`,
        line2: 'Business Tower',
        city: c.city,
        state: c.state,
        pincode: String(randInt(rand, 400001, 700100)),
        phone: c.phone,
      })
    }
    return { ...c, addresses }
  })
}

function buildReturns(
  rand: () => number,
  orders: Order[],
  now: number
): {
  returns: ReturnRequest[]
  refundSeeds: { order: Order; amount: number; reason: string; returnId: number | null }[]
} {
  const returns: ReturnRequest[] = []
  const refundSeeds: { order: Order; amount: number; reason: string; returnId: number | null }[] = []
  let retId = 0
  let retSeq = 400

  const reasons = [
    'Size not fitting',
    'Quality issue',
    'Fabric not as expected',
    'Different from what I ordered',
    'Delivered damaged',
    'Changed my mind',
  ]

  const delivered = orders.filter((o) => o.fulfillmentStatus === 'Delivered')
  const recentDelivered = delivered.filter((o) => Date.now() - new Date(o.createdAt).getTime() < 9 * 86400000)
  const olderDelivered = delivered.filter((o) => Date.now() - new Date(o.createdAt).getTime() >= 9 * 86400000)

  const recentCount = Math.min(4, recentDelivered.length)
  const olderCount = Math.min(16, olderDelivered.length)
  const candidates = [...recentDelivered.slice(0, recentCount), ...olderDelivered.slice(0, olderCount)]

  for (const order of candidates) {
    const reason = pick(rand, reasons)
    const ageDays = (now - new Date(order.createdAt).getTime()) / 86400000

    let status: ReturnStatus
    if (ageDays < 5) status = 'Requested'
    else if (ageDays < 7) status = 'Approved'
    else if (ageDays < 9) status = 'Pickup Scheduled'
    else if (ageDays < 12) status = 'Received'
    else if (ageDays < 16) status = 'Refunded'
    else status = 'Completed'

    const partial = rand() < 0.18
    const amount = partial ? Math.round(order.total * (rand() < 0.5 ? 0.6 : 0.5)) : order.total

    const returnRequest: ReturnRequest = {
      id: retId,
      number: `RTN-${retSeq++}`,
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      reason,
      details: partial ? 'Partial return — customer kept one pair.' : 'Customer returned the full order.',
      status,
      amount,
      requestedAt: new Date(new Date(order.createdAt).getTime() + 10 * 86400000).toISOString(),
      updatedAt: new Date(now - Math.max(0, ageDays - 2) * 86400000).toISOString(),
    }
    returns.push(returnRequest)

    const returnDone = status === 'Refunded' || status === 'Completed'
    order.fulfillmentStatus = returnDone ? 'Refunded' : 'Returned'
    order.paymentStatus = returnDone ? 'Refunded' : 'Paid'
    order.timeline.push({
      id: 1000 + retId,
      status: order.fulfillmentStatus,
      note: `Return ${returnRequest.number} — ${reason}`,
      at: returnRequest.requestedAt,
      by: 'Returns Desk',
    })

    if (returnDone) {
      refundSeeds.push({
        order,
        amount,
        reason: `Return ${returnRequest.number} — ${reason}`,
        returnId: returnRequest.id,
      })
    }
    retId++
  }

  return { returns, refundSeeds }
}

function buildRefunds(
  rand: () => number,
  orderRefunds: { order: Order; amount: number; reason: string }[],
  returnRefunds: { order: Order; amount: number; reason: string; returnId: number | null }[]
): Refund[] {
  let refundId = 0
  let refundSeq = 500
  const refunds: Refund[] = []
  const all = [
    ...orderRefunds.map((r) => ({ ...r, returnId: null as number | null })),
    ...returnRefunds,
  ]
  for (const r of all) {
    const method = r.order.paymentMethod === 'COD' ? 'UPI' : r.order.paymentMethod
    const processed = rand() < 0.88
    refunds.push({
      id: refundId++,
      number: `RF-${refundSeq++}`,
      orderId: r.order.id,
      returnId: r.returnId,
      customerId: r.order.customerId,
      amount: r.amount,
      reason: r.reason,
      method,
      status: processed ? 'Processed' : 'Pending',
      createdAt: isoDaysAgo(randInt(rand, 1, 8)),
      processedAt: processed ? isoDaysAgo(randInt(rand, 0, 2)) : null,
    })
  }
  return refunds
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

const REVIEW_TEXTS: { title: string; body: string; stars: number }[] = [
  { title: 'Perfect everyday fit', body: 'Bought these for daily wear and they fit true to size. Wash after wash the colour holds up well.', stars: 5 },
  { title: 'Great quality cotton', body: 'The fabric feels soft and structured, exactly what I wanted. The fit is comfortable for everyday wear.', stars: 4 },
  { title: 'Runs a little long', body: 'Quality is great but the inseam is longer than expected. Had to get it hemmed locally.', stars: 4 },
  { title: 'Comfort all day', body: 'Wore them on a 10-hour flight, zero discomfort. The stretch does its job.', stars: 5 },
  { title: 'Disappointed with the colour', body: 'The wash looks lighter in person than in the photos. Not a bad pair otherwise.', stars: 3 },
  { title: 'Thin fabric', body: 'Fabric feels thinner than my older pairs. Okay for summer but not winter.', stars: 3 },
  { title: 'Poor stitching', body: 'The button came off within two weeks. Customer support arranged a replacement.', stars: 2 },
  { title: 'Best tee I have owned', body: 'Third piece from this brand and they keep getting better. The print and stitching are excellent.', stars: 5 },
  { title: 'Snug at the waist', body: 'Waist fits well but the hips are tight. Go one size up if you are between sizes.', stars: 4 },
  { title: 'Good value for money', body: 'At this price point, the quality is genuinely impressive. Would recommend.', stars: 4 },
  { title: 'Too baggy for me', body: 'I ordered the relaxed fit expecting a taper but it is quite wide. Style is subjective, fabric is fine.', stars: 3 },
  { title: 'Fast delivery', body: 'Ordered on Monday, got it Wednesday. Packing was neat and the fit is perfect.', stars: 5 },
]

function buildReviews(
  rand: () => number,
  orders: Order[],
  customers: Customer[],
  products: Product[],
  now: number
): Review[] {
  const reviews: Review[] = []
  let revId = 0
  const delivered = orders.filter(
    (o) => o.fulfillmentStatus === 'Delivered' || o.fulfillmentStatus === 'Returned' || o.fulfillmentStatus === 'Refunded'
  )
  const count = Math.min(84, customers.length * 2)

  for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length]
    const order = delivered[i % Math.max(1, delivered.length)]
    const productId = order ? (order.items[0]?.productId ?? 1) : 1
    const template = pick(rand, REVIEW_TEXTS)
    const statusRoll = rand()
    const status: ReviewStatus =
      statusRoll < 0.74 ? 'Approved' : statusRoll < 0.92 ? 'Pending' : statusRoll < 0.96 ? 'Rejected' : 'Hidden'
    const productFound = products.find((p) => p.id === productId)
    const viewed = productFound ? rand() < 0.85 : rand() < 0.6
    reviews.push({
      id: revId,
      customerId: customer.id,
      productId,
      rating: template.stars,
      title: template.title,
      content: template.body,
      status,
      verified: viewed,
      createdAt: isoDaysAgo(randInt(rand, 1, 60)),
      response:
        status === 'Approved' && rand() < 0.3
          ? 'Thank you for the detailed feedback — glad the fit worked out!'
          : null,
      respondedAt: null,
    })
    revId++
  }
  return reviews
}

/* ------------------------------------------------------------------ */
/* Marketing                                                           */
/* ------------------------------------------------------------------ */

function buildCoupons(now: number): Coupon[] {
  return [
    { id: 1, code: 'WELCOME15', type: 'percentage', value: 15, minOrderValue: 1299, maxDiscount: 499, startsAt: isoDaysAgo(300), endsAt: isoDaysAhead(300), usageLimit: null, perCustomerLimit: 1, productIds: [], categoryIds: [], isActive: true, timesUsed: 214 },
    { id: 2, code: 'FLAT199', type: 'fixed', value: 199, minOrderValue: 1999, maxDiscount: null, startsAt: isoDaysAgo(60), endsAt: isoDaysAhead(45), usageLimit: 500, perCustomerLimit: 1, productIds: [], categoryIds: [1], isActive: true, timesUsed: 132 },
    { id: 3, code: 'APPAREL10', type: 'percentage', value: 10, minOrderValue: 999, maxDiscount: 249, startsAt: isoDaysAgo(90), endsAt: isoDaysAhead(90), usageLimit: null, perCustomerLimit: 3, productIds: [], categoryIds: [], isActive: true, timesUsed: 356 },
    { id: 4, code: 'SAVE300', type: 'fixed', value: 300, minOrderValue: 2999, maxDiscount: null, startsAt: isoDaysAgo(45), endsAt: isoDaysAhead(20), usageLimit: 300, perCustomerLimit: 1, productIds: [], categoryIds: [], isActive: true, timesUsed: 88 },
    { id: 5, code: 'FIRSTORDER', type: 'fixed', value: 249, minOrderValue: 1499, maxDiscount: null, startsAt: isoDaysAgo(400), endsAt: isoDaysAhead(400), usageLimit: null, perCustomerLimit: 1, productIds: [], categoryIds: [], isActive: true, timesUsed: 418 },
    { id: 6, code: 'FESTIVE15', type: 'percentage', value: 15, minOrderValue: 1999, maxDiscount: 749, startsAt: isoDaysAhead(7), endsAt: isoDaysAhead(30), usageLimit: 1000, perCustomerLimit: 2, productIds: [], categoryIds: [], isActive: true, timesUsed: 41 },
    { id: 7, code: 'SELVEDGE50', type: 'percentage', value: 10, minOrderValue: 2499, maxDiscount: 499, startsAt: isoDaysAgo(14), endsAt: isoDaysAhead(14), usageLimit: 200, perCustomerLimit: 1, productIds: [], categoryIds: [], isActive: false, timesUsed: 63 },
    { id: 8, code: 'LOYAL10', type: 'percentage', value: 10, minOrderValue: 1499, maxDiscount: 400, startsAt: isoDaysAgo(200), endsAt: isoDaysAhead(200), usageLimit: null, perCustomerLimit: 5, productIds: [], categoryIds: [], isActive: true, timesUsed: 105 },
  ]
}

function buildPromotions(): Promotion[] {
  return [
    { id: 1, title: 'Flat ₹400 off all Slim Fits', target: 'Fit', targetId: 'Slim', discountType: 'fixed', discountValue: 400, startsAt: isoDaysAgo(10), endsAt: isoDaysAhead(20), status: 'Active', createdAt: isoDaysAgo(12) },
    { id: 2, title: 'Buy 2, get 10% off tees', target: 'Category', targetId: 4, discountType: 'percentage', discountValue: 10, startsAt: isoDaysAgo(5), endsAt: isoDaysAhead(15), status: 'Active', createdAt: isoDaysAgo(6) },
    { id: 3, title: 'Selvedge Week — 15% off Premium Selvedge', target: 'Collection', targetId: 3, discountType: 'percentage', discountValue: 15, startsAt: isoDaysAgo(2), endsAt: isoDaysAhead(5), status: 'Active', createdAt: isoDaysAgo(4) },
    { id: 4, title: 'Bootcut Revival — ₹500 off', target: 'Fit', targetId: 'Bootcut', discountType: 'fixed', discountValue: 500, startsAt: isoDaysAhead(7), endsAt: isoDaysAhead(21), status: 'Scheduled', createdAt: isoDaysAgo(1) },
    { id: 5, title: 'Seasonal apparel edit — 12% off', target: 'Category', targetId: 7, discountType: 'percentage', discountValue: 12, startsAt: isoDaysAgo(3), endsAt: isoDaysAhead(11), status: 'Active', createdAt: isoDaysAgo(5) },
    { id: 6, title: 'Summer Essentials Sale', target: 'Collection', targetId: 5, discountType: 'percentage', discountValue: 20, startsAt: isoDaysAhead(14), endsAt: isoDaysAhead(28), status: 'Scheduled', createdAt: isoDaysAgo(3) },
  ]
}

function buildBanners(): Banner[] {
  return [
    { id: 1, title: 'New Season Apparel', subtitle: 'Fresh tees and everyday bottoms', ctaLabel: 'Shop New Arrivals', link: '/collections/new-arrivals', image: img(2, 1400), startsAt: isoDaysAgo(20), endsAt: isoDaysAhead(40), status: 'Active', order: 1 },
    { id: 2, title: 'Heavyweight Cotton Edit', subtitle: 'Comfortable everyday tees', ctaLabel: 'Explore tees', link: '/shop/printed-tees', image: img(6, 1400), startsAt: isoDaysAgo(2), endsAt: isoDaysAhead(5), status: 'Active', order: 2 },
    { id: 3, title: 'Seasonal Essentials', subtitle: 'Easy layers for everyday wear', ctaLabel: 'Shop Now', link: '/collections/seasonal-edit', image: img(7, 1400), startsAt: isoDaysAhead(7), endsAt: isoDaysAhead(21), status: 'Scheduled', order: 3 },
    { id: 4, title: 'Festive Sale 2026', subtitle: 'Up to ₹1,500 off across the store', ctaLabel: 'Bookmark the sale', link: '/collections/bestsellers', image: img(3, 1400), startsAt: isoDaysAhead(21), endsAt: isoDaysAhead(60), status: 'Scheduled', order: 4 },
  ]
}

/* ------------------------------------------------------------------ */
/* Shipping, size charts, ops seed                                     */
/* ------------------------------------------------------------------ */

function buildShippingZones(): ShippingZone[] {
  const west = { id: 2, name: 'West India', regions: ['Maharashtra', 'Gujarat', 'Goa'] }
  return [
    {
      id: 1,
      name: 'North & Central India',
      regions: ['Delhi NCR', 'Uttar Pradesh', 'Haryana', 'Punjab', 'Rajasthan', 'Madhya Pradesh'],
      methods: [
        { id: 1, zoneId: 1, name: 'Standard', rate: 99, minDays: 2, maxDays: 4, codAvailable: true },
        { id: 2, zoneId: 1, name: 'Express', rate: 149, minDays: 1, maxDays: 2, codAvailable: true },
      ],
    },
    {
      ...west,
      methods: [
        { id: 3, zoneId: 2, name: 'Standard', rate: 99, minDays: 2, maxDays: 4, codAvailable: true },
        { id: 4, zoneId: 2, name: 'Express', rate: 149, minDays: 1, maxDays: 2, codAvailable: true },
      ],
    },
    {
      id: 3,
      name: 'South India',
      regions: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Telangana', 'Andhra Pradesh'],
      methods: [
        { id: 5, zoneId: 3, name: 'Standard', rate: 109, minDays: 2, maxDays: 5, codAvailable: true },
        { id: 6, zoneId: 3, name: 'Express', rate: 169, minDays: 1, maxDays: 3, codAvailable: true },
      ],
    },
    {
      id: 4,
      name: 'East & North-East India',
      regions: ['West Bengal', 'Bihar', 'Odisha', 'Assam', 'North-East States'],
      methods: [
        { id: 7, zoneId: 4, name: 'Standard', rate: 129, minDays: 3, maxDays: 6, codAvailable: true },
        { id: 8, zoneId: 4, name: 'Express', rate: 189, minDays: 2, maxDays: 3, codAvailable: false },
      ],
    },
  ]
}

function buildSizeCharts(): SizeChart[] {
  return CATEGORIES.map((cat) => ({
    categoryId: cat.id,
    description: cat.description || `${cat.name} sizing guide and body measurements in inches.`,
    measurements: sizeRangeFor(cat.slug).map((size) => ({
      size,
      waist: typeof size === 'number' ? size : 32,
      hip: typeof size === 'number' ? size + 8 : 40,
      inseam: (cat.slug === 'trackpants' || cat.slug === 'sweatpants') ? 32 : undefined,
      thigh: typeof size === 'number' ? Math.round(size * 0.72) : undefined,
    })),
  }))
}

function buildOpsSeed(): {
  adminUsers: AdminUser[]
  auditLog: AuditLogEntry[]
  notifications: AppNotification[]
  settings: StoreSettings
} {
  const adminUsers: AdminUser[] = []

  const auditLog: AuditLogEntry[] = [
    { id: 1, userId: 4, userName: 'Meena Krishnan', action: 'Adjusted stock', entity: 'Variant', entityId: 'TGE-109-32-BLK', detail: 'SKU TGE-109-32-BLK: 12 → 25 (restock)', at: isoDaysAgo(0.08) },
    { id: 2, userId: 3, userName: 'Rohan Kapoor', action: 'Updated product', entity: 'Product', entityId: 'Classic Breton Striped Tee', detail: 'Changed price ₹1,199 → ₹1,299', at: isoDaysAgo(0.5) },
    { id: 3, userId: 5, userName: 'Arjun Nair', action: 'Marked order shipped', entity: 'Order', entityId: 'TGE-2140', detail: 'Handed to Delhivery — tracking IN00010042', at: isoDaysAgo(1) },
    { id: 4, userId: 6, userName: 'Priya Anand', action: 'Created coupon', entity: 'Coupon', entityId: 'FESTIVE15', detail: '15% off, max ₹749', at: isoDaysAgo(1.2) },
    { id: 5, userId: 2, userName: 'Ananya Iyer', action: 'Approved return', entity: 'Return', entityId: 'RTN-401', detail: 'Approved — size not fitting', at: isoDaysAgo(2) },
    { id: 6, userId: 4, userName: 'Meena Krishnan', action: 'Adjusted stock', entity: 'Variant', entityId: 'TGE-120-34-BLU', detail: 'SKU TGE-120-34-BLU: 4 → 32 (purchase order PO-8821)', at: isoDaysAgo(3) },
    { id: 7, userId: 3, userName: 'Rohan Kapoor', action: 'Created product', entity: 'Product', entityId: 'Graphic Printed Tee', detail: 'New listing in Printed tees', at: isoDaysAgo(4) },
    { id: 8, userId: 7, userName: 'Kabir Shaikh', action: 'Replied to review', entity: 'Review', entityId: '#104', detail: 'Posted merchant response', at: isoDaysAgo(5) },
  ]

  const notifications: AppNotification[] = [
    { id: 1, type: 'low-stock', title: 'Low stock alert', body: '7 variants are running low — mostly size 34 in straight fits.', at: isoDaysAgo(0), read: false },
    { id: 2, type: 'order', title: 'Order out for delivery', body: 'IN-2149 is out for delivery in Bengaluru.', at: isoDaysAgo(0), read: false },
    { id: 3, type: 'payment', title: 'Payment failed', body: 'Payment failed for order IN-2142 (₹2,199). Customer retried successfully.', at: isoDaysAgo(0.2), read: false },
    { id: 4, type: 'review', title: 'Reviews awaiting moderation', body: '5 new reviews are waiting for approval.', at: isoDaysAgo(0.4), read: false },
    { id: 5, type: 'low-stock', title: 'Stock-out detected', body: 'Selvedge 14oz Raw Straight — W32 Blue is out of stock.', at: isoDaysAgo(1), read: true },
    { id: 6, type: 'system', title: 'Weekly digest ready', body: 'Your Week 35 performance report is available in Analytics.', at: isoDaysAgo(1.3), read: true },
  ]

  const settings: StoreSettings = {
    storeName: 'TEESGARAGE',
    supportEmail: 'support@teesgarage.in',
    supportPhone: '+91 73900 12345',
    address: 'TEESGARAGE Studio, Marine Drive, Kochi, Kerala 682031',
    currency: 'INR',
    taxRate: 18,
    orderPrefix: 'TG',
    returnWindowDays: 7,
    cancellationAllowedAfter: 'Processing',
    defaultShippingMethod: 'Standard',
    notify: { email: true, orderUpdates: true, inventoryAlerts: true, reviewAlerts: true },
  }

  return { adminUsers, auditLog, notifications, settings }
}

/* ------------------------------------------------------------------ */
/* Inventory movements (replayed from order history)                   */
/* ------------------------------------------------------------------ */

function buildInventoryMovements(
  rand: () => number,
  products: Product[],
  orders: Order[]
): InventoryMovement[] {
  const movements: InventoryMovement[] = []
  let movId = 1
  const consumedOrders = orders.filter((o) => o.fulfillmentStatus !== 'Cancelled')

  const soldByVariant = new Map<number, number>()
  for (const o of consumedOrders) {
    for (const item of o.items) {
      soldByVariant.set(item.variantId, (soldByVariant.get(item.variantId) ?? 0) + item.quantity)
    }
  }

  const running = new Map<number, number>()

  // Opening stock for every variant (initial = current + units sold since).
  for (const p of products) {
    for (const v of p.variants) {
      const sold = soldByVariant.get(v.id) ?? 0
      const initial = v.stock + sold
      running.set(v.id, initial)
      movements.push({
        id: movId++,
        productId: p.id,
        variantId: v.id,
        sku: v.sku,
        type: 'PURCHASE',
        delta: initial,
        before: 0,
        after: initial,
        reason: 'Opening stock',
        reference: `PO-${pad(Math.floor(rand() * 9000) + 1000, 5)}`,
        userId: null,
        userName: 'System',
        createdAt: new Date(new Date(p.createdAt).getTime() + 86400000).toISOString(),
      })
    }
  }

  // Sale movements, oldest order first.
  for (const o of consumedOrders) {
    for (const item of o.items) {
      const before = running.get(item.variantId) ?? 0
      const after = before - item.quantity
      running.set(item.variantId, after)
      movements.push({
        id: movId++,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        type: 'SALE',
        delta: -item.quantity,
        before,
        after,
        reason: `Order ${o.number}`,
        reference: o.number,
        userId: null,
        userName: 'System',
        createdAt: o.createdAt,
      })
    }
  }

  // A few manual adjustments & restocks for realism.
  const spotChecks: { sku: string; delta: number; reason: string; type: MovementType }[] = [
    { sku: 'TGE-112-34-BLU', delta: -2, reason: 'Cycle count variance', type: 'ADJUSTMENT' },
    { sku: 'TGE-119-30-GRY', delta: -3, reason: 'Damaged in transit (claim filed)', type: 'ADJUSTMENT' },
    { sku: 'TGE-105-36-BLK', delta: 24, reason: 'Fresh stock from godown', type: 'PURCHASE' },
  ]
  for (const spot of spotChecks) {
    let target: { p: Product; v: Variant } | null = null
    for (const p of products) {
      const v = p.variants.find((vv) => vv.sku === spot.sku)
      if (v) {
        target = { p, v }
        break
      }
    }
    if (!target) continue
    const before = running.get(target.v.id) ?? target.v.stock
    const after = before + spot.delta
    running.set(target.v.id, after)
    target.v.stock = after
    movements.push({
      id: movId++,
      productId: target.p.id,
      variantId: target.v.id,
      sku: target.v.sku,
      type: spot.type,
      delta: spot.delta,
      before,
      after,
      reason: spot.reason,
      reference: spot.type === 'ADJUSTMENT' ? `ADJ-${pad(movId, 3)}` : `PO-${pad(movId + 50, 5)}`,
      userId: 4,
      userName: 'Meena Krishnan',
      createdAt: isoDaysAgo(randInt(rand, 1, 12)),
    })
  }

  return movements
}

/* ------------------------------------------------------------------ */
/* Assembler                                                           */
/* ------------------------------------------------------------------ */

export function createDbState(): DbState {
  if (process.env.NODE_ENV === 'production') {
    return {
      version: DATA_VERSION,
      products: [], categories: CATEGORIES, collections: COLLECTIONS,
      orders: [], customers: [], returns: [], refunds: [], coupons: [], promotions: [], banners: [], reviews: [],
      sizeCharts: buildSizeCharts(), shippingZones: [], shipments: [], payments: [], inventoryMovements: [],
      adminUsers: [],
      roles: ROLE_DEFS.map((role) => ({ id: role.id, name: role.name, description: role.description, permissions: role.permissions })),
      auditLog: [], notifications: [],
      settings: {
        storeName: 'TEESGARAGE', supportEmail: 'support@teesgarage.in', supportPhone: '', address: '', currency: 'INR',
        taxRate: 18, orderPrefix: 'TG', returnWindowDays: 7, cancellationAllowedAfter: 'Processing',
        defaultShippingMethod: 'Standard',
        notify: { email: true, orderUpdates: true, inventoryAlerts: true, reviewAlerts: true }
      },
      navigation: DEFAULT_NAVIGATION_ITEMS.map((item) => ({ ...item })),
      homepage: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG)),
    }
  }

  const rand = mulberry32(SEED)

  const products = PRODUCT_SPECS.map((spec, i) => buildProduct(rand, spec, i, NOW))
  const customers = buildCustomersWithAddresses(rand, NOW)
  const orderGen = buildOrders(rand, products, customers, NOW)
  const { returns, refundSeeds } = buildReturns(rand, orderGen.orders, NOW)
  const refunds = buildRefunds(rand, orderGen.refundsToCreate, refundSeeds)
  const reviews = buildReviews(rand, orderGen.orders, customers, products, NOW)
  const ops = buildOpsSeed()
  const inventoryMovements = buildInventoryMovements(rand, products, orderGen.orders)
  const roles = ROLE_DEFS.map((r) => ({ id: r.id, name: r.name, description: r.description, permissions: r.permissions }))

  return {
    version: DATA_VERSION,
    products,
    categories: CATEGORIES,
    collections: COLLECTIONS,
    orders: orderGen.orders,
    customers,
    returns,
    refunds,
    coupons: buildCoupons(NOW),
    promotions: buildPromotions(),
    banners: buildBanners(),
    reviews,
    sizeCharts: buildSizeCharts(),
    shippingZones: buildShippingZones(),
    shipments: orderGen.shipments,
    payments: orderGen.payments,
    inventoryMovements,
    adminUsers: ops.adminUsers,
    roles,
    auditLog: ops.auditLog,
    notifications: ops.notifications,
    settings: ops.settings,
    navigation: DEFAULT_NAVIGATION_ITEMS.map((item) => ({ ...item })),
    homepage: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG)),
  }
}

export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'nav-1', label: 'Stripes', href: '/shop/stripes', type: 'category', targetValue: 'stripes', order: 0, isActive: true, openInNewTab: false },
  { id: 'nav-2', label: 'Fullsleeve', href: '/shop/fullsleeve', type: 'category', targetValue: 'fullsleeve', order: 1, isActive: true, openInNewTab: false },
  { id: 'nav-3', label: 'Drsleeve', href: '/shop/drsleeve', type: 'category', targetValue: 'drsleeve', order: 2, isActive: true, openInNewTab: false },
  { id: 'nav-4', label: 'Printed tees', href: '/shop/printed-tees', type: 'category', targetValue: 'printed-tees', order: 3, isActive: true, openInNewTab: false },
  { id: 'nav-5', label: 'Ringer tees', href: '/shop/ringer-tees', type: 'category', targetValue: 'ringer-tees', order: 4, isActive: true, openInNewTab: false },
  { id: 'nav-6', label: 'Henley', href: '/shop/henley', type: 'category', targetValue: 'henley', order: 5, isActive: true, openInNewTab: false },
  { id: 'nav-7', label: 'Trackpants', href: '/shop/trackpants', type: 'category', targetValue: 'trackpants', order: 6, isActive: true, openInNewTab: false },
  { id: 'nav-8', label: 'Sweatpants', href: '/shop/sweatpants', type: 'category', targetValue: 'sweatpants', order: 7, isActive: true, openInNewTab: false },
]

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sectionsOrder: [
    'announcement',
    'hero',
    'categories',
    'new_arrivals',
    'best_sellers',
    'featured_collection',
    'brand_story',
    'trust_bar',
    'looks',
    'instagram',
    'reviews',
    'catalog'
  ],
  sectionsEnabled: {
    announcement: true,
    hero: true,
    categories: true,
    new_arrivals: true,
    featured_collection: true,
    best_sellers: true,
    brand_story: true,
    looks: false,
    instagram: false,
    reviews: false,
    trust_bar: true,
    catalog: false
  },
  announcement: {
    enabled: true,
    messages: [
      '📦 Paid delivery calculated by destination and parcel weight',
      '🔄 7-Day doorstep exchanges — no questions asked',
      '🏭 24h dispatch from Mumbai',
      '💳 Cash on delivery available across India'
    ],
    intervalSeconds: 4
  },
  hero: {
    enabled: true,
    eyebrow: 'TEESGARAGE / EVERYDAY WEAR',
    title: 'Built for\neveryday.',
    subtitle: 'Heavyweight T-shirts. Engineered bottomwear.\nCuts that hold their shape with every wear.',
    primaryCtaText: 'Shop Collection',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'All Styles',
    secondaryCtaLink: '/shop',
    imageUrl: '/hero-man.jpg',
    trustBadges: []
  },
  categories: {
    enabled: true,
    eyebrow: 'Explore',
    title: 'Shop by Category',
    items: [
      {
        id: 'stripes', label: 'Stripes', icon: '💈',
        img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'fullsleeve', label: 'Fullsleeve', icon: '🧥',
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'drsleeve', label: 'Drsleeve', icon: '👕',
        img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'printed-tees', label: 'Printed Tees', icon: '🎨',
        img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'ringer-tees', label: 'Ringer Tees', icon: '⚡',
        img: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'henley', label: 'Henley', icon: '👔',
        img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'trackpants', label: 'Trackpants', icon: '👖',
        img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      },
      {
        id: 'sweatpants', label: 'Sweatpants', icon: '🩳',
        img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80', count: '3 styles'
      }
    ]
  },
  new_arrivals: {
    enabled: true,
    eyebrow: 'Fresh Drops',
    title: 'New Arrivals',
    limit: 4,
    ctaText: 'View All Products',
    ctaLink: '/shop'
  },
  featured_collection: {
    enabled: true,
    eyebrow: 'Featured Collection',
    title: 'The Essentials\nCollection',
    description:
      'Every piece designed to live in your rotation forever. Heavyweight fabrics, considered washes, and silhouettes that hold their shape.',
    ctaText: 'Shop Collection',
    ctaLink: '/shop',
    imageUrl: '/featured-collection.jpg'
  },
  best_sellers: {
    enabled: true,
    eyebrow: 'Community Picks',
    title: 'Best Sellers',
    subtitle: 'The styles our customers keep coming back for.',
    limit: 4
  },
  brand_story: {
    enabled: true,
    eyebrow: 'Our Story',
    title: 'Made for your\neveryday.',
    paragraphs: [
      'TEESGARAGE started with a simple question: why is it so hard to find heavyweight tees and bottomwear that fit right, last, and feel honest? We’re a Kerala-based label focused on getting everyday essentials right, from combed cotton to structured French terry.',
      'Considered garments built to hold their shape and earn a place in your daily rotation.'
    ],
    imageUrl: '/brand-editorial.jpg',
    stats: [
      { num: '260+ GSM', label: 'Cotton weight' },
      { num: '8', label: 'Categories' },
      { num: '24h', label: 'Kerala dispatch' }
    ],
    ctaText: 'Get in Touch',
    ctaLink: 'mailto:concierge@teesgarage.in'
  },
  looks: {
    enabled: true,
    eyebrow: 'Edit',
    title: 'Shop the Look',
    subtitle: 'Complete outfit inspiration — everything styled and linked.',
    items: [
      {
        id: 1,
        title: 'Off-duty uniform',
        tag: 'Drsleeve + Trackpants',
        img: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80',
        link: '/shop/trackpants'
      },
      {
        id: 2,
        title: 'Graphic rotation',
        tag: 'Printed tees',
        img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80',
        link: '/shop/printed-tees'
      },
      {
        id: 3,
        title: 'Everyday stripes',
        tag: 'Stripes + Sweatpants',
        img: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
        link: '/shop/stripes'
      },
      {
        id: 4,
        title: 'Long-sleeve layer',
        tag: 'Fullsleeve + Henley',
        img: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=600&q=80',
        link: '/shop/fullsleeve'
      }
    ]
  },
  instagram: {
    enabled: true,
    eyebrow: '@teesgarage.in',
    title: 'Follow Our Story',
    subtitle: 'Real people, real fits — tag us in yours.',
    instagramUrl: 'https://instagram.com',
    photos: []
  },
  reviews: {
    enabled: true,
    title: 'What Customers Say',
    ratingText: '',
    items: []
  },
  trust_bar: {
    enabled: true,
    items: [
      { id: '1', title: 'Paid delivery by destination and weight', icon: 'truck' },
      { id: '2', title: '7-day doorstep exchange', icon: 'repeat' },
      { id: '3', title: '24h dispatch from Kerala', icon: 'package' },
      { id: '4', title: 'Secure payments', icon: 'shield' }
    ]
  },
  catalog: {
    enabled: true,
    title: 'All Products',
    showFilters: true
  }
}