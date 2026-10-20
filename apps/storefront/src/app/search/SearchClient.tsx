'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import type { Product } from '@/lib/constants'
import ProductCard from '@/components/ProductCard'
import { searchProducts } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const POPULAR_TAGS = [
  'Stripes',
  'Printed tees',
  'Henley',
  'Trackpants',
  'Sweatpants',
  'Fullsleeve',
  'Black',
  'Oversized',
]

const QUICK_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'printed-tees', label: 'Printed Tees' },
  { id: 'henley', label: 'Henley' },
  { id: 'fullsleeve', label: 'Fullsleeve' },
  { id: 'trackpants', label: 'Trackpants' },
  { id: 'sweatpants', label: 'Sweatpants' },
]

type SortOption = 'relevance' | 'price-asc' | 'price-desc'

interface SearchClientProps {
  initialProducts: Product[]
  initialQuery?: string
}

export default function SearchClient({
  initialProducts,
  initialQuery = '',
}: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || initialQuery

  const [query, setQuery] = useState(urlQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Sync state if URL query changes
  useEffect(() => {
    setQuery(urlQuery)
  }, [urlQuery])

  // Update URL search param seamlessly without full page reload
  const handleQueryChange = (val: string) => {
    setQuery(val)
    const params = new URLSearchParams(window.location.search)
    if (val.trim()) {
      params.set('q', val.trim())
    } else {
      params.delete('q')
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState(null, '', newRelativePathQuery)
  }

  const handleTagClick = (tag: string) => {
    handleQueryChange(tag)
  }

  const handleClear = () => {
    handleQueryChange('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  // Filter and sort products
  const searchResults = useMemo(() => {
    let list = initialProducts

    // 1. Text Search query
    if (query.trim()) {
      list = searchProducts(query, initialProducts)
    }

    // 2. Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    // 3. Sorting
    const sorted = [...list]
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.priceNum - b.priceNum)
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.priceNum - a.priceNum)
    }

    return sorted
  }, [query, selectedCategory, sortBy, initialProducts])

  // Track search submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && searchResults.length > 0) {
      trackEvent('product_list_viewed', {
        list_id: 'search',
        list_name: `Search: ${query.trim()}`,
        products: searchResults.slice(0, 10).map((p, idx) => ({
          product_id: p.id,
          product_name: p.name,
          category: p.category,
          price: p.priceNum,
          position: idx + 1,
        })),
      })
    }
  }

  return (
    <div className="min-h-[calc(100dvh-120px)] bg-paper pb-[clamp(48px,8vw,96px)]">
      {/* 1. Mobile & Desktop Sticky Search Bar */}
      <div className="sticky top-0 z-[35] border-b border-line bg-[rgba(255,255,255,0.96)] pt-[max(8px,env(safe-area-inset-top,0px))]">
        <div className="mx-auto flex max-w-[1240px] items-center gap-2.5 px-4 py-2.5">
          <button
            type="button"
            className="flex h-10 w-10 min-w-10 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-transparent bg-transparent text-ink transition-all duration-150 ease-[ease] hover:bg-bone"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <form className="relative flex flex-1 items-center rounded-full border border-transparent bg-bone transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-ink focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(12,14,18,0.08)]" onSubmit={handleFormSubmit} role="search">
            <SearchIcon className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-[#71717a]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className="h-11 w-full border-0 bg-transparent py-0 pl-[42px] pr-10 font-ui text-base text-ink outline-none placeholder:text-[13.5px] placeholder:text-[#a1a1aa]"
              placeholder="Search by fit, style, wash, or fabric..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
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
                className="absolute right-2.5 flex h-[26px] w-[26px] cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 bg-[#e4e4e7] text-[#52525b]"
                onClick={handleClear}
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* 2. Quick Tags Bar */}
        <div className="mx-auto max-w-[1240px] px-4 pb-2.5">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
            <span className="inline-flex items-center whitespace-nowrap font-brand text-[10.5px] font-bold tracking-[0.06em] text-ink-muted">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              POPULAR:
            </span>
            {POPULAR_TAGS.map((tag) => {
              const active = query.toLowerCase() === tag.toLowerCase()
              return (
                <button
                  key={tag}
                  type="button"
                  className={`cursor-pointer touch-manipulation whitespace-nowrap rounded-2xl border px-3 py-[5px] font-ui text-[11.5px] font-medium transition-all duration-150 ease-[ease] ${active ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink-secondary hover:border-ink hover:text-ink'}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Search Body Content */}
      <div className="mx-auto max-w-[1240px] px-4 py-5">
        {/* Category Filter Pills & Sort Bar */}
        <div className="mb-6 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`cursor-pointer touch-manipulation whitespace-nowrap rounded-[6px] border border-transparent px-3.5 py-1.5 font-ui text-[12.5px] font-medium transition-all duration-150 ease-[ease] ${selectedCategory === cat.id ? 'bg-ink text-white' : 'bg-bone text-[#52525b]'}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-ui text-[13px] text-[#52525b]">
              {query.trim() ? (
                <>
                  Showing <b>{searchResults.length}</b> {searchResults.length === 1 ? 'item' : 'items'} for{' '}
                  <span className="font-semibold text-ink">“{query}”</span>
                </>
              ) : (
                <>
                  All Products <b>({searchResults.length})</b>
                </>
              )}
            </span>

            <div className="inline-flex items-center rounded-[6px] border border-line bg-bone px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 mr-1" />
              <select
                className="cursor-pointer border-0 bg-transparent font-ui text-xs font-medium text-[#18181b] outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort search results"
              >
                <option value="relevance">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Product Grid or Empty State */}
        {searchResults.length === 0 ? (
          <div className="mx-auto max-w-[480px] px-5 py-16 text-center">
            <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-bone">
              <SearchIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="mb-2 font-brand text-[20px] leading-[26px] font-bold text-ink">No styles found for “{query}”</h3>
            <p className="mb-6 font-ui text-[13.5px] leading-normal text-ink-muted">
              Check your spelling or explore our popular everyday heavy cotton fits, stripes, and bottomwear.
            </p>

            <div className="mb-7">
              <span className="mb-2.5 block font-brand text-[10.5px] font-bold tracking-[0.08em] text-ink-muted">TRY SEARCHING:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_TAGS.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="cursor-pointer rounded-2xl border border-line bg-white px-3.5 py-1.5 font-ui text-[12px] leading-[18px] font-medium transition-all duration-150 ease-[ease] hover:bg-ink hover:text-white"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Link href="/shop" className="inline-flex h-[46px] items-center justify-center rounded-[6px] bg-ink px-6 font-brand text-[13.5px] font-semibold tracking-[0.03em] text-white no-underline transition-opacity duration-150 ease-[ease] hover:opacity-90">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Entire Collection
            </Link>
          </div>
        ) : (
          <div className="mt-2.5 grid grid-cols-4 gap-x-4 gap-y-6 [@media(max-width:1200px)]:grid-cols-3 [@media(max-width:768px)]:grid-cols-2 [@media(max-width:768px)]:gap-x-2.5 [@media(max-width:768px)]:gap-y-4">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
