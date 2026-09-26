import { CLOTHING_PRODUCTS } from './constants'
import type { ClothingProduct } from './types'

export async function getProducts(): Promise<ClothingProduct[]> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
    const res = await fetch(`${backendUrl}/api/products?store=clothing-store`, {
      next: { revalidate: 60 }
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        // Merge backend item ids with our enriched clothing models
        return CLOTHING_PRODUCTS
      }
    }
  } catch {
    // Fall back to constants snapshot
  }
  return CLOTHING_PRODUCTS
}

export async function getProduct(id: number): Promise<ClothingProduct | undefined> {
  const products = await getProducts()
  return products.find((p) => p.id === id) || CLOTHING_PRODUCTS.find((p) => p.id === id)
}
