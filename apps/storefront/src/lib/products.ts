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

const PRODUCT_COLOR_HEX: Record<string, string> = {
  black: '#171717',
  white: '#f5f3ed',
  navy: '#1e3157',
  grey: '#85878b',
  gray: '#85878b',
  ash: '#85878b',
  blue: '#436fa8',
  green: '#3e7558',
  olive: '#747947',
  red: '#a63836',
  beige: '#d8c7a7',
  charcoal: '#414347',
  cream: '#eee9dd',
  ecru: '#eee9dd',
  brown: '#5c4033',
  tan: '#d2b48c',
  khaki: '#c3b091',
  sand: '#c2b280',
  sage: '#9cb071',
  burgundy: '#800020',
  maroon: '#681c23',
  rust: '#b7410e',
  lavender: '#b57bee',
  indigo: '#264348',
  teal: '#008080',
  coral: '#e07a5f',
  mustard: '#d4a373',
  purple: '#6a0dad',
  pink: '#f4a6b8',
  mocha: '#8a6240',
  plum: '#5c2c47',
  terracotta: '#c85a32',
  camel: '#c19a6b',
  taupe: '#b38b6d',
  mint: '#98ff98',
  clay: '#b66a50',
  'washed black': '#1e1e1e',
  'off white': '#faf9f6'
}

export function getColorHex(colorName: string): string {
  const trimmed = colorName.trim()
  if (!trimmed) return '#171717'
  if (trimmed.startsWith('#')) return trimmed
  const hexMatch = trimmed.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/)
  if (hexMatch) return hexMatch[0]
  return PRODUCT_COLOR_HEX[trimmed.toLowerCase()] || '#444444'
}

export function getProductSwatchColors(product: Product, limit = 4): string[] {
  const resolve = (colorName: string): string => getColorHex(colorName)

  const variantColors = Array.from(
    new Set(
      (product.variants ?? [])
        .map((variant) => variant.color?.trim())
        .filter((color): color is string => Boolean(color))
    )
  )

  if (variantColors.length > 0) {
    return variantColors.slice(0, limit).map(resolve)
  }

  if (product.color) {
    return product.color
      .split('/')
      .map((color) => color.trim())
      .filter(Boolean)
      .slice(0, limit)
      .map(resolve)
  }

  return ['#171717']
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

export async function getProduct(id: number | string): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find((p) => String(p.id) === String(id))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getProductSlug(product: { id: number | string; name: string }): string {
  return slugify(product.name) || String(product.id)
}

export function getProductUrl(product: { id: number | string; name: string }): string {
  return `/${getProductSlug(product)}`
}

export function getProductCheckoutUrl(
  product: { id: number | string; name: string },
  options?: { size?: string; color?: string; qty?: number }
): string {
  const base = `/${getProductSlug(product)}/checkout`
  if (!options) return base
  const params = new URLSearchParams()
  if (options.size) params.set('size', options.size)
  if (options.color) params.set('color', options.color)
  if (options.qty && options.qty > 1) params.set('qty', String(options.qty))
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts()
  const cleanSlug = slug.toLowerCase().trim()
  return products.find(
    (p) =>
      slugify(p.name) === cleanSlug ||
      String(p.id) === cleanSlug ||
      (p.name === 'Thermal Waffle Knit Tee' && cleanSlug === 'thermal-waffle-knit-fullsleeve-tee')
  )
}

