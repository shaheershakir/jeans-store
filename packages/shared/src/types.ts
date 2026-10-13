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
  productId?: number
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
  id: number
  store?: string
  category?: string
  name: string
  sku?: string
  fit?: Fit
  price: string
  priceNum: number
  img: string
  img2: string
  images?: string[]
  badge?: string
  desc: string
  wash?: string
  color?: string
  sizes?: string[]
  variants?: Variant[]
  fabric?: string
  material?: string
  sleeveLength?: string
  neckType?: string
  pattern?: string
  printStyle?: string
  trimColor?: string
  buttons?: string
  waistSize?: string[]
  length?: string
  closure?: string
  pockets?: string
  use?: string
  legStyle?: string
  rise?: string
  rating?: number
  inStock?: boolean
  collection?: string
}

export interface OrderItem {
  id: number
  name: string
  fit?: string
  size: string
  price: string
  priceNum: number
  quantity: number
  img?: string
}

export interface Order {
  id: number
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
  shipping: number
  total: number
  status: string
  handoffType: 'whatsapp' | 'email' | 'razorpay' | 'cod'
  paymentMethod?: string
  paymentId?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  createdAt: Date | string
}

export interface CreateOrderInput {
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
  shipping: number
  total: number
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
  name: string
  provider: string
  createdAt: Date | string
}

export interface AuthResponse {
  user: UserProfile
  token: string
  expiresIn: number
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
