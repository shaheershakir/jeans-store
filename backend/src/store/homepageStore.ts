import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HomepageConfig } from '../schemas/homepage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE_PATH = path.resolve(__dirname, '../data/homepage-config.json')

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
      'TEESGARAGE started with a simple question: why is it so hard to find jeans that fit, last, and feel honest? We’re a Mumbai-based label obsessed with getting denim right — from the weight of the fabric to the arc of the seat.',
      'No fast fashion. No compromise. Just weighty, considered denim built to outlast the trends.'
    ],
    imageUrl: '/brand-editorial.jpg',
    stats: [
      { num: '14oz', label: 'Fabric weight' },
      { num: '5+', label: 'Signature fits' },
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
    eyebrow: '@teesgarage.in',
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

class HomepageStore {
  private currentConfig: HomepageConfig = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG))

  constructor() {
    this.loadFromDisk()
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8')
        const parsed = JSON.parse(raw)
        if (parsed && parsed.sectionsOrder) {
          this.currentConfig = { ...DEFAULT_HOMEPAGE_CONFIG, ...parsed }
        }
      }
    } catch {
      // Fallback to default in-memory config
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(DATA_FILE_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(this.currentConfig, null, 2), 'utf-8')
    } catch {
      // Non-critical if filesystem is read-only
    }
  }

  async get(): Promise<HomepageConfig> {
    return JSON.parse(JSON.stringify(this.currentConfig))
  }

  async save(newConfig: HomepageConfig): Promise<HomepageConfig> {
    this.currentConfig = JSON.parse(JSON.stringify(newConfig))
    this.saveToDisk()
    return this.get()
  }

  async resetToDefaults(): Promise<HomepageConfig> {
    this.currentConfig = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG))
    this.saveToDisk()
    return this.get()
  }
}

export const homepageStore = new HomepageStore()
