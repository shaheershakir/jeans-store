/**
 * TEESGARAGE Admin — domain model.
 *
 * The admin manages a much richer catalog shape than the storefront
 * (`frontend/src/lib/constants.ts`): one product owns many variants
 * (size × color), and every variant owns its own inventory/SKU.
 * The persisted store in `src/store` is the swap point for the backend
 * API once `backend/` is built.
 */

export type Fit =
  | 'Oversized'
  | 'Boxy'
  | 'Relaxed'
  | 'Regular'
  | 'Straight'
  | 'Baggy'
  | 'Bootcut'
  | 'Wide'
  | 'Tapered'
  | 'Slim'
  | 'Skinny'

export type Color =
  | 'Black'
  | 'White'
  | 'Navy'
  | 'Grey'
  | 'Blue'
  | 'Dark Blue'
  | 'Light Blue'
  | 'Green'
  | 'Olive'
  | 'Red'
  | 'Beige'
  | string

export type Wash =
  | 'Raw'
  | 'Stone Wash'
  | 'Acid Wash'
  | 'Vintage Wash'
  | 'Distressed'
  | 'Dark Wash'
export type Gender = 'Men' | 'Women' | 'Unisex'
export type Rise = 'Low' | 'Mid' | 'High'
export type Material = 'Cotton' | 'Cotton Stretch' | 'French Terry' | 'Fleece' | 'Jersey' | 'Waffle Knit'

export type ProductStatus = 'Active' | 'Draft' | 'Archived'
export type StockStatus = 'Healthy' | 'Low Stock' | 'Out of Stock'

export interface Product {
  id: number
  name: string
  slug: string
  sku: string
  description: string
  brand?: string
  categoryId: number
  collectionId: number
  fit?: Fit
  gender?: Gender
  rise?: Rise
  material?: Material
  pattern?: string
  wash?: Wash
  inseam?: number
  price: number
  compareAtPrice: number | null
  costPrice: number
  taxRate: number
  status: ProductStatus
  featured: boolean
  weightGrams?: number
  views: number
  wishlists: number
  image: string
  images: ProductImage[]
  variants: Variant[]
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: number
  url: string
  alt: string
  order: number
}

export interface Variant {
  id: number
  productId: number
  sku: string
  size: number | string
  color: Color
  price: number
  stock: number
  reserved: number
  reorderPoint: number
  weight: number
  barcode: string
  status: 'Active' | 'Inactive'
}


export interface Category {
  id: number
  name: string
  slug: string
  description: string
  parentId: number | null
}

export interface Collection {
  id: number
  name: string
  slug: string
  description: string
  status: 'Active' | 'Inactive'
}

export type PaymentMethod = 'Card' | 'UPI' | 'Net Banking' | 'Wallet' | 'Razorpay' | 'COD'
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded'

export type FulfillmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded'

export interface OrderItem {
  id: number
  productId: number
  variantId: number
  productName: string
  variantLabel: string
  sku: string
  quantity: number
  price: number
  total: number
}

export interface Address {
  id: number
  label: 'Home' | 'Work'
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  phone: string
}

export interface OrderEvent {
  id: number
  status: string
  note: string
  at: string
  by: string
}

export interface OrderNote {
  id: number
  text: string
  at: string
  by: string
  internal: boolean
}

export interface Order {
  id: number
  number: string
  customerId: number
  items: OrderItem[]
  subtotal: number
  discount: number
  shippingFee: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  transactionId: string | null
  fulfillmentStatus: FulfillmentStatus
  shippingAddress: Address
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  timeline: OrderEvent[]
  notes: OrderNote[]
  createdAt: string
  updatedAt: string
}

export type CustomerSegment =
  | 'New Customer'
  | 'Repeat Customer'
  | 'VIP'
  | 'Inactive'
  | 'High Return Rate'
  | 'At Risk'

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  city: string
  state: string
  pincode: string
  joinedAt: string
  addresses: Address[]
}

