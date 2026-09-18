'use client'

import { apiFetch, simulateLatency } from './api'
import { useAdminStore, type ProductInput } from '@/store/admin-store'
import type { Collection, Product, SizeChart } from '@/lib/types'

export async function fetchBackendProducts(): Promise<void> {
  try {
    const data = await apiFetch<{ products: Array<{ id: number; name: string; priceNum: number; fit: string; wash: string; desc: string }> }>('/api/products')
    if (data.products && Array.isArray(data.products)) {
      console.log(`[Admin] Loaded ${data.products.length} products from backend API`)
    }
  } catch (err) {
    console.warn('[Admin] Could not load backend products:', err)
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await simulateLatency()
  const product = useAdminStore.getState().saveProduct(input)

  // Sync to live backend API
  try {
    await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        fit: input.fit,
        price: `₹${input.price.toLocaleString('en-IN')}`,
        priceNum: input.price,
        img: input.image || input.images?.[0]?.url || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
        img2: input.images?.[1]?.url || input.image || 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
        badge: input.status === 'Draft' ? 'Draft' : undefined,
        desc: input.description || input.name,
        wash: input.wash || 'Raw'
      })
    })
  } catch (err) {
    console.warn('[Admin] Failed to sync product create to backend:', err)
  }

  return product
}

export async function updateProduct(input: ProductInput): Promise<Product> {
  await simulateLatency()
  const product = useAdminStore.getState().saveProduct(input)

  if (input.id) {
    try {
      await apiFetch(`/api/products/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          fit: input.fit,
          price: `₹${input.price.toLocaleString('en-IN')}`,
          priceNum: input.price,
          img: input.image || input.images?.[0]?.url,
          img2: input.images?.[1]?.url,
          desc: input.description,
          wash: input.wash
        })
      })
    } catch (err) {
      console.warn('[Admin] Failed to sync product update to backend:', err)
    }
  }

  return product
}

export async function deleteProduct(id: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteProduct(id)

  try {
    await apiFetch(`/api/products/${id}`, {
      method: 'DELETE'
    })
  } catch (err) {
    console.warn('[Admin] Failed to sync product delete to backend:', err)
  }
}

export async function setProductStatus(id: number, status: Product['status']): Promise<void> {
  await simulateLatency(120)
  useAdminStore.getState().setProductStatus(id, status)
}

export async function bulkSetProductStatus(ids: number[], status: Product['status']): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().bulkSetProductsStatus(ids, status)
}

export async function bulkDeleteProducts(ids: number[]): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().bulkDeleteProducts(ids)

  for (const id of ids) {
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
    } catch {
      // Ignore individual sync errors in bulk
    }
  }
}

export async function saveSizeChart(chart: SizeChart): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().saveSizeChart(chart)
}

export async function saveCategory(input: { id?: number; name: string; description: string; parentId?: number | null }) {
  await simulateLatency()
  return useAdminStore.getState().saveCategory({ ...input, parentId: input.parentId ?? null })
}

export async function deleteCategory(id: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteCategory(id)
}

export async function saveCollection(input: {
  id?: number
  name: string
  description?: string
  status: Collection['status']
}) {
  await simulateLatency()
  return useAdminStore.getState().saveCollection(input)
}

export async function deleteCollection(id: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteCollection(id)
}