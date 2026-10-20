import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import {
  CATEGORIES,
  type Category,
  type CreateProduct,
  type Fit,
  type Product,
  type StoreType,
  type UpdateProduct,
  type Variant
} from '../schemas/product.js'
import { PRODUCTS } from '../data/products.js'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  categories as categoriesTable,
  products as productsTable,
  productVariants as productVariantsTable,
  productImages as productImagesTable,
  type DbCategory,
  type DbProduct,
  type DbProductVariant,
  type DbProductImage
} from '@jeans-store/db'
import {
  generateBaseSku,
  generateProductScopedSku,
  type SkuComponents
} from '../services/skuService.js'
import { assetUrl, keyFromUrl } from '@jeans-store/shared'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80'

export const INITIAL_CATEGORIES = [
  { id: 1, slug: 'stripes', name: 'Stripes', sortOrder: 1, isActive: true },
  { id: 2, slug: 'fullsleeve', name: 'Fullsleeve', sortOrder: 2, isActive: true },
  { id: 3, slug: 'drsleeve', name: 'Drsleeve', sortOrder: 3, isActive: true },
  { id: 4, slug: 'printed-tees', name: 'Printed Tees', sortOrder: 4, isActive: true },
  { id: 5, slug: 'ringer-tees', name: 'Ringer Tees', sortOrder: 5, isActive: true },
  { id: 6, slug: 'henley', name: 'Henley', sortOrder: 6, isActive: true },
  { id: 7, slug: 'trackpants', name: 'Trackpants', sortOrder: 7, isActive: true },
  { id: 8, slug: 'sweatpants', name: 'Sweatpants', sortOrder: 8, isActive: true },
  { id: 9, slug: 't-shirts', name: 'T-Shirts', sortOrder: 9, isActive: true },
  { id: 10, slug: 'shirts', name: 'Shirts', sortOrder: 10, isActive: true },
  { id: 11, slug: 'hoodies', name: 'Hoodies', sortOrder: 11, isActive: true },
  { id: 12, slug: 'accessories', name: 'Accessories', sortOrder: 12, isActive: true },
  { id: 13, slug: 'jeans', name: 'Jeans', sortOrder: 13, isActive: true }
]

export const ATTRIBUTE_SPEC_KEYS = [
  'fabric',
  'material',
  'sleeveLength',
  'neckType',
  'pattern',
  'printStyle',
  'trimColor',
  'buttons',
  'waistSize',
  'length',
  'closure',
  'pockets',
  'use',
  'legStyle',
  'rise',
  'collection'
] as const

export function extractAttributes(input: Record<string, any>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...(typeof input.attributes === 'object' && input.attributes !== null ? input.attributes : {})
  }
  for (const key of ATTRIBUTE_SPEC_KEYS) {
    if (input[key] !== undefined && input[key] !== null) {
      result[key] = input[key]
    } else if (
      input.adminData &&
      typeof input.adminData === 'object' &&
      input.adminData[key] !== undefined &&
      input.adminData[key] !== null
    ) {
      result[key] = input.adminData[key]
    }
  }
  return result
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface NormalizedImage {
  storageKey: string | null
  externalUrl: string | null
  position: number
}

export function normalizeImageInputs(img: string, img2: string, images?: string[]): NormalizedImage[] {
  const allUrls: string[] = []
  if (img) allUrls.push(img)
  if (img2 && img2 !== img) allUrls.push(img2)
  if (Array.isArray(images)) {
    for (const u of images) {
      if (u && !allUrls.includes(u)) {
        allUrls.push(u)
      }
    }
  }

  const result: NormalizedImage[] = []
  for (let i = 0; i < allUrls.length; i++) {
    const rawUrl = allUrls[i].trim()
    if (!rawUrl) continue
    if (rawUrl.startsWith('data:')) {
      throw new Error('Base64 data: URLs are not allowed for product images. Please upload images.')
    }
    const key = keyFromUrl(rawUrl)
    if (key) {
      result.push({ storageKey: key, externalUrl: null, position: i })
    } else {
      if (!/^https:\/\//i.test(rawUrl)) {
        throw new Error(`Product image URL must be a valid HTTPS URL: ${rawUrl}`)
      }
      result.push({ storageKey: null, externalUrl: rawUrl, position: i })
    }
  }
  return result
}

function normalizeStatus(value?: string | null): 'draft' | 'active' | 'archived' {
  const raw = String(value ?? 'active').toLowerCase()
  return raw === 'archived' ? 'archived' : raw === 'draft' ? 'draft' : 'active'
}

function adminStatus(status: 'draft' | 'active' | 'archived'): 'Draft' | 'Active' | 'Archived' {
  return status === 'archived' ? 'Archived' : status === 'draft' ? 'Draft' : 'Active'
}

function imageUrls(
  images: Array<{ storageKey: string | null; externalUrl: string | null; position: number }>
): string[] {
  return [...images]
    .sort((a, b) => a.position - b.position)
    .map((image) => (image.storageKey ? assetUrl(image.storageKey) : image.externalUrl))
    .filter((url): url is string => Boolean(url))
}

function variantFromRow(row: DbProductVariant, product?: DbProduct): Variant {
  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    size: row.size,
    color: row.color,
    price: row.price ?? product?.price,
    stock: row.stock,
    reserved: row.reserved,
    reorderPoint: row.reorderPoint,
    weight: row.weightGrams ?? product?.weightGrams ?? 350,
    barcode: row.barcode ?? undefined,
    status: (row.status as 'Active' | 'Inactive') || 'Active'
  }
}

