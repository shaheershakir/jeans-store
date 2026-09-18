import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { orderStore } from '../store/orderStore.js'
import { createOrderSchema } from '../schemas/order.js'

function verifyAdminAuth(request: FastifyRequest, reply: FastifyReply): boolean {
  const configuredKey = process.env.ADMIN_API_KEY
  if (configuredKey) {
    const keyHeader = request.headers['x-api-key']
    if (!keyHeader || keyHeader !== configuredKey) {
      void reply.status(401).send({ error: 'Unauthorized: Missing or invalid X-API-Key' })
      return false
    }
  }
  return true
}

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  // Public order submission from Storefront
  app.post('/api/orders', async (request, reply) => {
    const parsed = createOrderSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid order payload',
        details: z.treeifyError(parsed.error)
      })
    }

    try {
      const order = await orderStore.create(parsed.data)
      return reply.status(201).send({ order })
    } catch (err) {
      app.log.error({ err }, 'Failed to save order')
      return reply.status(500).send({ error: 'Failed to process order' })
    }
  })

  // Admin: List all captured orders
  app.get('/api/orders', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    try {
      const orders = await orderStore.list()
      return reply.send({ count: orders.length, orders })
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch orders')
      return reply.status(500).send({ error: 'Failed to retrieve orders' })
    }
  })

  // Admin: Get single order by id
  app.get('/api/orders/:id', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    const { id } = request.params as { id: string }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId < 0) {
      return reply.status(400).send({ error: 'Order id must be a non-negative integer' })
    }

    const order = await orderStore.getById(numericId)
    if (!order) {
      return reply.status(404).send({ error: `Order ${numericId} not found` })
    }

    return reply.send({ order })
  })
}
