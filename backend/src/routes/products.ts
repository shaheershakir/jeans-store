import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { productStore } from '../store/productStore.js'
import { createProductSchema, updateProductSchema, variantSchema } from '../schemas/product.js'
import {
  generateBaseSku,
  generateProductScopedSku,
  getCategoryCode,
  getProductTypeCode,
  getColorCode,
  getSizeCode
} from '../services/skuService.js'

const SORT_MODES = ['featured', 'price-asc', 'price-desc'] as const

const listQuerySchema = z.object({
  store: z.string().optional(),
  category: z.string().optional(),
  fit: z.string().optional(),
  sku: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  q: z.string().optional(),
  sort: z.enum(SORT_MODES).optional()
})

const skuPreviewSchema = z.object({
  category: z.string().default('printed-tees'),
  productType: z.string().optional(),
  color: z.string().default('Black'),
  size: z.union([z.string(), z.number()]).default('M'),
  productId: z.union([z.string(), z.number()]).optional()
})

const skuBatchGenerateSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  variants: z.array(
    z.object({
      category: z.string().optional(),
      productType: z.string().optional(),
      color: z.string(),
      size: z.union([z.string(), z.number()]),
      sku: z.string().optional()
    })
  )
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
  // ─── SKU PREVIEW & GENERATION ENDPOINTS ─────────────────────────────────────
  app.post('/api/products/sku/preview', async (request, reply) => {
    const parsed = skuPreviewSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid SKU preview parameters',
        details: z.treeifyError(parsed.error)
      })
    }

    const { category, productType, color, size, productId } = parsed.data
    const baseSku = generateBaseSku({ category, productType, color, size, productId })
    const productScopedSku = generateProductScopedSku({ category, productType, color, size, productId })
    const sku = await productStore.generateSku({ category, productType, color, size, productId })

    return reply.send({
      sku,
      baseSku,
      productScopedSku,
      breakdown: {
        categoryCode: getCategoryCode(category),
        productTypeCode: getProductTypeCode(productType),
        colorCode: getColorCode(color),
        sizeCode: getSizeCode(size)
      }
    })
  })

  app.post('/api/products/sku/generate', async (request, reply) => {
    const parsed = skuBatchGenerateSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid batch SKU generate parameters',
        details: z.treeifyError(parsed.error)
      })
    }

    const { productId, variants } = parsed.data
    const generated = await Promise.all(
      variants.map(async (v) => {
        if (v.sku && v.sku.trim().length > 0) {
          return { ...v, sku: v.sku.trim().toUpperCase() }
        }
        const sku = await productStore.generateSku({
          category: v.category || 'printed-tees',
          productType: v.productType,
          color: v.color,
          size: v.size,
          productId
        })
        return { ...v, sku }
      })
    )

    return reply.send({ variants: generated })
  })

  // ─── GET VARIANT BY SKU ─────────────────────────────────────────────────────
  app.get('/api/variants/:sku', async (request, reply) => {
    const { sku } = request.params as { sku: string }
    if (!sku || !sku.trim()) {
      return reply.status(400).send({ error: 'SKU parameter is required' })
    }

    const result = await productStore.getBySku(sku)
    if (!result) {
      return reply.status(404).send({ error: `Variant with SKU "${sku}" not found` })
    }

    return reply.send(result)
  })

  // ─── PRODUCT CATALOG ROUTES ─────────────────────────────────────────────────
  app.get('/api/products', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid query parameters',
        details: z.treeifyError(parsed.error)
      })
    }

    const { store, category, fit, sku, minPrice, maxPrice, q, sort = 'featured' } = parsed.data
    let list = await productStore.list({ store, category, fit, sku, q })

    if (minPrice !== undefined) {
      list = list.filter((p) => p.priceNum >= minPrice)
    }
    if (maxPrice !== undefined) {
      list = list.filter((p) => p.priceNum <= maxPrice)
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

    try {
      const product = await productStore.create(parsed.data)
      void triggerFrontendRevalidation(app, product.store)
      return reply.status(201).send({ product })
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || 'Failed to create product'
      })
    }
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

    try {
      const product = await productStore.update(numericId, parsed.data)
      if (!product) {
        return reply.status(404).send({ error: `Product ${numericId} not found` })
      }
      void triggerFrontendRevalidation(app, product.store)
      return reply.send({ product })
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || 'Failed to update product'
      })
    }
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