function attributesFromRow(row: DbProduct): Record<string, unknown> {
  const entries: Record<string, unknown> = {
    careInstructions: row.careInstructions
  }
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== null && value !== undefined))
}

export function toProduct(
  row: DbProduct,
  categorySlug: string,
  variants: Variant[] = [],
  images: Array<{ storageKey: string | null; externalUrl: string | null; position: number }> = []
): Product {
  const urls = imageUrls(images)
  const attributes = attributesFromRow(row)
  const firstVariant = variants[0]
  const adminData: Record<string, unknown> = {
    status: adminStatus(normalizeStatus(row.status)),
    collectionId: row.collectionId,
    weightGrams: row.weightGrams,
    isFeatured: row.isFeatured,
    isFreeSize: row.isFreeSize,
    compareAtPrice: row.compareAtPrice,
    costPrice: row.costPrice,
    taxRate: row.taxRate,
    hsnCode: row.hsnCode,
    ratingAverage: row.ratingAverage,
    reviewCount: row.reviewCount
  }

  return {
    id: row.id,
    store: 'teesgarage' as StoreType,
    category: categorySlug as Category,
    categoryId: row.categoryId,
    slug: row.slug,
    status: normalizeStatus(row.status),
    attributes,
    name: row.name,
    sku: firstVariant?.sku,
    price: `₹${row.price.toLocaleString('en-IN')}`,
    priceNum: row.price,
    weightGrams: row.weightGrams,
    compareAtPrice: row.compareAtPrice,
    costPrice: row.costPrice,
    taxRate: row.taxRate,
    hsnCode: row.hsnCode ?? undefined,
    isFeatured: row.isFeatured,
    isFreeSize: row.isFreeSize,
    careInstructions: row.careInstructions ?? undefined,
    img: urls[0] ?? FALLBACK_IMAGE,
    img2: urls[1] ?? urls[0] ?? FALLBACK_IMAGE,
    images: urls.length > 0 ? urls : undefined,
    badge: row.badge ?? undefined,
    desc: row.description,
    color: firstVariant?.color,
    sizes: variants.length > 0 ? [...new Set(variants.map((variant) => String(variant.size)))] : undefined,
    rating: row.ratingAverage,
    inStock: variants.some((variant) => variant.stock - variant.reserved > 0),
    adminData,
    variants: variants.length > 0 ? variants : undefined,
    createdAt: row.createdAt
  }
}

interface RawVariantInput {
  id?: number
  productId?: number
  size: string | number
  color?: string
  sku?: string
  price?: number
  stock?: number
  reserved?: number
  reorderPoint?: number
  weight?: number
  barcode?: string
  status?: 'Active' | 'Inactive'
}

interface ReadyVariant {
  id?: number
  productId: number
  sku: string
  size: string
  color: string
  price: number
  stock: number
  reserved: number
  reorderPoint: number
  weight: number
  barcode: string
  status: 'Active' | 'Inactive'
}

/**
 * Product store backed by PostgreSQL via Drizzle ORM,
 * with an in-memory fallback when DATABASE_URL is not provided (e.g. CI / offline dev).
 */
export class ProductStore {
  private memoryProducts: Product[]
  private memoryVariants: Variant[]
  private memoryProductImages: DbProductImage[]
  private nextMemoryProductId: number
  private memoryClaimedSkus = new Map<string, number>()
  private createLock: Promise<void> = Promise.resolve()

  constructor(seed: Product[]) {
    this.memoryVariants = []
    this.memoryProductImages = []
    let variantCounter = 1

    this.memoryProducts = seed.map((product) => {
      const p = { ...product }
      const rawSizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL']
      const color = p.color || 'Black'

      const attributes = extractAttributes(p)
      const status = normalizeStatus(
        p.status || ((p.adminData as any)?.status ? String((p.adminData as any).status) : 'active')
      )
      p.status = status
      p.attributes = attributes
      p.slug = p.slug || `${slugify(p.name)}-${p.id}`
      const cat = INITIAL_CATEGORIES.find((c) => c.slug === p.category?.toLowerCase())
      p.categoryId = cat?.id ?? 1

      if (p.img) {
        try {
          const norm = normalizeImageInputs(p.img, p.img2 || p.img, p.images)
          for (const img of norm) {
            this.memoryProductImages.push({
              id: this.memoryProductImages.length + 1,
              productId: p.id,
              color: null,
              storageKey: img.storageKey,
              externalUrl: img.externalUrl,
              position: img.position,
              createdAt: new Date()
            })
          }
        } catch {
          // Ignore invalid seed images in tests/mock
        }
      }

      const variants: Variant[] =
        p.variants && p.variants.length > 0
          ? p.variants.map((v) => ({ ...v, productId: p.id }))
          : rawSizes.map((sz) => {
              const sku = generateBaseSku({
                category: p.category || 'printed-tees',
                productType: 'Regular',
                color,
                size: sz
              })
              return {
                id: variantCounter++,
                productId: p.id,
                sku,
                size: sz,
                color,
                price: p.priceNum,
                stock: 20,
                reserved: 0,
                reorderPoint: 5,
                weight: p.weightGrams ?? 350,
                barcode: String(8900000000000 + (p.id + 1) * 1000 + variantCounter),
                status: 'Active' as const
              }
            })

      this.memoryVariants.push(...variants)
      return { ...p, variants }
    })

    this.nextMemoryProductId = Math.max(...this.memoryProducts.map((p) => p.id), 0)
    for (const v of this.memoryVariants) {
      if (v.sku && v.productId !== undefined) {
        this.memoryClaimedSkus.set(v.sku.toUpperCase(), v.productId)
      }
    }
  }

