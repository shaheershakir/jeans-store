
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

export const DEFAULT_NAV_LINKS: NavigationItem[] = [
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

export interface ProductDesign {
  id?: number
  name: string
  slug: string
  priceOverride?: number | null
  sortOrder?: number
  status?: 'Active' | 'Inactive'
  images?: string[]
  variants?: ProductVariant[]
}

export interface Product {
  id: string
  store?: string
  category?: string
  name: string
  price: string
  priceNum: number
  img: string
  img2: string
  images?: string[]
  badge?: string
  desc: string
  color?: string
  sizes?: string[]
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
  collectionIds?: number[]
  tags?: string[]
  createdAt?: string
  weight?: number
  shortDescription?: string | null
  compareAtPrice?: number | null
  trackInventory?: boolean
  continueSelling?: boolean
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  seoTitle?: string | null
  seoDescription?: string | null
  variants?: ProductVariant[]
  designs?: ProductDesign[]
}

export interface ProductVariant {
  id?: number
  productId?: string
  designId?: number | null
  sku?: string
  size: string | number
  color: string
  price?: number
  stock: number
  reserved: number
  weight?: number
  status: 'Active' | 'Inactive'
}

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Garments' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'fullsleeve', label: 'Fullsleeve' },
  { id: 'drsleeve', label: 'Drsleeve' },
  { id: 'printed-tees', label: 'Printed Tees' },
  { id: 'ringer-tees', label: 'Ringer Tees' },
  { id: 'henley', label: 'Henley' },
  { id: 'waffle', label: 'Waffle' },
  { id: 'trackpants', label: 'Trackpants' },
  { id: 'sweatpants', label: 'Sweatpants' },
] as const

export const PRODUCTS: Product[] = []

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export const SWATCHES = [
  { name: 'Pitch Black', className: 'black' },
  { name: 'Heather Charcoal', className: 'charcoal' },
  { name: 'Forest Green', className: 'green' },
  { name: 'Ecru / Navy', className: 'ecru' }
]

// ─── Homepage Layout Configuration ────────────────────────────────────────────

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
  link: string
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
  icon: 'truck' | 'repeat' | 'package' | 'shield'
}

export interface HomepageConfig {
  sectionsOrder: HomepageSectionType[]
  sectionsEnabled: Record<HomepageSectionType, boolean>
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
    stats: { num: string; label: string }[]
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
      'Paid delivery calculated by destination',
      '7-Day doorstep exchanges — no questions asked',
      '24h dispatch from Kerala atelier',
      'Cash on delivery available across India'
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
        id: 'stripes',
        label: 'Stripes',
        icon: '',
        img: '/teesgarage-category-assets/category-stripes.webp',
        count: '3 styles'
      },
      {
        id: 'fullsleeve',
        label: 'Fullsleeve',
        icon: '',
        img: '/teesgarage-category-assets/category-fullsleeve.webp',
        count: '3 styles'
      },
      {
        id: 'drsleeve',
        label: 'Drsleeve',
        icon: '',
        img: '/teesgarage-category-assets/category-drsleeve.webp',
        count: '3 styles'
      },
      {
        id: 'printed-tees',
        label: 'Printed Tees',
        icon: '',
        img: '/teesgarage-category-assets/category-printed-tees.webp',
        count: '3 styles'
      },
      {
        id: 'ringer-tees',
        label: 'Ringer Tees',
        icon: '',
        img: '/teesgarage-category-assets/category-ringer-tees.webp',
        count: '3 styles'
      },
      {
        id: 'henley',
        label: 'Henley',
        icon: '',
        img: '/teesgarage-category-assets/category-henley.webp',
        count: '3 styles'
      },
      {
        id: 'waffle',
        label: 'Waffle',
        icon: '',
        img: '/teesgarage-category-assets/category-fullsleeve.webp',
        count: '3 styles'
      },
      {
        id: 'trackpants',
        label: 'Trackpants',
        icon: '',
        img: '/teesgarage-category-assets/category-trackpants.webp',
        count: '3 styles'
      },
      {
        id: 'sweatpants',
        label: 'Sweatpants',
        icon: '',
        img: '/teesgarage-category-assets/category-sweatpants.webp',
        count: '3 styles'
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
    title: 'The Heavyweight\nCollection',
    description:
      'Every piece designed to live in your everyday rotation. Heavyweight 260+ GSM combed cotton, structured French terry, and boxy fits that hold their shape.',
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
      'TEESGARAGE started with a simple question: why is it so hard to find heavyweight tees and bottomwear that fit right, last, and feel honest? We’re a Kerala-based label obsessed with getting everyday essentials right — from 260+ GSM combed cotton to structured French terry.',
      'No fast fashion. No compromise. Just weighty, considered garments built to outlast trends.'
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
        img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        link: '/shop/drsleeve'
      },
      {
        id: 2,
        title: 'Graphic rotation',
        tag: 'Printed Tee + Sweatpants',
        img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
        link: '/shop/printed-tees'
      },
      {
        id: 3,
        title: 'Everyday stripes',
        tag: 'Stripes + Sweatpants',
        img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
        link: '/shop/stripes'
      },
      {
        id: 4,
        title: 'Long-sleeve layer',
        tag: 'Fullsleeve + Henley',
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
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
      { id: '1', title: 'Paid delivery calculated by destination', icon: 'truck' },
      { id: '2', title: '7-day doorstep exchange', icon: 'repeat' },
      { id: '3', title: '24h dispatch from Mumbai', icon: 'package' },
      { id: '4', title: 'Secure payments', icon: 'shield' }
    ]
  },
  catalog: {
    enabled: true,
    title: 'All Garments',
    showFilters: true
  }
}
