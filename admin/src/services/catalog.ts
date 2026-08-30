'use client'

import { simulateLatency } from './api'
import { useAdminStore, type ProductInput } from '@/store/admin-store'
import type { Collection, Product, SizeChart } from '@/lib/types'

export async function createProduct(input: ProductInput): Promise<Product> {
  await simulateLatency()
  return useAdminStore.getState().saveProduct(input)
}

export async function updateProduct(input: ProductInput): Promise<Product> {
  await simulateLatency()
  return useAdminStore.getState().saveProduct(input)
}

export async function deleteProduct(id: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteProduct(id)
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