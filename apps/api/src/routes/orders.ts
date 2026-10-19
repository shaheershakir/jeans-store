import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { orderStore } from '../store/orderStore.js'
import { createOrderSchema } from '../schemas/order.js'
import { verifyAdminAuth } from '../middleware/auth.js'
import { razorpayService } from '../services/razorpay.js'
import { logger } from '../lib/logger.js'
import { productStore } from '../store/productStore.js'
import { calculateShipping, getShippingRates, getDeliveryEstimation } from '../services/shipping.js'
import { verifyCloudIamToken } from '../services/cloudIam.js'
import { trackServerEvent } from '../services/posthog.js'
import { userStore } from '../store/userStore.js'
import type { CalculatedOrder, CreateOrder } from '../schemas/order.js'

export const orderRouter = Router()

async function getOptionalCustomerClaims(req: Request): Promise<{ email: string } | null | false> {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  if (!authHeader.startsWith('Bearer ')) return false
  const claims = await verifyCloudIamToken(authHeader.slice(7).trim())
  if (!claims?.email) return false
  return { email: claims.email.trim().toLowerCase() }
}

// Public: Get Razorpay configuration
orderRouter.get('/api/orders/razorpay/config', (_req: Request, res: Response) => {
  const keyId = razorpayService.getKeyId()
  res.json({
    enabled: Boolean(keyId),
    keyId: keyId || ''
  })
})

// Public: Create Razorpay checkout order
const createRazorpayOrderSchema = z.object({
  currency: z.string().default('INR'),
  orderNumber: z.string().min(1),
  state: z.string().default(''),
  pincode: z.string().optional(),
  items: z.array(z.object({ id: z.number(), variantId: z.number().int().positive().optional(), size: z.string(), quantity: z.number().int().positive() })).min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional()
})

async function calculateCheckout(
  itemsRequest: CreateOrder['items'],
  state: string,
  pincode?: string
): Promise<Pick<CalculatedOrder, 'items' | 'subtotal' | 'shipping' | 'total'> & { weightGrams: number; deliveryEstimation: ReturnType<typeof getDeliveryEstimation> }> {
  let subtotal = 0
  let weightGrams = 0
  const items: CalculatedOrder['items'] = []

  for (const requested of itemsRequest) {
    const product = await productStore.getById(requested.id)
    if (!product) throw new Error(`Product ${requested.id} is no longer available.`)
    const productStatus = (product.adminData as Record<string, unknown> | undefined)?.status
    if (productStatus && productStatus !== 'Active') throw new Error(`${product.name} is not available for purchase.`)
    const variant = product.variants?.find((candidate) =>
      requested.variantId ? candidate.id === requested.variantId : String(candidate.size) === requested.size
    )
    if (!variant || String(variant.size) !== requested.size || variant.status !== 'Active') {
      throw new Error(`Size ${requested.size} for ${product.name} is no longer available.`)
    }
    if (variant.stock - variant.reserved < requested.quantity) {
      throw new Error(`${product.name} (${requested.size}) does not have enough stock.`)
    }
    const unitPrice = typeof variant.price === 'number' && variant.price > 0 ? variant.price : product.priceNum
    const lineTotal = unitPrice * requested.quantity
    subtotal += lineTotal
    weightGrams += variant.weight * requested.quantity
    items.push({
      id: product.id,
      variantId: variant.id!,
      name: product.name,
      size: String(variant.size),
      price: `₹${unitPrice.toLocaleString('en-IN')}`,
      priceNum: unitPrice,
      sku: variant.sku,
      quantity: requested.quantity,
      weightGrams: variant.weight,
      img: product.img
    })
  }

  const rates = await getShippingRates()
  const shipping = calculateShipping(weightGrams, state, rates, pincode)
  const deliveryEstimation = getDeliveryEstimation(state, rates, pincode)
  return { items, subtotal, shipping, total: subtotal + shipping, weightGrams, deliveryEstimation }
}

