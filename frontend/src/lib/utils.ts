import type { Fit, Product } from './constants'
import type { SortMode } from './store'
import { PRODUCTS } from './constants'

export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]) {
  return inputs
    .flatMap((input) => {
      if (!input) return []
      if (typeof input === 'string') return input.split(' ')
      return Object.entries(input)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key)
    })
    .filter(Boolean)
    .join(' ')
}

export function getProductById(id: number, catalog: Product[] = PRODUCTS): Product | undefined {
  return catalog.find((p) => p.id === id)
}

export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

export interface AdvancedFilterOptions {
  fits?: string[]
  colors?: string[]
  fabrics?: string[]
  sleeveLengths?: string[]
  neckTypes?: string[]
  patterns?: string[]
  printStyles?: string[]
  trimColors?: string[]
  buttons?: string[]
  waistSizes?: string[]
  lengths?: string[]
  materials?: string[]
  closures?: string[]
  pockets?: string[]
  uses?: string[]
  legStyles?: string[]
  rises?: string[]
  availability?: string | null
  discount?: number | null
  rating?: number | null
  collections?: string[]
}

export function filterAndSortProducts(
  fit: Fit | 'all',
  prices: string[],
  sort: SortMode,
  catalog: Product[] = PRODUCTS,
  category: string | string[] | 'all' = 'all',
  searchQuery: string = '',
  sizes: string[] = [],
  washes: string[] = [],
  advanced?: AdvancedFilterOptions
): Product[] {
  let list = [...catalog]

  if (searchQuery && searchQuery.trim()) {
    const clean = searchQuery.trim().toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(clean) ||
        (p.fit && p.fit.toLowerCase().includes(clean)) ||
        (p.wash && p.wash.toLowerCase().includes(clean)) ||
        (p.color && p.color.toLowerCase().includes(clean)) ||
        (p.fabric && p.fabric.toLowerCase().includes(clean)) ||
        (p.material && p.material.toLowerCase().includes(clean)) ||
        p.desc.toLowerCase().includes(clean) ||
        (p.category && p.category.toLowerCase().includes(clean)) ||
        p.price.toLowerCase().includes(clean)
    )
  }

  if (category && category !== 'all') {
    const selectedCats = Array.isArray(category)
      ? category.map((c) => c.toLowerCase()).filter(Boolean)
      : category
          .split(',')
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean)

    if (selectedCats.length > 0 && !selectedCats.includes('all')) {
      list = list.filter((p) => {
        return selectedCats.some((cat) => {
          if (cat === 'sale') {
            return p.badge?.toLowerCase() === 'sale' || p.priceNum <= 1500
          }
          return p.category?.toLowerCase() === cat
        })
      })
    }
  }

  if (fit !== 'all') {
    list = list.filter((p) => p.fit === fit)
  }

  if (advanced?.fits && advanced.fits.length > 0) {
    list = list.filter((p) => p.fit && advanced.fits?.includes(p.fit))
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

  if (sizes.length > 0) {
    list = list.filter((p) =>
      p.sizes?.some((s) => sizes.includes(s))
    )
  }

  if (washes.length > 0) {
    list = list.filter((p) =>
      p.wash && washes.some((w) => p.wash?.toLowerCase().includes(w.toLowerCase()))
    )
  }

  if (advanced?.colors && advanced.colors.length > 0) {
    list = list.filter((p) =>
      advanced.colors?.some((c) =>
        (p.color && p.color.toLowerCase() === c.toLowerCase()) ||
        (p.wash && p.wash.toLowerCase().includes(c.toLowerCase()))
      )
    )
  }

  if (advanced?.fabrics && advanced.fabrics.length > 0) {
    list = list.filter((p) =>
      advanced.fabrics?.some((f) =>
        (p.fabric && p.fabric.toLowerCase().includes(f.toLowerCase())) ||
        (p.material && p.material.toLowerCase().includes(f.toLowerCase()))
      )
    )
  }

  if (advanced?.materials && advanced.materials.length > 0) {
    list = list.filter((p) =>
      advanced.materials?.some((m) =>
        (p.material && p.material.toLowerCase().includes(m.toLowerCase())) ||
        (p.fabric && p.fabric.toLowerCase().includes(m.toLowerCase()))
      )
    )
  }

  if (advanced?.sleeveLengths && advanced.sleeveLengths.length > 0) {
    list = list.filter((p) =>
      p.sleeveLength && advanced.sleeveLengths?.includes(p.sleeveLength)
    )
  }

  if (advanced?.neckTypes && advanced.neckTypes.length > 0) {
    list = list.filter((p) =>
      p.neckType && advanced.neckTypes?.includes(p.neckType)
    )
  }

  if (advanced?.patterns && advanced.patterns.length > 0) {
    list = list.filter((p) =>
      p.pattern && advanced.patterns?.includes(p.pattern)
    )
  }

  if (advanced?.printStyles && advanced.printStyles.length > 0) {
    list = list.filter((p) =>
      p.printStyle && advanced.printStyles?.includes(p.printStyle)
    )
  }

  if (advanced?.trimColors && advanced.trimColors.length > 0) {
    list = list.filter((p) =>
      p.trimColor && advanced.trimColors?.includes(p.trimColor)
    )
  }

  if (advanced?.buttons && advanced.buttons.length > 0) {
    list = list.filter((p) =>
      p.buttons && advanced.buttons?.includes(p.buttons)
    )
  }

  if (advanced?.waistSizes && advanced.waistSizes.length > 0) {
    list = list.filter((p) =>
      p.waistSize?.some((ws) => advanced.waistSizes?.includes(ws)) ||
      p.sizes?.some((s) => advanced.waistSizes?.includes(s))
    )
  }

  if (advanced?.lengths && advanced.lengths.length > 0) {
    list = list.filter((p) =>
      p.length && advanced.lengths?.includes(p.length)
    )
  }

  if (advanced?.closures && advanced.closures.length > 0) {
    list = list.filter((p) =>
      p.closure && advanced.closures?.includes(p.closure)
    )
  }

  if (advanced?.pockets && advanced.pockets.length > 0) {
    list = list.filter((p) =>
      p.pockets && advanced.pockets?.includes(p.pockets)
    )
  }

  if (advanced?.uses && advanced.uses.length > 0) {
    list = list.filter((p) =>
      p.use && advanced.uses?.includes(p.use)
    )
  }

  if (advanced?.legStyles && advanced.legStyles.length > 0) {
    list = list.filter((p) =>
      p.legStyle && advanced.legStyles?.includes(p.legStyle)
    )
  }

  if (advanced?.rises && advanced.rises.length > 0) {
    list = list.filter((p) =>
      p.rise && advanced.rises?.includes(p.rise)
    )
  }

  if (advanced?.availability) {
    if (advanced.availability === 'in-stock') {
      list = list.filter((p) => p.inStock !== false)
    } else if (advanced.availability === 'out-of-stock') {
      list = list.filter((p) => p.inStock === false)
    }
  }

  if (advanced?.discount !== null && advanced?.discount !== undefined) {
    list = list.filter((p) => {
      const orig = Math.round(p.priceNum * 1.38)
      const disc = Math.round(((orig - p.priceNum) / orig) * 100)
      return disc >= (advanced.discount as number)
    })
  }

  if (advanced?.rating !== null && advanced?.rating !== undefined) {
    list = list.filter((p) => (p.rating ?? 4.5) >= (advanced.rating as number))
  }

  if (advanced?.collections && advanced.collections.length > 0) {
    list = list.filter((p) =>
      (p.collection && advanced.collections?.includes(p.collection)) ||
      (p.badge && advanced.collections?.includes(p.badge))
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
      (p.fit && p.fit.toLowerCase().includes(clean)) ||
      (p.wash && p.wash.toLowerCase().includes(clean)) ||
      p.desc.toLowerCase().includes(clean) ||
      p.price.toLowerCase().includes(clean)
  )
}
