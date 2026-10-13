import type {
  Customer,
  DbState,
  Fit,
  Order,
  Product,
  Review,
  Variant,
} from './types'

/* ------------------------------------------------------------------ */
/* Time series                                                         */
/* ------------------------------------------------------------------ */

const DAY = 86400000

export function revenueOf(order: Order): number {
  // Only realized revenue counts: prepaid captured, or COD after delivery.
  return order.paymentStatus === 'Paid' ? order.total : 0
}

export function realizedOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.paymentStatus === 'Paid')
}

export function isInWindow(iso: string, days: number, now = Date.now()): boolean {
  const t = new Date(iso).getTime()
  return t <= now && now - t <= days * DAY
}

export interface TimePoint {
  label: string
  revenue: number
  orders: number
  refunds: number
}

const dayLabel = (d: Date): string =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

export function series(data: DbState, days: number, now = Date.now()): TimePoint[] {
  const points: TimePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY)
    points.push({ label: dayLabel(d), revenue: 0, orders: 0, refunds: 0 })
  }
  const windowStart = now - days * DAY
  for (const o of data.orders) {
    const t = new Date(o.createdAt).getTime()
    if (t < windowStart || t > now) continue
    const idx = Math.floor((now - t) / DAY)
    if (idx >= 0 && idx < days) {
      points[days - 1 - idx].orders += 1
      points[days - 1 - idx].revenue += revenueOf(o)
    }
  }
  for (const r of data.refunds) {
    const t = new Date(r.createdAt).getTime()
    if (t < windowStart || t > now) continue
    const idx = Math.floor((now - t) / DAY)
    if (idx >= 0 && idx < days) points[days - 1 - idx].refunds += r.amount
  }
  return points
}

const monthLabel = (d: Date): string =>
  d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

export function monthlySeries(data: DbState, months = 12, now = Date.now()): TimePoint[] {
  const first = new Date(now)
  first.setDate(1)
  const anchor = new Date(first.getFullYear(), first.getMonth() - (months - 1), 1)
  const points: TimePoint[] = []
  for (let i = 0; i < months; i++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1)
    points.push({ label: monthLabel(d), revenue: 0, orders: 0, refunds: 0 })
  }
  const monthKey = (t: number): number => {
    const d = new Date(t)
    return (d.getFullYear() - anchor.getFullYear()) * 12 + (d.getMonth() - anchor.getMonth())
  }
  for (const o of data.orders) {
    const idx = monthKey(new Date(o.createdAt).getTime())
    if (idx >= 0 && idx < months) {
      points[idx].orders += 1
      points[idx].revenue += revenueOf(o)
    }
  }
  for (const r of data.refunds) {
    const idx = monthKey(new Date(r.createdAt).getTime())
    if (idx >= 0 && idx < months) points[idx].refunds += r.amount
  }
  return points
}

/* ------------------------------------------------------------------ */
/* KPIs with period-over-period delta                                  */
/* ------------------------------------------------------------------ */

export interface Kpi {
  value: number
  previous: number
  change: number | null
}

export interface KpiSet {
  revenue: Kpi
  orders: Kpi
  aov: Kpi
  customers: Kpi
  refunds: Kpi
  conversion: Kpi
}

function pctOf(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null
  return ((cur - prev) / prev) * 100
}

