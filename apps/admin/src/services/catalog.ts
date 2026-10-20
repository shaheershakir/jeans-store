'use client'

import { apiFetch } from './api'
import { useAdminStore, type ProductInput } from '@/store/admin-store'
import type { Collection, Product, ProductStatus, SizeChart } from '@/lib/types'

interface ApiVariant {
  id?: number
  productId?: number
  sku?: string
  size: number | string
  color: string
  price?: number
  stock: number
  reserved?: number
  reorderPoint?: number
  weight?: number
  barcode?: string
  status?: 'Active' | 'Inactive'
}

interface ApiProduct {
  id: number
  store?: string
  category?: string
  name: string
  sku?: string
  fit?: string
  price: string
  priceNum: number
  img: string
  img2: string
  images?: string[]
  isFreeSize?: boolean
  badge?: string
  desc: string
  wash?: string
  variants?: ApiVariant[]
  adminData?: Record<string, unknown>
  createdAt?: string
}

function fromApiProduct(value: ApiProduct): Product {
  const metadata = value.adminData ?? {}
  const categories = useAdminStore.getState().data.categories
  const collections = useAdminStore.getState().data.collections
  const imageUrls = value.images?.length ? value.images : [value.img, value.img2].filter(Boolean)
  const numeric = (key: string, fallback: number) => Number(metadata[key] ?? fallback)
  const text = (key: string, fallback: string) => String(metadata[key] ?? fallback)

  return {
    id: value.id,
    name: value.name,
    slug: text('slug', value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    sku: text('sku', value.sku ?? value.variants?.[0]?.sku ?? ''),
    description: value.desc,
    brand: text('brand', 'TEESGARAGE'),
    categoryId: numeric('categoryId', categories.find((category) => category.slug === value.category)?.id ?? categories.find((category) => category.slug === 'printed-tees')?.id ?? 1),
    collectionId: numeric('collectionId', collections[0]?.id ?? 1),
    fit: (value.fit ?? 'Regular') as Product['fit'],
    gender: text('gender', 'Men') as Product['gender'],
    rise: text('rise', 'Mid') as Product['rise'],
    material: text('material', 'Cotton') as Product['material'],
    pattern: text('pattern', ''),
    wash: (value.wash ?? 'Raw') as Product['wash'],
    inseam: numeric('inseam', 32),
    price: value.priceNum,
    compareAtPrice: metadata.compareAtPrice == null ? null : numeric('compareAtPrice', value.priceNum),
    costPrice: numeric('costPrice', 0),
    taxRate: numeric('taxRate', 0.12),
    status: text('status', value.badge === 'Draft' ? 'Draft' : 'Active') as ProductStatus,
    featured: Boolean(metadata.featured ?? false),
    isFreeSize: value.isFreeSize ?? Boolean(metadata.isFreeSize ?? false),
    weightGrams: numeric('weightGrams', value.variants?.[0]?.weight ?? 350),
    views: numeric('views', 0),
    wishlists: numeric('wishlists', 0),
    image: value.img,
    images: imageUrls.map((url, index) => ({ id: index + 1, url, alt: `${value.name} view ${index + 1}`, order: index })),
    variants: (value.variants ?? []).map((variant) => ({
      id: variant.id ?? 0,
      productId: value.id,
      sku: variant.sku ?? '',
      size: variant.size,
      color: variant.color,
      price: variant.price ?? value.priceNum,
      stock: variant.stock,
      reserved: variant.reserved ?? 0,
      reorderPoint: variant.reorderPoint ?? 5,
      weight: variant.weight ?? 350,
      barcode: variant.barcode ?? '',
      status: variant.status ?? 'Active'
    })),
    createdAt: value.createdAt ?? new Date().toISOString(),
    updatedAt: value.createdAt ?? new Date().toISOString()
  }
}

function toApiProduct(input: ProductInput) {
  const state = useAdminStore.getState().data
  const category = state.categories.find((item) => item.id === input.categoryId)
  const collection = state.collections.find((item) => item.id === input.collectionId)
  const images = input.images.map((image) => image.url).filter(Boolean)

  return {
    store: 'teesgarage',
    category: category?.slug ?? 'printed-tees',
    name: input.name,
    isFreeSize: input.isFreeSize ?? false,
    collectionId: input.collectionId || null,
    fit: input.fit,
    price: `₹${input.price.toLocaleString('en-IN')}`,
    priceNum: input.price,
    img: input.image,
    img2: images[1] ?? input.image,
    images,
    badge: input.status === 'Draft' ? 'Draft' : undefined,
    desc: input.description || input.name,
    wash: input.wash,
    color: String(input.variants[0]?.color ?? 'Blue'),
    sizes: [...new Set(input.variants.map((variant) => String(variant.size)))],
    variants: input.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      price: variant.price,
      stock: variant.stock,
      reorderPoint: variant.reorderPoint,
      weight: variant.weight,
      barcode: variant.barcode,
      status: variant.status ?? 'Active'
    })),
    adminData: {
      slug: input.slug,
      brand: input.brand,
      categoryId: input.categoryId,
      collectionId: input.collectionId,
      collection: collection?.name,
      gender: input.gender,
      rise: input.rise,
      material: input.material,
      pattern: input.pattern,
      inseam: input.inseam,
      compareAtPrice: input.compareAtPrice,
      costPrice: input.costPrice,
      taxRate: input.taxRate,
      status: input.status,
      featured: input.featured,
      isFreeSize: input.isFreeSize ?? false,
      weightGrams: input.weightGrams ?? input.variants[0]?.weight ?? 350
    }
  }
}