async function calculateOrder(input: CreateOrder): Promise<CalculatedOrder> {
  const calculated = await calculateCheckout(input.items, input.state, (input as { pincode?: string }).pincode)
  return { ...input, ...calculated }
}

const quoteSchema = z.object({
  state: z.string().trim().max(100).optional().default(''),
  pincode: z.string().trim().max(10).optional().default(''),
  items: z.array(z.object({
    id: z.number(),
    variantId: z.number().int().positive().optional(),
    size: z.string().min(1),
    quantity: z.number().int().positive().max(50)
  })).min(1)
}).refine((data) => data.state.length > 0 || data.pincode.replace(/\D/g, '').length === 6, {
  message: 'A delivery state or 6-digit PIN code is required.'
})

orderRouter.post('/api/orders/quote', async (req: Request, res: Response) => {
  const parsed = quoteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A delivery state or 6-digit PIN code and valid cart items are required.' })
    return
  }
  try {
    const quote = await calculateCheckout(parsed.data.items, parsed.data.state, parsed.data.pincode)
    res.json({
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      total: quote.total,
      weightGrams: quote.weightGrams,
      deliveryEstimation: quote.deliveryEstimation
    })
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to quote this cart.' })
  }
})

orderRouter.post('/api/orders/razorpay/create-order', async (req: Request, res: Response) => {
  const parsed = createRazorpayOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid Razorpay order request',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  try {
    const { currency, orderNumber, customerName, customerEmail, customerPhone, state, pincode, items } = parsed.data
    const quote = await calculateCheckout(items, state, pincode)
    const amountInPaise = Math.round(quote.total * 100)

    const rzpOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      currency,
      receipt: orderNumber,
      notes: {
        orderNumber,
        shipping: String(quote.shipping),
        weightGrams: String(quote.weightGrams),
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || ''
      }
    })

    res.status(201).json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: razorpayService.getKeyId(),
      orderNumber,
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      total: quote.total
    })
  } catch (err: any) {
    logger.error({ err }, 'Failed to create Razorpay order')
    res.status(500).json({ error: err.message || 'Failed to initiate Razorpay transaction' })
  }
})

// Public: Verify Razorpay payment and commit order
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  order: createOrderSchema
})

orderRouter.post('/api/orders/razorpay/verify', async (req: Request, res: Response) => {
  const parsed = verifyPaymentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid payment verification payload',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order } = parsed.data

  const customer = await getOptionalCustomerClaims(req)
  if (customer === false) {
    res.status(401).json({ error: 'Your customer session is invalid or expired. Please sign in again.' })
    return
  }
  if (customer && customer.email !== order.customerEmail.trim().toLowerCase()) {
    res.status(403).json({ error: 'Checkout email must match the signed-in customer account.' })
    return
  }

  const isValid = razorpayService.verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  })

  if (!isValid) {
    logger.warn({ razorpay_order_id, razorpay_payment_id }, 'Payment signature verification failed')
    res.status(400).json({ error: 'Invalid payment signature. Verification failed.' })
    return
  }

  try {
    const calculatedOrder = await calculateOrder(order)
    const razorpayOrder = await razorpayService.fetchOrder(razorpay_order_id)
    const payment = await razorpayService.fetchPayment(razorpay_payment_id)
    if (
      razorpayOrder.receipt !== order.orderNumber ||
      razorpayOrder.amount !== Math.round(calculatedOrder.total * 100) ||
      razorpayOrder.currency !== 'INR' ||
      payment.order_id !== razorpay_order_id ||
      payment.amount !== razorpayOrder.amount ||
      payment.status !== 'captured'
    ) {
      res.status(400).json({ error: 'Payment amount or status could not be verified.' })
      return
    }
    let userId: number | undefined
    if (customer) {
      const user = await userStore.findByEmail(customer.email)
      if (user) userId = user.id
    }
    const paymentNote = `Razorpay Payment ID: ${razorpay_payment_id} | Order ID: ${razorpay_order_id}`
    const finalOrder = await orderStore.create({
      ...calculatedOrder,
      userId,
      status: 'paid',
      handoffType: 'razorpay',
      paymentMethod: 'razorpay',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      notes: order.notes ? `${order.notes} | ${paymentNote}` : paymentNote
    })

    trackServerEvent(finalOrder.customerEmail || finalOrder.orderNumber, 'order_completed', {
      order_id: finalOrder.id || finalOrder.orderNumber,
      order_number: finalOrder.orderNumber,
      total: Number(finalOrder.total ?? calculatedOrder.total ?? 0),
      subtotal: Number(finalOrder.subtotal ?? calculatedOrder.subtotal ?? 0),
      shipping: Number(finalOrder.shipping ?? calculatedOrder.shipping ?? 0),
      currency: 'INR',
      item_count: finalOrder.items.reduce((sum, item) => sum + item.quantity, 0),
      customer_email: finalOrder.customerEmail,
      payment_method: 'razorpay',
      items: finalOrder.items.map((item) => ({
        product_id: item.id,
        product_name: item.name || `Product #${item.id}`,
        size: item.size,
        price: Number(item.priceNum ?? (parseFloat(item.price || '0') || 0)),
        quantity: item.quantity
      }))
    })

    logger.info({ orderNumber: finalOrder.orderNumber, paymentId: razorpay_payment_id }, 'Order successfully paid and recorded')
    res.status(201).json({
      success: true,
      order: finalOrder,
      paymentId: razorpay_payment_id
    })
  } catch (err: any) {
    logger.error({ err }, 'Failed to save confirmed order')
    res.status(500).json({ error: 'Payment received but failed to commit order' })
  }
})

