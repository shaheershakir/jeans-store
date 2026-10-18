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
    <div className="search-page-container">
      {/* 1. Mobile & Desktop Sticky Search Bar */}
      <div className="search-page-header">
        <div className="search-page-bar-inner">
          <button
            type="button"
            className="search-back-btn"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <form className="search-form-control" onSubmit={handleFormSubmit} role="search">
            <SearchIcon className="search-input-icon" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className="search-main-input"
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
                className="search-clear-btn"
                onClick={handleClear}
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* 2. Quick Tags Bar */}
        <div className="search-filter-pills-bar">
          <div className="search-pills-scroll">
            <span className="search-pill-label">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              POPULAR:
            </span>
            {POPULAR_TAGS.map((tag) => {
              const active = query.toLowerCase() === tag.toLowerCase()
              return (
                <button
                  key={tag}
                  type="button"
                  className={`search-pill-btn ${active ? 'active' : ''}`}
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
      <div className="search-page-content">
        {/* Category Filter Pills & Sort Bar */}
        <div className="search-meta-bar">
          <div className="search-categories-scroll">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`search-cat-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="search-results-summary">
            <span className="search-count-text">
              {query.trim() ? (
                <>
                  Showing <b>{searchResults.length}</b> {searchResults.length === 1 ? 'item' : 'items'} for{' '}
                  <span className="search-term-highlight">“{query}”</span>
                </>
              ) : (
                <>
                  All Products <b>({searchResults.length})</b>
                </>
              )}
            </span>

            <div className="search-sort-wrap">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 mr-1" />
              <select
                className="search-sort-select"
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
          <div className="search-zero-state">
            <div className="search-zero-icon">
              <SearchIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="search-zero-title">No styles found for “{query}”</h3>
            <p className="search-zero-desc">
              Check your spelling or explore our popular everyday heavy cotton fits, stripes, and bottomwear.
            </p>

            <div className="search-zero-tags">
              <span>TRY SEARCHING:</span>
              <div className="search-zero-pills">
                {POPULAR_TAGS.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="search-zero-pill"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Link href="/shop" className="search-zero-cta">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Entire Collection
            </Link>
          </div>
        ) : (
          <div className="shop-grid search-grid-spacing">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
