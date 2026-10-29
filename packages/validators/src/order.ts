import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  variantId: z.number().int().positive().nullable().optional(),
  designId: z.number().int().positive().nullable().optional(),
  designName: z.string().optional(),
  name: z.string(),
  size: z.string(),
  price: z.string(),
  priceNum: z.number(),
  sku: z.string().optional(),
  quantity: z.number().int().positive().max(50),
  weightGrams: z.number().int().nonnegative().optional(),
  img: z.string().optional(),
  lineTotal: z.number().int().nonnegative().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
  variantLabel: z.string().optional(),
});

export const createOrderSchema = z.object({
  orderNumber: z.string().min(1).optional(),
  store: z.string().default("teesgarage"),
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email(),
  address: z.string().min(1),
  apartment: z.string().optional(),
  landmark: z.string().max(255).optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(5),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  discountTotal: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative(),
  total: z.number().nonnegative(),
  weightGrams: z.number().int().nonnegative().optional(),
  couponCode: z.string().trim().min(1).max(60).optional(),
  handoffType: z
    .enum(["whatsapp", "email", "razorpay", "cod"])
    .default("whatsapp"),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export const createRazorpayOrderItemSchema = z.object({
  id: z.string().uuid(),
  variantId: z.number().int().positive().nullable().optional(),
  designId: z.number().int().positive().nullable().optional(),
  size: z.string().min(1),
  quantity: z.number().int().positive().max(50),
});

export const createRazorpayOrderSchema = z.object({
  currency: z.string().default("INR"),
  orderNumber: z.string().min(1).optional(),
  state: z.string().default(""),
  pincode: z.string().optional(),
  items: z.array(createRazorpayOrderItemSchema).min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  couponCode: z.string().trim().min(1).max(60).optional(),
});

export type OrderItemSchemaType = z.infer<typeof orderItemSchema>;
export type CreateOrderSchemaType = z.infer<typeof createOrderSchema>;
export type CreateRazorpayOrderSchemaType = z.infer<typeof createRazorpayOrderSchema>;
