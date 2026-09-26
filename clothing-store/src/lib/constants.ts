import type { ClothingProduct } from './types'

export const STORE_NAME = 'FIT CHECK'
export const STORE_TAGLINE = 'Contemporary Apparel · Heavyweight Silhouettes'
export const FREE_SHIPPING_THRESHOLD = 999
export const STANDARD_SHIPPING_FEE = 99

export const SIZE_CHART = {
  inches: [
    { size: 'XS', chest: '38', length: '26.5', shoulder: '19.5', sleeve: '8.2' },
    { size: 'S', chest: '41', length: '27.5', shoulder: '20.5', sleeve: '8.5' },
    { size: 'M', chest: '44', length: '28.5', shoulder: '21.5', sleeve: '8.8' },
    { size: 'L', chest: '47', length: '29.5', shoulder: '22.5', sleeve: '9.2' },
    { size: 'XL', chest: '50', length: '30.5', shoulder: '23.5', sleeve: '9.5' },
    { size: 'XXL', chest: '53', length: '31.5', shoulder: '24.5', sleeve: '9.8' }
  ],
  cm: [
    { size: 'XS', chest: '96.5', length: '67.3', shoulder: '49.5', sleeve: '20.8' },
    { size: 'S', chest: '104.1', length: '69.8', shoulder: '52.1', sleeve: '21.6' },
    { size: 'M', chest: '111.8', length: '72.4', shoulder: '54.6', sleeve: '22.4' },
    { size: 'L', chest: '119.4', length: '74.9', shoulder: '57.1', sleeve: '23.4' },
    { size: 'XL', chest: '127.0', length: '77.5', shoulder: '59.7', sleeve: '24.1' },
    { size: 'XXL', chest: '134.6', length: '80.0', shoulder: '62.2', sleeve: '24.9' }
  ]
}

