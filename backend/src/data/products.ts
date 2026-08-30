import type { Product } from '../schemas/product.js'

/**
 * Seed dataset — moved from frontend/src/lib/constants.ts.
 * This file is now the single source of truth for the product catalog.
 */
export const PRODUCTS: Product[] = [
  {
    id: 0,
    name: 'Classic Straight Indigo',
    fit: 'Straight',
    price: '₹1,699',
    priceNum: 1699,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Your dependable, everyday pair. A structured mid-weight denim with a straight leg and a lived-in indigo wash.',
    wash: 'Classic Indigo'
  },
  {
    id: 1,
    name: 'Heavy Wash Baggy',
    fit: 'Baggy',
    price: '₹1,899',
    priceNum: 1899,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    badge: 'Bestseller',
    desc: 'Wide volume through thigh and knee with heavy stone wash fading and vintage whiskering.',
    wash: 'Heavy Stonewash'
  },
  {
    id: 2,
    name: 'Vintage Blue Wide Leg',
    fit: 'Wide',
    price: '₹1,999',
    priceNum: 1999,
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    desc: 'Relaxed dramatic drape cut from 14oz Japanese-style ring-spun cotton denim.',
    wash: 'Vintage Blue'
  },
  {
    id: 3,
    name: 'Relaxed Black Denim',
    fit: 'Relaxed',
    price: '₹1,699',
    priceNum: 1699,
    img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1506629905607-d4052e16f733?auto=format&fit=crop&w=800&q=80',
    desc: 'Sulphur-dyed deep matte black that fades into subtle charcoal highlights with prolonged wear.',
    wash: 'Washed Black'
  },
  {
    id: 4,
    name: 'Dark Indigo Bootcut',
    fit: 'Bootcut',
    price: '₹2,199',
    priceNum: 2199,
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Fitted through the hip with a slight flare below the knee for an elongated, retro profile.',
    wash: 'Dark Indigo'
  },
  {
    id: 5,
    name: 'Washed Grey Straight',
    fit: 'Straight',
    price: '₹1,499',
    priceNum: 1499,
    img: 'https://images.unsplash.com/photo-1506629905607-d4052e16f733?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    badge: 'Sale',
    desc: 'Clean straight leg in an overdyed slate grey with subtle hand-scraping on thighs.',
    wash: 'Slate Grey'
  },
  {
    id: 6,
    name: 'Raw Denim Relaxed',
    fit: 'Relaxed',
    price: '₹1,899',
    priceNum: 1899,
    img: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    desc: 'Unwashed 14.5oz rigid raw selvedge denim built to break in and mold uniquely to your body.',
    wash: 'Rigid Raw Denim'
  },
  {
    id: 7,
    name: 'Faded Blue Baggy',
    fit: 'Baggy',
    price: '₹1,799',
    priceNum: 1799,
    img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    desc: 'Late 90s skater cut with generous leg room and authentic vintage sun-bleach wash.',
    wash: 'Sun Faded Blue'
  }
]