export function kpis(data: DbState, days = 30, now = Date.now()): KpiSet {
  const windowStart = now - days * DAY
  const prevStart = now - days * 2 * DAY
  const inCurrent = (iso: string) => {
    const t = new Date(iso).getTime()
    return t >= windowStart && t <= now
  }
  const inPrev = (iso: string) => {
    const t = new Date(iso).getTime()
    return t >= prevStart && t < windowStart
  }

  let revCur = 0
  let revPrev = 0
  let ordCur = 0
  let ordPrev = 0
  const custCur = new Set<number>()
  const custPrev = new Set<number>()
  let refCur = 0
  let refPrev = 0
  let sessionsCur = 0
  let sessionsPrev = 0

  for (const o of data.orders) {
    if (inCurrent(o.createdAt)) {
      ordCur += 1
      revCur += revenueOf(o)
      custCur.add(o.customerId)
    } else if (inPrev(o.createdAt)) {
      ordPrev += 1
      revPrev += revenueOf(o)
      custPrev.add(o.customerId)
    }
  }
  for (const r of data.refunds) {
    if (inCurrent(r.createdAt)) refCur += r.amount
    else if (inPrev(r.createdAt)) refPrev += r.amount
  }
  for (const p of data.products) {
    if (inCurrent(p.createdAt)) sessionsCur += Math.round(p.views * 0.15)
    else if (inPrev(p.createdAt)) sessionsPrev += Math.round(p.views * 0.15)
  }

  return {
    revenue: { value: revCur, previous: revPrev, change: pctOf(revCur, revPrev) },
    orders: { value: ordCur, previous: ordPrev, change: pctOf(ordCur, ordPrev) },
    aov: {
      value: ordCur ? Math.round(revCur / ordCur) : 0,
      previous: ordPrev ? Math.round(revPrev / ordPrev) : 0,
      change: pctOf(ordCur ? revCur / ordCur : 0, ordPrev ? revPrev / ordPrev : 0),
    },
    customers: { value: custCur.size, previous: custPrev.size, change: pctOf(custCur.size, custPrev.size) },
    refunds: { value: refCur, previous: refPrev, change: pctOf(refCur, refPrev) },
    conversion: {
      value: sessionsCur ? (ordCur / sessionsCur) * 100 : 0,
      previous: sessionsPrev ? (ordPrev / sessionsPrev) * 100 : 0,
      change: pctOf(
        sessionsCur ? (ordCur / sessionsCur) * 100 : 0,
        sessionsPrev ? (ordPrev / sessionsPrev) * 100 : 0
      ),
    },
  }
}

/* ------------------------------------------------------------------ */
/* Breakdowns by fit / size / color / wash / inseam                    */
/* ------------------------------------------------------------------ */

export interface BreakdownPoint {
  key: string
  units: number
  revenue: number
}

export function variantOf(data: DbState, variantId: number): Variant | undefined {
  for (const p of data.products) {
    const v = p.variants.find((x) => x.id === variantId)
    if (v) return v
  }
  return undefined
}

