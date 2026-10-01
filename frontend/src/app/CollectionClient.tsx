'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@/lib/constants'
import { CATEGORY_FILTERS, FITS, PRODUCTS } from '@/lib/constants'
import type { PriceRange, SortMode } from '@/lib/store'
import { useCartStore, useFilterStore } from '@/lib/store'
import { filterAndSortProducts } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'

const PRICE_LABELS: Record<PriceRange, string> = {
  'under-1500': 'Under ₹1,500',
  '1500-2000': '₹1,500 – ₹1,999',
  'above-2000': '₹2,000 & Above'
}

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'featured', label: 'Featured' },
  { mode: 'price-asc', label: 'Price: Low to High' },
  { mode: 'price-desc', label: 'Price: High to Low' }
]

interface CollectionClientProps {
  initialProducts?: Product[]
}

export default function CollectionClient({ initialProducts = PRODUCTS }: CollectionClientProps) {
  const category = useFilterStore((state) => state.category)
  const fit = useFilterStore((state) => state.fit)
  const prices = useFilterStore((state) => state.prices)
  const sort = useFilterStore((state) => state.sort)
  const setCategory = useFilterStore((state) => state.setCategory)
  const setFit = useFilterStore((state) => state.setFit)
  const togglePrice = useFilterStore((state) => state.togglePrice)
  const setSort = useFilterStore((state) => state.setSort)
  const reset = useFilterStore((state) => state.reset)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    void useFilterStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  const products = filterAndSortProducts(fit, prices, sort, initialProducts, category)
  const activeFilterCount = (category !== 'all' ? 1 : 0) + (fit !== 'all' ? 1 : 0) + prices.length

  const showFitFilter = category === 'all' || category === 'jeans'

  return (
    <>
      {/* Editorial Collection Hero Banner */}
      <section className="collection-hero">
        <div className="collection-hero-inner">
          <div className="hero-tagline">
            <span className="hero-dot"></span>
            <span className="hero-eyebrow">HEAVYWEIGHT DENIM & APPAREL // V26</span>
          </div>
          <h1 className="hero-title">Crafted for permanence. Cut for movement.</h1>
          <p className="hero-subtitle">
            13.5oz to 14.5oz shuttle loom denim, 450 GSM French terry hoodies, and heavyweight streetwear basics. Free shipping across India.
          </p>
        </div>
      </section>

      {/* Interactive Sticky Toolbar */}
      <header className="collection-toolbar-wrapper">
        {/* Category Filter Tabs */}
        <div className="category-tabs-bar">
          <div className="category-tabs-scroll" role="tablist" aria-label="Filter by wardrobe category">
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`category-tab-chip ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(cat.id)
                    if (cat.id !== 'all' && cat.id !== 'jeans') {
                      setFit('all')
                    }
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="collection-toolbar-content">
          {/* Fit Filter Segmented Chips (Visible for Denim & All) */}
          {showFitFilter ? (
            <div className="fit-pills-scroll" role="tablist" aria-label="Filter by denim fit">
              <button
                type="button"
                role="tab"
                aria-selected={fit === 'all'}
                className={`pill-btn ${fit === 'all' ? 'active' : ''}`}
                onClick={() => setFit('all')}
              >
                All Fits <span className="pill-count">{initialProducts.filter((p) => p.fit !== undefined).length}</span>
              </button>
              {FITS.map((f) => {
                const count = initialProducts.filter((p) => p.fit === f).length
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
            <div className="category-active-notice">
              <span>Viewing {CATEGORY_FILTERS.find((c) => c.id === category)?.label}</span>
            </div>
          )}

          {/* Secondary Controls: Price Filter Toggle & Sort Menu */}
          <div className="toolbar-actions">
            <button
              type="button"
              className={`filter-drawer-toggle ${activeFilterCount > 0 ? 'has-active' : ''}`}
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
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
                  <option key={opt.mode} value={opt.mode}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
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
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">{PRICE_LABELS[range]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-drawer-footer">
                <span className="filter-status-text">
                  Showing {products.length} of {initialProducts.length} silhouettes
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
      </header>

      {/* Main Grid */}
      <section className="catalog-section">
        {products.length === 0 ? (
          <div className="catalog-empty-state">
            <p className="empty-title">No jeans match those filters.</p>
            <p className="empty-desc">Try resetting your filter parameters to view the archive.</p>
            <button className="reset-catalog-btn" type="button" onClick={reset}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="collection-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
