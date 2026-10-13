import { z } from 'zod'

export const STORES = ['teesgarage', 'infit', 'clothing-store', 'frontend'] as const
export type StoreType = (typeof STORES)[number]

export const FITS = ['Oversized', 'Boxy', 'Relaxed', 'Regular', 'Straight', 'Baggy', 'Bootcut', 'Wide', 'Slim'] as const
export type Fit = (typeof FITS)[number]

export const FIT_VALUES = [...FITS, 'all'] as const

export const CATEGORIES = [
  'stripes',
  'fullsleeve',
  'drsleeve',
  'printed-tees',
  'ringer-tees',
  'henley',
  'trackpants',
  'sweatpants',
  't-shirts',
  'shirts',
  'hoodies',
  'accessories'
] as const
export type Category = (typeof CATEGORIES)[number]

export const variantSchema = z.object({
  id: z.number().int().nonnegative().optional(),
  productId: z.number().int().nonnegative().optional(),
  sku: z.string().min(1).optional(),
  size: z.union([z.string().min(1), z.number()]),
  color: z.string().min(1),
  price: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  reserved: z.number().int().nonnegative().default(0),
  reorderPoint: z.number().int().nonnegative().default(5),
  weight: z.number().nonnegative().default(250),
  barcode: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active')
})

export type Variant = z.infer<typeof variantSchema>

/**
 * Shared Product model across backend, frontend, and admin.
 */
export const productSchema = z.object({
  id: z.number().int().nonnegative(),
  store: z.string().default('teesgarage'),
  category: z.string().default('printed-tees'),
  name: z.string().min(1),
  sku: z.string().optional(),
  fit: z.enum(FITS).optional(),
  price: z.string().min(1),
  priceNum: z.number().nonnegative(),
  img: z.string().url(),
  img2: z.string().url(),
  images: z.array(z.string().url()).optional(),
  badge: z.string().min(1).optional(),
  desc: z.string().min(1),
  wash: z.string().min(1).optional(),
  color: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  fabric: z.string().optional(),
  material: z.string().optional(),
  sleeveLength: z.string().optional(),
  neckType: z.string().optional(),
  pattern: z.string().optional(),
  printStyle: z.string().optional(),
  trimColor: z.string().optional(),
  buttons: z.string().optional(),
  waistSize: z.array(z.string()).optional(),
  length: z.string().optional(),
  closure: z.string().optional(),
  pockets: z.string().optional(),
  use: z.string().optional(),
  legStyle: z.string().optional(),
  rise: z.string().optional(),
  rating: z.number().optional(),
  inStock: z.boolean().optional(),
  collection: z.string().optional(),
  createdAt: z.coerce.date().optional()
})

export const createProductSchema = productSchema.omit({ id: true, createdAt: true })

export const updateProductSchema = productSchema
  .omit({ id: true, createdAt: true })
  .partial()

export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>

