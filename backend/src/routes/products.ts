import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { productStore } from '../store/productStore.js'
import { createProductSchema, updateProductSchema } from '../schemas/product.js'

const SORT_MODES = ['featured', 'price-asc', 'price-desc'] as const

const listQuerySchema = z.object({
  fit: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  q: z.string().optional(),
  sort: z.enum(SORT_MODES).optional()
})

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/products', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: z.treeifyError(parsed.error)
      })
    }

    const { fit, minPrice, maxPrice, q, sort = 'featured' } = parsed.data
    let list = productStore.list()

    if (fit && fit !== 'all') {
      list = list.filter((p) => p.fit.toLowerCase() === fit.toLowerCase())
    }
    if (minPrice !== undefined) {
      list = list.filter((p) => p.priceNum >= minPrice)
    }
    if (maxPrice !== undefined) {
      list = list.filter((p) => p.priceNum <= maxPrice)
    }
    if (q) {
      const clean = q.trim().toLowerCase()
      if (clean) {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(clean) ||
            p.fit.toLowerCase().includes(clean) ||
            p.wash.toLowerCase().includes(clean) ||
            p.desc.toLowerCase().includes(clean)
        )
      }
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.priceNum - b.priceNum)
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.priceNum - a.priceNum)
    } else {
      list.sort((a, b) => a.id - b.id)
    }

    return reply.send({ count: list.length, products: list })
  })

  app.get('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId < 0) {
      return reply.status(400).send({ error: 'Product id must be a non-negative integer' })
    }
    const product = productStore.getById(numericId)
    if (!product) {
      return reply.status(404).send({ error: `Product ${numericId} not found` })
    }
    return reply.send({ product })
  })

  app.post('/api/products', async (request, reply) => {
    const parsed = createProductSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid product payload',
        details: z.treeifyError(parsed.error)
      })
    }
    const product = productStore.create(parsed.data)
    return reply.status(201).send({ product })
  })

  app.put('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId < 0) {
      return reply.status(400).send({ error: 'Product id must be a non-negative integer' })
    }
    const parsed = updateProductSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid product payload',
        details: z.treeifyError(parsed.error)
      })
    }
    const product = productStore.update(numericId, parsed.data)
    if (!product) {
      return reply.status(404).send({ error: `Product ${numericId} not found` })
    }
    return reply.send({ product })
  })

  app.delete('/api/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId < 0) {
      return reply.status(400).send({ error: 'Product id must be a non-negative integer' })
    }
    const removed = productStore.remove(numericId)
    if (!removed) {
      return reply.status(404).send({ error: `Product ${numericId} not found` })
    }
    return reply.status(204).send()
  })
}
