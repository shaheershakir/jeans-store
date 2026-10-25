'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  TrendingUp,
  Clock,
  Sparkles,
  Check
} from 'lucide-react'
import type { Product } from '@/lib/constants'
import ProductCard from '@/components/ProductCard'
import {
  searchProducts,
  getPopularSearches,
  getRecommendedProducts
} from '@/lib/utils'
import { getColorHex, getAvailableProductSizes } from '@/lib/products'
import { useSearchHistoryStore, useFavoriteStore } from '@/lib/store'
import { trackEvent } from '@/lib/analytics'

const QUICK_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'waffle', label: 'Waffle' },
  { id: 'fullsleeve', label: 'Fullsleeve' },
  { id: 'drsleeve', label: 'Drsleeve' },
  { id: 'printed-tees', label: 'Printed Tees' },
  { id: 'ringer-tees', label: 'Ringer Tees' },
  { id: 'henley', label: 'Henley' },
  { id: 'trackpants', label: 'Trackpants' },
  { id: 'sweatpants', label: 'Sweatpants' }
] as const

type CategoryId = (typeof QUICK_CATEGORIES)[number]['id']

const COLOR_PILLS = [
  'All Colors',
  'Black',
  'White',
  'Charcoal',
  'Navy',
  'Grey',
  'Green',
  'Beige',
  'Brown',
  'Red'
] as const

type SortOption = 'relevance' | 'price-asc' | 'price-desc'

interface SearchClientProps {
  initialProducts: Product[]
  initialQuery?: string
  initialCategory?: string
}

function matchesCategory(product: Product, category: string): boolean {
  if (category === 'all') return true
  const cat = (product.category ?? '').toLowerCase()
  if (category === 'waffle') {
    return (
      cat === 'waffle' ||
      (product.fabric ?? '').toLowerCase().includes('waffle') ||
      (product.name ?? '').toLowerCase().includes('waffle')
    )
  }
  return cat === category.toLowerCase()
}

function matchesColor(product: Product, selectedColor: string): boolean {
  if (!selectedColor || selectedColor === 'All Colors') return true
  const col = selectedColor.toLowerCase()
  if (product.color && product.color.toLowerCase().includes(col)) return true
  if (product.variants?.some((v) => v.color?.toLowerCase().includes(col))) return true
  return false
}

