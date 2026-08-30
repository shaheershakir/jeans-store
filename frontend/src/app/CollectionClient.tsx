'use client'

import { useEffect, useState } from 'react'
import { FITS, PRODUCTS } from '@/lib/constants'
import type { PriceRange, SortMode } from '@/lib/store'
import { useCartStore, useFilterStore } from '@/lib/store'
import { filterAndSortProducts } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'

const PRICE_LABELS: Record<PriceRange, string> = {
  'under-1500': 'Under ₹1,500',
  '1500-2000': '₹1,500 – ₹1,999',
  'above-2000': '₹2,000 & Above'
}

const SORT_LABELS: Record<SortMode, string> = {
  featured: 'Sort · Featured ⌄',
  'price-asc': 'Sort · Price ↑ ⌄',
  'price-desc': 'Sort · Price ↓ ⌄'
}

const SORT_CYCLE: SortMode[] = ['featured', 'price-asc', 'price-desc']

export default function CollectionClient() {
  const fit = useFilterStore((state) => state.fit)
  const prices = useFilterStore((state) => state.prices)
  const sort = useFilterStore((state) => state.sort)
  const setFit = useFilterStore((state) => state.setFit)
  const togglePrice = useFilterStore((state) => state.togglePrice)
  const setSort = useFilterStore((state) => state.setSort)
  const reset = useFilterStore((state) => state.reset)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    void useFilterStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  const products = filterAndSortProducts(fit, prices, sort)

  function handleSort() {
    const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sort) + 1) % SORT_CYCLE.length]
    setSort(next)
  }

  return (
    <>
      <header className="collection-head">
        <div className="collection-toolbar">
          <p className="eyebrow">
            All denim · {products.length} of {PRODUCTS.length}
          </p>
          <button className="sort" type="button" onClick={handleSort} aria-label="Sort products">
            {SORT_LABELS[sort]}
          </button>
        </div>
        <div className="filter-row">
          <button className="filter-trigger" type="button" onClick={() => setFiltersOpen((v) => !v)}>
            Filters <b>{filtersOpen ? '–' : '+'}</b>
          </button>
          <button
            className={`fit-filter-btn${fit === 'all' ? ' active' : ''}`}
            type="button"
            onClick={() => setFit('all')}
          >
            All
          </button>
          {FITS.map((f) => (
            <button
              key={f}
              className={`fit-filter-btn${fit === f ? ' active' : ''}`}
              type="button"
              onClick={() => setFit(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <aside className={`filter-panel${filtersOpen ? ' open' : ''}`}>
        <p className="eyebrow">Filter by fit</p>
        {FITS.map((f) => (
          <label key={f}>
            <input type="checkbox" checked={fit === f} onChange={() => setFit(fit === f ? 'all' : f)} /> {f}
          </label>
        ))}
        <hr />
        <p className="eyebrow">Price</p>
        {(Object.keys(PRICE_LABELS) as PriceRange[]).map((range) => (
          <label key={range}>
            <input type="checkbox" checked={prices.includes(range)} onChange={() => togglePrice(range)} />{' '}
            {PRICE_LABELS[range]}
          </label>
        ))}
        <button type="button" className="text-link" onClick={reset}>
          Clear all
        </button>
      </aside>

      <div className="collection-grid product-grid">
        {products.length === 0 ? (
          <div className="grid-empty">
            <p>No jeans match those filters.</p>
            <button className="text-link" type="button" onClick={reset}>
              Clear all filters
            </button>
          </div>
        ) : (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </>
  )
}
