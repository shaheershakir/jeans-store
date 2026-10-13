import type { Product } from './constants'
import { PRODUCTS as SNAPSHOT_PRODUCTS } from './constants'

export function getAvailableProductSizes(product: Product): string[] {
  if (product.variants) {
    const available = new Set(
      product.variants
        .filter((variant) => variant.status === 'Active' && variant.stock - variant.reserved > 0)
        .map((variant) => String(variant.size))
    )
    return getProductSizeOptions(product).filter((size) => available.has(size))
  }

  return product.inStock === false ? [] : getProductSizeOptions(product)
}

export function getProductSizeOptions(product: Product): string[] {
  const sizes = product.variants
    ? product.variants
        .filter((variant) => variant.status === 'Active')
        .map((variant) => String(variant.size))
    : product.sizes ?? []

  return Array.from(new Set(sizes))
}

export function isProductAvailable(product: Product): boolean {
  return getAvailableProductSizes(product).length > 0
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

export async function getProducts(): Promise<Product[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${BACKEND_URL}/api/products`, {
      signal: controller.signal,
      next: { tags: ['products'], revalidate: 3600 }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn(
        `[TEESGARAGE] Backend responded with status ${res.status}. Falling back to bundled product snapshot.`
      )
      return SNAPSHOT_PRODUCTS
    }

    const data = (await res.json()) as { products?: Product[] }
    if (Array.isArray(data?.products) && data.products.length > 0) {
      return data.products
    }

    console.warn('[TEESGARAGE] Backend returned empty products payload. Falling back to bundled snapshot.')
    return SNAPSHOT_PRODUCTS
  } catch {
    console.warn(
      `[TEESGARAGE] Backend unreachable at ${BACKEND_URL}. Using bundled product snapshot for static generation.`
    )
    return SNAPSHOT_PRODUCTS
  }
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => p.id === id)
}
