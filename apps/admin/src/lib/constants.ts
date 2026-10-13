import type {
  Color,
  Coupon,
  DiscountType,
  Fit,
  FulfillmentStatus,
  Gender,
  Material,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  Promotion,
  PromotionTarget,
  ReturnStatus,
  ReviewStatus,
  Rise,
  StockStatus,
  Wash,
} from './types'

/* ------------------------------------------------------------------ */
/* Domain option lists                                                 */
/* ------------------------------------------------------------------ */

export const FITS: Fit[] = ['Regular', 'Oversized', 'Boxy', 'Relaxed', 'Straight', 'Slim', 'Baggy', 'Wide', 'Tapered']
export const COLORS: Color[] = ['Black', 'White', 'Navy', 'Grey', 'Blue', 'Green', 'Olive', 'Red', 'Beige']
export const WASHES: Wash[] = ['Raw']
export const GENDERS: Gender[] = ['Men', 'Women', 'Unisex']
export const RISES: Rise[] = ['Low', 'Mid', 'High']
export const MATERIALS: Material[] = ['Cotton', 'Cotton Stretch', 'French Terry', 'Fleece', 'Jersey', 'Waffle Knit']
export const WAIST_SIZES = [28, 30, 32, 34, 36, 38, 40]
export const INSEAMS = [28, 30, 32, 34]
export const PRODUCT_STATUSES: ProductStatus[] = ['Active', 'Draft', 'Archived']

export const COLOR_SWATCH: Record<Color, string> = {
  Blue: '#3f6fb5',
  'Dark Blue': '#27345c',
  'Light Blue': '#7fa8d9',
  Black: '#26282b',
  Grey: '#8a9099',
  White: '#e8e4dc',
}

/* ------------------------------------------------------------------ */
/* Status metadata (label + tone)                                       */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export const ORDER_STATUSES: { value: FulfillmentStatus; tone: Tone; label: string }[] = [
  { value: 'Pending', tone: 'warning', label: 'Pending' },
  { value: 'Confirmed', tone: 'info', label: 'Confirmed' },
  { value: 'Processing', tone: 'info', label: 'Processing' },
  { value: 'Shipped', tone: 'primary', label: 'Shipped' },
  { value: 'Out for Delivery', tone: 'primary', label: 'Out for Delivery' },
  { value: 'Delivered', tone: 'success', label: 'Delivered' },
  { value: 'Cancelled', tone: 'danger', label: 'Cancelled' },
  { value: 'Returned', tone: 'warning', label: 'Returned' },
  { value: 'Refunded', tone: 'neutral', label: 'Refunded' },
]

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  Pending: 'warning',
  Paid: 'success',
  Failed: 'danger',
  Refunded: 'neutral',
}

export const PAYMENT_METHODS: PaymentMethod[] = ['Card', 'UPI', 'Net Banking', 'Wallet', 'COD']

export const RETURN_STATUSES: { value: ReturnStatus; tone: Tone; label: string }[] = [
  { value: 'Requested', tone: 'warning', label: 'Requested' },
  { value: 'Approved', tone: 'info', label: 'Approved' },
  { value: 'Rejected', tone: 'danger', label: 'Rejected' },
  { value: 'Pickup Scheduled', tone: 'primary', label: 'Pickup Scheduled' },
  { value: 'Received', tone: 'info', label: 'Received' },
  { value: 'Refunded', tone: 'success', label: 'Refunded' },
  { value: 'Completed', tone: 'success', label: 'Completed' },
]

export const REVIEW_STATUSES: { value: ReviewStatus; tone: Tone; label: string }[] = [
  { value: 'Pending', tone: 'warning', label: 'Pending' },
  { value: 'Approved', tone: 'success', label: 'Approved' },
  { value: 'Rejected', tone: 'danger', label: 'Rejected' },
  { value: 'Hidden', tone: 'neutral', label: 'Hidden' },
]

export const STOCK_STATUSES: { value: StockStatus; tone: Tone; label: string }[] = [
  { value: 'Healthy', tone: 'success', label: 'Healthy' },
  { value: 'Low Stock', tone: 'warning', label: 'Low Stock' },
  { value: 'Out of Stock', tone: 'danger', label: 'Out of Stock' },
]

export const RETURN_REASONS = [
  'Size not fitting',
  'Quality issue',
  'Changed my mind',
  'Delivered damaged',
  'Different from what I ordered',
  'Fabric not as expected',
]

export const CARRIERS = ['Delhivery', 'Blue Dart', 'DTDC', 'Ecom Express', 'India Post', 'XpressBees']

export const COUPON_STATUS: Record<'active' | 'scheduled' | 'expired' | 'exhausted', Tone> = {
  active: 'success',
  scheduled: 'info',
  expired: 'neutral',
  exhausted: 'warning',
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function stockStatusOf(stock: number, reorder: number): StockStatus {
  if (stock <= 0) return 'Out of Stock'
  if (stock <= reorder) return 'Low Stock'
  return 'Healthy'
}

export function totalStockOf(variants: { stock: number; reserved: number }[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0)
}

export function availableStockOf(variants: { stock: number; reserved: number }[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, v.stock - v.reserved), 0)
}

export function discountTypeLabel(t: DiscountType): string {
  return t === 'percentage' ? 'Percentage' : 'Fixed Amount'
}

export function promotionStatusLabel(p: Promotion): 'Scheduled' | 'Active' | 'Ended' {
  const now = Date.now()
  const start = new Date(p.startsAt).getTime()
  const end = new Date(p.endsAt).getTime()
  if (now < start) return 'Scheduled'
  if (now > end) return 'Ended'
  return 'Active'
}

export function couponStatusLabel(c: Coupon): 'active' | 'scheduled' | 'expired' | 'exhausted' {
  const now = Date.now()
  const start = new Date(c.startsAt).getTime()
  const end = new Date(c.endsAt).getTime()
  if (!c.isActive) return 'expired'
  if (now < start) return 'scheduled'
  if (now > end) return 'expired'
  if (c.usageLimit != null && c.timesUsed >= c.usageLimit) return 'exhausted'
  return 'active'
}

export const PROMOTION_TARGETS: PromotionTarget[] = ['Product', 'Category', 'Collection', 'Fit', 'Color']
