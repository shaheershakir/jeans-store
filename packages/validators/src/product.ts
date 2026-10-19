import { z } from 'zod'

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

export const productSchema = z.object({
  id: z.number().int().nonnegative(),
  store: z.string().default('teesgarage'),
  category: z.string().default('printed-tees'),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.string().min(1),
  priceNum: z.number().nonnegative(),
  weightGrams: z.number().int().positive().max(100_000).optional(),
  compareAtPrice: z.number().int().nonnegative().nullable().optional(),
  costPrice: z.number().int().nonnegative().nullable().optional(),
  taxRate: z.number().int().min(0).max(100).optional(),
  hsnCode: z.string().max(12).optional(),
  isFeatured: z.boolean().optional(),
  careInstructions: z.string().optional(),
  img: z.string().url(),
  img2: z.string().url(),
  images: z.array(z.string().url()).optional(),
  badge: z.string().min(1).optional(),
  desc: z.string().min(1),
  color: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  rating: z.number().optional(),
  inStock: z.boolean().optional(),
  collection: z.string().optional(),
  categoryId: z.number().int().optional(),
  slug: z.string().optional(),
  status: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  adminData: z.record(z.string(), z.unknown()).optional()
})

export const createProductSchema = productSchema.omit({ id: true })

export const updateProductSchema = productSchema
  .omit({ id: true })
  .partial()

export type ProductSchemaType = z.infer<typeof productSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type VariantSchemaType = z.infer<typeof variantSchema>