// Public order submission from Storefront
orderRouter.post('/api/orders', async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid order payload',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  if (parsed.data.handoffType === 'razorpay') {
    res.status(400).json({ error: 'Online payments must be completed through the verified Razorpay checkout.' })
    return
  }

  const customer = await getOptionalCustomerClaims(req)
  if (customer === false) {
    res.status(401).json({ error: 'Your customer session is invalid or expired. Please sign in again.' })
    return
  }
  if (customer && customer.email !== parsed.data.customerEmail.trim().toLowerCase()) {
    res.status(403).json({ error: 'Checkout email must match the signed-in customer account.' })
    return
  }

  let userId: number | undefined
  if (customer) {
    const user = await userStore.findByEmail(customer.email)
    if (user) userId = user.id
  }

  try {
    const calculatedOrder = await calculateOrder(parsed.data)
    const order = await orderStore.create({
      ...calculatedOrder,
      userId
    })

    trackServerEvent(order.customerEmail || order.orderNumber, 'order_completed', {
      order_id: order.id || order.orderNumber,
      order_number: order.orderNumber,
      total: Number(order.total ?? calculatedOrder.total ?? 0),
      subtotal: Number(order.subtotal ?? calculatedOrder.subtotal ?? 0),
      shipping: Number(order.shipping ?? calculatedOrder.shipping ?? 0),
      currency: 'INR',
      item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
      customer_email: order.customerEmail,
      payment_method: order.paymentMethod || 'cod',
      items: order.items.map((item) => ({
        product_id: item.id,
        product_name: item.name || `Product #${item.id}`,
        size: item.size,
        price: Number(item.priceNum ?? (parseFloat(item.price || '0') || 0)),
        quantity: item.quantity
      }))
    })

    res.status(201).json({ order })
  } catch (err) {
    logger.error({ err }, 'Failed to save order')
    res.status(500).json({ error: 'Failed to process order' })
  }
})

