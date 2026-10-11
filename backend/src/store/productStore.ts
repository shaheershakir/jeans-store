import { eq } from 'drizzle-orm'
import type { CreateProduct, Product, UpdateProduct, Fit, StoreType } from '../schemas/product.js'
import { PRODUCTS } from '../data/products.js'
import { db, isDatabaseConfigured } from '../db/index.js'
import { products as productsTable, type DbProduct } from '../db/schema.js'

function toProduct(row: DbProduct): Product {
  return {
    id: row.id,
    store: (row.store as StoreType) || 'teesgarage',
    category: row.category || 'printed-tees',
    name: row.name,
    fit: (row.fit as Fit) || undefined,
    price: row.price,
    priceNum: row.priceNum,
    img: row.img,
    img2: row.img2,
    badge: row.badge ?? undefined,
    desc: row.desc,
    wash: row.wash ?? undefined,
    sizes: (row.sizes as string[]) ?? undefined
  }
}

/**
 * Product store backed by Neon PostgreSQL via Drizzle ORM,
 * with an in-memory fallback when DATABASE_URL is not provided (e.g. CI / offline dev).
 */
class ProductStore {
  private memoryProducts: Product[]

  constructor(seed: Product[]) {
    this.memoryProducts = seed.map((product) => ({ ...product }))
  }

  async list(filters?: { store?: string; category?: string }): Promise<Product[]> {
    let list: Product[]
    if (isDatabaseConfigured() && db) {
      const rows = await db.select().from(productsTable)
      list = rows.map(toProduct)
    } else {
      list = [...this.memoryProducts]
    }

    if (filters?.store && filters.store !== 'all') {
      list = list.filter((p) => p.store === filters.store)
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === filters.category?.toLowerCase())
    }

    return list
  }

  async getById(id: number): Promise<Product | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id))
      return row ? toProduct(row) : undefined
    }
    return this.memoryProducts.find((p) => p.id === id)
  }

  async create(input: CreateProduct): Promise<Product> {
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
          badge: input.badge ?? null,
          desc: input.desc,
          wash: input.wash ?? null,
          sizes: input.sizes ?? null
        })
        .returning()
      return toProduct(row)
    }

    const id = this.memoryProducts.length > 0 ? Math.max(...this.memoryProducts.map((p) => p.id)) + 1 : 0
    const product: Product = { id, ...input }
    this.memoryProducts.push(product)
    return product
  }

  async update(id: number, patch: UpdateProduct): Promise<Product | undefined> {
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
      if (patch.badge !== undefined) updateData.badge = patch.badge
      if (patch.desc !== undefined) updateData.desc = patch.desc
      if (patch.wash !== undefined) updateData.wash = patch.wash
      if (patch.sizes !== undefined) updateData.sizes = patch.sizes

      const [row] = await db
        .update(productsTable)
        .set(updateData)
        .where(eq(productsTable.id, id))
        .returning()

      return row ? toProduct(row) : undefined
    }

    const existing = this.memoryProducts.find((p) => p.id === id)
    if (!existing) return undefined
    const updated: Product = { ...existing, ...patch, id }
    this.memoryProducts = this.memoryProducts.map((p) => (p.id === id ? updated : p))
    return updated
  }

  async remove(id: number): Promise<boolean> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .delete(productsTable)
        .where(eq(productsTable.id, id))
        .returning({ id: productsTable.id })
      return Boolean(row)
    }

    const before = this.memoryProducts.length
    this.memoryProducts = this.memoryProducts.filter((p) => p.id !== id)
    return this.memoryProducts.length < before
  }
}

export const productStore = new ProductStore(PRODUCTS)