  private hydrateMemory(product: Product): Product {
    const variants = this.memoryVariants.filter((variant) => variant.productId === product.id)
    const urls = imageUrls(this.memoryProductImages.filter((image) => image.productId === product.id))
    return {
      ...product,
      img: urls[0] ?? product.img ?? FALLBACK_IMAGE,
      img2: urls[1] ?? product.img2 ?? urls[0] ?? product.img ?? FALLBACK_IMAGE,
      images: urls.length > 0 ? urls : product.images,
      sizes: variants.length > 0 ? [...new Set(variants.map((variant) => String(variant.size)))] : product.sizes,
      variants
    }
  }

  private async hydrateDbRows(rows: DbProduct[]): Promise<Product[]> {
    if (rows.length === 0) return []
    const productIds = rows.map((row) => row.id)
    const categoryIds = [...new Set(rows.map((row) => row.categoryId))]

    const [categoryRows, variantRows, imageRows] = await Promise.all([
      db!.select().from(categoriesTable).where(inArray(categoriesTable.id, categoryIds)),
      db!.select().from(productVariantsTable).where(inArray(productVariantsTable.productId, productIds)),
      db!.select().from(productImagesTable).where(inArray(productImagesTable.productId, productIds))
    ])

    const categoryMap = new Map<number, string>(categoryRows.map((category) => [category.id, category.slug]))
    const variantMap = new Map<number, Variant[]>()
    for (const row of variantRows) {
      const list = variantMap.get(row.productId) ?? []
      list.push(variantFromRow(row, rows.find((product) => product.id === row.productId)))
      variantMap.set(row.productId, list)
    }
    const imageMap = new Map<number, DbProductImage[]>()
    for (const image of imageRows) {
      const list = imageMap.get(image.productId) ?? []
      list.push(image)
      imageMap.set(image.productId, list)
    }

    return rows.map((row) =>
      toProduct(
        row,
        categoryMap.get(row.categoryId) ?? 'printed-tees',
        variantMap.get(row.id) ?? [],
        imageMap.get(row.id) ?? []
      )
    )
  }

