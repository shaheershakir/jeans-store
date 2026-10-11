export type Fit =
  | 'Oversized'
  | 'Boxy'
  | 'Relaxed'
  | 'Regular'
  | 'Straight'
  | 'Baggy'
  | 'Wide'
  | 'Bootcut'
  | 'Slim'

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
  { id: 'nav-7', label: 'Trackpants', href: '/shop/trackpants', type: 'category', targetValue: 'trackpants', order: 6, isActive: true, openInNewTab: false },
  { id: 'nav-8', label: 'Sweatpants', href: '/shop/sweatpants', type: 'category', targetValue: 'sweatpants', order: 7, isActive: true, openInNewTab: false },
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
  images?: string[]
  badge?: string
  desc: string
  wash?: string
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
}

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Garments' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'fullsleeve', label: 'Fullsleeve' },
  { id: 'drsleeve', label: 'Drsleeve' },
  { id: 'printed-tees', label: 'Printed Tees' },
  { id: 'ringer-tees', label: 'Ringer Tees' },
  { id: 'henley', label: 'Henley' },
  { id: 'trackpants', label: 'Trackpants' },
  { id: 'sweatpants', label: 'Sweatpants' },
] as const

export const PRODUCTS: Product[] = [
  // ─── 1. STRIPES (Striped T-Shirts) ──────────────────────────────────────────
  {
    id: 0,
    store: 'teesgarage',
    category: 'stripes',
    name: 'Classic Breton Heavyweight Striped Tee',
    fit: 'Boxy',
    price: '₹1,199',
    priceNum: 1199,
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Bestseller',
    desc: '260 GSM combed cotton featuring traditional Breton nautical stripes, sturdy 1.25" ribbed collar, and relaxed drop-shoulder drape.',
    wash: 'Ecru / Navy',
    color: 'Navy',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Striped',
    rating: 4.8,
    inStock: true,
    collection: 'Bestsellers'
  },
  {
    id: 1,
    store: 'teesgarage',
    category: 'stripes',
    name: 'Vintage Skate Micro-Stripe Tee',
    fit: 'Relaxed',
    price: '₹1,249',
    priceNum: 1249,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'New',
    desc: 'Fine gauge horizontal micro-stripes knit from yarn-dyed ring-spun cotton. Pre-shrunk with a soft vintage silicone wash.',
    wash: 'Washed Black / Ash',
    color: 'Black',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Striped',
    rating: 4.6,
    inStock: true,
    collection: 'New arrivals'
  },
  {
    id: 2,
    store: 'teesgarage',
    category: 'stripes',
    name: 'Bold Block Stripe Oversized Tee',
    fit: 'Oversized',
    price: '₹1,299',
    priceNum: 1299,
    img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Wide horizontal contrast block stripes with reinforced twin-needle hems and an ultra-relaxed streetwear silhouette.',
    wash: 'Forest Green / Cream',
    color: 'Green',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'V-neck',
    pattern: 'Striped',
    rating: 4.5,
    inStock: true,
    collection: 'Featured'
  },

  // ─── 2. FULLSLEEVE (Full Sleeve T-Shirts) ──────────────────────────────────
  {
    id: 3,
    store: 'teesgarage',
    category: 'fullsleeve',
    name: 'Thermal Waffle Knit Fullsleeve',
    fit: 'Regular',
    price: '₹1,399',
    priceNum: 1399,
    img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Essential',
    desc: 'Heavyweight 320 GSM honeycomb waffle knit providing natural warmth, stretch recovery, and ribbed storm cuffs.',
    wash: 'Heather Charcoal',
    color: 'Grey',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton blend',
    sleeveLength: 'Full Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    rating: 4.7,
    inStock: true,
    collection: 'Featured'
  },
  {
    id: 4,
    store: 'teesgarage',
    category: 'fullsleeve',
    name: 'Heavy Combed Cotton Fullsleeve',
    fit: 'Relaxed',
    price: '₹1,299',
    priceNum: 1299,
    img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Core',
    desc: 'Clean, dense 260 GSM single jersey full sleeve tee with thick 1.25" neck ribbing and tapered wrist cuffs.',
    wash: 'Pitch Black',
    color: 'Black',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Full Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    rating: 4.9,
    inStock: true,
    collection: 'Bestsellers'
  },
  {
    id: 5,
    store: 'teesgarage',
    category: 'fullsleeve',
    name: 'Vintage Washed Raglan Fullsleeve',
    fit: 'Boxy',
    price: '₹1,349',
    priceNum: 1349,
    img: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Raglan sleeve construction for unrestricted mobility, finished in an authentic sun-bleached pigment wash with soft vintage patina.',
    wash: 'Washed Olive / Sand',
    color: 'Beige',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Full Sleeve',
    neckType: 'V-neck',
    pattern: 'Solid',
    rating: 4.4,
    inStock: true,
    collection: 'New arrivals'
  },

  // ─── 3. DRSLEEVE (Drop Sleeve / 3/4 Sleeve Tees) ───────────────────────────
  {
    id: 6,
    store: 'teesgarage',
    category: 'drsleeve',
    name: 'Raw Edge Drop Shoulder Heavy Tee',
    fit: 'Boxy',
    price: '₹1,199',
    priceNum: 1199,
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Bestseller',
    desc: 'Dropped shoulder seams with elbow-length sleeves, wide boxy body, and subtle raw-edge bottom hem details.',
    wash: 'Washed Charcoal',
    color: 'Grey',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: '3/4 Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    rating: 4.8,
    inStock: true,
    collection: 'Bestsellers'
  },
  {
    id: 7,
    store: 'teesgarage',
    category: 'drsleeve',
    name: 'Oversized Streetwear Drsleeve Tee',
    fit: 'Oversized',
    price: '₹1,299',
    priceNum: 1299,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Hot',
    desc: 'Ultra-relaxed drape with extended 12" drop shoulder sleeves, tight mock neck ribbing, and 260 GSM combed cotton.',
    wash: 'Concrete Slate',
    color: 'Grey',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: '3/4 Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    rating: 4.6,
    inStock: true,
    collection: 'New arrivals'
  },
  {
    id: 8,
    store: 'teesgarage',
    category: 'drsleeve',
    name: 'Minimalist Heavyweight Drop Shoulder',
    fit: 'Oversized',
    price: '₹1,249',
    priceNum: 1249,
    img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Clean 280 GSM luxury combed cotton with seamless dropped shoulders, double-stitched armholes, and zero side-twist construction.',
    wash: 'Bone White',
    color: 'White',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: '3/4 Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    rating: 4.7,
    inStock: true,
    collection: 'Featured'
  },

  // ─── 4. PRINTED TEES (Graphic / Printed T-Shirts) ──────────────────────────
  {
    id: 9,
    store: 'teesgarage',
    category: 'printed-tees',
    name: 'Tokyo Cyber Garage Graphic Tee',
    fit: 'Oversized',
    price: '₹1,299',
    priceNum: 1299,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Trending',
    desc: 'High-density puff screen print featuring distressed garage typography and cyber automotive mechanics graphics.',
    wash: 'Vintage Acid Black',
    color: 'Black',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Printed',
    printStyle: 'Graphic',
    rating: 4.9,
    inStock: true,
    collection: 'Featured'
  },
  {
    id: 10,
    store: 'teesgarage',
    category: 'printed-tees',
    name: 'Archival Sunburst Botanical Tee',
    fit: 'Relaxed',
    price: '₹1,199',
    priceNum: 1199,
    img: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Hand-pulled water-based screenprint on 240 GSM organic cotton. Breathable print surface that softens with each wash.',
    wash: 'Washed Ecru',
    color: 'Beige',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Printed',
    printStyle: 'Abstract',
    rating: 4.5,
    inStock: true,
    collection: 'New arrivals'
  },
  {
    id: 11,
    store: 'teesgarage',
    category: 'printed-tees',
    name: 'Garage Speed Division Distressed Tee',
    fit: 'Boxy',
    price: '₹1,249',
    priceNum: 1249,
    img: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'New',
    desc: 'Heritage motor club back graphic with subtle front chest crest, enzyme washed for an authentic vintage soft-hand feel.',
    wash: 'Faded Burgundy',
    color: 'Red',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'V-neck',
    pattern: 'Printed',
    printStyle: 'Typography',
    rating: 4.6,
    inStock: true,
    collection: 'Featured'
  },

  // ─── 5. RINGER TEES (Retro Contrast Ribbed Tees) ───────────────────────────
  {
    id: 12,
    store: 'teesgarage',
    category: 'ringer-tees',
    name: '70s Retro Contrast Ribbed Ringer Tee',
    fit: 'Regular',
    price: '₹999',
    priceNum: 999,
    img: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Classic',
    desc: 'Timeless retro ringer silhouette with contrast 1" binding along neck and sleeve cuffs. 100% fine combed cotton.',
    wash: 'Off-White / Cobalt',
    color: 'White',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Color-block',
    trimColor: 'Cobalt',
    rating: 4.8,
    inStock: true,
    collection: 'Featured'
  },
  {
    id: 13,
    store: 'teesgarage',
    category: 'ringer-tees',
    name: 'Collegiate Athletic Ringer Tee',
    fit: 'Regular',
    price: '₹1,049',
    priceNum: 1049,
    img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'New',
    desc: 'Vintage varsity styling with heavyweight two-tone ribbing and an engineered tailored drape.',
    wash: 'Forest Green / Cream',
    color: 'Green',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Color-block',
    trimColor: 'Forest Green',
    rating: 4.4,
    inStock: true,
    collection: 'New arrivals'
  },
  {
    id: 14,
    store: 'teesgarage',
    category: 'ringer-tees',
    name: 'Heritage Dual-Tone Contrast Ringer',
    fit: 'Boxy',
    price: '₹1,099',
    priceNum: 1099,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Warm earthy contrast trims on structured mid-weight cotton jersey. Built to hold neckline shape wear after wear.',
    wash: 'Mustard / Chocolate',
    color: 'Beige',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Color-block',
    trimColor: 'Chocolate',
    rating: 4.7,
    inStock: true,
    collection: 'Bestsellers'
  },

  // ─── 6. HENLEY (Buttoned Placket Tees) ─────────────────────────────────────
  {
    id: 15,
    store: 'teesgarage',
    category: 'henley',
    name: '3-Button Slub Cotton Waffle Henley',
    fit: 'Regular',
    price: '₹1,399',
    priceNum: 1399,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Bestseller',
    desc: 'Authentic 3-button placket featuring real corozo nut buttons, slub texture, and durable flatlock seam detailing.',
    wash: 'Heather Grey',
    color: 'Grey',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton blend',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    buttons: '3-button',
    rating: 4.8,
    inStock: true,
    collection: 'Bestsellers'
  },
  {
    id: 16,
    store: 'teesgarage',
    category: 'henley',
    name: 'Heavy Mineral Washed Rugged Henley',
    fit: 'Relaxed',
    price: '₹1,499',
    priceNum: 1499,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Warm',
    desc: 'Heavyweight 280 GSM cotton jersey with garment mineral wash, double-layer front placket, and raw-cut hem finish.',
    wash: 'Mineral Washed Black',
    color: 'Black',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton',
    sleeveLength: 'Full Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    buttons: '4-button',
    rating: 4.9,
    inStock: true,
    collection: 'Featured'
  },
  {
    id: 17,
    store: 'teesgarage',
    category: 'henley',
    name: 'Short Sleeve Summer Slub Henley',
    fit: 'Relaxed',
    price: '₹1,299',
    priceNum: 1299,
    img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Lightweight breathable cotton slub with mother-of-pearl buttons, curved hem, and effortless warm-weather drape.',
    wash: 'Washed Sage',
    color: 'Green',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton blend',
    sleeveLength: 'Short Sleeve',
    neckType: 'Crew neck',
    pattern: 'Solid',
    buttons: '2-button',
    rating: 4.6,
    inStock: true,
    collection: 'New arrivals'
  },

  // ─── 7. TRACKPANTS (Bottomwear: Trackpants) ────────────────────────────────
  {
    id: 18,
    store: 'teesgarage',
    category: 'trackpants',
    name: 'Urban Utility Cargo Trackpants',
    fit: 'Relaxed',
    price: '₹1,899',
    priceNum: 1899,
    img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Hot',
    desc: 'Durable nylon-cotton blend trackpants with dual bellowed cargo pockets, bungee adjustable ankle toggles, and elastic drawcord waistband.',
    wash: 'Matte Onyx Black',
    color: 'Black',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    waistSize: ['30', '32', '34', '36', '38'],
    material: 'Nylon-Cotton',
    fabric: 'Cotton blend',
    length: 'Full Length',
    closure: 'Drawstring',
    pockets: 'Cargo Pockets',
    use: 'Casual',
    rating: 4.8,
    inStock: true,
    collection: 'Bestsellers'
  },
  {
    id: 19,
    store: 'teesgarage',
    category: 'trackpants',
    name: 'Retro Side-Piping Straight Trackpants',
    fit: 'Straight',
    price: '₹1,799',
    priceNum: 1799,
    img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Classic',
    desc: 'Classic poly-tricot trackpants with contrast side seam piping, zippered hand pockets, and zippered leg gussets for clean sneaker stacking.',
    wash: 'Deep Navy / Off-White',
    color: 'Navy',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    waistSize: ['30', '32', '34', '36'],
    material: 'Poly-Tricot',
    fabric: 'Polyester',
    length: 'Full Length',
    closure: 'Elastic waist',
    pockets: 'Zippered Pockets',
    use: 'Sports',
    rating: 4.5,
    inStock: true,
    collection: 'Featured'
  },
  {
    id: 20,
    store: 'teesgarage',
    category: 'trackpants',
    name: 'Baggy Streetwear Shell Trackpants',
    fit: 'Baggy',
    price: '₹1,999',
    priceNum: 1999,
    img: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'New',
    desc: 'Wide skate-inspired volume cut from crinkled matte taslan nylon with breathable mesh lining and articulated knee darting.',
    wash: 'Graphite Grey',
    color: 'Grey',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    waistSize: ['30', '32', '34', '36', '38'],
    material: 'Taslan Nylon',
    fabric: 'Polyester',
    length: 'Full Length',
    closure: 'Drawstring',
    pockets: 'Cargo Pockets',
    use: 'Training',
    rating: 4.7,
    inStock: true,
    collection: 'New arrivals'
  },

  // ─── 8. SWEATPANTS (Bottomwear: Sweatpants) ────────────────────────────────
  {
    id: 21,
    store: 'teesgarage',
    category: 'sweatpants',
    name: '450 GSM Heavy French Terry Sweatpants',
    fit: 'Relaxed',
    price: '₹2,199',
    priceNum: 2199,
    img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Heavyweight',
    desc: 'Ultra-heavy 450 GSM combed cotton French terry with thick elastic waistband, hidden drawstrings, and deep slash pockets.',
    wash: 'Washed Black',
    color: 'Black',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    waistSize: ['30', '32', '34', '36', '38'],
    material: 'French terry',
    fabric: 'French terry',
    legStyle: 'Open hem',
    rise: 'Mid-rise',
    pockets: 'Slash Pockets',
    rating: 4.9,
    inStock: true,
    collection: 'Bestsellers'
  },
  {
    id: 22,
    store: 'teesgarage',
    category: 'sweatpants',
    name: 'Sun-Faded Vintage Cuffed Sweatpants',
    fit: 'Regular',
    price: '₹1,999',
    priceNum: 1999,
    img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Essential',
    desc: 'Enzyme sun-faded wash on fleece back jersey with ribbed ankle cuffs and heavy cotton flat-braided drawcords.',
    wash: 'Vintage Taupe',
    color: 'Beige',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    waistSize: ['30', '32', '34', '36'],
    material: 'Fleece',
    fabric: 'Fleece',
    legStyle: 'Cuffed',
    rise: 'Mid-rise',
    pockets: 'Slash Pockets',
    rating: 4.6,
    inStock: true,
    collection: 'Featured'
  },
  {
    id: 23,
    store: 'teesgarage',
    category: 'sweatpants',
    name: 'Open-Hem Baggy Fleece Sweatpants',
    fit: 'Baggy',
    price: '₹2,099',
    priceNum: 2099,
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'New',
    desc: 'Relaxed open bottom hem designed to stack cleanly over sneakers, crafted from 400 GSM brushed organic fleece.',
    wash: 'Heather Grey',
    color: 'Grey',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    waistSize: ['30', '32', '34', '36', '38'],
    material: 'Fleece',
    fabric: 'Fleece',
    legStyle: 'Open hem',
    rise: 'High-rise',
    pockets: 'Slash Pockets',
    rating: 4.8,
    inStock: true,
    collection: 'New arrivals'
  }
]

