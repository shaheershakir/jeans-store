import { and, eq, sql } from 'drizzle-orm'
import { CATEGORIES, type Category, type CreateProduct, type Fit, type Product, type StoreType, type UpdateProduct, type Variant } from '../schemas/product.js'
import { PRODUCTS } from '../data/products.js'
import { db, isDatabaseConfigured } from '../db/index.js'
import {
  products as productsTable,
  productVariants as productVariantsTable,
  productImages as productImagesTable,
  type DbProduct,
  type DbProductVariant,
  type DbProductImage
} from '../db/schema.js'
import {
  generateBaseSku,
  generateProductScopedSku,
  type SkuComponents
} from '../services/skuService.js'
import { assetUrl, keyFromUrl } from '@jeans-store/shared'

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

function toVariant(row: DbProductVariant): Variant {
  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    size: row.size,
    color: row.color,
    price: row.price,
    stock: row.stock,
    reserved: row.reserved,
    reorderPoint: row.reorderPoint,
    weight: row.weight,
    barcode: row.barcode ?? undefined,
    status: (row.status as 'Active' | 'Inactive') || 'Active'
  }
}

function toProduct(
  row: DbProduct,
  variants: Variant[] = [],
  images: Array<{ storageKey: string | null; externalUrl: string | null; position: number }> = []
): Product {
  const validCategory = CATEGORIES.includes(row.category as Category)
  const adminData = row.adminData ?? {}

  let displayImg = row.img
  let displayImg2 = row.img2
  let displayImages = row.images ?? []

  if (images.length > 0) {
    const sorted = [...images].sort((a, b) => a.position - b.position)
    const resolvedUrls = sorted
      .map((img) => (img.storageKey ? assetUrl(img.storageKey) : img.externalUrl))
      .filter((u): u is string => Boolean(u))

    if (resolvedUrls.length > 0) {
      displayImg = resolvedUrls[0]
      displayImg2 = resolvedUrls[1] || resolvedUrls[0]
      displayImages = resolvedUrls
    }
  }

  return {
    id: row.id,
    store: (row.store as StoreType) || 'teesgarage',
    category: validCategory ? (row.category as Category) : 'printed-tees',
    name: row.name,
    fit: (row.fit as Fit) || undefined,
    price: row.price,
    priceNum: row.priceNum,
    img: displayImg,
    img2: displayImg2,
    images: displayImages,
    badge: row.badge ?? undefined,
    desc: row.desc,
    wash: row.wash ?? undefined,
    sizes: (row.sizes as string[]) ?? undefined,
    adminData: validCategory ? adminData : { ...adminData, status: 'Archived', legacyCategory: row.category },
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
 * Product store backed by Neon PostgreSQL via Drizzle ORM,
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
      let color = p.color || 'Black'
      if (!p.color && p.wash) {
        if (p.wash.includes('/')) {
          color = p.wash.split('/')[1].trim()
        } else {
          color = p.wash
        }
      }

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
              alt: null,
              mimeType: null,
              width: null,
              height: null,
              sizeBytes: null,
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
                productType: p.fit || 'Regular',
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
                weight: 250,
                barcode: `890${String(10000000000 + p.id * 100 + variantCounter).slice(0, 10)}`,
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

  /**
   * Helper to check if an SKU is claimed by another product.
   */
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

  /**
   * Generates a collision-safe SKU for a variant.
   */
  async generateSku(components: SkuComponents): Promise<string> {
    const baseSku = generateBaseSku(components)
    const claimed = await this.isSkuClaimedByOtherProduct(baseSku, components.productId ? Number(components.productId) : undefined)
    if (!claimed) {
      return baseSku
    }
    return generateProductScopedSku(components)
  }

  async list(filters?: { store?: string; category?: string; fit?: string; sku?: string; q?: string }): Promise<Product[]> {
    let list: Product[]
    if (isDatabaseConfigured() && db) {
      const productRows = await db.select().from(productsTable)
      const variantRows = await db.select().from(productVariantsTable)
      const imageRows = await db.select().from(productImagesTable)

      const variantMap = new Map<number, Variant[]>()
      for (const vr of variantRows) {
        if (!variantMap.has(vr.productId)) {
          variantMap.set(vr.productId, [])
        }
        variantMap.get(vr.productId)!.push(toVariant(vr))
      }

      const imageMap = new Map<number, DbProductImage[]>()
      for (const ir of imageRows) {
        if (!imageMap.has(ir.productId)) {
          imageMap.set(ir.productId, [])
        }
        imageMap.get(ir.productId)!.push(ir)
      }

      list = productRows.map((p) => toProduct(p, variantMap.get(p.id) || [], imageMap.get(p.id) || []))
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('Product database is not configured.')
    } else {
      const imageMap = new Map<number, DbProductImage[]>()
      for (const ir of this.memoryProductImages) {
        if (!imageMap.has(ir.productId)) {
          imageMap.set(ir.productId, [])
        }
        imageMap.get(ir.productId)!.push(ir)
      }

      list = this.memoryProducts.map((p) => {
        const variants = this.memoryVariants.filter((v) => v.productId === p.id)
        const images = imageMap.get(p.id) || []
        return toProduct(
          {
            id: p.id,
            store: p.store,
            category: p.category,
            name: p.name,
            fit: p.fit ?? null,
            price: p.price,
            priceNum: p.priceNum,
            img: p.img,
            img2: p.img2,
            images: p.images ?? [],
            badge: p.badge ?? null,
            desc: p.desc,
            wash: p.wash ?? null,
            sizes: p.sizes ?? null,
            adminData: p.adminData ?? {},
            createdAt: p.createdAt ?? new Date(),
            updatedAt: p.createdAt ?? new Date()
          },
          variants,
          images
        )
      })
    }

    if (filters?.store && filters.store !== 'all') {
      list = list.filter((p) => p.store === filters.store)
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === filters.category?.toLowerCase())
    }
    if (filters?.fit && filters.fit !== 'all') {
      list = list.filter((p) => p.fit?.toLowerCase() === filters.fit?.toLowerCase())
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
          (p.fit && p.fit.toLowerCase().includes(clean)) ||
          (p.wash && p.wash.toLowerCase().includes(clean)) ||
          (p.category && p.category.toLowerCase().includes(clean)) ||
          p.desc.toLowerCase().includes(clean) ||
          (p.sku && p.sku.toLowerCase().includes(clean)) ||
          p.variants?.some((v) => Boolean(v.sku && v.sku.toLowerCase().includes(clean)))
      )
    }

    return list
  }

  async getById(id: number): Promise<Product | undefined> {
    if (isDatabaseConfigured() && db) {
      const [pRow] = await db.select().from(productsTable).where(eq(productsTable.id, id))
      if (!pRow) return undefined
      const vRows = await db
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.productId, id))
      const iRows = await db
        .select()
        .from(productImagesTable)
        .where(eq(productImagesTable.productId, id))
      return toProduct(pRow, vRows.map(toVariant), iRows)
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Product database is not configured.')
    }

    const found = this.memoryProducts.find((p) => p.id === id)
    if (!found) return undefined
    const variants = this.memoryVariants.filter((v) => v.productId === id)
    const images = this.memoryProductImages.filter((img) => img.productId === id)
    return toProduct(
      {
        id: found.id,
        store: found.store,
        category: found.category,
        name: found.name,
        fit: found.fit ?? null,
        price: found.price,
        priceNum: found.priceNum,
        img: found.img,
        img2: found.img2,
        images: found.images ?? [],
        badge: found.badge ?? null,
        desc: found.desc,
        wash: found.wash ?? null,
        sizes: found.sizes ?? null,
        adminData: found.adminData ?? {},
        createdAt: found.createdAt ?? new Date(),
        updatedAt: found.createdAt ?? new Date()
      },
      variants,
      images
    )
  }

  async adjustStock(variantId: number, delta: number): Promise<Variant> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .update(productVariantsTable)
        .set({ stock: sql`${productVariantsTable.stock} + ${delta}`, updatedAt: new Date() })
        .where(and(
          eq(productVariantsTable.id, variantId),
          sql`${productVariantsTable.stock} + ${delta} >= ${productVariantsTable.reserved}`
        ))
        .returning()
      if (!row) throw new Error('Variant not found or adjustment would reduce stock below reserved units.')
      return toVariant(row)
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
    const variant = this.memoryVariants.find((item) => item.id === variantId)
    if (!variant) throw new Error('Variant not found.')
    if (variant.stock + delta < variant.reserved) throw new Error('Adjustment would reduce stock below reserved units.')
    variant.stock += delta
    return { ...variant }
  }

  async getBySku(sku: string): Promise<{ product: Product; variant: Variant } | undefined> {
    const cleanSku = sku.trim().toUpperCase()
    if (isDatabaseConfigured() && db) {
      const [vRow] = await db
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.sku, cleanSku))
      if (!vRow) return undefined
      const product = await this.getById(vRow.productId)
      if (!product) return undefined
      return { product, variant: toVariant(vRow) }
    }

    if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')

    const variant = this.memoryVariants.find((v) => Boolean(v.sku && v.sku.toUpperCase() === cleanSku))
    if (!variant) return undefined
    const product = this.memoryProducts.find((p) => p.id === variant.productId)
    if (!product) return undefined
    return { product, variant }
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

  private async _doCreate(input: CreateProduct): Promise<Product> {
    const normalizedImages = normalizeImageInputs(input.img, input.img2, input.images)

    // Determine product ID
    let newProductId: number
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .insert(productsTable)
        .values({
          store: input.store || 'teesgarage',
          category: input.category || 'printed-tees',
          name: input.name,
          fit: input.fit ?? null,
          price: input.price,
          priceNum: input.priceNum,
          img: input.img,
          img2: input.img2,
          images: input.images ?? [],
          badge: input.badge ?? null,
          desc: input.desc,
          wash: input.wash ?? null,
          sizes: input.sizes ?? null,
          adminData: input.adminData ?? {}
        })
        .returning()
      newProductId = row.id

      for (const norm of normalizedImages) {
        await db.insert(productImagesTable).values({
          productId: newProductId,
          storageKey: norm.storageKey,
          externalUrl: norm.externalUrl,
          position: norm.position
        })
      }
    } else {
      if (process.env.NODE_ENV === 'production') throw new Error('Product database is not configured.')
      newProductId = ++this.nextMemoryProductId
      for (const norm of normalizedImages) {
        this.memoryProductImages.push({
          id: this.memoryProductImages.length + 1,
          productId: newProductId,
          color: null,
          storageKey: norm.storageKey,
          externalUrl: norm.externalUrl,
          alt: null,
          mimeType: null,
          width: null,
          height: null,
          sizeBytes: null,
          position: norm.position,
          createdAt: new Date()
        })
      }
    }

    // Process and validate variants
    const rawVariants: RawVariantInput[] =
      input.variants && input.variants.length > 0
        ? input.variants
        : (input.sizes || ['S', 'M', 'L', 'XL']).map((sz) => ({
            size: sz,
            color: input.color || (input.wash?.includes('/') ? input.wash.split('/')[1].trim() : input.wash) || 'Black',
            price: input.priceNum,
            stock: 20,
            reserved: 0,
            reorderPoint: 5,
            weight: 250,
            status: 'Active' as const
          }))

    // Validate duplicate color + size variants on this product
    const seenCombos = new Set<string>()
    const variantsToInsert: ReadyVariant[] = []

    for (const v of rawVariants) {
      const color = String(v.color || 'Black').trim()
      const size = String(v.size || 'M').trim()
      const comboKey = `${color.toLowerCase()}__${size.toUpperCase()}`
      if (seenCombos.has(comboKey)) {
        throw new Error(`Duplicate variant: a variant with color "${color}" and size "${size}" already exists for this product.`)
      }
      seenCombos.add(comboKey)

      // Generate or resolve SKU
      let sku = v.sku?.trim().toUpperCase()
      if (!sku) {
        sku = await this.generateSku({
          category: input.category || 'printed-tees',
          productType: input.fit || 'Regular',
          color,
          size,
          productId: newProductId
        })
      } else {
        // If provided SKU collides with another product, resolve it
        const claimed = await this.isSkuClaimedByOtherProduct(sku, newProductId)
        if (claimed) {
          sku = await this.generateSku({
            category: input.category || 'printed-tees',
            productType: input.fit || 'Regular',
            color,
            size,
            productId: newProductId
          })
        }
      }

      if (!isDatabaseConfigured() || !db) {
        this.memoryClaimedSkus.set(sku, newProductId)
      }

      variantsToInsert.push({
        id: v.id,
        productId: newProductId,
        sku,
        size,
        color,
        price: v.price ?? input.priceNum,
        stock: v.stock ?? 20,
        reserved: v.reserved ?? 0,
        reorderPoint: v.reorderPoint ?? 5,
        weight: v.weight ?? 250,
        barcode: v.barcode || `890${String(10000000000 + newProductId * 1000 + variantsToInsert.length).slice(0, 10)}`,
        status: v.status || 'Active'
      })
    }

    if (isDatabaseConfigured() && db) {
      const insertedVariants: Variant[] = []
      for (const vi of variantsToInsert) {
        const [vRow] = await db
          .insert(productVariantsTable)
          .values({
            productId: newProductId,
            sku: vi.sku,
            size: vi.size,
            color: vi.color,
            price: vi.price,
            stock: vi.stock,
            reserved: vi.reserved,
            reorderPoint: vi.reorderPoint,
            weight: vi.weight,
            barcode: vi.barcode || null,
            status: vi.status
          })
          .returning()
        insertedVariants.push(toVariant(vRow))
      }

      const p = await this.getById(newProductId)
      return p!
    }

    const createdProduct: Product = {
      id: newProductId,
      ...input,
      createdAt: new Date(),
      variants: variantsToInsert.map((v, i) => ({ ...v, id: this.memoryVariants.length + i + 1 }))
    }
    this.memoryProducts.push(createdProduct)
    this.memoryVariants.push(...createdProduct.variants!)
    return createdProduct
  }

  async update(id: number, patch: UpdateProduct): Promise<Product | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined

    const hasImagePatch = patch.img !== undefined || patch.img2 !== undefined || patch.images !== undefined
    const normalizedImages = hasImagePatch
      ? normalizeImageInputs(
          patch.img !== undefined ? patch.img : existing.img,
          patch.img2 !== undefined ? patch.img2 : existing.img2,
          patch.images !== undefined ? patch.images : existing.images
        )
      : []

    if (isDatabaseConfigured() && db) {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date()
      }
      if (patch.store !== undefined) updateData.store = patch.store
      if (patch.category !== undefined) updateData.category = patch.category
      if (patch.name !== undefined) updateData.name = patch.name
      if (patch.fit !== undefined) updateData.fit = patch.fit
      if (patch.price !== undefined) updateData.price = patch.price
      if (patch.priceNum !== undefined) updateData.priceNum = patch.priceNum
      if (patch.img !== undefined) updateData.img = patch.img
      if (patch.img2 !== undefined) updateData.img2 = patch.img2
      if (patch.images !== undefined) updateData.images = patch.images
      if (patch.badge !== undefined) updateData.badge = patch.badge
      if (patch.desc !== undefined) updateData.desc = patch.desc
      if (patch.wash !== undefined) updateData.wash = patch.wash
      if (patch.sizes !== undefined) updateData.sizes = patch.sizes
      if (patch.adminData !== undefined) updateData.adminData = patch.adminData

      await db
        .update(productsTable)
        .set(updateData)
        .where(eq(productsTable.id, id))

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
        // Enforce duplicate check
        const seenCombos = new Set<string>()
        for (const v of patch.variants) {
          const comboKey = `${String(v.color).toLowerCase()}__${String(v.size).toUpperCase()}`
          if (seenCombos.has(comboKey)) {
            throw new Error(`Duplicate variant: color "${v.color}" and size "${v.size}" already exists for this product.`)
          }
          seenCombos.add(comboKey)
        }

        const existingDbVariants = await db
          .select()
          .from(productVariantsTable)
          .where(eq(productVariantsTable.productId, id))

        const existingById = new Map<number, DbProductVariant>()
        for (const ev of existingDbVariants) {
          existingById.set(ev.id, ev)
        }

        const updatedIds = new Set<number>()

        for (const v of patch.variants) {
          const color = String(v.color).trim()
          const size = String(v.size).trim()

          if (v.id && existingById.has(v.id)) {
            // Existing variant: PRESERVE existing SKU!
            const ev = existingById.get(v.id)!
            const preserveSku = v.sku?.trim().toUpperCase() || ev.sku
            updatedIds.add(v.id)

            await db
              .update(productVariantsTable)
              .set({
                sku: preserveSku,
                size,
                color,
                price: v.price ?? patch.priceNum ?? ev.price,
                stock: v.stock ?? ev.stock,
                reorderPoint: v.reorderPoint ?? ev.reorderPoint,
                weight: v.weight ?? ev.weight,
                barcode: v.barcode ?? ev.barcode,
                status: v.status ?? ev.status,
                updatedAt: new Date()
              })
              .where(eq(productVariantsTable.id, v.id))
          } else {
            // Newly created variant: generate SKU automatically!
            const cat = patch.category || existing.category || 'printed-tees'
            const pType = patch.fit || existing.fit || 'Regular'
            let sku = v.sku?.trim().toUpperCase()
            if (!sku) {
              sku = await this.generateSku({
                category: cat,
                productType: pType,
                color,
                size,
                productId: id
              })
            }

            const [newV] = await db
              .insert(productVariantsTable)
              .values({
                productId: id,
                sku,
                size,
                color,
                price: v.price ?? patch.priceNum ?? existing.priceNum,
                stock: v.stock ?? 20,
                reserved: 0,
                reorderPoint: v.reorderPoint ?? 5,
                weight: v.weight ?? 250,
                barcode: v.barcode || null,
                status: v.status || 'Active'
              })
              .returning()
            updatedIds.add(newV.id)
          }
        }

        // Remove variants that were excluded in the updated list
        for (const ev of existingDbVariants) {
          if (!updatedIds.has(ev.id)) {
            await db.delete(productVariantsTable).where(eq(productVariantsTable.id, ev.id))
          }
        }
      }

      return this.getById(id)
    }

    // In-memory update
    const updated: Product = { ...existing, ...patch, id }
    if (patch.variants !== undefined) {
      const seenCombos = new Set<string>()
      for (const v of patch.variants) {
        const comboKey = `${String(v.color).toLowerCase()}__${String(v.size).toUpperCase()}`
        if (seenCombos.has(comboKey)) {
          throw new Error(`Duplicate variant: color "${v.color}" and size "${v.size}" already exists for this product.`)
        }
        seenCombos.add(comboKey)
      }

      const existingForProduct = this.memoryVariants.filter((v) => v.productId === id)
      const existingById = new Map<number, Variant>()
      for (const ev of existingForProduct) {
        if (ev.id) existingById.set(ev.id, ev)
      }

      const newVariants: Variant[] = []
      for (const v of patch.variants) {
        const color = String(v.color).trim()
        const size = String(v.size).trim()

        if (v.id && existingById.has(v.id)) {
          // Preserve existing SKU
          const ev = existingById.get(v.id)!
          newVariants.push({
            ...ev,
            ...v,
            sku: v.sku?.trim().toUpperCase() || ev.sku,
            size,
            color
          })
        } else {
          // Newly created variant: generate SKU
          const cat = patch.category || existing.category || 'printed-tees'
          const pType = patch.fit || existing.fit || 'Regular'
          const sku = v.sku?.trim().toUpperCase() || (await this.generateSku({
            category: cat,
            productType: pType,
            color,
            size,
            productId: id
          }))

          newVariants.push({
            id: this.memoryVariants.length + newVariants.length + 1,
            productId: id,
            sku,
            size,
            color,
            price: v.price ?? patch.priceNum ?? existing.priceNum,
            stock: v.stock ?? 20,
            reserved: 0,
            reorderPoint: v.reorderPoint ?? 5,
            weight: v.weight ?? 250,
            barcode: v.barcode,
            status: v.status || 'Active'
          })
        }
      }

      // Replace variants for this product in memory
      for (const [sku, pId] of this.memoryClaimedSkus.entries()) {
        if (pId === id) this.memoryClaimedSkus.delete(sku)
      }
      for (const nv of newVariants) {
        if (nv.sku) this.memoryClaimedSkus.set(nv.sku.toUpperCase(), id)
      }

      this.memoryVariants = [
        ...this.memoryVariants.filter((v) => v.productId !== id),
        ...newVariants
      ]
      updated.variants = newVariants
    }

    if (hasImagePatch) {
      this.memoryProductImages = this.memoryProductImages.filter((img) => img.productId !== id)
      for (const norm of normalizedImages) {
        this.memoryProductImages.push({
          id: this.memoryProductImages.length + 1,
          productId: id,
          color: null,
          storageKey: norm.storageKey,
          externalUrl: norm.externalUrl,
          alt: null,
          mimeType: null,
          width: null,
          height: null,
          sizeBytes: null,
          position: norm.position,
          createdAt: new Date()
        })
      }
    }

    this.memoryProducts = this.memoryProducts.map((p) => (p.id === id ? updated : p))
    return updated
  }

  async remove(id: number): Promise<boolean> {
    if (isDatabaseConfigured() && db) {
      // Cascade delete variants, images and product
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
    this.memoryProducts = this.memoryProducts.filter((p) => p.id !== id)
    this.memoryVariants = this.memoryVariants.filter((v) => v.productId !== id)
    this.memoryProductImages = this.memoryProductImages.filter((img) => img.productId !== id)
    for (const [sku, pId] of this.memoryClaimedSkus.entries()) {
      if (pId === id) this.memoryClaimedSkus.delete(sku)
    }
    return this.memoryProducts.length < before
  }
}

export const productStore = new ProductStore(PRODUCTS)
