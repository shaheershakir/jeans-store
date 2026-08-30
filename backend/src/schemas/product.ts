import { z } from 'zod'

export const FITS = ['Straight', 'Baggy', 'Wide', 'Relaxed', 'Bootcut'] as const

export type Fit = (typeof FITS)[number]

export const FIT_VALUES = [...FITS, 'all'] as const

/**
 * Mirrors the `Product` interface in frontend/src/lib/constants.ts.
 * Keep both in sync until a shared package exists.
 */
export const productSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  fit: z.enum(FITS),
  price: z.string().min(1),
  priceNum: z.number().nonnegative(),
  img: z.string().url(),
  img2: z.string().url(),
  badge: z.string().min(1).optional(),
  desc: z.string().min(1),
  wash: z.string().min(1)
})

export const createProductSchema = productSchema.omit({ id: true })

export const updateProductSchema = productSchema
  .omit({ id: true })
  .partial()

export type Product = z.infer<typeof productSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
