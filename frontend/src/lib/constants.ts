export type Fit = 'Straight' | 'Baggy' | 'Wide' | 'Relaxed' | 'Bootcut'

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
  { id: 'nav-1', label: 'All Styles', href: '/shop', type: 'category', targetValue: 'all', order: 0, isActive: true, openInNewTab: false },
  { id: 'nav-2', label: 'Denim', href: '/shop/jeans', type: 'category', targetValue: 'jeans', order: 1, isActive: true, openInNewTab: false },
  { id: 'nav-3', label: 'Tops & T-Shirts', href: '/shop/tops', type: 'category', targetValue: 'tops', order: 2, isActive: true, openInNewTab: false },
  { id: 'nav-4', label: 'Shirts', href: '/shop/shirts', type: 'category', targetValue: 'shirts', order: 3, isActive: true, openInNewTab: false },
  { id: 'nav-5', label: 'Hoodies', href: '/shop/hoodies', type: 'category', targetValue: 'hoodies', order: 4, isActive: true, openInNewTab: false },
  { id: 'nav-6', label: 'Accessories', href: '/shop/accessories', type: 'category', targetValue: 'hats', order: 5, isActive: true, openInNewTab: false },
]

export interface Product {
  id: number
  store?: string
  category?: string
  name: string
  fit?: Fit
  price: string
  priceNum: number
  img: string
  img2: string
  badge?: string
  desc: string
  wash?: string
  sizes?: string[]
}

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Garments' },
  { id: 'jeans', label: 'Denim' },
  { id: 'tops', label: 'Tops & Shirts' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'hats', label: 'Accessories' }
] as const

export const PRODUCTS: Product[] = [
  // --- Signature INFIT Denim ---
  {
    id: 0,
    store: 'infit',
    category: 'jeans',
    name: 'Classic Straight Indigo',
    fit: 'Straight',
    price: '₹1,699',
    priceNum: 1699,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Your dependable, everyday pair. A structured mid-weight denim with a straight leg and a lived-in indigo wash.',
    wash: 'Classic Indigo',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 1,
    store: 'infit',
    category: 'jeans',
    name: 'Heavy Wash Baggy',
    fit: 'Baggy',
    price: '₹1,899',
    priceNum: 1899,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    badge: 'Bestseller',
    desc: 'Wide volume through thigh and knee with heavy stone wash fading and vintage whiskering.',
    wash: 'Heavy Stonewash',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 2,
    store: 'infit',
    category: 'jeans',
    name: 'Vintage Blue Wide Leg',
    fit: 'Wide',
    price: '₹1,999',
    priceNum: 1999,
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    desc: 'Relaxed dramatic drape cut from 14oz Japanese-style ring-spun cotton denim.',
    wash: 'Vintage Blue',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 3,
    store: 'infit',
    category: 'jeans',
    name: 'Relaxed Black Denim',
    fit: 'Relaxed',
    price: '₹1,699',
    priceNum: 1699,
    img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    desc: 'Sulphur-dyed deep matte black that fades into subtle charcoal highlights with prolonged wear.',
    wash: 'Washed Black',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 4,
    store: 'infit',
    category: 'jeans',
    name: 'Dark Indigo Bootcut',
    fit: 'Bootcut',
    price: '₹2,199',
    priceNum: 2199,
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Fitted through the hip with a slight flare below the knee for an elongated, retro profile.',
    wash: 'Dark Indigo',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 5,
    store: 'infit',
    category: 'jeans',
    name: 'Washed Grey Straight',
    fit: 'Straight',
    price: '₹1,499',
    priceNum: 1499,
    img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    badge: 'Sale',
    desc: 'Clean straight leg in an overdyed slate grey with subtle hand-scraping on thighs.',
    wash: 'Slate Grey',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 6,
    store: 'infit',
    category: 'jeans',
    name: 'Raw Denim Relaxed',
    fit: 'Relaxed',
    price: '₹1,899',
    priceNum: 1899,
    img: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    desc: 'Unwashed 14.5oz rigid raw selvedge denim built to break in and mold uniquely to your body.',
    wash: 'Rigid Raw Denim',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 7,
    store: 'infit',
    category: 'jeans',
    name: 'Faded Blue Baggy',
    fit: 'Baggy',
    price: '₹1,799',
    priceNum: 1799,
    img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    desc: 'Late 90s skater cut with generous leg room and authentic vintage sun-bleach wash.',
    wash: 'Sun Faded Blue',
    sizes: ['28', '30', '32', '34', '36', '38']
  },

  // --- Curated Wardrobe Essentials ---
  {
    id: 8,
    store: 'infit',
    category: 't-shirts',
    name: 'Boxy Heavyweight Tee - Vintage Black',
    price: '₹999',
    priceNum: 999,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    badge: 'Essential',
    desc: '260 GSM combed cotton with dropped shoulders, tight mock neck ribbing, and an effortless streetwear drape.',
    wash: 'Vintage Black',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 9,
    store: 'infit',
    category: 't-shirts',
    name: 'Oversized Washed Graphic Tee',
    price: '₹1,199',
    priceNum: 1199,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Acid-washed streetwear tee featuring distressed typography and an oversized vintage silhouette.',
    wash: 'Mineral Wash',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 10,
    store: 'infit',
    category: 'shirts',
    name: 'Relaxed Oxford Button-Down Shirt',
    price: '₹1,599',
    priceNum: 1599,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    badge: 'Essential',
    desc: 'Garment-dyed structured cotton Oxford shirt with curved hem, pearl buttons, and a clean relaxed fit.',
    wash: 'Garment Dyed White',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 11,
    store: 'infit',
    category: 'shirts',
    name: 'Utility Canvas Overshirt',
    price: '₹2,299',
    priceNum: 2299,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    badge: 'Bestseller',
    desc: 'Durable cotton canvas shacket with dual chest utility pockets and custom matte metal hardware.',
    wash: 'Olive Canvas',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 12,
    store: 'infit',
    category: 'hoodies',
    name: 'Heavy French Terry Pullover Hoodie',
    price: '₹2,499',
    priceNum: 2499,
    img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    badge: 'Heavyweight',
    desc: '450 GSM heavyweight organic French terry hoodie with double-layered hood, no drawstrings, and deep kangaroo pocket.',
    wash: 'Heather Concrete',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 13,
    store: 'infit',
    category: 'hoodies',
    name: 'Washed Street Zip Hoodie',
    price: '₹2,799',
    priceNum: 2799,
    img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    desc: 'Sun-faded vintage mineral wash with custom two-way metal zipper and ribbed side gussets.',
    wash: 'Washed Charcoal',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 14,
    store: 'infit',
    category: 'hats',
    name: 'Vintage Washed Cotton Dad Cap',
    price: '₹799',
    priceNum: 799,
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
    badge: 'Accessory',
    desc: 'Unstructured 6-panel low profile cotton twill cap with brass buckle strap closure and subtle embroidery.',
    wash: 'Forest Green',
    sizes: ['One Size']
  },
  {
    id: 15,
    store: 'infit',
    category: 'hats',
    name: 'Ripstop Streetwear Bucket Hat',
    price: '₹899',
    priceNum: 899,
    img: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    badge: 'Weather Resistant',
    desc: 'Technical water-resistant ripstop fabric with 360-degree brim and internal sweatband.',
    wash: 'Matte Black',
    sizes: ['One Size']
  }
]