export default function SearchClient({
  initialProducts,
  initialQuery = '',
  initialCategory = 'all'
}: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? initialQuery
  const urlCategory = searchParams.get('category') ?? initialCategory

  const [query, setQuery] = useState(urlQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'all')
  const [selectedColor, setSelectedColor] = useState<string>('All Colors')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  const inputRef = useRef<HTMLInputElement>(null)

  const recentSearches = useSearchHistoryStore((s) => s.recentSearches)
  const recentlyViewedIds = useSearchHistoryStore((s) => s.recentlyViewedIds)
  const addRecentSearch = useSearchHistoryStore((s) => s.addRecentSearch)
  const removeRecentSearch = useSearchHistoryStore((s) => s.removeRecentSearch)
  const clearRecentSearches = useSearchHistoryStore((s) => s.clearRecentSearches)
  const favorites = useFavoriteStore((s) => s.favorites)

  // Hydrate stores on mount
  useEffect(() => {
    void useSearchHistoryStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Sync state if URL query changes via browser back/forward
  useEffect(() => {
    const currentQ = searchParams.get('q') ?? ''
    const currentCat = searchParams.get('category') ?? 'all'
    setQuery(currentQ)
    setSelectedCategory(currentCat)
  }, [searchParams])

  // Sync q and category to URL using window.history.replaceState debounced by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (query.trim()) {
        params.set('q', query.trim())
      } else {
        params.delete('q')
      }
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      } else {
        params.delete('category')
      }
      const newRelativePath =
        window.location.pathname + (params.toString() ? '?' + params.toString() : '')
      window.history.replaceState(null, '', newRelativePath)
    }, 150)

    return () => clearTimeout(timer)
  }, [query, selectedCategory])

  // Popular searches with live item counts
  const popularSearches = useMemo(() => {
    return getPopularSearches(initialProducts)
  }, [initialProducts])

  // Filtered & sorted products
  const searchResults = useMemo(() => {
    let list = query.trim() ? searchProducts(query, initialProducts) : [...initialProducts]

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) => matchesCategory(p, selectedCategory))
    }

    // Color filter
    if (selectedColor !== 'All Colors') {
      list = list.filter((p) => matchesColor(p, selectedColor))
    }

    // In Stock Only
    if (inStockOnly) {
      list = list.filter((p) => p.inStock !== false && getAvailableProductSizes(p).length > 0)
    }

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.priceNum - b.priceNum)
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.priceNum - a.priceNum)
    }

    return list
  }, [query, initialProducts, selectedCategory, selectedColor, inStockOnly, sortBy])

  // Recommended products for discovery or zero-result fallback
  const recommendedProducts = useMemo(() => {
    return getRecommendedProducts(initialProducts, {
      favoriteIds: favorites,
      recentlyViewedIds,
      recentQueries: recentSearches,
      limit: 4
    })
  }, [initialProducts, favorites, recentlyViewedIds, recentSearches])

  const isDiscovery = query.trim() === '' && selectedCategory === 'all'

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('all')
    setSelectedColor('All Colors')
    setInStockOnly(false)
    setSortBy('relevance')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      addRecentSearch(query.trim())
      trackEvent('product_list_viewed', {
        list_id: 'search',
        list_name: `Search: ${query.trim()}`,
        products: searchResults.slice(0, 10).map((p, idx) => ({
          product_id: p.id,
          product_name: p.name,
          category: p.category,
          price: p.priceNum,
          position: idx + 1
        }))
      })
    }
  }

  return (
    <div className="min-h-[calc(100dvh-120px)] bg-[#faf9f6] pb-[clamp(48px,8vw,96px)]">
      {/* 1. Sticky Search & Filter Header */}
      <div className="sticky top-0 z-[35] border-b border-black/8 bg-white/95 backdrop-blur-xl pt-[max(8px,env(safe-area-inset-top,0px))]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2.5 px-4 sm:px-6 lg:px-8 py-2.5">
          <button
            type="button"
            className="flex h-10 w-10 min-w-10 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-transparent bg-transparent text-zinc-900 transition-colors duration-150 hover:bg-zinc-100"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <form
            className="relative flex flex-1 items-center rounded-full border border-zinc-200 bg-zinc-50 transition-all duration-200 focus-within:border-zinc-950 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-950/10"
            onSubmit={handleFormSubmit}
            role="search"
          >
            <SearchIcon
              className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-zinc-400"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              className="h-11 w-full border-0 bg-transparent py-0 pl-[42px] pr-10 font-sans text-sm sm:text-base text-zinc-950 outline-none placeholder:text-zinc-400 font-medium"
              placeholder="Search heavyweight combed cotton tees, bottomwear, or colors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              aria-label="Search catalog"
            />
            {query && (
              <button
                type="button"
                className="absolute right-2.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 transition-colors"
                onClick={handleClear}
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Categories Strip */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {QUICK_CATEGORIES.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Popular & Recent Tag Bars */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-3 space-y-1.5">
          {/* Recent Searches Row */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="inline-flex items-center whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">
                <Clock className="w-3 h-3 mr-1 text-zinc-400" />
                RECENT:
              </span>
              {recentSearches.map((term) => (
                <span
                  key={term}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors cursor-pointer group shrink-0"
                  onClick={() => {
                    setQuery(term)
                    addRecentSearch(term)
                  }}
                >
                  <span>{term}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeRecentSearch(term)
                    }}
                    className="p-0.5 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-black/10 transition-colors"
                    aria-label={`Remove recent search ${term}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-[11px] text-zinc-500 hover:text-zinc-950 underline underline-offset-2 ml-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {/* Popular Searches Row */}
          {popularSearches.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="inline-flex items-center whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">
                <TrendingUp className="w-3 h-3 mr-1 text-zinc-400" />
                POPULAR:
              </span>
              {popularSearches.map(({ term, count }) => {
                const active = query.toLowerCase() === term.toLowerCase()
                return (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term)
                      setSelectedCategory('all')
                      addRecentSearch(term)
                    }}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer shrink-0 ${
                      active
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:text-zinc-950'
                    }`}
                  >
                    <span>{term}</span>
                    <span className={`text-[10px] ${active ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      · {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Search Body */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Secondary Filter & Sort Bar */}
        <div className="mb-6 pb-4 border-b border-black/8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Color Pills & In Stock toggle */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            {COLOR_PILLS.map((color) => {
              const active = selectedColor === color
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-950'
                  }`}
                >
                  {color !== 'All Colors' && (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                  )}
                  {color}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ml-1 ${
                inStockOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${inStockOnly ? 'opacity-100' : 'opacity-30'}`} />
              In Stock Only
            </button>
          </div>

          {/* Result Count and Sort Dropdown */}
          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
            <span className="text-xs font-medium text-zinc-500">
              <strong className="text-zinc-950">{searchResults.length}</strong> {searchResults.length === 1 ? 'style' : 'styles'}
            </span>

            <label className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-0 outline-none text-zinc-900 cursor-pointer font-medium"
                aria-label="Sort products"
              >
                <option value="relevance">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>
          </div>
        </div>

        {/* 3. Discovery State: Recommended For You Strip above catalog grid */}
        {isDiscovery && recommendedProducts.length > 0 && (
          <section className="mb-10 pb-8 border-b border-black/8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-700" />
                <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                  Recommended For You
                </h2>
              </div>
              <span className="text-xs text-zinc-500 font-medium">Curated for your preferences</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {recommendedProducts.map((product) => (
                <ProductCard key={`rec-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 4. Active Results or Zero-Result State */}
        {searchResults.length === 0 ? (
          <div className="space-y-10 py-6">
            <div className="mx-auto max-w-lg px-4 py-12 text-center rounded-2xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <SearchIcon className="w-7 h-7 text-zinc-400" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-zinc-950">
                No styles found for &ldquo;{query.trim() || selectedCategory}&rdquo;
              </h3>
              <p className="mb-6 text-xs text-zinc-500 max-w-sm mx-auto">
                Check your spelling, or select one of our curated popular tags below.
              </p>

              {popularSearches.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {popularSearches.slice(0, 6).map(({ term, count }) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setQuery(term)
                        setSelectedCategory('all')
                        setSelectedColor('All Colors')
                        setInStockOnly(false)
                        addRecentSearch(term)
                      }}
                      className="px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-800 transition-colors cursor-pointer"
                    >
                      {term} · {count}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                Browse Entire Collection
              </button>
            </div>

            {/* Guaranteed fallback recommended grid */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-zinc-700" />
                <h3 className="text-base font-bold text-zinc-950">
                  Recommended Alternatives
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {recommendedProducts.map((product) => (
                  <ProductCard key={`fallback-${product.id}`} product={product} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {isDiscovery && (
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
                All Products
              </h3>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
