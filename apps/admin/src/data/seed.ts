import type {
  AppNotification,
  AuditLogEntry,
  Category,
  Collection,
  Coupon,
  Customer,
  DbState,
  HomepageConfig,
  InventoryMovement,
  NavigationItem,
  Order,
  PaymentRecord,
  Product,
  Refund,
  Review,
  Shipment,
  ShippingZone,
  SizeChart,
  StoreSettings,
} from '@/lib/types'

export const DATA_VERSION = 8

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Stripes', slug: 'stripes', description: 'Classic horizontal and vertical striped t-shirts.' },
  { id: 2, name: 'Fullsleeve', slug: 'fullsleeve', description: 'Full sleeve heavyweight and ribbed t-shirts.' },
  { id: 3, name: 'Drsleeve', slug: 'drsleeve', description: 'Drop shoulder loose and boxy cut tees.' },
  { id: 4, name: 'Printed tees', slug: 'printed-tees', description: 'Screen printed and graphic streetwear tees.' },
  { id: 5, name: 'Ringer tees', slug: 'ringer-tees', description: 'Vintage style contrast rib collar and cuff tees.' },
  { id: 6, name: 'Henley', slug: 'henley', description: 'Button placket waffle and jersey knit tees.' },
  { id: 7, name: 'Waffle', slug: 'waffle', description: 'Thermal waffle knit tees and long sleeves with textured honeycomb weave.' },
  { id: 8, name: 'Trackpants', slug: 'trackpants', description: 'Athletic, training and tapered trackpants.' },
  { id: 9, name: 'Sweatpants', slug: 'sweatpants', description: 'Heavyweight fleece and French terry sweatpants.' },
]

function sizeRangeFor(category: string): Array<string | number> {
  return category === 'trackpants' || category === 'sweatpants'
    ? [28, 30, 32, 34, 36, 38, 40]
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL']
}

function buildSizeCharts(): SizeChart[] {
  return CATEGORIES.map((cat) => ({
    categoryId: cat.id,
    description: cat.description || `${cat.name} sizing guide and body measurements in inches.`,
    measurements: sizeRangeFor(cat.slug).map((size) => ({
      size,
      waist: typeof size === 'number' ? size : 32,
      hip: typeof size === 'number' ? size + 8 : 40,
      inseam: cat.slug === 'trackpants' || cat.slug === 'sweatpants' ? 32 : undefined,
      thigh: typeof size === 'number' ? Math.round(size * 0.72) : undefined,
    })),
  }))
}