export const CLOTHING_PRODUCTS: ClothingProduct[] = [
  {
    id: 8,
    store: 'clothing-store',
    category: 't-shirts',
    name: 'Boxy Heavyweight Tee - Vintage Black',
    fit: 'Boxy Relaxed Fit',
    price: '₹999',
    originalPrice: '₹1,499',
    priceNum: 999,
    originalPriceNum: 1499,
    badge: 'Bestseller · 33% Off',
    sellingPoint:
      '260 GSM custom-milled combed cotton with dropped shoulders that maintains its structured boxy drape wash after wash.',
    desc: 'An uncompromising everyday essential. Cut with wide chest volume, dropped shoulder seams, and a tight 1.25" ribbed mock neck that will never bacon or sag. Crafted from 100% high-density combed cotton with a substantial, buttery hand-feel.',
    detailsStory:
      'Engineered from scratch to solve the flimsy tee dilemma. We spent nine months testing 14 custom jersey mills before perfecting this 260 GSM single-jersey fabric. It has enough weight to drape crisply away from the body without clinging, yet breathes effortlessly in warm climates thanks to long-staple Indian combed yarn. Finished with twin-needle reinforced hems and silicone-washed for broken-in softness from day one.',
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
        alt: 'Boxy Heavyweight Tee front view on model',
        label: 'Front'
      },
      {
        id: 'back',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85',
        alt: 'Boxy Heavyweight Tee back view showing dropped shoulders',
        label: 'Back'
      },
      {
        id: 'detail',
        url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=85',
        alt: 'Close-up fabric detail showing 260 GSM knit texture and ribbed collar',
        label: 'Detail'
      },
      {
        id: 'lifestyle',
        url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=85',
        alt: 'Lifestyle street shot of the Boxy Heavyweight Tee styled with denim',
        label: 'Lifestyle'
      }
    ],
    colors: [
      { name: 'Vintage Black', hex: '#171717', inStock: true, imageIndex: 0 },
      { name: 'Washed Bone', hex: '#e6e2d8', inStock: true, imageIndex: 1 },
      { name: 'Slate Olive', hex: '#485044', inStock: true, imageIndex: 2 },
      { name: 'Deep Charcoal', hex: '#2c3038', inStock: true, imageIndex: 0 }
    ],
    sizes: [
      { size: 'XS', status: 'low_stock', stockCount: 2 },
      { size: 'S', status: 'available' },
      { size: 'M', status: 'available' },
      { size: 'L', status: 'available' },
      { size: 'XL', status: 'low_stock', stockCount: 3 },
      { size: 'XXL', status: 'out_of_stock', stockCount: 0 }
    ],
    modelInfo: {
      height: '6\'1" (185 cm)',
      weight: '77 kg (170 lbs)',
      chest: '39.5" (100 cm)',
      sizeWorn: 'Large (L)',
      fitNote:
        'Fits intentionally boxy and relaxed with generous chest width. Choose your normal size for the look seen here, or size down one if you prefer a traditional classic fit.'
    },
    specs: [
      { label: 'Fabric Composition', value: '100% Long-Staple Combed Cotton' },
      { label: 'Fabric Weight', value: '260 GSM Heavyweight Single Jersey' },
      { label: 'Fit Profile', value: 'Boxy Silhouette · Dropped Shoulder Seams' },
      { label: 'Collar Construction', value: '1.25" High-Density 1x1 Ribbed Mock Collar' },
      { label: 'Stretch Index', value: 'Natural mechanical drape (zero elastane)' },
      { label: 'Finishing Process', value: 'Pre-shrunk & enzyme silicone washed' },
      { label: 'Care Instructions', value: 'Cold wash inside-out · Line dry in shade · Cool iron' },
      { label: 'Country of Origin', value: 'Ethically crafted in Tiruppur, India' }
    ],
    reviewsSummary: {
      rating: 4.9,
      reviewCount: 148,
      recommendPercentage: 98,
      distribution: [
        { stars: 5, percentage: 86 },
        { stars: 4, percentage: 11 },
        { stars: 3, percentage: 2 },
        { stars: 2, percentage: 1 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [
      {
        id: 'rev-1',
        author: 'Arjun M.',
        location: 'Bengaluru',
        rating: 5,
        date: '2 days ago',
        sizePurchased: 'L',
        fitFeedback: 'True to Size',
        title: 'Finally, a real heavyweight tee that doesn\'t lose its collar shape',
        comment:
          'I own tees from high-end labels costing 4x this. This 260 GSM fabric is genuinely top-tier. The tight collar stays completely flat after multiple washes, and the drape over the shoulders is immaculate.',
        verified: true,
        helpfulCount: 34,
        photoUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'rev-2',
        author: 'Rohan K.',
        location: 'Mumbai',
        rating: 5,
        date: '1 week ago',
        sizePurchased: 'M',
        fitFeedback: 'Slightly Oversized',
        title: 'The perfect streetwear silhouette for Indian weather',
        comment:
          'Substantial weight without feeling like a sauna. The boxy drape means it doesn\'t stick to your back when it is humid outside. Going to order the Washed Bone and Olive right now.',
        verified: true,
        helpfulCount: 19
      },
      {
        id: 'rev-3',
        author: 'Devansh S.',
        location: 'Delhi',
        rating: 5,
        date: '2 weeks ago',
        sizePurchased: 'XL',
        fitFeedback: 'True to Size',
        title: 'Worth every rupee. Heavy, soft, and premium.',
        comment:
          'I\'m 6\'2" and broad shouldered, usually tees are either too short or way too narrow. The XL fits like a custom tailor cut it for streetwear styling. The packaging was also totally plastic-free!',
        verified: true,
        helpfulCount: 14,
        photoUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'rev-4',
        author: 'Kabir P.',
        location: 'Pune',
        rating: 4,
        date: '3 weeks ago',
        sizePurchased: 'S',
        fitFeedback: 'Slightly Oversized',
        title: 'Great quality, definitely oversized',
        comment:
          'Be mindful that this is genuinely boxy. If you want a slim fit you must size down. Fabric weight and stitching are 10/10.',
        verified: true,
        helpfulCount: 8
      }
    ],
    faqs: [
      {
        question: 'Will this tee shrink after the first machine wash?',
        answer:
          'No. All our heavyweight cotton fabric undergoes mechanical pre-shrinking and heat-setting before cutting. When washed in cold water (under 30°C) and hung to dry, shrinkage is strictly under 1%.'
      },
      {
        question: 'How does the 260 GSM weight feel in warm or humid climates?',
        answer:
          'Because we use 100% combed long-staple Indian cotton ring-spun yarn with an open single-jersey structure, the fabric breathes naturally. The boxy cut creates an air pocket between the cloth and your skin, keeping you cooler than a thin clingy polyester blend.'
      },
      {
        question: 'What is your size exchange policy if the fit isn\'t right?',
        answer:
          'We offer a seamless 7-day doorstep exchange policy across India. Our delivery courier brings your new size and picks up the returned tee at the exact same moment. No printing labels or courier drop-offs required.'
      },
      {
        question: 'How does the collar hold up over time?',
        answer:
          'Our collar is made with a custom 1.25-inch high-density 1x1 rib with internal spandex thread reinforcement and herringbone neck taping. It will not curl, stretch out, or bacon even after 50+ wash cycles.'
      },
      {
        question: 'How fast will my order arrive?',
        answer:
          'Orders placed before 2:00 PM are dispatched same-day from our Mumbai distribution center. Metro deliveries arrive in 1–3 business days; rest of India takes 3–5 business days with full SMS tracking.'
      }
    ]
  },
  {
    id: 9,
    store: 'clothing-store',
    category: 't-shirts',
    name: 'Oversized Washed Graphic Tee',
    fit: 'Oversized Fit',
    price: '₹1,199',
    originalPrice: '₹1,699',
    priceNum: 1199,
    originalPriceNum: 1699,
    badge: 'New Arrival',
    sellingPoint:
      'Mineral acid-washed 240 GSM cotton with cracked vintage screenprint and dropped armholes.',
    desc: 'Acid-washed streetwear tee featuring distressed cyberpunk typography and an oversized vintage silhouette.',
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85',
        alt: 'Oversized Washed Graphic Tee front view',
        label: 'Front'
      },
      {
        id: 'back',
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
        alt: 'Oversized Washed Graphic Tee back view',
        label: 'Back'
      }
    ],
    colors: [
      { name: 'Acid Washed Charcoal', hex: '#31343c', inStock: true, imageIndex: 0 },
      { name: 'Vintage Stone', hex: '#87837b', inStock: true, imageIndex: 1 }
    ],
    sizes: [
      { size: 'S', status: 'available' },
      { size: 'M', status: 'available' },
      { size: 'L', status: 'available' },
      { size: 'XL', status: 'low_stock', stockCount: 1 }
    ],
    modelInfo: {
      height: '6\'0" (183 cm)',
      weight: '74 kg',
      sizeWorn: 'M',
      fitNote: 'Fits noticeably oversized with exaggerated drop shoulders.'
    },
    specs: [
      { label: 'Fabric', value: '100% Combed Cotton, 240 GSM' },
      { label: 'Wash', value: 'Vintage Mineral Acid Wash' },
      { label: 'Print', value: 'Crack-resistant water-based discharge ink' },
      { label: 'Care', value: 'Cold wash inside-out · Do not tumble dry' }
    ],
    reviewsSummary: {
      rating: 4.8,
      reviewCount: 92,
      recommendPercentage: 96,
      distribution: [
        { stars: 5, percentage: 80 },
        { stars: 4, percentage: 16 },
        { stars: 3, percentage: 4 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  },
  {
    id: 10,
    store: 'clothing-store',
    category: 'shirts',
    name: 'Relaxed Oxford Button-Down Shirt',
    fit: 'Relaxed Tailored Fit',
    price: '₹1,599',
    originalPrice: '₹2,299',
    priceNum: 1599,
    originalPriceNum: 2299,
    badge: 'Essential Staple',
    sellingPoint:
      'Garment-dyed 220 GSM structured cotton Oxford with curved split yoke and mother-of-pearl buttons.',
    desc: 'Structured yet relaxed button-down shirt cut from authentic pin-point Oxford cloth. Soft rolled collar with box pleat back.',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
        alt: 'Relaxed Oxford Button-Down Shirt front view',
        label: 'Front'
      },
      {
        id: 'detail',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85',
        alt: 'Collar detail on Oxford Shirt',
        label: 'Detail'
      }
    ],
    colors: [
      { name: 'Sky Blue Oxford', hex: '#a4c2db', inStock: true, imageIndex: 0 },
      { name: 'Classic Crisp White', hex: '#fbfbfb', inStock: true, imageIndex: 1 }
    ],
    sizes: [
      { size: 'S', status: 'available' },
      { size: 'M', status: 'available' },
      { size: 'L', status: 'available' },
      { size: 'XL', status: 'available' }
    ],
    modelInfo: {
      height: '6\'1" (185 cm)',
      weight: '78 kg',
      sizeWorn: 'L',
      fitNote: 'Relaxed through body with a clean, unrestrictive collar fit.'
    },
    specs: [
      { label: 'Material', value: '100% Ring-spun Oxford Cotton, 220 GSM' },
      { label: 'Collar', value: '3" Button-down with natural roll' },
      { label: 'Buttons', value: 'Matte Mother-of-pearl imitation resin' }
    ],
    reviewsSummary: {
      rating: 4.9,
      reviewCount: 76,
      recommendPercentage: 99,
      distribution: [
        { stars: 5, percentage: 89 },
        { stars: 4, percentage: 11 },
        { stars: 3, percentage: 0 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  },
  {
    id: 11,
    store: 'clothing-store',
    category: 'shirts',
    name: 'Utility Canvas Overshirt',
    fit: 'Boxy Outerwear Fit',
    price: '₹2,299',
    originalPrice: '₹3,199',
    priceNum: 2299,
    originalPriceNum: 3199,
    badge: 'Heavyweight Canvas',
    sellingPoint:
      '340 GSM duck cotton canvas with dual expandable utility chest pockets and gunmetal shank buttons.',
    desc: 'Durable cotton canvas shacket with dual chest utility pockets and custom matte metal hardware. Designed to layer over tees or hoodies.',
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85',
        alt: 'Utility Canvas Overshirt front view',
        label: 'Front'
      }
    ],
    colors: [
      { name: 'Washed Olive Drab', hex: '#4f5643', inStock: true, imageIndex: 0 },
      { name: 'Toasted Tan', hex: '#a68762', inStock: true, imageIndex: 0 }
    ],
    sizes: [
      { size: 'S', status: 'available' },
      { size: 'M', status: 'available' },
      { size: 'L', status: 'available' },
      { size: 'XL', status: 'low_stock', stockCount: 2 }
    ],
    modelInfo: {
      height: '6\'2" (188 cm)',
      weight: '80 kg',
      sizeWorn: 'L',
      fitNote: 'Designed with generous room in the chest and arms to layer over hoodies.'
    },
    specs: [
      { label: 'Fabric', value: '100% Duck Canvas Cotton, 340 GSM' },
      { label: 'Hardware', value: 'Reinforced gunmetal matte snap shanks' },
      { label: 'Pockets', value: 'Dual gusseted chest cargo pockets with pen slot' }
    ],
    reviewsSummary: {
      rating: 4.9,
      reviewCount: 54,
      recommendPercentage: 97,
      distribution: [
        { stars: 5, percentage: 88 },
        { stars: 4, percentage: 10 },
        { stars: 3, percentage: 2 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  },
  {
    id: 12,
    store: 'clothing-store',
    category: 'hoodies',
    name: 'Heavy French Terry Pullover Hoodie',
    fit: 'Boxy Drop Shoulder',
    price: '₹2,499',
    originalPrice: '₹3,499',
    priceNum: 2499,
    originalPriceNum: 3499,
    badge: '450 GSM Heavy',
    sellingPoint:
      '450 GSM organic looped French terry with double-layered crossover hood and zero cheap drawstrings.',
    desc: '450 GSM heavyweight organic French terry hoodie with double-layered hood, no drawstrings, and deep kangaroo pocket.',
    img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85',
        alt: 'Heavy French Terry Pullover Hoodie front view',
        label: 'Front'
      }
    ],
    colors: [
      { name: 'Concrete Heather Grey', hex: '#8e9196', inStock: true, imageIndex: 0 },
      { name: 'Pitch Black', hex: '#111113', inStock: true, imageIndex: 0 }
    ],
    sizes: [
      { size: 'S', status: 'available' },
      { size: 'M', status: 'available' },
      { size: 'L', status: 'available' },
      { size: 'XL', status: 'available' }
    ],
    modelInfo: {
      height: '6\'1"',
      weight: '76 kg',
      sizeWorn: 'L',
      fitNote: 'Substantial boxy drape that holds its sculptural silhouette.'
    },
    specs: [
      { label: 'Fabric Weight', value: '450 GSM Organic French Terry Cotton' },
      { label: 'Hood', value: 'Double-walled structured hood, clean crossover neck' },
      { label: 'Ribbing', value: 'Heavy 2x2 lycra-reinforced cotton rib at cuffs & waist' }
    ],
    reviewsSummary: {
      rating: 5.0,
      reviewCount: 110,
      recommendPercentage: 100,
      distribution: [
        { stars: 5, percentage: 95 },
        { stars: 4, percentage: 5 },
        { stars: 3, percentage: 0 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  },
  {
    id: 13,
    store: 'clothing-store',
    category: 'hoodies',
    name: 'Washed Street Zip Hoodie',
    fit: 'Relaxed Streetwear Fit',
    price: '₹2,799',
    originalPrice: '₹3,799',
    priceNum: 2799,
    originalPriceNum: 3799,
    badge: 'Two-Way Zip',
    sellingPoint:
      'Vintage mineral wash 420 GSM fleece with custom two-way YKK matte zipper and deep side pockets.',
    desc: 'Sun-faded vintage mineral wash with custom two-way metal zipper and ribbed side gussets.',
    img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=85',
        alt: 'Washed Street Zip Hoodie front view',
        label: 'Front'
      }
    ],
    colors: [
      { name: 'Sun Faded Clay', hex: '#6d483e', inStock: true, imageIndex: 0 },
      { name: 'Faded Black', hex: '#2b2a29', inStock: true, imageIndex: 0 }
    ],
    sizes: [
      { size: 'S', status: 'available' },
      { size: 'M', status: 'available' },
      { size: 'L', status: 'available' },
      { size: 'XL', status: 'low_stock', stockCount: 2 }
    ],
    modelInfo: {
      height: '6\'0"',
      weight: '75 kg',
      sizeWorn: 'M',
      fitNote: 'Relaxed vintage silhouette with functional two-way styling zipper.'
    },
    specs: [
      { label: 'Fabric', value: '420 GSM brushed back cotton fleece' },
      { label: 'Zipper', value: 'Two-way heavy duty antiqued nickel hardware' }
    ],
    reviewsSummary: {
      rating: 4.8,
      reviewCount: 42,
      recommendPercentage: 95,
      distribution: [
        { stars: 5, percentage: 85 },
        { stars: 4, percentage: 12 },
        { stars: 3, percentage: 3 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  },
  {
    id: 14,
    store: 'clothing-store',
    category: 'hats',
    name: 'Vintage Washed Cotton Dad Cap',
    fit: 'Low Profile 6-Panel',
    price: '₹799',
    originalPrice: '₹1,199',
    priceNum: 799,
    originalPriceNum: 1199,
    badge: 'Accessory',
    sellingPoint:
      'Unstructured low-profile 280 GSM cotton twill with antique brass slider buckle and subtle tone-on-tone embroidery.',
    desc: 'Unstructured 6-panel low profile cotton twill cap with brass buckle strap closure and subtle embroidery.',
    img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85',
        alt: 'Vintage Washed Cotton Dad Cap front view',
        label: 'Front'
      }
    ],
    colors: [
      { name: 'Washed Pine Green', hex: '#263d33', inStock: true, imageIndex: 0 },
      { name: 'Off-White Ecru', hex: '#ede8dd', inStock: true, imageIndex: 0 }
    ],
    sizes: [{ size: 'One Size (Adjustable 54-61 cm)', status: 'available' }],
    modelInfo: {
      height: 'Standard Headform',
      weight: '-',
      sizeWorn: 'One Size',
      fitNote: 'Adjustable strap comfortably fits head circumferences from 54 cm to 61 cm.'
    },
    specs: [
      { label: 'Material', value: '100% Chino Cotton Twill' },
      { label: 'Profile', value: 'Unstructured 6-Panel, Pre-curved visor' },
      { label: 'Closure', value: 'Self-fabric tuck-in strap with brass tri-glide buckle' }
    ],
    reviewsSummary: {
      rating: 4.9,
      reviewCount: 65,
      recommendPercentage: 98,
      distribution: [
        { stars: 5, percentage: 90 },
        { stars: 4, percentage: 8 },
        { stars: 3, percentage: 2 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  },
  {
    id: 15,
    store: 'clothing-store',
    category: 'hats',
    name: 'Ripstop Streetwear Bucket Hat',
    fit: 'Relaxed Brimmed Hat',
    price: '₹899',
    originalPrice: '₹1,299',
    priceNum: 899,
    originalPriceNum: 1299,
    badge: 'Weather Resistant',
    sellingPoint:
      'Technical DWR-coated diamond ripstop with 360-degree stitched brim and breathable mesh sweatband.',
    desc: 'Technical water-resistant ripstop fabric with 360-degree brim and internal sweatband.',
    img: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1200&q=85',
    img2: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      {
        id: 'front',
        url: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=1200&q=85',
        alt: 'Ripstop Streetwear Bucket Hat front view',
        label: 'Front'
      }
    ],
    colors: [
      { name: 'Matte Obsidian', hex: '#16171a', inStock: true, imageIndex: 0 },
      { name: 'Coyote Sand', hex: '#b79e7a', inStock: true, imageIndex: 0 }
    ],
    sizes: [
      { size: 'S/M (56-58 cm)', status: 'available' },
      { size: 'L/XL (59-61 cm)', status: 'available' }
    ],
    modelInfo: {
      height: 'Standard Headform',
      weight: '-',
      sizeWorn: 'L/XL',
      fitNote: 'Wide downward sloping brim provides complete sun and moisture protection.'
    },
    specs: [
      { label: 'Material', value: '100% Diamond Ripstop Nylon with DWR finish' },
      { label: 'Sweatband', value: 'Quick-dry moisture wicking poly-mesh' }
    ],
    reviewsSummary: {
      rating: 4.7,
      reviewCount: 38,
      recommendPercentage: 94,
      distribution: [
        { stars: 5, percentage: 78 },
        { stars: 4, percentage: 18 },
        { stars: 3, percentage: 4 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 0 }
      ]
    },
    reviews: [],
    faqs: []
  }
]
