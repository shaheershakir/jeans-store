import type { Product } from '../schemas/product.js'

const SEED_PRODUCT_ID_PREFIX = '00000000-0000-4000-8000-'

/**
 * Deterministic UUIDs for product IDs when needed.
 */
export function seedProductId(index: number): string {
  return `${SEED_PRODUCT_ID_PREFIX}${String(index + 1).padStart(12, '0')}`
}

export const PRODUCTS: Product[] = []