export const FITS: Fit[] = ['Straight', 'Baggy', 'Wide', 'Relaxed', 'Bootcut']

export const SIZES = ['28', '30', '32', '34', '36']

export const SWATCHES = [
  { name: 'Classic Indigo', className: 'indigo' },
  { name: 'Washed Black', className: 'black' },
  { name: 'Vintage Blue', className: 'blue' }
]

export const FREE_SHIPPING_THRESHOLD = 1499
export const SHIPPING_FEE = 99

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

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sectionsOrder: [
    'announcement',
    'hero',
    'categories',
    'new_arrivals',
    'featured_collection',
    'best_sellers',
    'brand_story',
    'looks',
    'instagram',
    'reviews',
    'trust_bar',
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
    looks: true,
    instagram: true,
    reviews: true,
    trust_bar: true,
    catalog: true
  },
  announcement: {
    enabled: true,
    messages: [
      '🚚 Free shipping on orders above ₹999',
      '🔄 7-Day doorstep exchanges — no questions asked',
      '🏭 24h dispatch from Mumbai',
      '💳 Cash on delivery available across India'
    ],
    intervalSeconds: 4
  },
  hero: {
    enabled: true,
    eyebrow: 'New Season — SS 2026',
    title: 'Built for\neveryday.',
    subtitle: 'Heavyweight denim. Honest washes.\nCuts that get better with every wear.',
    primaryCtaText: 'Shop Denim',
    primaryCtaLink: '/#catalog',
    secondaryCtaText: 'All Styles',
    secondaryCtaLink: '/#catalog',
    imageUrl: '/hero-man.jpg',
    trustBadges: ['⚡ 24h dispatch', '🔄 7-day exchange', '🚚 Free above ₹999']
  },
  categories: {
    enabled: true,
    eyebrow: 'Explore',
    title: 'Shop by Category',
    items: [
      {
        id: 'jeans',
        label: 'Denim',
        icon: '👖',
        img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
        count: '8 styles'
      },
      {
        id: 't-shirts',
        label: 'T-Shirts',
        icon: '👕',
        img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        count: '4 styles'
      },
      {
        id: 'shirts',
        label: 'Shirts',
        icon: '👔',
        img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'hoodies',
        label: 'Hoodies',
        icon: '🧥',
        img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
        count: '2 styles'
      },
      {
        id: 'hats',
        label: 'Accessories',
        icon: '🧢',
        img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
        count: '2 styles'
      }
    ]
  },
  new_arrivals: {
    enabled: true,
    eyebrow: 'Fresh Drops',
    title: 'New Arrivals',
    limit: 4,
    ctaText: 'View All Products',
    ctaLink: '/#catalog'
  },
  featured_collection: {
    enabled: true,
    eyebrow: 'Featured Collection',
    title: 'The Essentials\nCollection',
    description:
      'Every piece designed to live in your rotation forever. Heavyweight fabrics, considered washes, and silhouettes that hold their shape.',
    ctaText: 'Shop Collection',
    ctaLink: '/#catalog',
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
      'INFIT started with a simple question: why is it so hard to find jeans that fit, last, and feel honest? We’re a Mumbai-based label obsessed with getting denim right — from the weight of the fabric to the arc of the seat.',
      'No fast fashion. No compromise. Just weighty, considered denim built to outlast the trends.'
    ],
    imageUrl: '/brand-editorial.jpg',
    stats: [
      { num: '14oz', label: 'Fabric weight' },
      { num: '5+', label: 'Signature fits' },
      { num: '24h', label: 'Mumbai dispatch' }
    ],
    ctaText: 'Get in Touch',
    ctaLink: 'mailto:concierge@infit.in'
  },
  looks: {
    enabled: true,
    eyebrow: 'Edit',
    title: 'Shop the Look',
    subtitle: 'Complete outfit inspiration — everything styled and linked.',
    items: [
      {
        id: 1,
        title: 'The Daily Driver',
        tag: 'Straight + Tee',
        img: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      },
      {
        id: 2,
        title: 'Street Ready',
        tag: 'Baggy + Hoodie',
        img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      },
      {
        id: 3,
        title: 'Clean & Classic',
        tag: 'Relaxed + Oxford',
        img: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      },
      {
        id: 4,
        title: 'Night Out',
        tag: 'Dark Indigo + Jacket',
        img: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      }
    ]
  },
  instagram: {
    enabled: true,
    eyebrow: '@infit.in',
    title: 'Follow Our Story',
    subtitle: 'Real people, real fits — tag us in yours.',
    instagramUrl: 'https://instagram.com',
    photos: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=400&q=80'
    ]
  },
  reviews: {
    enabled: true,
    title: 'What Customers Say',
    ratingText: '4.9 / 5 — 200+ verified reviews',
    items: [
      {
        id: 1,
        name: 'Aryan S.',
        location: 'Mumbai',
        stars: 5,
        text: 'Best jeans I’ve ever owned. The indigo wash is incredible and the fit is exactly right — not too tight, not loose. Worth every rupee.',
        product: 'Classic Straight Indigo'
      },
      {
        id: 2,
        name: 'Karan M.',
        location: 'Delhi',
        stars: 5,
        text: 'Ordered the Baggy Heavy Wash and it exceeded my expectations. The denim weight is perfect for Mumbai winters. Already ordered a second pair.',
        product: 'Heavy Wash Baggy'
      },
      {
        id: 3,
        name: 'Rahul T.',
        location: 'Bangalore',
        stars: 5,
        text: 'Finally a brand that gets streetwear proportions. The wide leg sits exactly how it should — generously cut but still clean. Top quality.',
        product: 'Vintage Blue Wide Leg'
      }
    ]
  },
  trust_bar: {
    enabled: true,
    items: [
      { id: '1', title: 'Free shipping above ₹999', icon: 'truck' },
      { id: '2', title: '7-day doorstep exchange', icon: 'repeat' },
      { id: '3', title: '24h dispatch from Mumbai', icon: 'package' },
      { id: '4', title: 'Secure payments', icon: 'shield' }
    ]
  },
  catalog: {
    enabled: true,
    title: 'All Products',
    showFilters: true
  }
}