export const FITS: Fit[] = ['Oversized', 'Boxy', 'Relaxed', 'Regular', 'Straight', 'Baggy']

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export const SWATCHES = [
  { name: 'Pitch Black', className: 'black' },
  { name: 'Heather Charcoal', className: 'charcoal' },
  { name: 'Forest Green', className: 'green' },
  { name: 'Ecru / Navy', className: 'ecru' }
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
    subtitle: 'Heavyweight T-shirts. Engineered bottomwear.\nCuts that hold their shape with every wear.',
    primaryCtaText: 'Shop Collection',
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
        id: 'stripes',
        label: 'Stripes',
        icon: '💈',
        img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'fullsleeve',
        label: 'Fullsleeve',
        icon: '🧥',
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'drsleeve',
        label: 'Drsleeve',
        icon: '👕',
        img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'printed-tees',
        label: 'Printed Tees',
        icon: '🎨',
        img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'ringer-tees',
        label: 'Ringer Tees',
        icon: '⚡',
        img: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'henley',
        label: 'Henley',
        icon: '👔',
        img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'trackpants',
        label: 'Trackpants',
        icon: '👖',
        img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=80',
        count: '3 styles'
      },
      {
        id: 'sweatpants',
        label: 'Sweatpants',
        icon: '🩳',
        img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
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
    ctaLink: '/#catalog'
  },
  featured_collection: {
    enabled: true,
    eyebrow: 'Featured Collection',
    title: 'The Heavyweight\nCollection',
    description:
      'Every piece designed to live in your everyday rotation. Heavyweight 260+ GSM combed cotton, structured French terry, and boxy fits that hold their shape.',
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
      'TEESGARAGE started with a simple question: why is it so hard to find heavyweight tees and bottomwear that fit right, last, and feel honest? We’re a Mumbai-based label obsessed with getting everyday essentials right — from 260+ GSM combed cotton to structured French terry.',
      'No fast fashion. No compromise. Just weighty, considered garments built to outlast trends.'
    ],
    imageUrl: '/brand-editorial.jpg',
    stats: [
      { num: '280 GSM', label: 'Cotton weight' },
      { num: '8', label: 'Signature cuts' },
      { num: '24h', label: 'Mumbai dispatch' }
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
        title: 'The Daily Driver',
        tag: 'Drsleeve + Trackpants',
        img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      },
      {
        id: 2,
        title: 'Street Ready',
        tag: 'Printed Tee + Sweatpants',
        img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      },
      {
        id: 3,
        title: 'Clean & Classic',
        tag: 'Stripes + Cargo',
        img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      },
      {
        id: 4,
        title: 'Minimal Thermal',
        tag: 'Fullsleeve + Shell Pants',
        img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
        link: '/#catalog'
      }
    ]
  },
  instagram: {
    enabled: true,
    eyebrow: '@teesgarage.in',
    title: 'Follow Our Story',
    subtitle: 'Real people, real fits — tag us in yours.',
    instagramUrl: 'https://instagram.com',
    photos: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80'
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
        text: 'Best oversized tee I’ve owned. The 280 GSM combed cotton has real structural weight and doesn\'t bacon at the neck after multiple washes.',
        product: 'Tokyo Cyber Garage Graphic Tee'
      },
      {
        id: 2,
        name: 'Karan M.',
        location: 'Delhi',
        stars: 5,
        text: 'The 450 GSM French terry sweatpants exceeded all my expectations. Heavy, soft, and the cuff stacks perfectly over my sneakers. Ordered a second pair.',
        product: '450 GSM Heavy French Terry Sweatpants'
      },
      {
        id: 3,
        name: 'Rahul T.',
        location: 'Bangalore',
        stars: 5,
        text: 'Finally a brand that gets streetwear drop-shoulder cuts right. Wide boxy body without being too long. Top quality craftsmanship.',
        product: 'Raw Edge Drop Shoulder Heavy Tee'
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
    title: 'All Garments',
    showFilters: true
  }
}
