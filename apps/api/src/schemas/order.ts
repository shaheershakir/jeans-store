import { z } from 'zod'

export const orderItemSchema = z.object({
  id: z.number().int().nonnegative(),
  variantId: z.number().int().positive().optional(),
  name: z.string().optional(),
  fit: z.string().optional(),
  size: z.string().min(1),
  price: z.string().optional(),
  priceNum: z.number().nonnegative().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive().max(50),
  img: z.string().optional()
})

export const createOrderSchema = z.object({
  userId: z.number().int().positive().nullable().optional(),
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
  subtotal: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  total: z.number().positive().optional(),
  handoffType: z.enum(['whatsapp', 'email', 'razorpay', 'cod']).default('whatsapp'),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional()
})

export type CreateOrder = z.infer<typeof createOrderSchema>

export type CalculatedOrder = Omit<CreateOrder, 'items' | 'subtotal' | 'shipping' | 'total'> & {
  userId?: number | null
  items: Array<z.infer<typeof orderItemSchema> & { variantId: number; name: string; price: string; priceNum: number; img?: string }>
  subtotal: number
  shipping: number
  total: number
}

export interface Order extends CreateOrder {
  id: number
  userId?: number | null
  status: string
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
  carrier: string | null
  trackingNumber: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
  adminNotes: Array<{ id: string; text: string; at: string; by: string; internal: boolean }>
  events: Array<{ id: string; status: string; note: string; at: string; by: string }>
  createdAt: Date
  updatedAt: Date
}
