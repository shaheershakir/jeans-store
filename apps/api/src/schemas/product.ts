import { z } from 'zod'

export const STORES = ['teesgarage', 'clothing-store', 'frontend'] as const
export type StoreType = (typeof STORES)[number]

export const FITS = ['Oversized', 'Boxy', 'Relaxed', 'Regular', 'Straight', 'Baggy', 'Bootcut', 'Wide', 'Slim', 'Tapered'] as const
export type Fit = (typeof FITS)[number]

export const FIT_VALUES = [...FITS, 'all'] as const

export const CATEGORIES = [
  'stripes',
  'fullsleeve',
  'drsleeve',
  'printed-tees',
  'ringer-tees',
  'henley',
  'waffle',
  'trackpants',
  'sweatpants',
] as const
export type Category = (typeof CATEGORIES)[number]

export const variantSchema = z.object({
  id: z.number().int().nonnegative().optional(),
  productId: z.string().uuid().optional(),
  designId: z.number().int().positive().nullable().optional(),
  sku: z.string().min(1).optional(),
  size: z.union([z.string().min(1), z.number()]),
  color: z.string().min(1).default('Black'),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  reserved: z.number().int().nonnegative().default(0),
  weight: z.number().int().positive().max(100_000).default(350),
  status: z.enum(['Active', 'Inactive']).default('Active')
})

export type Variant = z.infer<typeof variantSchema>

export const productDesignSchema = z.object({
  id: z.number().int().positive().optional(),
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  priceOverride: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0).optional(),
  status: z.enum(['Active', 'Inactive']).default('Active').optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional()
})

export type ProductDesign = z.infer<typeof productDesignSchema>

/**
 * Shared Product model across backend, frontend, and admin.
 */
export const productSchema = z.object({
  id: z.string().uuid(),
  store: z.string().default('teesgarage'),
  category: z.string().min(1).default('printed-tees'),
  categoryId: z.number().int().optional(),
  collectionIds: z.array(z.number().int().positive()).optional(),
  tags: z.array(z.string().min(1)).optional(),
  slug: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('active').optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  name: z.string().min(1),
  shortDescription: z.string().max(200).optional(),
  sku: z.string().optional(),
  price: z.string().min(1),
  priceNum: z.number().nonnegative(),
  weightGrams: z.number().int().positive().max(100_000).optional(),
  compareAtPrice: z.number().int().nonnegative().nullable().optional(),
  costPrice: z.number().int().nonnegative().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isFreeSize: z.boolean().optional(),
  trackInventory: z.boolean().default(true).optional(),
  continueSelling: z.boolean().default(false).optional(),
  img: z.string().url(),
  img2: z.string().url(),
  images: z.array(z.string()).optional(),
  desc: z.string().min(1),
  color: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  designs: z.array(productDesignSchema).optional(),
  rating: z.number().optional(),
  inStock: z.boolean().optional(),
  collection: z.string().optional(),
  adminData: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.coerce.date().optional()
})

export const createProductSchema = productSchema.omit({ id: true, createdAt: true })

export const updateProductSchema = productSchema
  .omit({ id: true, createdAt: true })
  .partial()

export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
