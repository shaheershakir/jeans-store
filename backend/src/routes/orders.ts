import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { orderStore } from '../store/orderStore.js'
import { createOrderSchema } from '../schemas/order.js'
import { verifyAdminAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const orderRouter = Router()

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