export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'nav-1', label: 'Stripes', href: '/shop/stripes', type: 'category', targetValue: 'stripes', order: 0, isActive: true, openInNewTab: false },
  { id: 'nav-2', label: 'Fullsleeve', href: '/shop/fullsleeve', type: 'category', targetValue: 'fullsleeve', order: 1, isActive: true, openInNewTab: false },
  { id: 'nav-3', label: 'Drsleeve', href: '/shop/drsleeve', type: 'category', targetValue: 'drsleeve', order: 2, isActive: true, openInNewTab: false },
  { id: 'nav-4', label: 'Printed tees', href: '/shop/printed-tees', type: 'category', targetValue: 'printed-tees', order: 3, isActive: true, openInNewTab: false },
  { id: 'nav-5', label: 'Ringer tees', href: '/shop/ringer-tees', type: 'category', targetValue: 'ringer-tees', order: 4, isActive: true, openInNewTab: false },
  { id: 'nav-6', label: 'Henley', href: '/shop/henley', type: 'category', targetValue: 'henley', order: 5, isActive: true, openInNewTab: false },
  { id: 'nav-7', label: 'Waffle', href: '/shop/waffle', type: 'category', targetValue: 'waffle', order: 6, isActive: true, openInNewTab: false },
  { id: 'nav-8', label: 'Trackpants', href: '/shop/trackpants', type: 'category', targetValue: 'trackpants', order: 7, isActive: true, openInNewTab: false },
  { id: 'nav-9', label: 'Sweatpants', href: '/shop/sweatpants', type: 'category', targetValue: 'sweatpants', order: 8, isActive: true, openInNewTab: false },
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
    'catalog',
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
    catalog: false,
  },
  announcement: {
    enabled: true,
    messages: [
      '📦 Paid delivery calculated by destination and parcel weight',
      '🔄 7-Day doorstep exchanges — no questions asked',
      '🏭 24h dispatch from Mumbai',
      '💳 Cash on delivery available across India',
    ],
    intervalSeconds: 4,
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
    trustBadges: [],
  },
  categories: {
    enabled: true,
    eyebrow: 'Explore',
    title: 'Shop by Category',
    items: [
      {
        id: 'stripes',
        label: 'Stripes',
        icon: '💈',
        img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'fullsleeve',
        label: 'Fullsleeve',
        icon: '🧥',
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'drsleeve',
        label: 'Drsleeve',
        icon: '👕',
        img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'printed-tees',
        label: 'Printed Tees',
        icon: '🎨',
        img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'ringer-tees',
        label: 'Ringer Tees',
        icon: '⚡',
        img: 'https://images.unsplash.com/photo-1503343394128-c104d54dba01?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'henley',
        label: 'Henley',
        icon: '👔',
        img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'waffle',
        label: 'Waffle',
        icon: '🧇',
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'trackpants',
        label: 'Trackpants',
        icon: '👖',
        img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
      {
        id: 'sweatpants',
        label: 'Sweatpants',
        icon: '🩳',
        img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
        count: '3 styles',
      },
    ],
  },
  new_arrivals: {
    enabled: true,
    eyebrow: 'Fresh Drops',
    title: 'New Arrivals',
    limit: 4,
    ctaText: 'View All Products',
    ctaLink: '/shop',
  },
  featured_collection: {
    enabled: true,
    eyebrow: 'Featured Collection',
    title: 'The Essentials\nCollection',
    description:
      'Every piece designed to live in your rotation forever. Heavyweight fabrics, considered washes, and silhouettes that hold their shape.',
    ctaText: 'Shop Collection',
    ctaLink: '/shop',
    imageUrl: '/featured-collection.jpg',
  },
  best_sellers: {
    enabled: true,
    eyebrow: 'Community Picks',
    title: 'Best Sellers',
    subtitle: 'The styles our customers keep coming back for.',
    limit: 4,
  },
  brand_story: {
    enabled: true,
    eyebrow: 'Our Story',
    title: 'Made for your\neveryday.',
    paragraphs: [
      'TEESGARAGE started with a simple question: why is it so hard to find heavyweight tees and bottomwear that fit right, last, and feel honest? We’re a Kerala-based label focused on getting everyday essentials right, from combed cotton to structured French terry.',
      'Considered garments built to hold their shape and earn a place in your daily rotation.',
    ],
    imageUrl: '/brand-editorial.jpg',
    stats: [
      { num: '260+ GSM', label: 'Cotton weight' },
      { num: '9', label: 'Categories' },
      { num: '24h', label: 'Kerala dispatch' },
    ],
    ctaText: 'Get in Touch',
    ctaLink: 'mailto:concierge@teesgarage.in',
  },
  looks: {
    enabled: true,
    eyebrow: 'Edit',
    title: 'Shop the Look',
    subtitle: 'Complete outfit inspiration — everything styled and linked.',
    items: [],
  },
  instagram: {
    enabled: true,
    eyebrow: '@teesgarage.in',
    title: 'Follow Our Story',
    subtitle: 'Real people, real fits — tag us in yours.',
    instagramUrl: 'https://instagram.com',
    photos: [],
  },
  reviews: {
    enabled: true,
    title: 'What Customers Say',
    ratingText: '',
    items: [],
  },
  trust_bar: {
    enabled: true,
    items: [
      { id: '1', title: 'Paid delivery by destination and weight', icon: 'truck' },
      { id: '2', title: '7-day doorstep exchange', icon: 'repeat' },
      { id: '3', title: '24h dispatch from Kerala', icon: 'package' },
      { id: '4', title: 'Secure payments', icon: 'shield' },
    ],
  },
  catalog: {
    enabled: true,
    title: 'All Products',
    showFilters: true,
  },
}

export function createDbState(): DbState {
  return {
    version: DATA_VERSION,
    products: [],
    categories: CATEGORIES,
    collections: [],
    orders: [],
    customers: [],
    refunds: [],
    coupons: [],
    reviews: [],
    sizeCharts: buildSizeCharts(),
    shippingZones: [],
    shipments: [],
    payments: [],
    inventoryMovements: [],
    auditLog: [],
    notifications: [],
    settings: {
      storeName: 'TEESGARAGE',
      supportEmail: 'support@teesgarage.in',
      supportPhone: '',
      address: '',
      currency: 'INR',
      orderPrefix: 'TG',
    },
    navigation: DEFAULT_NAVIGATION_ITEMS.map((item) => ({ ...item })),
    homepage: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG)),
  }
}