export type ReturnStatus =
  | 'Requested'
  | 'Approved'
  | 'Rejected'
  | 'Pickup Scheduled'
  | 'Received'
  | 'Refunded'
  | 'Completed'

export interface ReturnRequest {
  id: number
  number: string
  orderId: number
  customerId: number
  items: OrderItem[]
  reason: string
  details: string
  status: ReturnStatus
  amount: number
  requestedAt: string
  updatedAt: string
}

export type RefundStatus = 'Pending' | 'Processed' | 'Failed'

export interface Refund {
  id: number
  number: string
  orderId: number
  returnId: number | null
  customerId: number
  amount: number
  reason: string
  method: PaymentMethod
  status: RefundStatus
  createdAt: string
  processedAt: string | null
}

export type DiscountType = 'percentage' | 'fixed'

export interface Coupon {
  id: number
  code: string
  type: DiscountType
  value: number
  minOrderValue: number
  maxDiscount: number | null
  startsAt: string
  endsAt: string
  usageLimit: number | null
  perCustomerLimit: number
  productIds: number[]
  categoryIds: number[]
  isActive: boolean
  timesUsed: number
}

export type PromotionTarget = 'Product' | 'Category' | 'Collection' | 'Fit' | 'Color'

export interface Promotion {
  id: number
  title: string
  target: PromotionTarget
  targetId: number | string
  discountType: DiscountType
  discountValue: number
  startsAt: string
  endsAt: string
  status: 'Scheduled' | 'Active' | 'Ended'
  createdAt: string
}

export interface Banner {
  id: number
  title: string
  subtitle: string
  ctaLabel: string
  link: string
  image: string
  startsAt: string
  endsAt: string
  status: 'Active' | 'Scheduled' | 'Ended'
  order: number
}

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected' | 'Hidden'

export interface Review {
  id: number
  customerId: number
  productId: number
  rating: number
  title: string
  content: string
  status: ReviewStatus
  verified: boolean
  createdAt: string
  response: string | null
  respondedAt: string | null
}

export type SizeChartMeasurement = {
  size: number | string
  waist?: number
  hip?: number
  chest?: number
  length?: number
  inseam?: number
  thigh?: number
  [key: string]: unknown
}

export interface SizeChart {
  categoryId: number
  description: string
  measurements: SizeChartMeasurement[]
}

export interface ShippingZone {
  id: number
  name: string
  regions: string[]
  methods: ShippingMethod[]
}

export interface ShippingMethod {
  id: number
  zoneId: number
  name: string
  rate: number
  minDays: number
  maxDays: number
  codAvailable: boolean
}

export interface Shipment {
  id: number
  orderId: number
  carrier: string
  trackingNumber: string
  status: 'Pending' | 'Booked' | 'In Transit' | 'Delivered' | 'Failed' | 'RTO'
  shippedAt: string | null
  eta: string
}

export interface PaymentRecord {
  id: number
  orderId: number
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  gateway: string
  gatewayFee: number | null
  settled: boolean
  createdAt: string
  settledAt: string | null
}

export interface AdminUser {
  id: number
  name: string
  email: string
  roleId: number
  status: 'Active' | 'Inactive'
  lastLoginAt: string | null
}

export interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
}

export interface AuditLogEntry {
  id: number
  userId: number
  userName: string
  action: string
  entity: string
  entityId: string
  detail: string
  at: string
}

export type NotificationType = 'low-stock' | 'order' | 'payment' | 'review' | 'system'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  at: string
  read: boolean
}

export interface StoreSettings {
  storeName: string
  supportEmail: string
  supportPhone: string
  address: string
  currency: string
  taxRate: number
  orderPrefix: string
  returnWindowDays: number
  cancellationAllowedAfter: string
  defaultShippingMethod: string
  notify: {
    email: boolean
    orderUpdates: boolean
    inventoryAlerts: boolean
    reviewAlerts: boolean
  }
}

