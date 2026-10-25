'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Plus,
  Check,
  Eye
} from 'lucide-react'
import type { Product } from '@/lib/constants'
import { PRODUCTS } from '@/lib/constants'
import {
  searchProducts,
  getPopularSearches,
  getRecommendedProducts
} from '@/lib/utils'
import { getAvailableProductSizes, getProductUrl } from '@/lib/products'
import {
  useUIStore,
  useCartStore,
  useFavoriteStore,
  useSearchHistoryStore
} from '@/lib/store'

const OVERLAY_CATEGORIES = [
  { id: 'all', label: 'All' },
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

type CategoryId = (typeof OVERLAY_CATEGORIES)[number]['id']

function matchesCategory(product: Product, category: CategoryId): boolean {
  if (category === 'all') return true
  const cat = (product.category ?? '').toLowerCase()
  if (category === 'waffle') {
    return (
      cat === 'waffle' ||
      (product.fabric ?? '').toLowerCase().includes('waffle') ||
      (product.name ?? '').toLowerCase().includes('waffle')
    )
  }
  return cat === category
}

export default function SearchOverlay() {
  const router = useRouter()
  const overlay = useUIStore((s) => s.overlay)
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const addItem = useCartStore((s) => s.addItem)
  const showToast = useUIStore((s) => s.showToast)
  const favorites = useFavoriteStore((s) => s.favorites)

  const recentSearches = useSearchHistoryStore((s) => s.recentSearches)
  const recentlyViewedIds = useSearchHistoryStore((s) => s.recentlyViewedIds)
  const addRecentSearch = useSearchHistoryStore((s) => s.addRecentSearch)
  const removeRecentSearch = useSearchHistoryStore((s) => s.removeRecentSearch)
  const clearRecentSearches = useSearchHistoryStore((s) => s.clearRecentSearches)

  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const isOpen = overlay === 'search'

  // Hydrate stores on open
  useEffect(() => {
    if (isOpen) {
      void useSearchHistoryStore.persist.rehydrate()
      void useFavoriteStore.persist.rehydrate()
      void useCartStore.persist.rehydrate()
    }
  }, [isOpen])

  // Fetch live products
  useEffect(() => {
    let isSubscribed = true
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isSubscribed && Array.isArray(data) && data.length > 0) {
          setCatalog(data)
        }
      })
      .catch(() => {})
    return () => {
      isSubscribed = false
    }
  }, [])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setQuery('')
      setSelectedCategory('all')
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  // Popular searches with live counts
  const popularSearches = useMemo(() => {
    return getPopularSearches(catalog)
  }, [catalog])

  // Filtered active results
  const searchResults = useMemo(() => {
    if (!query.trim() && selectedCategory === 'all') {
      return []
    }
    const filteredByQuery = query.trim() ? searchProducts(query, catalog) : catalog
    return filteredByQuery.filter((p) => matchesCategory(p, selectedCategory))
  }, [query, catalog, selectedCategory])

  // Recommendations for discovery and zero-results
  const recommendedProducts = useMemo(() => {
    return getRecommendedProducts(catalog, {
      favoriteIds: favorites,
      recentlyViewedIds,
      recentQueries: recentSearches,
      limit: 4
    })
  }, [catalog, favorites, recentlyViewedIds, recentSearches])

  // Recently viewed products
  const recentlyViewedProducts = useMemo(() => {
    if (recentlyViewedIds.length === 0) return []
    const map = new Map(catalog.map((p) => [String(p.id), p]))
    return recentlyViewedIds
      .map((id) => map.get(id))
      .filter((p): p is Product => Boolean(p))
  }, [recentlyViewedIds, catalog])

  const isDiscovery = query.trim() === '' && selectedCategory === 'all'

  // Debounce commit to recent searches after 1200ms pause with >= 1 result
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || searchResults.length === 0) return
    const timer = setTimeout(() => {
      addRecentSearch(trimmed)
    }, 1200)
    return () => clearTimeout(timer)
  }, [query, searchResults.length, addRecentSearch])

  const handleSelectProduct = useCallback(
    (product: Product) => {
      if (query.trim()) {
        addRecentSearch(query.trim())
      }
      closeOverlay()
      router.push(getProductUrl(product))
    },
    [query, addRecentSearch, closeOverlay, router]
  )

  const handleQuickAdd = useCallback(
    (product: Product, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const sizes = getAvailableProductSizes(product)
      const size = sizes.includes('L') ? 'L' : sizes[0] || 'M'
      addItem(product.id, size, product, product.color)
      showToast(`Added ${product.name} (${size}) to bag`)

      setAddedIds((prev) => new Set(prev).add(product.id))
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev)
          next.delete(product.id)
          return next
        })
      }, 1500)
    },
    [addItem, showToast]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeOverlay()
      return
    }

    const currentList = isDiscovery ? recommendedProducts : searchResults
    if (currentList.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % currentList.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? currentList.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && currentList[highlightedIndex]) {
        handleSelectProduct(currentList[highlightedIndex])
      } else if (query.trim()) {
        addRecentSearch(query.trim())
        closeOverlay()
        router.push(
          `/search?q=${encodeURIComponent(query.trim())}${
            selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''
          }`
        )
      }
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(
        `[data-highlight-index="${highlightedIndex}"]`
      ) as HTMLElement | null
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Catalog"
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={closeOverlay}
        aria-hidden="true"
      />

      {/* Surface: 92dvh bottom sheet on mobile, centered modal on desktop */}
      <div
        className="relative z-10 w-full md:max-w-[760px] h-[92dvh] md:h-auto md:max-h-[85vh] bg-[#faf9f6]/98 md:bg-white/95 backdrop-blur-2xl rounded-t-[24px] md:rounded-[20px] border border-black/10 shadow-[0_24px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-auth-enter motion-reduce:animate-none"
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-black/10 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-zinc-500 shrink-0" strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlightedIndex(-1)
              }}
              placeholder="Search by product, fit, color, or category..."
              className="flex-1 bg-transparent text-sm sm:text-base text-zinc-950 placeholder:text-zinc-400 outline-none font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={closeOverlay}
              className="px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
              aria-label="Close search overlay"
            >
              ESC
            </button>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {OVERLAY_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setHighlightedIndex(-1)
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-zinc-100/90 text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-950'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Discovery State */}
          {isDiscovery ? (
            <div className="space-y-6">
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200/80 rounded-full text-xs font-medium text-zinc-800 transition-colors group cursor-pointer"
                        onClick={() => {
                          setQuery(term)
                          addRecentSearch(term)
                        }}
                      >
                        <Clock className="h-3 w-3 text-zinc-400 group-hover:text-zinc-700" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeRecentSearch(term)
                          }}
                          className="p-0.5 rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-black/10 transition-colors ml-0.5"
                          aria-label={`Remove recent search ${term}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches Section */}
              {popularSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Popular Searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map(({ term, count }) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term)
                          addRecentSearch(term)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200/80 rounded-full text-xs font-medium text-zinc-800 transition-colors cursor-pointer"
                      >
                        <span>{term}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">· {count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Viewed Strip */}
              {recentlyViewedProducts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                    <Eye className="h-3.5 w-3.5" />
                    Recently Viewed
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {recentlyViewedProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="flex-shrink-0 w-28 group cursor-pointer"
                      >
                        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-100 mb-1.5">
                          <Image
                            src={product.img}
                            alt={product.name}
                            fill
                            sizes="112px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <p className="text-xs font-medium text-zinc-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] font-semibold text-zinc-600">
                          {product.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended For You Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    Recommended For You
                  </span>
                  <Link
                    href="/shop"
                    onClick={closeOverlay}
                    className="text-xs font-semibold text-zinc-800 hover:text-black flex items-center gap-1"
                  >
                    View catalog <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recommendedProducts.map((product, idx) => {
                    const isHighlighted = highlightedIndex === idx
                    const isAdded = addedIds.has(product.id)
                    return (
                      <div
                        key={product.id}
                        data-highlight-index={idx}
                        onClick={() => handleSelectProduct(product)}
                        className={`group relative rounded-xl p-2 bg-white/70 border transition-all cursor-pointer ${
                          isHighlighted
                            ? 'border-zinc-950 ring-2 ring-zinc-950/20 shadow-sm'
                            : 'border-black/5 hover:border-black/15 shadow-2xs'
                        }`}
                      >
                        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-100 mb-2">
                          <Image
                            src={product.img}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 45vw, 160px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-zinc-950">
                            {product.price}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(product, e)}
                            className={`p-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-100 hover:bg-zinc-950 hover:text-white text-zinc-900'
                            }`}
                            aria-label={`Add ${product.name} to bag`}
                          >
                            {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            /* Active Results State */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                <span>
                  Found <strong className="text-zinc-900">{searchResults.length}</strong> styles
                </span>
                <span className="hidden sm:inline">Use ↑↓ arrows to navigate, Enter to select</span>
              </div>

              <div className="space-y-2">
                {searchResults.map((product, idx) => {
                  const isHighlighted = highlightedIndex === idx
                  const isAdded = addedIds.has(product.id)
                  return (
                    <div
                      key={product.id}
                      data-highlight-index={idx}
                      onClick={() => handleSelectProduct(product)}
                      className={`flex items-center gap-3.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isHighlighted
                          ? 'bg-zinc-100/90 border-zinc-950 shadow-xs ring-1 ring-zinc-950/20'
                          : 'bg-white/60 hover:bg-white border-black/5 hover:border-black/15 shadow-2xs'
                      }`}
                    >
                      <div className="h-16 w-12 sm:h-20 sm:w-16 relative rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        <Image
                          src={product.img}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                            {product.category || 'Apparel'}
                          </span>
                          {product.color && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {product.color}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-950 truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 mt-0.5">
                          {product.price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs active:scale-95'
                        }`}
                        aria-label={`Add ${product.name} to bag`}
                      >
                        {isAdded ? (
                          <span className="flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Added
                          </span>
                        ) : (
                          '+ BAG'
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Zero-Result State with Recommended Fallback */
            <div className="py-4 space-y-6">
              <div className="text-center py-6 px-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <Search className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-zinc-900">
                  No styles found for &ldquo;{query}&rdquo;
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Check your spelling or try broader terms like &ldquo;waffle&rdquo;, &ldquo;stripes&rdquo;, or &ldquo;oversized&rdquo;.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommended Alternatives
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recommendedProducts.map((product) => {
                    const isAdded = addedIds.has(product.id)
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="group relative rounded-xl p-2 bg-white border border-black/5 hover:border-black/15 shadow-2xs transition-all cursor-pointer"
                      >
                        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-zinc-100 mb-2">
                          <Image
                            src={product.img}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 45vw, 160px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-zinc-950">
                            {product.price}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(product, e)}
                            className={`p-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-100 hover:bg-zinc-950 hover:text-white text-zinc-900'
                            }`}
                            aria-label={`Add ${product.name} to bag`}
                          >
                            {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-zinc-50/80 border-t border-black/5 flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            {query.trim()
              ? `Press Enter to search for "${query}"`
              : 'Type to search live catalog'}
          </span>
          <button
            type="button"
            onClick={() => {
              if (query.trim()) addRecentSearch(query.trim())
              closeOverlay()
              router.push(
                `/search${
                  query.trim()
                    ? `?q=${encodeURIComponent(query.trim())}${
                        selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''
                      }`
                    : selectedCategory !== 'all'
                    ? `?category=${selectedCategory}`
                    : ''
                }`
              )
            }}
            className="font-semibold text-zinc-900 hover:underline cursor-pointer"
          >
            Go to Full Search Page →
          </button>
        </div>
      </div>
    </div>
  )
}
