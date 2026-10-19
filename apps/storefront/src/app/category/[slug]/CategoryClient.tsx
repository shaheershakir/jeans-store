'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { CATEGORY_FILTERS, FITS } from '@/lib/constants'
import { useCartStore, useFilterStore } from '@/lib/store'
import { filterAndSortProducts } from '@/lib/utils'
import type { PriceRange, SortMode } from '@/lib/store'
import ProductCard from '@/components/ProductCard'
import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'
import { getProductSlug } from '@/lib/products'

const PRICE_LABELS: Record<PriceRange, string> = {
  'under-1500': 'Under ₹1,500',
  '1500-2000': '₹1,500 – ₹1,999',
  'above-2000': '₹2,000 & Above',
}

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'featured', label: 'Featured' },
  { mode: 'price-asc', label: 'Price: Low to High' },
  { mode: 'price-desc', label: 'Price: High to Low' },
]

interface CategoryClientProps {
  products: Product[]
  category: string
  title: string
}

export default function CategoryClient({ products, category: initialCategory, title }: CategoryClientProps) {
  const category = useFilterStore((s) => s.category)
  const fit = useFilterStore((s) => s.fit)
  const prices = useFilterStore((s) => s.prices)
  const sort = useFilterStore((s) => s.sort)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const setCategory = useFilterStore((s) => s.setCategory)
  const setFit = useFilterStore((s) => s.setFit)
  const togglePrice = useFilterStore((s) => s.togglePrice)
  const setSort = useFilterStore((s) => s.setSort)
  const reset = useFilterStore((s) => s.reset)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Initialise category from the route on mount
  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useFilterStore.persist.rehydrate()
    setCategory(initialCategory)
  }, [initialCategory, setCategory])

  useEffect(() => {
    if (products && products.length > 0) {
      trackEvent('product_list_viewed', {
        list_id: `category_${initialCategory}`,
        list_name: title || initialCategory,
        products: products.slice(0, 24).map((p, idx) => ({
          product_id: p.id,
          product_name: p.name,
          product_slug: getProductSlug(p),
          category: p.category,
          price: p.priceNum,
          position: idx + 1
        }))
      })
    }
  }, [initialCategory, title])

  const filtered = filterAndSortProducts(fit, prices, sort, products, category, searchQuery)
  const activeFilterCount =
    (fit !== 'all' ? 1 : 0) + prices.length + (searchQuery.trim() ? 1 : 0)
  const showFitFilter = false

  return (
    <div className="cat-page">
      {/* Page header */}
      <div className="cat-page-header">
        <nav className="cat-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="cat-breadcrumb-link">Home</Link>
          <span className="cat-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="cat-breadcrumb-current">{title}</span>
        </nav>
        <h1 className="cat-page-title">{title}</h1>
        <p className="cat-page-count">{filtered.length} {filtered.length === 1 ? 'style' : 'styles'}</p>
      </div>

      {/* Category tabs */}
      <div className="cat-tabs-bar">
        <div className="cat-tabs-scroll" role="tablist" aria-label="Filter by category">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={category === cat.id}
              className={`category-tab-chip ${category === cat.id ? 'active' : ''}`}
              onClick={() => {
                setCategory(cat.id)
                if (cat.id !== 'all') setFit('all')
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="cat-toolbar">
        <div className="cat-toolbar-inner">
          {/* Fit pills */}
          {showFitFilter ? (
            <div className="fit-pills-scroll" role="tablist" aria-label="Filter by product fit">
              <button
                type="button"
                role="tab"
                aria-selected={fit === 'all'}
                className={`pill-btn ${fit === 'all' ? 'active' : ''}`}
                onClick={() => setFit('all')}
              >
                All Fits <span className="pill-count">{products.filter((p) => p.fit !== undefined).length}</span>
              </button>
              {FITS.map((f) => {
                const count = products.filter((p) => p.fit === f).length
                return (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={fit === f}
                    className={`pill-btn ${fit === f ? 'active' : ''}`}
                    onClick={() => setFit(f)}
                  >
                    {f} <span className="pill-count">{count}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div />
          )}

          {/* Sort + filters */}
          <div className="toolbar-actions">
            <button
              type="button"
              className={`filter-drawer-toggle ${activeFilterCount > 0 ? 'has-active' : ''}`}
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && <span className="filter-badge-pill">{activeFilterCount}</span>}
            </button>

            <div className="sort-dropdown-wrap">
              <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.mode} value={opt.mode}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="filter-drawer-panel">
            <div className="filter-drawer-content">
              <div className="filter-group">
                <span className="filter-group-heading">Price Range</span>
                <div className="filter-checkbox-list">
                  {(Object.keys(PRICE_LABELS) as PriceRange[]).map((range) => (
                    <label key={range} className="custom-checkbox-label">
                      <input
                        type="checkbox"
                        checked={prices.includes(range)}
                        onChange={() => togglePrice(range)}
                      />
                      <span className="checkbox-custom" />
                      <span className="checkbox-text">{PRICE_LABELS[range]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="filter-drawer-footer">
                <span className="filter-status-text">
                  Showing {filtered.length} of {products.length} styles
                </span>
                {activeFilterCount > 0 && (
                  <button type="button" className="clear-filters-btn" onClick={reset}>
                    Reset all filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <section className="catalog-section">
        {filtered.length === 0 ? (
          <div className="catalog-empty-state">
            <p className="empty-title">No styles match those filters.</p>
            <p className="empty-desc">Try resetting your filter parameters.</p>
            <button className="reset-catalog-btn" type="button" onClick={reset}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="collection-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
