import { z } from 'zod'

export const orderItemSchema = z.object({
  id: z.number(),
  variantId: z.number().int().positive().optional(),
  name: z.string(),
  fit: z.string().optional(),
  size: z.string(),
  price: z.string(),
  priceNum: z.number(),
  sku: z.string().optional(),
  quantity: z.number().int().positive().max(50),
  weightGrams: z.number().int().nonnegative().optional(),
  img: z.string().optional(),
  lineTotal: z.number().int().nonnegative().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  taxAmount: z.number().int().nonnegative().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
  taxableAmount: z.number().int().nonnegative().optional(),
  variantLabel: z.string().optional()
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
  discountTotal: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative(),
  taxTotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  weightGrams: z.number().int().nonnegative().optional(),
  couponCode: z.string().trim().min(1).max(60).optional(),
  handoffType: z.enum(['whatsapp', 'email', 'razorpay', 'cod']).default('whatsapp'),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional()
})

export type OrderItemSchemaType = z.infer<typeof orderItemSchema>
export type CreateOrderSchemaType = z.infer<typeof createOrderSchema>
