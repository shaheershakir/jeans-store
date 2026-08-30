import type { CreateProduct, Product, UpdateProduct } from '../schemas/product.js'
import { PRODUCTS } from '../data/products.js'

/**
 * In-memory product store. Backed by the seed dataset at boot.
 * Swap this module for a database layer when persistence is added —
 * the routes only talk to these functions.
 */
class ProductStore {
  private products: Product[]

  constructor(seed: Product[]) {
    this.products = seed.map((product) => ({ ...product }))
  }

  list(): Product[] {
    return [...this.products]
  }

  getById(id: number): Product | undefined {
    return this.products.find((p) => p.id === id)
  }

  create(input: CreateProduct): Product {
    const id = this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 0
    const product: Product = { id, ...input }
    this.products.push(product)
    return product
  }

  update(id: number, patch: UpdateProduct): Product | undefined {
    const existing = this.getById(id)
    if (!existing) return undefined
    const updated: Product = { ...existing, ...patch, id }
    this.products = this.products.map((p) => (p.id === id ? updated : p))
    return updated
  }

  remove(id: number): boolean {
    const before = this.products.length
    this.products = this.products.filter((p) => p.id !== id)
    return this.products.length < before
  }
}

export const productStore = new ProductStore(PRODUCTS)