// Admin: List all captured orders
orderRouter.get('/api/orders/mine', async (req: Request, res: Response) => {
  const customer = await getOptionalCustomerClaims(req)
  if (!customer) {
    res.status(401).json({ error: 'Sign in to view your order history.' })
    return
  }

  try {
    const user = await userStore.findByEmail(customer.email)
    const orders = user
      ? await orderStore.listByUserId(user.id, customer.email)
      : await orderStore.listByCustomerEmail(customer.email)
    res.json({
      count: orders.length,
      orders: orders.map((order) => ({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        address: order.address,
        apartment: order.apartment,
        city: order.city,
        state: order.state,
        pincode: order.pincode
      }))
    })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch customer order history')
    res.status(503).json({ error: 'Order history is temporarily unavailable.' })
  }
})

orderRouter.get('/api/orders', verifyAdminAuth, async (_req: Request, res: Response) => {
  try {
    const orders = await orderStore.list()
    res.json({ count: orders.length, orders })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch orders')
    res.status(500).json({ error: 'Failed to retrieve orders' })
  }
})

// Admin: Get single order by id
orderRouter.get('/api/orders/:id', verifyAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId < 0) {
    res.status(400).json({ error: 'Order id must be a non-negative integer' })
    return
  }

  const order = await orderStore.getById(numericId)
  if (!order) {
    res.status(404).json({ error: `Order ${numericId} not found` })
    return
  }

  res.json({ order })
})

const adminOrderPatchSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned']).optional(),
  paymentStatus: z.enum(['Pending', 'Paid', 'Failed']).optional(),
  carrier: z.string().trim().min(1).max(100).optional(),
  trackingNumber: z.string().trim().min(1).max(100).optional()
}).refine((value) => Object.values(value).some((field) => field !== undefined), 'At least one update is required.')

const ORDER_TRANSITIONS: Record<string, string[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Delivered', 'Returned'],
  'Out for Delivery': ['Delivered', 'Returned'],
  Delivered: ['Returned'],
  Returned: [],
  Cancelled: []
}

orderRouter.patch('/api/orders/:id', verifyAdminAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Order id must be a positive integer.' })
    return
  }
  const parsed = adminOrderPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a valid order update.' })
    return
  }
  try {
    const current = await orderStore.getById(id)
    if (!current) {
      res.status(404).json({ error: `Order ${id} not found.` })
      return
    }
    const patch = parsed.data
    if (patch.status && patch.status !== current.status && !ORDER_TRANSITIONS[current.status]?.includes(patch.status)) {
      res.status(409).json({ error: `Order cannot move from ${current.status} to ${patch.status}.` })
      return
    }
    if (patch.status === 'Shipped' && (!(patch.carrier || current.carrier) || !(patch.trackingNumber || current.trackingNumber))) {
      res.status(400).json({ error: 'Set a carrier and tracking number before shipping this order.' })
      return
    }
    if (patch.paymentStatus === 'Paid' && current.handoffType !== 'cod') {
      res.status(409).json({ error: 'Online payment status can only be changed by verified payment records.' })
      return
    }
    const author = process.env.ADMIN_NAME || process.env.ADMIN_EMAIL || 'Administrator'
    const order = await orderStore.updateAdmin(id, patch, author)
    res.json({ order })
  } catch (err) {
    logger.error({ err, id }, 'Failed to update order')
    res.status(503).json({ error: 'Order update is unavailable.' })
  }
})

const adminNoteSchema = z.object({ text: z.string().trim().min(1).max(5000) })
orderRouter.post('/api/orders/:id/notes', verifyAdminAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const parsed = adminNoteSchema.safeParse(req.body)
  if (!Number.isInteger(id) || id < 1 || !parsed.success) {
    res.status(400).json({ error: 'Enter a valid order id and note.' })
    return
  }
  try {
    const author = process.env.ADMIN_NAME || process.env.ADMIN_EMAIL || 'Administrator'
    const order = await orderStore.addAdminNote(id, parsed.data.text, author)
    if (!order) {
      res.status(404).json({ error: `Order ${id} not found.` })
      return
    }
    res.status(201).json({ order })
  } catch (err) {
    logger.error({ err, id }, 'Failed to add internal order note')
    res.status(503).json({ error: 'Order note could not be saved.' })
  }
})
