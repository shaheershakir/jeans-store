import type { Fit, Product } from './constants'
import type { SortMode } from './store'
import { PRODUCTS } from './constants'

export function getProductById(id: number, catalog: Product[] = PRODUCTS): Product | undefined {
  return catalog.find((p) => p.id === id)
}

export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

export function filterAndSortProducts(
  fit: Fit | 'all',
  prices: string[],
  sort: SortMode,
  catalog: Product[] = PRODUCTS
): Product[] {
  let list = [...catalog]

  if (fit !== 'all') {
    list = list.filter((p) => p.fit === fit)
  }

  if (prices.length > 0) {
    list = list.filter((p) =>
      prices.some((key) => {
        if (key === 'under-1500') return p.priceNum < 1500
        if (key === '1500-2000') return p.priceNum >= 1500 && p.priceNum <= 1999
        if (key === 'above-2000') return p.priceNum >= 2000
        return false
      })
    )
  }

  if (sort === 'price-asc') {
    list.sort((a, b) => a.priceNum - b.priceNum)
  } else if (sort === 'price-desc') {
    list.sort((a, b) => b.priceNum - a.priceNum)
  } else {
    list.sort((a, b) => a.id - b.id)
  }

  return list
}

export function searchProducts(query: string, catalog: Product[] = PRODUCTS): Product[] {
  const clean = query.trim().toLowerCase()
  if (!clean) return catalog
  return catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(clean) ||
      p.fit.toLowerCase().includes(clean) ||
      p.wash.toLowerCase().includes(clean) ||
      p.desc.toLowerCase().includes(clean) ||
      p.price.toLowerCase().includes(clean)
  )
}
