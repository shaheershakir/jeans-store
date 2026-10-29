import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  variantId: z.number().int().positive().nullable().optional(),
  designId: z.number().int().positive().nullable().optional(),
  designName: z.string().optional(),
  name: z.string().optional(),

  size: z.string().min(1),
  price: z.string().optional(),
  priceNum: z.number().nonnegative().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive().max(50),
  weightGrams: z.number().int().nonnegative().optional(),
  img: z.string().optional(),
  lineTotal: z.number().int().nonnegative().optional(),
  discountAmount: z.number().int().nonnegative().optional(),
  variantLabel: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  isFreeSize: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  userId: z.number().int().positive().nullable().optional(),
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
  // Browser values are accepted for compatibility but are always replaced by
  // the server-side pricing calculation before persistence.
  subtotal: z.number().nonnegative().optional(),
  discountTotal: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  weightGrams: z.number().nonnegative().optional(),
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

export type CreateOrder = z.infer<typeof createOrderSchema>;

export type CalculatedOrder = Omit<
  CreateOrder,
  "items" | "subtotal" | "discountTotal" | "shipping" | "total" | "orderNumber"
> & {
  orderNumber: string;
  userId?: number | null;
  items: Array<
    z.infer<typeof orderItemSchema> & {
      variantId: number;
      name: string;
      price: string;
      priceNum: number;
      img?: string;
      lineTotal: number;
      discountAmount: number;
      variantLabel: string;
      isFreeSize: boolean;
    }
  >;
  subtotal: number;
  discountTotal: number;
  shipping: number;
  total: number;
  weightGrams?: number;
};

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

export type CreateRazorpayOrder = z.infer<typeof createRazorpayOrderSchema>;

export interface Order extends Omit<CreateOrder, "orderNumber"> {
  id: number;
  orderNumber: string;
  userId?: number | null;
  status: string;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  adminNotes: Array<{
    id: string;
    text: string;
    at: string;
    by: string;
    internal: boolean;
  }>;
  events: Array<{
    id: string;
    status: string;
    note: string;
    at: string;
    by: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