export async function fetchBackendProducts(): Promise<void> {
  const data = await apiFetch<{ products: ApiProduct[] }>('/api/admin/products')
  useAdminStore.getState().replaceProducts(data.products.map(fromApiProduct))
}

export async function uploadProductImage(file: File): Promise<string> {
  const response = await apiFetch<{ url: string }>('/api/uploads/products', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file
  })
  return response.url
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const response = await apiFetch<{ product: ApiProduct }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(toApiProduct(input))
  })
  await fetchBackendProducts()
  return fromApiProduct(response.product)
}

export async function updateProduct(input: ProductInput): Promise<Product> {
  if (!input.id) throw new Error('Product id is required to update a product.')
  const response = await apiFetch<{ product: ApiProduct }>(`/api/products/${input.id}`, {
    method: 'PUT',
    body: JSON.stringify(toApiProduct(input))
  })
  await fetchBackendProducts()
  return fromApiProduct(response.product)
}

export async function deleteProduct(id: number): Promise<void> {
  await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
  await fetchBackendProducts()
}

export async function setProductStatus(id: number, status: ProductStatus): Promise<void> {
  const current = useAdminStore.getState().data.products.find((item) => item.id === id)
  if (!current) throw new Error('Product not found.')
  await updateProduct({ ...current, status })
}

export async function bulkSetProductStatus(ids: number[], status: ProductStatus): Promise<void> {
  const products = useAdminStore.getState().data.products.filter((item) => ids.includes(item.id))
  for (const product of products) await updateProduct({ ...product, status })
  await fetchBackendProducts()
}

export async function bulkDeleteProducts(ids: number[]): Promise<void> {
  for (const id of ids) await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
  await fetchBackendProducts()
}

export async function saveSizeChart(chart: SizeChart): Promise<void> {
  useAdminStore.getState().saveSizeChart(chart)
}

export async function saveCategory(input: { id?: number; name: string; description: string; parentId?: number | null }) {
  return useAdminStore.getState().saveCategory({ ...input, parentId: input.parentId ?? null })
}

export async function deleteCategory(id: number): Promise<void> {
  useAdminStore.getState().deleteCategory(id)
}

export async function saveCollection(input: {
  id?: number
  name: string
  description?: string
  status: Collection['status']
}) {
  return useAdminStore.getState().saveCollection(input)
}

export async function deleteCollection(id: number): Promise<void> {
  useAdminStore.getState().deleteCollection(id)
}
