export const STORES = ['teesgarage', 'clothing-store', 'frontend'] as const
export type StoreType = (typeof STORES)[number]

export const FITS = [
  'Oversized',
  'Boxy',
  'Relaxed',
  'Regular',
  'Straight',
  'Baggy',
  'Bootcut',
  'Wide',
  'Slim'
] as const
export type Fit = (typeof FITS)[number]

export const CATEGORIES = [
  'stripes',
  'fullsleeve',
  'drsleeve',
  'printed-tees',
  'ringer-tees',
  'henley',
  'waffle',
  'trackpants',
  'sweatpants',
  't-shirts',
  'shirts',
  'hoodies',
  'accessories'
] as const
export type Category = (typeof CATEGORIES)[number]

export interface Variant {
  id?: number
  productId?: string
  sku?: string
  size: string | number
  color: string
  price?: number
  stock?: number
  reserved?: number
  reorderPoint?: number
  weight?: number
  barcode?: string
  status?: 'Active' | 'Inactive'
}

export interface Product {
  id: string
  store?: string
  category?: string
  name: string
  sku?: string
  price: string
  priceNum: number
  weightGrams?: number
  compareAtPrice?: number | null
  costPrice?: number | null
  taxRate?: number
  hsnCode?: string
  isFeatured?: boolean
  isFreeSize?: boolean
  careInstructions?: string
  img: string
  img2: string
  images?: string[]
  badge?: string
  desc: string
  color?: string
  sizes?: string[]
  variants?: Variant[]
  rating?: number
  inStock?: boolean
  collection?: string
  categoryId?: number
  slug?: string
  status?: string
  attributes?: Record<string, unknown>
  adminData?: Record<string, unknown>
  createdAt?: Date | string
}

export interface OrderItem {
  id: string
  variantId?: number
  name: string
  size: string
  price: string
  priceNum: number
  sku?: string
  quantity: number
  weightGrams?: number
  img?: string
  lineTotal?: number
  discountAmount?: number
  taxRate?: number
  taxAmount?: number
  taxableAmount?: number
  variantLabel?: string
}

export interface Order {
  id: number
  userId?: number | null
  orderNumber: string
  store: string
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  apartment?: string
  city: string
  state: string
  pincode: string
  notes?: string
  items: OrderItem[]
  subtotal: number
  discountTotal?: number
  shipping: number
  taxTotal?: number
  total: number
  weightGrams?: number
  couponCode?: string
  status: string
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  handoffType: 'whatsapp' | 'email' | 'razorpay' | 'cod'
  paymentMethod?: string
  paymentId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  carrier?: string | null
  trackingNumber?: string | null
  shippedAt?: Date | string | null
  deliveredAt?: Date | string | null
  adminNotes?: Array<{ id: string; text: string; at: string; by: string; internal?: boolean }>
  events?: Array<{ id: string; status: string; note: string; at: string; by: string }>
  createdAt: Date | string
  updatedAt?: Date | string
}

export interface CreateOrderInput {
  userId?: number | null
  orderNumber: string
  store?: string
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  apartment?: string
  city: string
  state: string
  pincode: string
  notes?: string
  items: OrderItem[]
  subtotal: number
  discountTotal?: number
  shipping: number
  taxTotal?: number
  total: number
  weightGrams?: number
  couponCode?: string
  handoffType?: 'whatsapp' | 'email' | 'razorpay' | 'cod'
  status?: string
  paymentMethod?: string
  paymentId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

export interface UserProfile {
  id: number
  uid: string
  email: string
  phone?: string | null
  name: string
  provider: string
  googleSub?: string | null
  onboardingCompleted?: boolean
  createdAt: Date | string
}

export interface AuthResponse {
  user: UserProfile
  token: string
  expiresIn: number
}

export type NavItemType = 'category' | 'collection' | 'custom'

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

export interface ShippingRate {
  baseWeightGrams: number
  baseCharge: number
  additionalWeightGrams: number
  additionalCharge: number
  estimatedDaysMin?: number
  estimatedDaysMax?: number
  exactDeliveryDate?: string
}

export interface ShippingRates {
  kerala: ShippingRate
  restOfIndia: ShippingRate
}

export interface DeliveryEstimation {
  minDays: number
  maxDays: number
  exactDeliveryDate?: string
  zone: 'kerala' | 'restOfIndia'
}

export interface Customer {
  id: number
  userId?: number | null
  name: string
  email: string
  phone?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface CustomerAddress {
  id: number
  customerId: number
  label: 'Home' | 'Work' | 'Other'
  line1: string
  line2?: string | null
  city: string
  state: string
  pincode: string
  phone?: string | null
  isDefault: boolean
}

export interface ProductReview {
  id: number
  productId: string
  customerId?: number | null
  reviewerName: string
  rating: number
  title?: string | null
  content: string
  isVerifiedPurchase: boolean
  status: 'Pending' | 'Approved' | 'Rejected' | 'Hidden'
  merchantResponse?: string | null
  createdAt: Date | string
}

export interface Shipment {
  id: number
  orderId: number
  carrier: string
  trackingNumber: string
  status: 'Pending' | 'Booked' | 'In Transit' | 'Delivered' | 'Failed' | 'RTO'
  shippedAt?: Date | string | null
  eta?: Date | string | null
  deliveredAt?: Date | string | null
}

export interface Payment {
  id: number
  orderId: number
  method: string
  amount: number
  status: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  gateway: string
  gatewayOrderId?: string | null
  gatewayPaymentId?: string | null
  settled: boolean
}
