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

/**
 * Shared Product model across backend, frontend, and admin.
 */
export const productSchema = z.object({
  id: z.number().int().nonnegative(),
  store: z.string().default('teesgarage'),
  category: z.string().default('printed-tees'),
  name: z.string().min(1),
  fit: z.enum(FITS).optional(),
  price: z.string().min(1),
  priceNum: z.number().nonnegative(),
  img: z.string().url(),
  img2: z.string().url(),
  images: z.array(z.string().url()).optional(),
  badge: z.string().min(1).optional(),
  desc: z.string().min(1),
  wash: z.string().min(1).optional(),
  sizes: z.array(z.string()).optional()
})

export const createProductSchema = productSchema.omit({ id: true })

export const updateProductSchema = productSchema
  .omit({ id: true })
  .partial()

export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
