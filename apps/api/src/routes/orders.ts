import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { orderStore } from '../store/orderStore.js'
import { createOrderSchema } from '../schemas/order.js'
import { verifyAdminAuth } from '../middleware/auth.js'
import { razorpayService } from '../services/razorpay.js'
import { logger } from '../lib/logger.js'

export const orderRouter = Router()

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
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  orderNumber: z.string().min(1),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional()
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
    const { amount, currency, orderNumber, customerName, customerEmail, customerPhone } = parsed.data
    const amountInPaise = Math.round(amount * 100)

    const rzpOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      currency,
      receipt: orderNumber,
      notes: {
        orderNumber,
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
      orderNumber
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
    const paymentNote = `Razorpay Payment ID: ${razorpay_payment_id} | Order ID: ${razorpay_order_id}`
    const finalOrder = await orderStore.create({
      ...order,
      status: 'paid',
      handoffType: 'razorpay',
      paymentMethod: 'razorpay',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      notes: order.notes ? `${order.notes} | ${paymentNote}` : paymentNote
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

  try {
    const order = await orderStore.create(parsed.data)
    res.status(201).json({ order })
  } catch (err) {
    logger.error({ err }, 'Failed to save order')
    res.status(500).json({ error: 'Failed to process order' })
  }
})

// Admin: List all captured orders
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
