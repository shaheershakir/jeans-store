import { z } from 'zod'

export const orderItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  fit: z.string().optional(),
  size: z.string(),
  price: z.string(),
  priceNum: z.number(),
  quantity: z.number().int().positive(),
  img: z.string().optional()
})

export const createOrderSchema = z.object({
  orderNumber: z.string().min(1),
  store: z.string().default('teesgarage'),
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email(),
  address: z.string().min(1),
  apartment: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(5),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().positive(),
  handoffType: z.enum(['whatsapp', 'email']).default('whatsapp')
})

export type OrderItemSchemaType = z.infer<typeof orderItemSchema>
export type CreateOrderSchemaType = z.infer<typeof createOrderSchema>
