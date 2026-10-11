import type { Product } from '../schemas/product.js'

/**
 * Seed dataset — single source of truth for the product catalog.
 * Pivoted from denim to heavyweight T-Shirts and premium Bottomwear for TEESGARAGE.
 */
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },

  // ─── 3. DRSLEEVE (Drop Sleeve / Drop Shoulder Tees) ────────────────────────
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80'
    ],
    desc: 'Clean 280 GSM luxury combed cotton with seamless dropped shoulders, double-stitched armholes, and zero side-twist construction.',
    wash: 'Bone White',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
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
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  }
]