function breakdown(
  data: DbState,
  getKey: (product: Product, item: Order['items'][number]) => string | null,
  days: number | null,
  now = Date.now()
): BreakdownPoint[] {
  const map = new Map<string, BreakdownPoint>()
  const byProduct = new Map(data.products.map((p) => [p.id, p]))
  for (const o of data.orders) {
    if (days != null && !isInWindow(o.createdAt, days, now)) continue
    for (const item of o.items) {
      const product = byProduct.get(item.productId)
      if (!product) continue
      const key = getKey(product, item)
      if (!key) continue
      const entry = map.get(key) ?? { key, units: 0, revenue: 0 }
      entry.units += item.quantity
      entry.revenue += item.quantity * item.price
      map.set(key, entry)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export const salesByFit = (data: DbState, days: number | null = null): BreakdownPoint[] =>
  breakdown(data, (p) => p.fit, days)

export const salesByColor = (data: DbState, days: number | null = null): BreakdownPoint[] =>
  breakdown(data, (_p, item) => variantOf(data, item.variantId)?.color ?? null, days)

export const salesBySize = (data: DbState, days: number | null = null): BreakdownPoint[] =>
  breakdown(data, (_p, item) => String(variantOf(data, item.variantId)?.size ?? 0), days)

export const salesByWash = (data: DbState, days: number | null = null): BreakdownPoint[] =>
  breakdown(data, (p) => p.wash, days)

export const salesByInseam = (data: DbState, days: number | null = null): BreakdownPoint[] =>
  breakdown(data, (p) => `${p.inseam}"`, days)

/* ------------------------------------------------------------------ */
/* Product performance                                                 */
/* ------------------------------------------------------------------ */

export interface ProductPerformance {
  product: Product
  unitsSold: number
  revenue: number
  stock: number
  reserved: number
  returnRate: number
  views: number
}

export function topProducts(data: DbState, limit = 8): ProductPerformance[] {
  const sold = new Map<number, { units: number; revenue: number }>()
  const byProduct = new Map(data.products.map((p) => [p.id, p]))
  for (const o of data.orders) {
    for (const item of o.items) {
      const entry = sold.get(item.productId) ?? { units: 0, revenue: 0 }
      entry.units += item.quantity
      entry.revenue += item.quantity * item.price
      sold.set(item.productId, entry)
    }
  }
  const returnedUnits = new Map<number, number>()
  for (const r of data.returns) {
    for (const item of r.items) {
      returnedUnits.set(item.productId, (returnedUnits.get(item.productId) ?? 0) + item.quantity)
    }
  }
  const rows: ProductPerformance[] = []
  for (const [id, entry] of sold) {
    const product = byProduct.get(id)
    if (!product) continue
    const returned = returnedUnits.get(id) ?? 0
    rows.push({
      product,
      unitsSold: entry.units,
      revenue: entry.revenue,
      stock: product.variants.reduce((s, v) => s + v.stock, 0),
      reserved: product.variants.reduce((s, v) => s + v.reserved, 0),
      returnRate: entry.units ? (returned / entry.units) * 100 : 0,
      views: product.views,
    })
  }
  return rows.sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export function worstSellers(data: DbState, limit = 5): ProductPerformance[] {
  const all = topProducts(data, data.products.length)
  return all.slice(-limit).sort((a, b) => a.revenue - b.revenue)
}

/* ------------------------------------------------------------------ */
/* Return rates by fit / size                                          */
/* ------------------------------------------------------------------ */

export interface RatePoint {
  key: string
  rate: number
  units: number
  returned: number
}

export function returnRateByFit(data: DbState): RatePoint[] {
  const units = new Map<string, number>()
  const returnedMap = new Map<string, number>()
  for (const o of data.orders) {
    for (const item of o.items) {
      const p = data.products.find((x) => x.id === item.productId)
      if (!p) continue
      units.set(p.fit, (units.get(p.fit) ?? 0) + item.quantity)
    }
  }
  for (const r of data.returns) {
    const p = data.products.find((x) => x.id === r.items[0]?.productId)
    if (!p) continue
    returnedMap.set(p.fit, (returnedMap.get(p.fit) ?? 0) + r.items.reduce((s, i) => s + i.quantity, 0))
  }
  return [...units.entries()].map(([key, unitTotal]) => ({
    key,
    rate: unitTotal ? ((returnedMap.get(key) ?? 0) / unitTotal) * 100 : 0,
    units: unitTotal,
    returned: returnedMap.get(key) ?? 0,
  }))
}

export function returnRateBySize(data: DbState): RatePoint[] {
  const units = new Map<string, number>()
  const returnedMap = new Map<string, number>()
  for (const o of data.orders) {
    for (const item of o.items) {
      const v = variantOf(data, item.variantId)
      if (!v) continue
      units.set(String(v.size), (units.get(String(v.size)) ?? 0) + item.quantity)
    }
  }
  for (const r of data.returns) {
    for (const item of r.items) {
      const v = variantOf(data, item.variantId)
      if (!v) continue
      returnedMap.set(String(v.size), (returnedMap.get(String(v.size)) ?? 0) + item.quantity)
    }
  }
  return [...units.entries()].map(([key, unitTotal]) => ({
    key,
    rate: unitTotal ? ((returnedMap.get(key) ?? 0) / unitTotal) * 100 : 0,
    units: unitTotal,
    returned: returnedMap.get(key) ?? 0,
  }))
}

/* ------------------------------------------------------------------ */
/* Inventory alerts                                                    */
/* ------------------------------------------------------------------ */

export interface StockAlert {
  product: Product
  variant: Variant
  daysLeft: number | null
}

export function inventoryAlerts(data: DbState): { low: StockAlert[]; out: StockAlert[]; predicted: StockAlert[] } {
  const low: StockAlert[] = []
  const out: StockAlert[] = []
  const predicted: StockAlert[] = []

  for (const product of data.products) {
    if (product.status === 'Archived') continue
    for (const variant of product.variants) {
      const status = variant.stock <= 0 ? 'Out of Stock' : variant.stock <= variant.reorderPoint ? 'Low Stock' : 'Healthy'
      if (status === 'Out of Stock') out.push({ product, variant, daysLeft: null })
      else if (status === 'Low Stock') low.push({ product, variant, daysLeft: null })
    }
  }
  const soldByVariant = new Map<number, number>()
  const thirtyDays = Date.now() - 30 * DAY
  for (const m of data.inventoryMovements) {
    if (m.type !== 'SALE' || new Date(m.createdAt).getTime() < thirtyDays) continue
    soldByVariant.set(m.variantId, (soldByVariant.get(m.variantId) ?? 0) + Math.abs(m.delta))
  }
  for (const product of data.products) {
    if (product.status === 'Archived') continue
    for (const variant of product.variants) {
      if (variant.stock === 0) continue
      const rate = (soldByVariant.get(variant.id) ?? 0) / 30
      if (rate > 0 && variant.stock > variant.reorderPoint && variant.stock / rate < 14) {
        predicted.push({ product, variant, daysLeft: variant.stock / rate })
      }
    }
  }
  return { low, out, predicted }
}

export function stockOutsBySize(data: DbState): { size: number | string; count: number }[] {
  const bySize = new Map<number | string, number>()
  for (const p of data.products) {
    if (p.status === 'Archived') continue
    for (const v of p.variants) {
      if (v.stock === 0) bySize.set(v.size, (bySize.get(v.size) ?? 0) + 1)
    }
  }
  return [...bySize.entries()]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => String(a.size).localeCompare(String(b.size), undefined, { numeric: true }))
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export interface ReviewStats {
  average: number
  pending: number
  total: number
  distribution: { stars: number; count: number }[]
  lowest: { review: Review; product: Product }[]
  highest: { review: Review; product: Product }[]
}

export function reviewStats(data: DbState): ReviewStats {
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: data.reviews.filter((r) => r.rating === stars).length,
  }))
  const rated = data.reviews.filter((r) => r.rating > 0)
  const average = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0

  const grouped = new Map<number, Review[]>()
  for (const r of data.reviews) {
    const list = grouped.get(r.productId) ?? []
    list.push(r)
    grouped.set(r.productId, list)
  }
  const avgList = [...grouped.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([pid, list]) => ({ productId: pid, avg: list.reduce((s, r) => s + r.rating, 0) / list.length }))
    .sort((a, b) => b.avg - a.avg)
  const byProduct = new Map(data.products.map((p) => [p.id, p]))
  const top = (list: { productId: number }[], count: number) =>
    list.slice(0, count).flatMap((item) => {
      const product = byProduct.get(item.productId)
      if (!product) return []
      return (grouped.get(item.productId) ?? []).slice(0, 1).map((review) => ({ review, product }))
    })

  return {
    average,
    pending: data.reviews.filter((r) => r.status === 'Pending').length,
    total: data.reviews.length,
    distribution,
    lowest: top([...avgList].reverse(), 4),
    highest: top(avgList, 4),
  }
}

/* ------------------------------------------------------------------ */
/* Payments & shipping                                                 */
/* ------------------------------------------------------------------ */

export interface PaymentMetric {
  status: string
  count: number
  amount: number
}

export interface PaymentMetrics {
  byStatus: PaymentMetric[]
  byMethod: (PaymentMetric & { fees: number })[]
  settlements: number
  gatewayFees: number
  codOrders: number
}

export function paymentMetrics(data: DbState, days: number | null = null): PaymentMetrics {
  const statusMap = new Map<string, { count: number; amount: number }>()
  const methodMap = new Map<string, { count: number; amount: number; fees: number }>()
  let settled = 0
  let gatewayFees = 0
  let cod = 0
  for (const p of data.payments) {
    if (days != null && !isInWindow(p.createdAt, days)) continue
    const st = statusMap.get(p.status) ?? { count: 0, amount: 0 }
    st.count += 1
    st.amount += p.amount
    statusMap.set(p.status, st)
    if (p.method === 'COD') cod += 1
    const mt = methodMap.get(p.method) ?? { count: 0, amount: 0, fees: 0 }
    mt.count += 1
    mt.amount += p.amount
    mt.fees += p.gatewayFee
    gatewayFees += p.gatewayFee
    methodMap.set(p.method, mt)
    if (p.settled) settled += p.amount
  }
  const byStatus = [...statusMap.entries()].map(([status, v]) => ({ status, count: v.count, amount: v.amount }))
  const byMethod = [...methodMap.entries()]
    .map(([method, v]) => ({ status: method, count: v.count, amount: v.amount, fees: v.fees }))
    .sort((a, b) => b.amount - a.amount)
  return { byStatus, byMethod, settlements: settled, gatewayFees, codOrders: cod }
}

export interface ShippingMetrics {
  pending: number
  transit: number
  delivered: number
  failed: number
  rto: number
}

export function shippingMetrics(data: DbState): ShippingMetrics {
  let transit = 0
  let delivered = 0
  let failed = 0
  let rto = 0
  for (const s of data.shipments) {
    if (s.status === 'Delivered') delivered += 1
    else if (s.status === 'In Transit' || s.status === 'Booked') transit += 1
    else if (s.status === 'Failed') failed += 1
    else if (s.status === 'RTO') rto += 1
  }
  let pending = 0
  for (const o of data.orders) {
    if (
      o.fulfillmentStatus === 'Pending' ||
      o.fulfillmentStatus === 'Confirmed' ||
      o.fulfillmentStatus === 'Processing'
    ) {
      pending += 1
    }
  }
  return { pending, transit, delivered, failed, rto }
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export interface CustomerStats {
  customer: Customer
  orders: Order[]
  paidOrders: number
  count: number
  totalSpent: number
  aov: number
  lastOrderAt: string | null
  returnsCount: number
  refundsTotal: number
  reviewsCount: number
  segment: string
}

export function customerStats(data: DbState, customerId: number): CustomerStats | null {
  const customer = data.customers.find((c) => c.id === customerId)
  if (!customer) return null
  const orders = data.orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const paid = orders.filter((o) => o.paymentStatus === 'Paid')
  const totalSpent = paid.reduce((s, o) => s + o.total, 0)
  const returnsCount = data.returns.filter((r) => r.customerId === customerId && r.status !== 'Rejected').length
  const refundsTotal = data.refunds
    .filter((r) => r.customerId === customerId && r.status === 'Processed')
    .reduce((s, r) => s + r.amount, 0)
  const reviewsCount = data.reviews.filter((r) => r.customerId === customerId).length
  const lastOrderAt = orders[0]?.createdAt ?? null

  return {
    customer,
    orders,
    paidOrders: paid.length,
    count: orders.length,
    totalSpent,
    aov: paid.length ? Math.round(totalSpent / paid.length) : 0,
    lastOrderAt,
    returnsCount,
    refundsTotal,
    reviewsCount,
    segment: segmentFor(customer, orders, returnsCount, totalSpent),
  }
}

export function segmentFor(
  customer: Customer,
  orders: Order[],
  returnsCount: number,
  totalSpent: number
): string {
  const count = orders.length
  const now = Date.now()
  const joined = new Date(customer.joinedAt).getTime()
  const recent = orders.filter((o) => now - new Date(o.createdAt).getTime() < 120 * DAY).length
  if (count >= 3 && returnsCount / count >= 0.4) return 'High Return Rate'
  if (count >= 5 && totalSpent >= 20000) return 'VIP'
  if (count === 1 && now - joined < 60 * DAY) return 'New Customer'
  if (count >= 1 && recent === 0) return 'Inactive'
  if (count === 1) return 'At Risk'
  if (count > 1) return 'Repeat Customer'
  return 'Guest'
}

export function mostWishlisted(data: DbState, limit = 5): Product[] {
  return [...data.products].sort((a, b) => b.wishlists - a.wishlists).slice(0, limit)
}

export function mostViewed(data: DbState, limit = 5): Product[] {
  return [...data.products].sort((a, b) => b.views - a.views).slice(0, limit)
}

export interface ViewConversionRow {
  product: Product
  views: number
  ordered: number
  conversions: number
}

export function highViewsLowSales(data: DbState, limit = 5): ViewConversionRow[] {
  const sold = new Map<number, number>()
  for (const o of data.orders) {
    for (const item of o.items) {
      sold.set(item.productId, (sold.get(item.productId) ?? 0) + item.quantity)
    }
  }
  return data.products
    .map((p) => ({
      product: p,
      views: p.views,
      ordered: sold.get(p.id) ?? 0,
      conversions: p.views ? ((sold.get(p.id) ?? 0) / p.views) * 100 : 0,
    }))
    .filter((x) => x.views > 1500 && x.conversions < 2)
    .sort((a, b) => a.conversions - b.conversions)
    .slice(0, limit)
}