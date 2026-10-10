import { z } from 'zod'

export const HOMEPAGE_SECTION_TYPES = [
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
] as const

export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number]

export const announcementSchema = z.object({
  enabled: z.boolean().default(true),
  messages: z.array(z.string()).default([]),
  intervalSeconds: z.number().min(1).max(20).default(4)
})

export const heroSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('New Season — SS 2026'),
  title: z.string().default('Built for\neveryday.'),
  subtitle: z.string().default('Heavyweight denim. Honest washes.\nCuts that get better with every wear.'),
  primaryCtaText: z.string().default('Shop Denim'),
  primaryCtaLink: z.string().default('/#catalog'),
  secondaryCtaText: z.string().default('All Styles'),
  secondaryCtaLink: z.string().default('/#catalog'),
  imageUrl: z.string().default('/hero-man.jpg'),
  trustBadges: z.array(z.string()).default(['⚡ 24h dispatch', '🔄 7-day exchange', '🚚 Free above ₹999'])
})

export const categoryItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string().default('👖'),
  img: z.string(),
  count: z.string()
})

export const categoriesSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('Explore'),
  title: z.string().default('Shop by Category'),
  items: z.array(categoryItemSchema).default([])
})

export const newArrivalsSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('Fresh Drops'),
  title: z.string().default('New Arrivals'),
  limit: z.number().int().min(1).max(12).default(4),
  ctaText: z.string().default('View All Products'),
  ctaLink: z.string().default('/#catalog')
})

export const featuredCollectionSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('Featured Collection'),
  title: z.string().default('The Essentials\nCollection'),
  description: z.string().default(
    'Every piece designed to live in your rotation forever. Heavyweight fabrics, considered washes, and silhouettes that hold their shape.'
  ),
  ctaText: z.string().default('Shop Collection'),
  ctaLink: z.string().default('/#catalog'),
  imageUrl: z.string().default('/featured-collection.jpg')
})

export const bestSellersSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('Community Picks'),
  title: z.string().default('Best Sellers'),
  subtitle: z.string().default('The styles our customers keep coming back for.'),
  limit: z.number().int().min(1).max(12).default(4)
})

export const brandStatSchema = z.object({
  num: z.string(),
  label: z.string()
})

export const brandStorySectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('Our Story'),
  title: z.string().default('Made for your\neveryday.'),
  paragraphs: z.array(z.string()).default([]),
  imageUrl: z.string().default('/brand-editorial.jpg'),
  stats: z.array(brandStatSchema).default([]),
  ctaText: z.string().default('Get in Touch'),
  ctaLink: z.string().default('mailto:concierge@teesgarage.in')
})

export const lookItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  tag: z.string(),
  img: z.string(),
  link: z.string().default('/#catalog')
})

export const looksSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('Edit'),
  title: z.string().default('Shop the Look'),
  subtitle: z.string().default('Complete outfit inspiration — everything styled and linked.'),
  items: z.array(lookItemSchema).default([])
})

export const instagramSectionSchema = z.object({
  enabled: z.boolean().default(true),
  eyebrow: z.string().default('@teesgarage.in'),
  title: z.string().default('Follow Our Story'),
  subtitle: z.string().default('Real people, real fits — tag us in yours.'),
  instagramUrl: z.string().default('https://instagram.com'),
  photos: z.array(z.string()).default([])
})

export const reviewItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  stars: z.number().min(1).max(5).default(5),
  text: z.string(),
  product: z.string()
})

export const reviewsSectionSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default('What Customers Say'),
  ratingText: z.string().default('4.9 / 5 — 200+ verified reviews'),
  items: z.array(reviewItemSchema).default([])
})

export const trustItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional()
})

export const trustBarSectionSchema = z.object({
  enabled: z.boolean().default(true),
  items: z.array(trustItemSchema).default([])
})

export const catalogSectionSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default('All Products'),
  showFilters: z.boolean().default(true)
})

export const homepageConfigSchema = z.object({
  sectionsOrder: z.array(z.enum(HOMEPAGE_SECTION_TYPES)),
  sectionsEnabled: z.record(z.string(), z.boolean()),
  announcement: announcementSchema,
  hero: heroSchema,
  categories: categoriesSectionSchema,
  new_arrivals: newArrivalsSectionSchema,
  featured_collection: featuredCollectionSectionSchema,
  best_sellers: bestSellersSectionSchema,
  brand_story: brandStorySectionSchema,
  looks: looksSectionSchema,
  instagram: instagramSectionSchema,
  reviews: reviewsSectionSchema,
  trust_bar: trustBarSectionSchema,
  catalog: catalogSectionSchema
})

export const updateHomepageConfigSchema = z.object({
  config: homepageConfigSchema
})

export type HomepageConfig = z.infer<typeof homepageConfigSchema>
export type UpdateHomepageConfigInput = z.infer<typeof updateHomepageConfigSchema>