  async resolveCategory(slug?: string): Promise<{ id: number; slug: string; name: string } | null> {
    if (!slug) return null
    const cleanSlug = slug.trim().toLowerCase()
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, cleanSlug))
      if (row) return { id: row.id, slug: row.slug, name: row.name }
      return null
    }
    const found = INITIAL_CATEGORIES.find((c) => c.slug === cleanSlug)
    if (found) return { id: found.id, slug: found.slug, name: found.name }
    return null
  }

  async getValidCategorySlugs(): Promise<string[]> {
    if (isDatabaseConfigured() && db) {
      const rows = await db.select({ slug: categoriesTable.slug }).from(categoriesTable)
      if (rows.length > 0) return rows.map((r) => r.slug)
    }
    return INITIAL_CATEGORIES.map((c) => c.slug)
  }

  async generateUniqueSlug(name: string, requestedSlug?: string, currentProductId?: number): Promise<string> {
    const base = slugify(requestedSlug || name) || 'product'
    let candidate = base
    let counter = 1

    while (true) {
      let exists = false
      if (isDatabaseConfigured() && db) {
        const rows = await db
          .select({ id: productsTable.id })
          .from(productsTable)
          .where(eq(productsTable.slug, candidate))
        exists = rows.some((r) => currentProductId === undefined || r.id !== currentProductId)
      } else {
        exists = this.memoryProducts.some(
          (p) => (p as any).slug === candidate && (currentProductId === undefined || p.id !== currentProductId)
        )
      }

      if (!exists) return candidate
      counter++
      candidate = `${base}-${counter}`
    }
  }

  async isSkuClaimedByOtherProduct(sku: string, currentProductId?: number): Promise<boolean> {
    const cleanSku = sku.trim().toUpperCase()
    if (isDatabaseConfigured() && db) {
      const rows = await db
        .select({ id: productVariantsTable.id, productId: productVariantsTable.productId })
        .from(productVariantsTable)
        .where(eq(productVariantsTable.sku, cleanSku))

      if (rows.length === 0) return false
      return rows.some((r) => currentProductId === undefined || r.productId !== currentProductId)
    }

    const ownerProductId = this.memoryClaimedSkus.get(cleanSku)
    if (ownerProductId === undefined) {
      const found = this.memoryVariants.find((v) => Boolean(v.sku && v.sku.toUpperCase() === cleanSku))
      if (!found) return false
      return currentProductId === undefined || found.productId !== currentProductId
    }
    return currentProductId === undefined || ownerProductId !== currentProductId
  }

  async generateSku(components: SkuComponents, reservedSkus: string[] = []): Promise<string> {
    const baseSku = generateBaseSku(components)
    const reserved = new Set(reservedSkus.map((sku) => sku.toUpperCase()))
    const isTaken = async (sku: string) => reserved.has(sku.toUpperCase()) || this.isSkuClaimedByOtherProduct(sku)
    const claimed = await isTaken(baseSku)
    if (!claimed) return baseSku

    const scopedSku = generateProductScopedSku(components)
    if (!(await isTaken(scopedSku))) return scopedSku

    for (let suffix = 2; ; suffix++) {
      const candidate = `${scopedSku}-${suffix}`
      if (!(await isTaken(candidate))) return candidate
    }
  }

  async list(filters?: {
    store?: string
    category?: string
    sku?: string
    q?: string
    status?: string
    includeAllStatuses?: boolean
  }): Promise<Product[]> {
    let list: Product[]

    if (isDatabaseConfigured() && db) {
      const conditions: ReturnType<typeof eq>[] = []

      if (filters?.category && filters.category !== 'all') {
        const category = await this.resolveCategory(filters.category)
        if (!category) return []
        conditions.push(eq(productsTable.categoryId, category.id))
      }
      if (filters?.status) {
        conditions.push(eq(productsTable.status, filters.status.toLowerCase()) as any)
      } else if (!filters?.includeAllStatuses) {
        conditions.push(eq(productsTable.status, 'active') as any)
      }
      if (filters?.q && filters.q.trim()) {
        const term = `%${filters.q.trim()}%`
        conditions.push(
          or(
            ilike(productsTable.name, term),
            ilike(productsTable.description, term),
            ilike(productsTable.badge, term)
          ) as any
        )
      }
      if (filters?.sku && filters.sku.trim()) {
        const cleanSku = filters.sku.trim()
        const matchingVariants = await db
          .select({ productId: productVariantsTable.productId })
          .from(productVariantsTable)
          .where(ilike(productVariantsTable.sku, cleanSku))
        const variantProductIds = matchingVariants.map((v) => v.productId)
        conditions.push(
          (variantProductIds.length > 0 ? inArray(productsTable.id, variantProductIds) : sql`1=0`) as any
        )
      }

      const query = db.select().from(productsTable)
      const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query
      list = await this.hydrateDbRows(rows)
    } else {
      if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
      list = this.memoryProducts.map((product) => this.hydrateMemory(product))
    }

    if (filters?.store && filters.store !== 'all') {
      list = list.filter((p) => p.store === filters.store)
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === filters.category!.toLowerCase())
    }
    if (filters?.status) {
      list = list.filter((p) => (p.status || 'active').toLowerCase() === filters.status!.toLowerCase())
    } else if (!filters?.includeAllStatuses) {
      list = list.filter((p) => (p.status || 'active').toLowerCase() === 'active')
    }
    if (filters?.sku) {
      const cleanSku = filters.sku.trim().toLowerCase()
      list = list.filter(
        (p) =>
          (p.sku && p.sku.toLowerCase() === cleanSku) ||
          p.variants?.some((v) => Boolean(v.sku && v.sku.toLowerCase() === cleanSku))
      )
    }
    if (filters?.q) {
      const clean = filters.q.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(clean) ||
          (p.category && p.category.toLowerCase().includes(clean)) ||
          p.desc.toLowerCase().includes(clean) ||
          (p.sku && p.sku.toLowerCase().includes(clean)) ||
          p.variants?.some((v) => Boolean(v.sku && v.sku.toLowerCase().includes(clean)))
      )
    }

    return list
  }

  async getBySlug(slug: string): Promise<Product | undefined> {
    const cleanSlug = slug.trim().toLowerCase()
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(productsTable).where(eq(productsTable.slug, cleanSlug))
      if (!row) return undefined
      return (await this.hydrateDbRows([row]))[0]
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
    const product = this.memoryProducts.find((p) => (p as any).slug === cleanSlug)
    return product ? this.hydrateMemory(product) : undefined
  }

  async getById(id: number): Promise<Product | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id))
      if (!row) return undefined
      return (await this.hydrateDbRows([row]))[0]
    }
    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
    const found = this.memoryProducts.find((p) => p.id === id)
    return found ? this.hydrateMemory(found) : undefined
  }

  async adjustStock(variantId: number, delta: number): Promise<Variant> {
    if (isDatabaseConfigured() && db) {
      const [target] = await db
        .select({ productId: productVariantsTable.productId, isFreeSize: productsTable.isFreeSize })
        .from(productVariantsTable)
        .innerJoin(productsTable, eq(productsTable.id, productVariantsTable.productId))
        .where(eq(productVariantsTable.id, variantId))
      if (!target) throw new Error('Variant not found.')

      if (target.isFreeSize) {
        const rows = await db.transaction(async (tx) => {
          const updated = await tx
            .update(productVariantsTable)
            .set({ stock: sql`${productVariantsTable.stock} + ${delta}`, updatedAt: new Date() })
            .where(
              and(
                eq(productVariantsTable.productId, target.productId),
                sql`${productVariantsTable.stock} + ${delta} >= ${productVariantsTable.reserved}`
              )
            )
            .returning()
          const existing = await tx
            .select({ id: productVariantsTable.id })
            .from(productVariantsTable)
            .where(eq(productVariantsTable.productId, target.productId))
          if (updated.length !== existing.length) {
            throw new Error('Shared stock adjustment would reduce stock below reserved units.')
          }
          return updated
        })
        const updatedTarget = rows.find((row) => row.id === variantId)
        if (!updatedTarget) throw new Error('Variant not found.')
        return variantFromRow(updatedTarget)
      }

      const [row] = await db
        .update(productVariantsTable)
        .set({ stock: sql`${productVariantsTable.stock} + ${delta}`, updatedAt: new Date() })
        .where(
          and(
            eq(productVariantsTable.id, variantId),
            sql`${productVariantsTable.stock} + ${delta} >= ${productVariantsTable.reserved}`
          )
        )
        .returning()
      if (!row) throw new Error('Variant not found or adjustment would reduce stock below reserved units.')
      return variantFromRow(row)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
    const variant = this.memoryVariants.find((item) => item.id === variantId)
    if (!variant) throw new Error('Variant not found.')
    const product = this.memoryProducts.find((item) => item.id === variant.productId)
    if (product?.isFreeSize) {
      const variants = this.memoryVariants.filter((item) => item.productId === product.id)
      if (variants.some((item) => item.stock + delta < item.reserved)) {
        throw new Error('Shared stock adjustment would reduce stock below reserved units.')
      }
      for (const item of variants) item.stock += delta
      return { ...variant }
    }
    if (variant.stock + delta < variant.reserved) throw new Error('Adjustment would reduce stock below reserved units.')
    variant.stock += delta
    return { ...variant }
  }

  async getBySku(sku: string): Promise<{ product: Product; variant: Variant } | undefined> {
    const cleanSku = sku.trim().toUpperCase()
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.sku, cleanSku))
      if (!row) return undefined
      const product = await this.getById(row.productId)
      if (!product) return undefined
      return { product, variant: product.variants?.find((variant) => variant.id === row.id) ?? variantFromRow(row) }
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
    const variant = this.memoryVariants.find((v) => Boolean(v.sku && v.sku.toUpperCase() === cleanSku))
    if (!variant) return undefined
    const product = this.memoryProducts.find((p) => p.id === variant.productId)
    if (!product) return undefined
    return { product: this.hydrateMemory(product), variant }
  }

  async create(input: CreateProduct): Promise<Product> {
    const currentLock = this.createLock
    let releaseLock: () => void
    this.createLock = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    try {
      await currentLock
      return await this._doCreate(input)
    } finally {
      releaseLock!()
    }
  }

  private productWeightFor(input: CreateProduct, categorySlug: string): number {
    const adminData = (input.adminData ?? {}) as Record<string, unknown>
    const candidate = input.weightGrams ?? Number(adminData.weightGrams ?? NaN)
    if (Number.isFinite(candidate) && candidate > 0) return Math.round(candidate)
    return categorySlug === 'trackpants' || categorySlug === 'sweatpants' || categorySlug === 'jeans' ? 650 : 350
  }

  private productColumns(input: CreateProduct, _attributes: Record<string, unknown>, weightGrams: number) {
    const adminData = (input.adminData ?? {}) as Record<string, any>
    return {
      ...(input.collectionId !== undefined ? { collectionId: input.collectionId } : {}),
      price: input.priceNum,
      compareAtPrice: input.compareAtPrice ?? adminData.compareAtPrice ?? null,
      costPrice: input.costPrice ?? adminData.costPrice ?? null,
      taxRate: input.taxRate ?? adminData.taxRate ?? 0,
      hsnCode: input.hsnCode ?? adminData.hsnCode ?? null,
      badge: input.badge ?? null,
      isFeatured: input.isFeatured ?? Boolean(adminData.featured) ?? false,
      isFreeSize: input.isFreeSize ?? Boolean(adminData.isFreeSize),
      weightGrams,
      careInstructions: input.careInstructions ?? (adminData.careInstructions as string) ?? null
    }
  }

  private async _doCreate(input: CreateProduct): Promise<Product> {
    const normalizedImages = normalizeImageInputs(input.img, input.img2, input.images)

    const rawCategory = input.category || 'printed-tees'
    const resolvedCat = await this.resolveCategory(rawCategory)
    if (!resolvedCat) {
      const valid = await this.getValidCategorySlugs()
      throw new Error(`Unknown category "${rawCategory}". Valid categories are: ${valid.join(', ')}`)
    }
    const categoryId = resolvedCat.id

    const attributes = extractAttributes(input as any)
    const status = normalizeStatus(input.status ?? (input.adminData as any)?.status)
    const slug = await this.generateUniqueSlug(input.name, input.slug)
    const weightGrams = this.productWeightFor(input, rawCategory)

    const rawVariants: RawVariantInput[] =
      input.variants && input.variants.length > 0
        ? (input.variants as RawVariantInput[])
        : (input.sizes || ['S', 'M', 'L', 'XL']).map((sz) => ({
            size: sz,
            color: input.color || 'Black',
            price: input.priceNum,
            stock: 20,
            reserved: 0,
            reorderPoint: 5,
            weight: weightGrams,
            status: 'Active' as const
          }))

    const newProductId = isDatabaseConfigured() && db
      ? (
          await db
            .insert(productsTable)
            .values({
              categoryId,
              slug,
              name: input.name,
              description: input.desc,
              status,
              ...this.productColumns(input, attributes, weightGrams)
            })
            .returning({ id: productsTable.id })
        )[0].id
      : ++this.nextMemoryProductId

    try {
      const variantsToInsert = await this.prepareVariants(rawVariants, input, newProductId, weightGrams)

      if (isDatabaseConfigured() && db) {
        for (const norm of normalizedImages) {
          await db.insert(productImagesTable).values({
            productId: newProductId,
            storageKey: norm.storageKey,
            externalUrl: norm.externalUrl,
            position: norm.position
          })
        }

        for (const variant of variantsToInsert) {
          const [row] = await db
            .insert(productVariantsTable)
            .values({
              productId: newProductId,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              price: variant.price !== input.priceNum ? variant.price : null,
              stock: variant.stock,
              reserved: variant.reserved,
              reorderPoint: variant.reorderPoint,
              weightGrams: variant.weight !== weightGrams ? variant.weight : null,
              barcode: variant.barcode || null,
              status: variant.status
            })
            .returning()
          if (row && row.sku) this.memoryClaimedSkus.set(row.sku.toUpperCase(), newProductId)
        }

        return (await this.getById(newProductId))!
      }

      for (const norm of normalizedImages) {
        this.memoryProductImages.push({
          id: this.memoryProductImages.length + 1,
          productId: newProductId,
          color: null,
          storageKey: norm.storageKey,
          externalUrl: norm.externalUrl,
          position: norm.position,
          createdAt: new Date()
        })
      }

      const createdProduct: Product = {
        ...input,
        id: newProductId,
        isFreeSize: input.isFreeSize ?? false,
        category: rawCategory as Category,
        categoryId,
        slug,
        status,
        attributes,
        weightGrams,
        adminData: { ...(input.adminData ?? {}), status: adminStatus(status) },
        createdAt: new Date(),
        variants: variantsToInsert.map((variant) => ({ ...variant }))
      }
      this.memoryProducts.push(createdProduct)
      this.memoryVariants.push(...createdProduct.variants!)
      return this.hydrateMemory(createdProduct)
    } catch (error) {
      if (isDatabaseConfigured() && db) {
        await db.delete(productsTable).where(eq(productsTable.id, newProductId)).catch(() => {})
      }
      throw error
    }
  }

  private async prepareVariants(
    rawVariants: RawVariantInput[],
    input: CreateProduct,
    productId: number,
    productWeight: number
  ): Promise<ReadyVariant[]> {
    const seenCombos = new Set<string>()
    const variantsToInsert: ReadyVariant[] = []
    const sharedStock = input.isFreeSize ? rawVariants[0]?.stock ?? 20 : undefined

    for (const variant of rawVariants) {
      const color = String(variant.color || 'Black').trim()
      const size = String(variant.size || 'M').trim()
      const comboKey = `${color.toLowerCase()}__${size.toUpperCase()}`
      if (seenCombos.has(comboKey)) {
        throw new Error(
          `Duplicate variant: a variant with color "${color}" and size "${size}" already exists for this product.`
        )
      }
      seenCombos.add(comboKey)

      // The API owns SKU assignment so every new variant follows the same
      // collision rules, regardless of which admin client created it.
      const sku = await this.generateSku({
        category: input.category || 'printed-tees',
        productType: (input as any).fit || (input as any).productType || 'Regular',
        color,
        size,
        productId
      }, variantsToInsert.map((item) => item.sku))

      if (!isDatabaseConfigured() || !db) {
        this.memoryClaimedSkus.set(sku, productId)
      }

      variantsToInsert.push({
        id: variant.id,
        productId,
        sku,
        size,
        color,
        price: variant.price ?? input.priceNum,
        stock: sharedStock ?? variant.stock ?? 20,
        reserved: variant.reserved ?? 0,
        reorderPoint: variant.reorderPoint ?? 5,
        weight: variant.weight ?? productWeight,
        barcode:
          variant.barcode ||
          String(8900000000000 + productId * 1000 + variantsToInsert.length),
        status: variant.status || 'Active'
      })
    }

    return variantsToInsert
  }

  async update(id: number, patch: UpdateProduct): Promise<Product | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined

    let categoryId = existing.categoryId
    if (patch.category !== undefined) {
      const resolvedCat = await this.resolveCategory(patch.category)
      if (!resolvedCat) {
        const valid = await this.getValidCategorySlugs()
        throw new Error(`Unknown category "${patch.category}". Valid categories are: ${valid.join(', ')}`)
      }
      categoryId = resolvedCat.id
    }

    const hasAttributeUpdate =
      patch.attributes !== undefined || ATTRIBUTE_SPEC_KEYS.some((key) => (patch as any)[key] !== undefined)
    let attributes = (existing.attributes as Record<string, unknown>) || {}
    if (hasAttributeUpdate) {
      attributes = { ...attributes, ...extractAttributes(patch as any) }
    }

    let status = normalizeStatus(existing.status)
    if (patch.status !== undefined) {
      status = normalizeStatus(patch.status)
    } else if (patch.adminData?.status !== undefined) {
      status = normalizeStatus(String(patch.adminData.status))
    }

    let slug = existing.slug
    if (patch.slug !== undefined) {
      slug = await this.generateUniqueSlug(patch.name || existing.name, patch.slug, id)
    }

    const hasImagePatch = patch.img !== undefined || patch.img2 !== undefined || patch.images !== undefined
    const normalizedImages = hasImagePatch
      ? normalizeImageInputs(
          patch.img !== undefined ? patch.img : existing.img,
          patch.img2 !== undefined ? patch.img2 : existing.img2,
          patch.images !== undefined ? patch.images : existing.images
        )
      : []

    if (patch.variants !== undefined) {
      const seenCombos = new Set<string>()
      for (const variant of patch.variants) {
        const comboKey = `${String(variant.color).toLowerCase()}__${String(variant.size).toUpperCase()}`
        if (seenCombos.has(comboKey)) {
          throw new Error(
            `Duplicate variant: color "${variant.color}" and size "${variant.size}" already exists for this product.`
          )
        }
        seenCombos.add(comboKey)
      }
    }

    if (isDatabaseConfigured() && db) {
      const [raw] = await db.select().from(productsTable).where(eq(productsTable.id, id))
      if (!raw) return undefined
      const weightGrams = patch.weightGrams ?? raw.weightGrams
      const columns = this.productColumns({ ...existing, ...patch } as CreateProduct, attributes, weightGrams)
      const updateData: Record<string, unknown> = {
        ...columns,
        categoryId,
        slug,
        status,
        weightGrams,
        updatedAt: new Date()
      }
      if (patch.name !== undefined) updateData.name = patch.name
      if (patch.desc !== undefined) updateData.description = patch.desc
      if (patch.badge !== undefined) updateData.badge = patch.badge
      if (patch.compareAtPrice !== undefined) updateData.compareAtPrice = patch.compareAtPrice
      if (patch.costPrice !== undefined) updateData.costPrice = patch.costPrice
      if (patch.taxRate !== undefined) updateData.taxRate = patch.taxRate
      if (patch.hsnCode !== undefined) updateData.hsnCode = patch.hsnCode
      if (patch.isFeatured !== undefined) updateData.isFeatured = patch.isFeatured
      if (patch.isFreeSize !== undefined) updateData.isFreeSize = patch.isFreeSize
      if (patch.careInstructions !== undefined) updateData.careInstructions = patch.careInstructions

      await db.update(productsTable).set(updateData).where(eq(productsTable.id, id))

      if (hasImagePatch) {
        await db.delete(productImagesTable).where(eq(productImagesTable.productId, id))
        for (const norm of normalizedImages) {
          await db.insert(productImagesTable).values({
            productId: id,
            storageKey: norm.storageKey,
            externalUrl: norm.externalUrl,
            position: norm.position
          })
        }
      }

      if (patch.variants !== undefined) {
        await this.syncDbVariants(id, patch, existing, weightGrams)
      }

      return this.getById(id)
    }

    const updated: Product = {
      ...existing,
      ...patch,
      id,
      isFreeSize: patch.isFreeSize ?? existing.isFreeSize ?? false,
      category: (patch.category as Category) || existing.category,
      categoryId,
      slug,
      status,
      attributes,
      weightGrams: patch.weightGrams ?? existing.weightGrams,
      adminData: { ...(existing.adminData ?? {}), ...(patch.adminData ?? {}), status: adminStatus(status) }
    }

    if (patch.variants !== undefined) {
      const seenCombos = new Set<string>()
      for (const variant of patch.variants) {
        const comboKey = `${String(variant.color).toLowerCase()}__${String(variant.size).toUpperCase()}`
        if (seenCombos.has(comboKey)) {
          throw new Error(
            `Duplicate variant: color "${variant.color}" and size "${variant.size}" already exists for this product.`
          )
        }
        seenCombos.add(comboKey)
      }

      const existingForProduct = this.memoryVariants.filter((variant) => variant.productId === id)
      const existingById = new Map<number, Variant>()
      for (const variant of existingForProduct) {
        if (variant.id) existingById.set(variant.id, variant)
      }

      const newVariants: Variant[] = []
      const useSharedStock = patch.isFreeSize ?? existing.isFreeSize ?? false
      const sharedStock = useSharedStock ? patch.variants[0]?.stock ?? existingForProduct[0]?.stock ?? 0 : undefined
      for (const variant of patch.variants) {
        const color = String(variant.color).trim()
        const size = String(variant.size).trim()
        if (variant.id && existingById.has(variant.id)) {
          const current = existingById.get(variant.id)!
          const sku =
            color.toLowerCase() === current.color.toLowerCase() &&
            size.toUpperCase() === String(current.size).toUpperCase() &&
            (patch.category === undefined || patch.category === existing.category)
              ? current.sku
              : await this.generateSku({
                  category: patch.category || existing.category || 'printed-tees',
                  productType: (patch as any).fit || (patch as any).productType || 'Regular',
                  color,
                  size,
                  productId: id
                })
          newVariants.push({
            ...current,
            ...variant,
            sku,
            size,
            color
          })
        } else {
          const sku = await this.generateSku({
            category: patch.category || existing.category || 'printed-tees',
            productType: (patch as any).fit || (patch as any).productType || 'Regular',
            color,
            size,
            productId: id
          })
          newVariants.push({
            id: this.memoryVariants.length + newVariants.length + 1,
            productId: id,
            sku,
            size,
            color,
            price: variant.price ?? patch.priceNum ?? existing.priceNum,
            stock: sharedStock ?? variant.stock ?? 20,
            reserved: 0,
            reorderPoint: variant.reorderPoint ?? 5,
            weight: variant.weight ?? existing.weightGrams ?? 350,
            barcode: variant.barcode,
            status: variant.status || 'Active'
          })
        }
      }

      for (const [sku, productId] of this.memoryClaimedSkus.entries()) {
        if (productId === id) this.memoryClaimedSkus.delete(sku)
      }
      for (const variant of newVariants) {
        if (variant.sku) this.memoryClaimedSkus.set(variant.sku.toUpperCase(), id)
      }

      this.memoryVariants = [...this.memoryVariants.filter((variant) => variant.productId !== id), ...newVariants]
      updated.variants = newVariants
    }

    if (hasImagePatch) {
      this.memoryProductImages = this.memoryProductImages.filter((image) => image.productId !== id)
      for (const norm of normalizedImages) {
        this.memoryProductImages.push({
          id: this.memoryProductImages.length + 1,
          productId: id,
          color: null,
          storageKey: norm.storageKey,
          externalUrl: norm.externalUrl,
          position: norm.position,
          createdAt: new Date()
        })
      }
    }

    this.memoryProducts = this.memoryProducts.map((product) => (product.id === id ? updated : product))
    return this.hydrateMemory(updated)
  }

  private async syncDbVariants(
    id: number,
    patch: UpdateProduct,
    existing: Product,
    productWeight: number
  ): Promise<void> {
    const seenCombos = new Set<string>()
    for (const variant of patch.variants!) {
      const comboKey = `${String(variant.color).toLowerCase()}__${String(variant.size).toUpperCase()}`
      if (seenCombos.has(comboKey)) {
        throw new Error(
          `Duplicate variant: color "${variant.color}" and size "${variant.size}" already exists for this product.`
        )
      }
      seenCombos.add(comboKey)
    }

    const existingDbVariants = await db!
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, id))
    const existingById = new Map(existingDbVariants.map((variant) => [variant.id, variant]))
    const updatedIds = new Set<number>()
    const newProductPrice = patch.priceNum ?? existing.priceNum
    const useSharedStock = patch.isFreeSize ?? existing.isFreeSize ?? false
    const sharedStock = useSharedStock ? patch.variants![0]?.stock ?? existingDbVariants[0]?.stock ?? 0 : undefined

    for (const variant of patch.variants!) {
      const color = String(variant.color).trim()
      const size = String(variant.size).trim()
      const price = variant.price ?? newProductPrice
      const weight = variant.weight ?? productWeight

      if (variant.id && existingById.has(variant.id)) {
        const current = existingById.get(variant.id)!
        updatedIds.add(variant.id)
        const sku =
          color.toLowerCase() === current.color.toLowerCase() &&
          size.toUpperCase() === current.size.toUpperCase() &&
          (patch.category === undefined || patch.category === existing.category)
            ? current.sku
            : await this.generateSku({
                category: patch.category || existing.category || 'printed-tees',
                productType: (patch as any).fit || (patch as any).productType || 'Regular',
                color,
                size,
                productId: id
              })
        await db!
          .update(productVariantsTable)
          .set({
            sku,
            size,
            color,
            price: price !== newProductPrice ? price : null,
            stock: sharedStock ?? variant.stock ?? current.stock,
            reorderPoint: variant.reorderPoint ?? current.reorderPoint,
            weightGrams: weight !== productWeight ? weight : null,
            barcode: variant.barcode ?? current.barcode,
            status: variant.status ?? current.status,
            updatedAt: new Date()
          })
          .where(eq(productVariantsTable.id, variant.id))
      } else {
        const sku = await this.generateSku({
          category: patch.category || existing.category || 'printed-tees',
          productType: (patch as any).fit || (patch as any).productType || 'Regular',
          color,
          size,
          productId: id
        })
        const [created] = await db!
          .insert(productVariantsTable)
          .values({
            productId: id,
            sku,
            size,
            color,
            price: price !== newProductPrice ? price : null,
            stock: sharedStock ?? variant.stock ?? 20,
            reserved: 0,
            reorderPoint: variant.reorderPoint ?? 5,
            weightGrams: weight !== productWeight ? weight : null,
            barcode: variant.barcode || null,
            status: variant.status || 'Active'
          })
          .returning({ id: productVariantsTable.id })
        updatedIds.add(created.id)
      }
    }

    for (const variant of existingDbVariants) {
      if (!updatedIds.has(variant.id)) {
        await db!.delete(productVariantsTable).where(eq(productVariantsTable.id, variant.id))
      }
    }
  }

  async remove(id: number): Promise<boolean> {
    if (isDatabaseConfigured() && db) {
      await db.delete(productImagesTable).where(eq(productImagesTable.productId, id))
      await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, id))
      const [row] = await db
        .delete(productsTable)
        .where(eq(productsTable.id, id))
        .returning({ id: productsTable.id })
      return Boolean(row)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')

    const before = this.memoryProducts.length
    this.memoryProducts = this.memoryProducts.filter((product) => product.id !== id)
    this.memoryVariants = this.memoryVariants.filter((variant) => variant.productId !== id)
    this.memoryProductImages = this.memoryProductImages.filter((image) => image.productId !== id)
    for (const [sku, productId] of this.memoryClaimedSkus.entries()) {
      if (productId === id) this.memoryClaimedSkus.delete(sku)
    }
    return this.memoryProducts.length < before
  }
}

export const productStore = new ProductStore(PRODUCTS)