export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'RESERVATION' | 'RELEASE'

export interface InventoryMovement {
  id: number
  productId: number
  variantId: number
  sku: string
  type: MovementType
  delta: number
  before: number
  after: number
  reason: string
  reference: string
  userId: number | null
  userName: string
  createdAt: string
}

export type NavItemType = 'fit' | 'category' | 'custom'

export interface NavigationItem {
  id: string
  label: string
  href: string
  type: NavItemType
  targetValue?: string
  badge?: string
  order: number
  isActive: boolean
  openInNewTab: boolean
}

export interface DbState {
  version: number
  products: Product[]
  categories: Category[]
  collections: Collection[]
  orders: Order[]
  customers: Customer[]
  returns: ReturnRequest[]
  refunds: Refund[]
  coupons: Coupon[]
  promotions: Promotion[]
  banners: Banner[]
  reviews: Review[]
  sizeCharts: SizeChart[]
  shippingZones: ShippingZone[]
  shipments: Shipment[]
  payments: PaymentRecord[]
  inventoryMovements: InventoryMovement[]
  adminUsers: AdminUser[]
  roles: Role[]
  auditLog: AuditLogEntry[]
  notifications: AppNotification[]
  settings: StoreSettings
  navigation: NavigationItem[]
  homepage: HomepageConfig
}

export type HomepageSectionType =
  | 'announcement'
  | 'hero'
  | 'categories'
  | 'new_arrivals'
  | 'featured_collection'
  | 'best_sellers'
  | 'brand_story'
  | 'looks'
  | 'instagram'
  | 'reviews'
  | 'trust_bar'
  | 'catalog'

export interface HomepageCategoryItem {
  id: string
  label: string
  icon: string
  img: string
  count: string
}

export interface HomepageLookItem {
  id: number
  title: string
  tag: string
  img: string
  link?: string
}

export interface HomepageReviewItem {
  id: number
  name: string
  location: string
  stars: number
  text: string
  product: string
}

export interface HomepageTrustItem {
  id: string
  title: string
  subtitle?: string
  icon?: string
}

export interface HomepageConfig {
  sectionsOrder: HomepageSectionType[]
  sectionsEnabled: Record<string, boolean>
  announcement: {
    enabled: boolean
    messages: string[]
    intervalSeconds: number
  }
  hero: {
    enabled: boolean
    eyebrow: string
    title: string
    subtitle: string
    primaryCtaText: string
    primaryCtaLink: string
    secondaryCtaText: string
    secondaryCtaLink: string
    imageUrl: string
    trustBadges: string[]
  }
  categories: {
    enabled: boolean
    eyebrow: string
    title: string
    items: HomepageCategoryItem[]
  }
  new_arrivals: {
    enabled: boolean
    eyebrow: string
    title: string
    limit: number
    ctaText: string
    ctaLink: string
  }
  featured_collection: {
    enabled: boolean
    eyebrow: string
    title: string
    description: string
    ctaText: string
    ctaLink: string
    imageUrl: string
  }
  best_sellers: {
    enabled: boolean
    eyebrow: string
    title: string
    subtitle: string
    limit: number
  }
  brand_story: {
    enabled: boolean
    eyebrow: string
    title: string
    paragraphs: string[]
    imageUrl: string
    stats: Array<{ num: string; label: string }>
    ctaText: string
    ctaLink: string
  }
  looks: {
    enabled: boolean
    eyebrow: string
    title: string
    subtitle: string
    items: HomepageLookItem[]
  }
  instagram: {
    enabled: boolean
    eyebrow: string
    title: string
    subtitle: string
    instagramUrl: string
    photos: string[]
  }
  reviews: {
    enabled: boolean
    title: string
    ratingText: string
    items: HomepageReviewItem[]
  }
  trust_bar: {
    enabled: boolean
    items: HomepageTrustItem[]
  }
  catalog: {
    enabled: boolean
    title: string
    showFilters: boolean
  }
}