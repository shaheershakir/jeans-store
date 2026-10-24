import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { productStore } from '../store/productStore.js'
import { createProductSchema, updateProductSchema } from '../schemas/product.js'
import {
  generateBaseSku,
  generateProductScopedSku,
  getCategoryCode,
  getProductTypeCode,
  getColorCode,
  getSizeCode
} from '../services/skuService.js'
import { verifyAdminAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

const SORT_MODES = ['featured', 'price-asc', 'price-desc'] as const

const productIdSchema = z.string().uuid()

function parseProductId(value: unknown): string | null {
  const str = Array.isArray(value) ? value[0] : typeof value === 'string' ? value : ''
  const parsed = productIdSchema.safeParse(str)
  return parsed.success ? parsed.data : null
}

const listQuerySchema = z.object({
  store: z.string().optional(),
  category: z.string().optional(),
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

async function triggerFrontendRevalidation(store?: string): Promise<void> {
  const revalidateSecret = process.env.REVALIDATION_SECRET
  if (!revalidateSecret) return

  const urls: string[] = []
  const storefrontUrl = process.env.FRONTEND_URL
  const clothingStoreUrl = process.env.CLOTHING_STORE_URL

  if (!store || store === 'teesgarage' || store === 'jean-store' || store === 'all') {
    if (storefrontUrl) urls.push(storefrontUrl)
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
        logger.warn(`Revalidation for ${url} responded with status ${res.status}`)
      } else {
        logger.info(`Triggered ISR revalidation successfully for ${url}`)
      }
    } catch (err) {
      logger.warn({ err }, `Failed to trigger revalidation for ${url} (non-fatal)`)
    }
  }
}

export const productRouter = Router()

productRouter.get('/api/admin/products', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameters', details: z.treeifyError(parsed.error) })
    return
  }
  try {
    const { store, category, sku, q } = parsed.data
    const products = await productStore.list({ store, category, sku, q, includeAllStatuses: true })
    res.json({ count: products.length, products })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch admin product catalog')
    res.status(503).json({ error: 'Product catalog is unavailable.' })
  }
})

productRouter.get('/api/admin/products/:id', verifyAdminAuth, async (req: Request, res: Response) => {
  const productId = parseProductId(req.params.id)
  if (!productId) {
    res.status(400).json({ error: 'Product id must be a UUID' })
    return
  }
  try {
    const product = await productStore.getById(productId)
    if (!product) {
      res.status(404).json({ error: `Product ${productId} not found` })
      return
    }
    res.json({ product })
  } catch (err) {
    logger.error({ err, productId }, 'Failed to fetch admin product')
    res.status(503).json({ error: 'Product catalog is unavailable.' })
  }
})

// ─── SKU PREVIEW & GENERATION ENDPOINTS ─────────────────────────────────────
productRouter.post('/api/products/sku/preview', async (req: Request, res: Response) => {
  const parsed = skuPreviewSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid SKU preview parameters',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  const { category, productType, color, size, productId } = parsed.data
  const baseSku = generateBaseSku({ category, productType, color, size, productId })
  const productScopedSku = generateProductScopedSku({ category, productType, color, size, productId })
  const sku = await productStore.generateSku({ category, productType, color, size, productId })

  res.json({
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

productRouter.post('/api/products/sku/generate', async (req: Request, res: Response) => {
  const parsed = skuBatchGenerateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid batch SKU generate parameters',
      details: z.treeifyError(parsed.error)
    })
    return
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

  res.json({ variants: generated })
})

// ─── GET VARIANT BY SKU ─────────────────────────────────────────────────────
productRouter.get('/api/variants/:sku', async (req: Request, res: Response) => {
  const sku = req.params.sku as string
  if (!sku || !sku.trim()) {
    res.status(400).json({ error: 'SKU parameter is required' })
    return
  }

  const result = await productStore.getBySku(sku)
  if (!result) {
    res.status(404).json({ error: `Variant with SKU "${sku}" not found` })
    return
  }

  res.json(result)
})

productRouter.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await productStore.getValidCategorySlugs()
    res.json({ categories })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch categories')
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// ─── PRODUCT CATALOG ROUTES ─────────────────────────────────────────────────
productRouter.get('/api/products', async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid query parameters',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  const { store, category, sku, minPrice, maxPrice, q, sort = 'featured' } = parsed.data
  let list = await productStore.list({ store, category, sku, q, status: 'active' })

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
    list.sort((a, b) => a.id.localeCompare(b.id))
  }

  res.json({ count: list.length, products: list })
})

productRouter.get('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const productId = parseProductId(id)
  if (!productId) {
    res.status(400).json({ error: 'Product id must be a UUID' })
    return
  }
  const product = await productStore.getById(productId)
  if (!product) {
    res.status(404).json({ error: `Product ${productId} not found` })
    return
  }
  const status = (product.adminData as Record<string, unknown> | undefined)?.status
  if (product.status === 'draft' || product.status === 'archived' || status === 'Draft' || status === 'Archived') {
    res.status(404).json({ error: `Product ${productId} not found` })
    return
  }
  res.json({ product })
})

productRouter.post('/api/products', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid product payload',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  try {
    const product = await productStore.create(parsed.data)
    void triggerFrontendRevalidation(product.store)
    res.status(201).json({ product })
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Failed to create product'
    })
  }
})

productRouter.put('/api/products/:id', verifyAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params
  const productId = parseProductId(id)
  if (!productId) {
    res.status(400).json({ error: 'Product id must be a UUID' })
    return
  }
  const parsed = updateProductSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid product payload',
      details: z.treeifyError(parsed.error)
    })
    return
  }

  try {
    const product = await productStore.update(productId, parsed.data)
    if (!product) {
      res.status(404).json({ error: `Product ${productId} not found` })
      return
    }
    void triggerFrontendRevalidation(product.store)
    res.json({ product })
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Failed to update product'
    })
  }
})

productRouter.delete('/api/products/:id', verifyAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params
  const productId = parseProductId(id)
  if (!productId) {
    res.status(400).json({ error: 'Product id must be a UUID' })
    return
  }
  const existing = await productStore.getById(productId)
  const removed = await productStore.remove(productId)
  if (!removed) {
    res.status(404).json({ error: `Product ${productId} not found` })
    return
  }
  void triggerFrontendRevalidation(existing?.store)
  res.status(204).end()
})

const stockAdjustmentSchema = z.object({
  delta: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0),
  reason: z.string().trim().min(1).max(200),
  reference: z.string().trim().max(200).optional()
})

productRouter.patch('/api/products/variants/:id/stock', verifyAdminAuth, async (req: Request, res: Response) => {
  const variantId = Number(req.params.id)
  const parsed = stockAdjustmentSchema.safeParse(req.body)
  if (!Number.isInteger(variantId) || variantId < 1 || !parsed.success) {
    res.status(400).json({ error: 'Enter a valid stock adjustment and variant.' })
    return
  }
  try {
    const variant = await productStore.adjustStock(variantId, parsed.data.delta)
    res.json({ variant })
  } catch (err) {
    res.status(409).json({ error: err instanceof Error ? err.message : 'Stock adjustment failed.' })
  }
})
