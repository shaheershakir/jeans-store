import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { productStore } from '../store/productStore.js'
import { createProductSchema, updateProductSchema } from '../schemas/product.js'

const SORT_MODES = ['featured', 'price-asc', 'price-desc'] as const

const listQuerySchema = z.object({
  store: z.enum(['jean-store', 'clothing-store', 'all']).optional(),
  category: z.string().optional(),
  fit: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  q: z.string().optional(),
  sort: z.enum(SORT_MODES).optional()
})

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

async function triggerFrontendRevalidation(app: FastifyInstance, store?: string): Promise<void> {
  const revalidateSecret = process.env.REVALIDATION_SECRET
  if (!revalidateSecret) return

  const urls: string[] = []
  const jeanStoreUrl = process.env.JEAN_STORE_URL || process.env.FRONTEND_URL
  const clothingStoreUrl = process.env.CLOTHING_STORE_URL

  if (!store || store === 'jean-store' || store === 'all') {
    if (jeanStoreUrl) urls.push(jeanStoreUrl)
  }
  if (!store || store === 'clothing-store' || store === 'all') {
    if (clothingStoreUrl) urls.push(clothingStoreUrl)
  }

  for (const url of urls) {
    try {
      const res = await fetch(`${url}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': revalidateSecret
        },
        body: JSON.stringify({ tag: 'products' }),
        signal: AbortSignal.timeout(4000)
      })
      if (!res.ok) {
        app.log.warn(`Revalidation for ${url} responded with status ${res.status}`)
      } else {
        app.log.info(`Triggered ISR revalidation successfully for ${url}`)
      }
    } catch (err) {
      app.log.warn({ err }, `Failed to trigger revalidation for ${url} (non-fatal)`)
    }
  }
}

export async function productRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/products', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: z.treeifyError(parsed.error)
      })
    }

    const { store, category, fit, minPrice, maxPrice, q, sort = 'featured' } = parsed.data
    let list = await productStore.list({ store, category })

    if (fit && fit !== 'all') {
      list = list.filter((p) => p.fit?.toLowerCase() === fit.toLowerCase())
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
            (p.fit && p.fit.toLowerCase().includes(clean)) ||
            (p.wash && p.wash.toLowerCase().includes(clean)) ||
            (p.category && p.category.toLowerCase().includes(clean)) ||
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
    const product = await productStore.getById(numericId)
    if (!product) {
      return reply.status(404).send({ error: `Product ${numericId} not found` })
    }
    return reply.send({ product })
  })

  app.post('/api/products', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    const parsed = createProductSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid product payload',
        details: z.treeifyError(parsed.error)
      })
    }
    const product = await productStore.create(parsed.data)
    void triggerFrontendRevalidation(app, product.store)
    return reply.status(201).send({ product })
  })

  app.put('/api/products/:id', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

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
    const product = await productStore.update(numericId, parsed.data)
    if (!product) {
      return reply.status(404).send({ error: `Product ${numericId} not found` })
    }
    void triggerFrontendRevalidation(app, product.store)
    return reply.send({ product })
  })

  app.delete('/api/products/:id', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    const { id } = request.params as { id: string }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId < 0) {
      return reply.status(400).send({ error: 'Product id must be a non-negative integer' })
    }
    const existing = await productStore.getById(numericId)
    const removed = await productStore.remove(numericId)
    if (!removed) {
      return reply.status(404).send({ error: `Product ${numericId} not found` })
    }
    void triggerFrontendRevalidation(app, existing?.store)
    return reply.status(204).send()
  })
}
