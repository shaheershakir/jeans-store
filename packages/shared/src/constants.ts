import type { NavigationItem, HomepageConfig } from './types.js'

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export const SWATCHES = [
  { name: 'Pitch Black', className: 'black' },
  { name: 'Heather Charcoal', className: 'charcoal' },
  { name: 'Forest Green', className: 'green' },
  { name: 'Ecru / Navy', className: 'ecru' }
]

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Garments' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'fullsleeve', label: 'Fullsleeve' },
  { id: 'drsleeve', label: 'Drsleeve' },
  { id: 'printed-tees', label: 'Printed Tees' },
  { id: 'ringer-tees', label: 'Ringer Tees' },
  { id: 'henley', label: 'Henley' },
  { id: 'trackpants', label: 'Trackpants' },
  { id: 'sweatpants', label: 'Sweatpants' }
] as const

export const DEFAULT_NAV_LINKS: NavigationItem[] = [
  { id: 'nav-1', label: 'Stripes', href: '/shop/stripes', type: 'category', targetValue: 'stripes', order: 0, isActive: true, openInNewTab: false },
  { id: 'nav-2', label: 'Fullsleeve', href: '/shop/fullsleeve', type: 'category', targetValue: 'fullsleeve', order: 1, isActive: true, openInNewTab: false },
  { id: 'nav-3', label: 'Drsleeve', href: '/shop/drsleeve', type: 'category', targetValue: 'drsleeve', order: 2, isActive: true, openInNewTab: false },
  { id: 'nav-4', label: 'Printed tees', href: '/shop/printed-tees', type: 'category', targetValue: 'printed-tees', order: 3, isActive: true, openInNewTab: false },
  { id: 'nav-5', label: 'Ringer tees', href: '/shop/ringer-tees', type: 'category', targetValue: 'ringer-tees', order: 4, isActive: true, openInNewTab: false },
  { id: 'nav-6', label: 'Henley', href: '/shop/henley', type: 'category', targetValue: 'henley', order: 5, isActive: true, openInNewTab: false },
  { id: 'nav-7', label: 'Trackpants', href: '/shop/trackpants', type: 'category', targetValue: 'trackpants', order: 6, isActive: true, openInNewTab: false },
  { id: 'nav-8', label: 'Sweatpants', href: '/shop/sweatpants', type: 'category', targetValue: 'sweatpants', order: 7, isActive: true, openInNewTab: false }
]

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
      '📦 Paid delivery calculated by destination and parcel weight',
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
    trustBadges: ['⚡ 24h dispatch', '🔄 7-day exchange', '🚚 Delivery priced by weight']
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
      { id: '1', title: 'Paid delivery by destination and weight', icon: 'truck' },
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
