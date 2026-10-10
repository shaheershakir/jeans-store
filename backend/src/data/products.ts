import type { Product } from '../schemas/product.js'

/**
 * Seed dataset — moved from frontend/src/lib/constants.ts.
 * This file is now the single source of truth for the product catalog.
 */
export const PRODUCTS: Product[] = [
  // --- TEESGARAGE Jeans (jean-store) ---
  {
    id: 0,
    store: 'jean-store',
    category: 'jeans',
    name: 'Classic Straight Indigo',
    fit: 'Straight',
    price: '₹1,699',
    priceNum: 1699,
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'New',
    desc: 'Your dependable, everyday pair. A structured mid-weight denim with a straight leg and a lived-in indigo wash.',
    wash: 'Classic Indigo',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 1,
    store: 'jean-store',
    category: 'jeans',
    name: 'Heavy Wash Baggy',
    fit: 'Baggy',
    price: '₹1,899',
    priceNum: 1899,
    img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80'
    ],
    badge: 'Bestseller',
    desc: 'Wide volume through thigh and knee with heavy stone wash fading and vintage whiskering.',
    wash: 'Heavy Stonewash',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 2,
    store: 'jean-store',
    category: 'jeans',
    name: 'Vintage Blue Wide Leg',
    fit: 'Wide',
    price: '₹1,999',
    priceNum: 1999,
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Relaxed dramatic drape cut from 14oz Japanese-style ring-spun cotton denim.',
    wash: 'Vintage Blue',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 3,
    store: 'jean-store',
    category: 'jeans',
    name: 'Relaxed Black Denim',
    fit: 'Relaxed',
    price: '₹1,699',
    priceNum: 1699,
    img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Sulphur-dyed deep matte black that fades into subtle charcoal highlights with prolonged wear.',
    wash: 'Washed Black',
    sizes: ['28', '30', '32', '34', '36', '38']
  },
  {
    id: 4,
    store: 'teesgarage',
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
    store: 'teesgarage',
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
    store: 'jean-store',
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
    store: 'jean-store',
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

  // --- Fit Check Clothing (clothing-store) ---
  {
    id: 8,
    store: 'clothing-store',
    category: 't-shirts',
    name: 'Boxy Heavyweight Tee - Vintage Black',
    price: '₹999',
    priceNum: 999,
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    badge: 'Hot',
    desc: '260 GSM combed cotton with dropped shoulders, tight mock neck ribbing, and an effortless streetwear drape.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 9,
    store: 'clothing-store',
    category: 't-shirts',
    name: 'Oversized Washed Graphic Tee',
    price: '₹1,199',
    priceNum: 1199,
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Acid-washed streetwear tee featuring distressed cyberpunk typography and oversized vintage silhouette.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 10,
    store: 'clothing-store',
    category: 'shirts',
    name: 'Relaxed Oxford Button-Down Shirt',
    price: '₹1,599',
    priceNum: 1599,
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    badge: 'Essential',
    desc: 'Garment-dyed structured cotton Oxford shirt with curved hem, pearl buttons, and a clean relaxed fit.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 11,
    store: 'clothing-store',
    category: 'shirts',
    name: 'Utility Canvas Overshirt',
    price: '₹2,299',
    priceNum: 2299,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    badge: 'Bestseller',
    desc: 'Durable cotton canvas shacket with dual chest utility pockets and custom matte metal hardware.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 12,
    store: 'clothing-store',
    category: 'hoodies',
    name: 'Heavy French Terry Pullover Hoodie',
    price: '₹2,499',
    priceNum: 2499,
    img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    badge: 'Warm',
    desc: '450 GSM heavyweight organic French terry hoodie with double-layered hood, no drawstrings, and kangaroo pocket.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 13,
    store: 'clothing-store',
    category: 'hoodies',
    name: 'Washed Street Zip Hoodie',
    price: '₹2,799',
    priceNum: 2799,
    img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    desc: 'Sun-faded vintage mineral wash with custom two-way metal zipper and ribbed side gussets.',
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: 14,
    store: 'clothing-store',
    category: 'hats',
    name: 'Vintage Washed Cotton Dad Cap',
    price: '₹799',
    priceNum: 799,
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
    badge: 'New',
    desc: 'Unstructured 6-panel low profile cotton twill cap with brass buckle strap closure and subtle embroidery.',
    sizes: ['One Size']
  },
  {
    id: 15,
    store: 'clothing-store',
    category: 'hats',
    name: 'Ripstop Streetwear Bucket Hat',
    price: '₹899',
    priceNum: 899,
    img: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
    img2: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    desc: 'Technical water-resistant ripstop fabric with 360-degree brim and internal sweatband.',
    sizes: ['One Size']
  }
]
