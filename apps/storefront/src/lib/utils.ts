import type { Product } from './constants'
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

export function getProductById(id: string | number, catalog: Product[] = PRODUCTS): Product | undefined {
  return catalog.find((p) => String(p.id) === String(id))
}

export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

export interface AdvancedFilterOptions {

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

  prices: string[],
  sort: SortMode,
  catalog: Product[] = PRODUCTS,
  category: string | string[] | 'all' = 'all',
  searchQuery: string = '',
  sizes: string[] = [],

  advanced?: AdvancedFilterOptions
): Product[] {
  let list = [...catalog]

  if (searchQuery && searchQuery.trim()) {
    const matchingIds = new Set(searchProducts(searchQuery, list).map((product) => product.id))
    list = list.filter((product) => matchingIds.has(product.id))
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


  if (advanced?.colors && advanced.colors.length > 0) {
    list = list.filter((p) =>
      advanced.colors?.some((c) =>
        (p.color && p.color.toLowerCase() === c.toLowerCase())
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
    list.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
  }

  return list
}

/* ── Search and Recommendation Engine ─────────────────────────────────────
   Tokenized, weighted, typo-tolerant catalog search, live popular search tags,
   and personalized recommendation engine.
   ───────────────────────────────────────────────────────────────────────── */

const SEARCH_SYNONYM_GROUPS: string[][] = [
  ['tee', 'tees', 'tshirt', 'tshirts'],
  ['pant', 'pants', 'bottom', 'bottoms', 'trackpants', 'sweatpants'],
  ['longsleeve', 'fullsleeve'],
  ['drop', 'dropshoulder', 'drsleeve'],
  ['thermal', 'honeycomb', 'waffle']
]

const SYNONYM_MAP: Map<string, string[]> = new Map()
for (const group of SEARCH_SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYM_MAP.set(word, group)
  }
}

const PHRASE_COLLAPSES: [RegExp, string][] = [
  [/\bfull\s+sleeve\b/g, 'fullsleeve'],
  [/\bdr\s+sleeve\b/g, 'drsleeve'],
  [/\bdrop\s+shoulder\b/g, 'dropshoulder'],
  [/\bt\s+shirt\b/g, 'tshirt'],
  [/\btrack\s+pant\b/g, 'trackpants'],
  [/\bsweat\s+pant\b/g, 'sweatpants']
]

export function normalizeSearchText(value: string): string {
  let text = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  for (const [pattern, replacement] of PHRASE_COLLAPSES) {
    text = text.replace(pattern, replacement)
  }
  return text
}

function expandSearchToken(token: string): string[] {
  const group = SYNONYM_MAP.get(token)
  return group ? Array.from(new Set([token, ...group])) : [token]
}

function isWithinOneEdit(a: string, b: string): boolean {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false

  let i = 0
  let j = 0
  let edits = 0

  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    edits++
    if (edits > 1) return false
    if (la > lb) {
      i++
    } else if (lb > la) {
      j++
    } else {
      i++
      j++
    }
  }

  if (i < la || j < lb) edits++
  return edits <= 1
}

interface SearchableFields {
  name: string
  nameWords: string[]
  category: string
  color: string
  meta: string
  descAndPrice: string
  allWords: string[]
}

function buildSearchableFields(product: Product): SearchableFields {
  const variantColors = (product.variants ?? [])
    .map((variant) => variant.color)
    .filter(Boolean)
    .join(' ')

  const metaFields = [
    product.badge,
    product.fabric,
    product.material,
    product.neckType,
    (product as { neck?: string }).neck,
    product.sleeveLength
  ]
    .filter(Boolean)
    .join(' ')

  const descAndPriceFields = [
    product.desc,
    product.price,
    String(product.priceNum ?? '')
  ]
    .filter(Boolean)
    .join(' ')

  const name = normalizeSearchText(product.name ?? '')
  const nameWords = name.split(' ').filter(Boolean)
  const category = normalizeSearchText(product.category ?? '')
  const color = normalizeSearchText(`${product.color ?? ''} ${variantColors}`)
  const meta = normalizeSearchText(metaFields)
  const descAndPrice = normalizeSearchText(descAndPriceFields)

  const combinedWords = Array.from(
    new Set(`${name} ${category} ${color} ${meta} ${descAndPrice}`.split(' ').filter(Boolean))
  )

  return {
    name,
    nameWords,
    category,
    color,
    meta,
    descAndPrice,
    allWords: combinedWords
  }
}

function scoreTokenAgainstFields(token: string, fields: SearchableFields): number {
  const aliases = expandSearchToken(token)
  let score = 0

  // 1. Exact or word-start match in product.name: +100, substring match: +70
  const hasExactOrWordStartName = aliases.some((alias) =>
    fields.nameWords.some((word) => word === alias || word.startsWith(alias))
  )
  if (hasExactOrWordStartName) {
    score += 100
  } else if (aliases.some((alias) => fields.name.includes(alias))) {
    score += 70
  }

  // 2. Match in product.category: +65
  if (aliases.some((alias) => fields.category.includes(alias))) {
    score += 65
  }

  // 3. Match in product.color or variants: +55
  if (aliases.some((alias) => fields.color.includes(alias))) {
    score += 55
  }

  // 4. Match in badge, fabric, material, neck, or sleeveLength: +40
  if (aliases.some((alias) => fields.meta.includes(alias))) {
    score += 40
  }

  // 5. Match in desc or price: +20
  if (aliases.some((alias) => fields.descAndPrice.includes(alias))) {
    score += 20
  }

  // 6. Typo-tolerant match (tokens >= 4 chars): +15
  if (score === 0 && token.length >= 4) {
    const hasTypoMatch = aliases.some((alias) =>
      fields.allWords.some((word) => word.length >= 4 && isWithinOneEdit(word, alias))
    )
    if (hasTypoMatch) {
      score += 15
    }
  }

  return score
}

export function searchProducts(query: string, catalog: Product[] = PRODUCTS): Product[] {
  if (!query.trim()) return [...catalog]

  const normalized = normalizeSearchText(query)
  if (!normalized) return [...catalog]

  const tokens = normalized.split(' ').filter(Boolean)
  if (tokens.length === 0) return [...catalog]

  const scored = catalog.flatMap((product) => {
    const fields = buildSearchableFields(product)
    let totalScore = 0

    for (const token of tokens) {
      const tokenScore = scoreTokenAgainstFields(token, fields)
      if (tokenScore === 0) return []
      totalScore += tokenScore
    }

    return [{ product, score: totalScore }]
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const stockDelta = (b.product.inStock !== false ? 1 : 0) - (a.product.inStock !== false ? 1 : 0)
    if (stockDelta !== 0) return stockDelta
    return (b.product.rating ?? 0) - (a.product.rating ?? 0)
  })

  return scored.map((entry) => entry.product)
}

export function getPopularSearches(catalog: Product[]): { term: string; count: number }[] {
  const candidates = [
    'Waffle',
    'Stripes',
    'Printed Tees',
    'Henley',
    'Fullsleeve',
    'Ringer Tees',
    'Trackpants',
    'Sweatpants',
    'Black',
    'Charcoal'
  ]
  return candidates
    .map((term) => ({
      term,
      count: searchProducts(term, catalog).length
    }))
    .filter((item) => item.count > 0)
}

export interface RecommendOptions {
  favoriteIds?: (string | number)[]
  recentlyViewedIds?: (string | number)[]
  recentQueries?: string[]
  limit?: number
  excludeId?: string | number
}

export function getRecommendedProducts(
  catalog: Product[],
  options: RecommendOptions = {}
): Product[] {
  const {
    favoriteIds = [],
    recentlyViewedIds = [],
    recentQueries = [],
    limit = 8,
    excludeId
  } = options

  const refIds = new Set(
    [...favoriteIds, ...recentlyViewedIds].map((id) => String(id)).filter(Boolean)
  )
  const referenceProducts = catalog.filter((p) => refIds.has(String(p.id)))

  const targetCategories = new Set(
    referenceProducts
      .map((p) => p.category?.toLowerCase().trim())
      .filter((c): c is string => Boolean(c))
  )

  const targetColors = new Set(
    referenceProducts.flatMap((p) => {
      const colors: string[] = []
      if (p.color) {
        colors.push(...p.color.toLowerCase().split('/').map((c) => c.trim()))
      }
      p.variants?.forEach((v) => {
        if (v.color) colors.push(v.color.toLowerCase().trim())
      })
      return colors.filter(Boolean)
    })
  )

  const mostRecentQuery = recentQueries[0]?.trim()
  const matchingQueryIds = new Set(
    mostRecentQuery ? searchProducts(mostRecentQuery, catalog).map((p) => p.id) : []
  )

  const candidates = catalog.filter((p) =>
    excludeId !== undefined ? String(p.id) !== String(excludeId) : true
  )

  const scored = candidates.map((product) => {
    let score = 0

    // +50 if category matches
    if (product.category && targetCategories.has(product.category.toLowerCase().trim())) {
      score += 50
    }

    // +35 if color matches
    const productColors = [
      ...(product.color ? product.color.toLowerCase().split('/').map((c) => c.trim()) : []),
      ...(product.variants?.map((v) => v.color.toLowerCase().trim()).filter(Boolean) ?? [])
    ]
    if (productColors.some((c) => targetColors.has(c))) {
      score += 35
    }

    // +40 if matches most recent query
    if (matchingQueryIds.has(product.id)) {
      score += 40
    }

    // +25 if bestseller / new / trending
    const badge = product.badge?.toLowerCase().trim()
    if (badge === 'bestseller' || badge === 'new' || badge === 'trending') {
      score += 25
    }

    // +15 if rating >= 4.6
    if (product.rating && product.rating >= 4.6) {
      score += 15
    }

    return { product, score }
  })

  scored.sort((a, b) => {
    const stockDelta = (b.product.inStock !== false ? 1 : 0) - (a.product.inStock !== false ? 1 : 0)
    if (stockDelta !== 0) return stockDelta
    if (b.score !== a.score) return b.score - a.score
    return (b.product.rating ?? 0) - (a.product.rating ?? 0)
  })

  return scored.slice(0, limit).map((s) => s.product)
}
