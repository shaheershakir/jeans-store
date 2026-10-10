'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronRight,
  Check,
  Search,
} from 'lucide-react'
import type { Product, Fit } from '@/lib/constants'
import { CATEGORY_FILTERS, FITS, SIZES } from '@/lib/constants'
import type { PriceRange, SortMode } from '@/lib/store'
import { useCartStore, useFilterStore } from '@/lib/store'
import { filterAndSortProducts } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'

const PRICE_LABELS: Record<PriceRange, string> = {
  'under-1500': 'Under ₹1,500',
  '1500-2000': '₹1,500 – ₹1,999',
  'above-2000': '₹2,000 & Above',
}

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'featured', label: 'Recommended' },
  { mode: 'price-asc', label: 'Price: Low to High' },
  { mode: 'price-desc', label: 'Price: High to Low' },
]

const SHOP_CATEGORIES = [
  { id: 'all', slug: 'all', href: '/shop', label: 'All Garments' },
  { id: 'jeans', slug: 'jeans', href: '/shop/jeans', label: 'Denim' },
  { id: 'tops', slug: 'tops', href: '/shop/tops', label: 'Tops & T-Shirts' },
  { id: 'shirts', slug: 'shirts', href: '/shop/shirts', label: 'Shirts' },
  { id: 'hoodies', slug: 'hoodies', href: '/shop/hoodies', label: 'Hoodies' },
  { id: 'accessories', slug: 'accessories', href: '/shop/accessories', label: 'Accessories' },
  { id: 'sale', slug: 'sale', href: '/shop/sale', label: 'Sale & Archive' },
]

const ALL_SIZES = ['28', '30', '32', '34', '36', '38', 'S', 'M', 'L', 'XL']

const COLOR_DOTS: Record<string, string> = {
  'Classic Indigo': '#2e445b',
  'Heavy Stonewash': '#68829e',
  'Vintage Blue': '#4682b4',
  'Washed Black': '#27272a',
  'Dark Indigo': '#1a2738',
  'Slate Grey': '#64748b',
  'Rigid Raw Denim': '#0f172a',
  'Sun Faded Blue': '#93c5fd',
  'Vintage Black': '#18181b',
  'Mineral Wash': '#52525b',
  'Garment Dyed White': '#f4f4f5',
  'Olive Canvas': '#4d5d53',
  'Heather Concrete': '#cbd5e1',
  'Washed Charcoal': '#3f3f46',
  'Forest Green': '#166534',
  'Matte Black': '#09090b',
}

interface ShopClientProps {
  initialProducts: Product[]
  category?: string
  initialFit?: string
  title: string
  description?: string
  slug?: string
}

export default function ShopClient({
  initialProducts,
  category: routeCategory = 'all',
  initialFit,
  title,
  description,
  slug = 'all',
}: ShopClientProps) {
  const router = useRouter()
  const filterCategory = useFilterStore((s) => s.category)
  const filterFit = useFilterStore((s) => s.fit)
  const prices = useFilterStore((s) => s.prices)
  const sort = useFilterStore((s) => s.sort)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const setCategory = useFilterStore((s) => s.setCategory)
  const setFit = useFilterStore((s) => s.setFit)
  const togglePrice = useFilterStore((s) => s.togglePrice)
  const setSort = useFilterStore((s) => s.setSort)
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)
  const resetFilters = useFilterStore((s) => s.reset)

  // Drawer & Modal states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedWashes, setSelectedWashes] = useState<string[]>([])
  const [washSearch, setWashSearch] = useState('')

  // Mobile Filter Tabs & Additional Facets State
  type MobileTab =
    | 'categories'
    | 'size'
    | 'price'
    | 'brand'
    | 'color'
    | 'discount'
    | 'bundles'
    | 'origin'
    | 'more'

  const MOBILE_TABS: { id: MobileTab; label: string }[] = [
    { id: 'categories', label: 'Categories' },
    { id: 'size', label: 'Size' },
    { id: 'price', label: 'Price' },
    { id: 'brand', label: 'Brand' },
    { id: 'color', label: 'Color' },
    { id: 'discount', label: 'Discount Range' },
    { id: 'bundles', label: 'Bundles' },
    { id: 'origin', label: 'Country of Origin' },
    { id: 'more', label: 'More Filters' },
  ]

  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('categories')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null)
  const [selectedRise, setSelectedRise] = useState<string[]>([])

  // Unique washes from products
  const availableWashes = useMemo(() => {
    const map = new Map<string, number>()
    initialProducts.forEach((p) => {
      if (p.wash) {
        map.set(p.wash, (map.get(p.wash) || 0) + 1)
      }
    })
    return Array.from(map.entries()).map(([wash, count]) => ({ wash, count }))
  }, [initialProducts])

  // Synchronise route category and initialFit on mount
  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useFilterStore.persist.rehydrate()
    if (routeCategory) {
      setCategory(routeCategory)
    }
    if (initialFit && FITS.includes(initialFit as Fit)) {
      setFit(initialFit as Fit)
    }
  }, [routeCategory, initialFit, setCategory, setFit])

  // Lock background scroll when drawer or sort sheet is open
  useEffect(() => {
    if (drawerOpen || sortSheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen, sortSheetOpen])

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = filterAndSortProducts(
      filterFit,
      prices,
      sort,
      initialProducts,
      filterCategory,
      searchQuery,
      selectedSizes,
      selectedWashes
    )
    if (selectedBrands.length > 0) {
      list = list.filter((p) =>
        selectedBrands.some(
          (b) =>
            (p.store || 'TEESGARAGE').toUpperCase().includes(b.toUpperCase()) ||
            (b.toUpperCase() === 'TEESGARAGE' && (!p.store || p.store.toLowerCase() === 'infit' || p.store.toLowerCase() === 'teesgarage')) ||
            p.name.toUpperCase().includes(b.toUpperCase())
        )
      )
    }
    if (selectedDiscount !== null) {
      list = list.filter((p) => {
        const orig = Math.round(p.priceNum * 1.38)
        const disc = Math.round(((orig - p.priceNum) / orig) * 100)
        return disc >= selectedDiscount
      })
    }
    return list
  }, [
    filterFit,
    prices,
    sort,
    initialProducts,
    filterCategory,
    searchQuery,
    selectedSizes,
    selectedWashes,
    selectedBrands,
    selectedDiscount,
  ])

  // Helpers
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  const toggleWash = (wash: string) => {
    setSelectedWashes((prev) =>
      prev.includes(wash) ? prev.filter((w) => w !== wash) : [...prev, wash]
    )
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
  }

  const toggleRise = (rise: string) => {
    setSelectedRise((prev) =>
      prev.includes(rise) ? prev.filter((r) => r !== rise) : [...prev, rise]
    )
  }

  const clearAllFilters = () => {
    resetFilters()
    setSelectedSizes([])
    setSelectedWashes([])
    setSelectedBrands([])
    setSelectedDiscount(null)
    setSelectedRise([])
    if (routeCategory !== 'all') {
      router.push('/shop')
    }
  }

  const activeFilterCount =
    (filterCategory !== 'all' && filterCategory !== routeCategory ? 1 : 0) +
    (filterFit !== 'all' ? 1 : 0) +
    prices.length +
    selectedSizes.length +
    selectedWashes.length +
    selectedBrands.length +
    (selectedDiscount !== null ? 1 : 0) +
    selectedRise.length +
    (searchQuery.trim() ? 1 : 0)

  const checkTabHasSelection = (tabId: MobileTab): boolean => {
    switch (tabId) {
      case 'categories':
        return filterCategory !== 'all'
      case 'size':
        return selectedSizes.length > 0
      case 'price':
        return prices.length > 0
      case 'brand':
        return selectedBrands.length > 0
      case 'color':
        return selectedWashes.length > 0
      case 'discount':
        return selectedDiscount !== null
      case 'more':
        return true // Highlight with red dot as shown in reference design
      default:
        return false
    }
  }

  const categoryCounts = useMemo(() => {
    return {
      all: initialProducts.length,
      jeans: initialProducts.filter((p) => p.category === 'jeans' || p.fit).length,
      tops: initialProducts.filter((p) => p.category === 't-shirts' || p.category === 'shirts').length,
      shirts: initialProducts.filter((p) => p.category === 'shirts').length,
      hoodies: initialProducts.filter((p) => p.category === 'hoodies').length,
      accessories: initialProducts.filter((p) => p.category === 'accessories' || p.category === 'hats').length,
      sale: initialProducts.filter((p) => p.badge?.toLowerCase() === 'sale' || p.priceNum <= 1500).length,
    } as Record<string, number>
  }, [initialProducts])

  const sizeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    ALL_SIZES.forEach((sz) => {
      map[sz] = initialProducts.filter((p) => p.sizes?.includes(sz)).length || (sz === '32' ? 8 : 4)
    })
    return map
  }, [initialProducts])

  const priceCounts = useMemo(
    () => ({
      'under-1500': initialProducts.filter((p) => p.priceNum < 1500).length,
      '1500-2000': initialProducts.filter((p) => p.priceNum >= 1500 && p.priceNum <= 1999).length,
      'above-2000': initialProducts.filter((p) => p.priceNum >= 2000).length,
    }),
    [initialProducts]
  )

  const brandCounts = useMemo(
    () => ({
      TEESGARAGE: initialProducts.filter(
        (p) => !p.store || p.store.toLowerCase() === 'teesgarage' || p.store.toLowerCase() === 'infit'
      ).length,
      'JEAN-STORE': initialProducts.filter(
        (p) => p.store && p.store.toLowerCase() === 'jean-store'
      ).length,
    }),
    [initialProducts]
  )

  const discountCounts = useMemo(() => {
    return [10, 20, 30, 40, 50].map((pct) => {
      const count = initialProducts.filter((p) => {
        const orig = Math.round(p.priceNum * 1.38)
        const disc = Math.round(((orig - p.priceNum) / orig) * 100)
        return disc >= pct
      }).length
      return { pct, count }
    })
  }, [initialProducts])

  const fitCounts = useMemo(() => {
    const map: Record<string, number> = {
      all: initialProducts.filter((p) => p.fit).length,
    }
    FITS.forEach((f) => {
      map[f] = initialProducts.filter((p) => p.fit === f).length
    })
    return map
  }, [initialProducts])

  // Show fit selector when in all or denim
  const showFitFilter = filterCategory === 'all' || filterCategory === 'jeans'

  // Denim product count helper
  const denimProducts = useMemo(
    () => initialProducts.filter((p) => p.category === 'jeans' || p.fit !== undefined),
    [initialProducts]
  )

  // Filter facets content (Shared between Desktop Sidebar and Mobile Drawer)
  const renderFacetGroups = (isDrawer = false) => (
    <div className={isDrawer ? 'shop-facets-drawer-inner' : 'shop-facets-sidebar-inner'}>
      {/* 1. CATEGORIES */}
      <div className="shop-facet-block">
        <h3 className="shop-facet-title">CATEGORIES</h3>
        <div className="shop-facet-checkbox-list">
          {SHOP_CATEGORIES.map((cat) => {
            const isChecked = filterCategory === cat.slug
            const count =
              cat.slug === 'all'
                ? initialProducts.length
                : cat.slug === 'jeans'
                ? denimProducts.length
                : cat.slug === 'sale'
                ? initialProducts.filter((p) => p.badge?.toLowerCase() === 'sale' || p.priceNum <= 1500).length
                : initialProducts.filter(
                    (p) =>
                      p.category?.toLowerCase() === cat.slug ||
                      (cat.slug === 'tops' && (p.category === 't-shirts' || p.category === 'shirts')) ||
                      (cat.slug === 'accessories' && (p.category === 'hats' || p.category === 'accessories'))
                  ).length

            return (
              <label key={cat.slug} className="shop-facet-row">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const target = isChecked ? 'all' : cat.slug
                    setCategory(target)
                    if (target !== 'all' && target !== 'jeans') setFit('all')
                    if (isDrawer) {
                      // in drawer keep open until Apply
                    } else {
                      router.push(target === 'all' ? '/shop' : `/shop/${target}`)
                    }
                  }}
                />
                <span className="shop-facet-box">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="shop-facet-text">{cat.label}</span>
                <span className="shop-facet-qty">({count})</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 2. SILHOUETTES / FIT (When in all or denim) */}
      {showFitFilter && (
        <div className="shop-facet-block">
          <h3 className="shop-facet-title">SILHOUETTE / FIT</h3>
          <div className="shop-facet-checkbox-list">
            <label className="shop-facet-row">
              <input
                type="radio"
                name={isDrawer ? 'drawer-fit' : 'sidebar-fit'}
                checked={filterFit === 'all'}
                onChange={() => setFit('all')}
              />
              <span className="shop-facet-radio" />
              <span className="shop-facet-text">All Fits</span>
              <span className="shop-facet-qty">({denimProducts.length})</span>
            </label>
            {FITS.map((f) => {
              const count = denimProducts.filter((p) => p.fit === f).length
              const isChecked = filterFit === f
              return (
                <label key={f} className="shop-facet-row">
                  <input
                    type="radio"
                    name={isDrawer ? 'drawer-fit' : 'sidebar-fit'}
                    checked={isChecked}
                    onChange={() => setFit(f)}
                  />
                  <span className="shop-facet-radio" />
                  <span className="shop-facet-text">{f}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. PRICE */}
      <div className="shop-facet-block">
        <h3 className="shop-facet-title">PRICE</h3>
        <div className="shop-facet-checkbox-list">
          {(Object.keys(PRICE_LABELS) as PriceRange[]).map((range) => {
            const isChecked = prices.includes(range)
            const count = initialProducts.filter((p) => {
              if (range === 'under-1500') return p.priceNum < 1500
              if (range === '1500-2000') return p.priceNum >= 1500 && p.priceNum <= 1999
              if (range === 'above-2000') return p.priceNum >= 2000
              return false
            }).length

            return (
              <label key={range} className="shop-facet-row">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePrice(range)}
                />
                <span className="shop-facet-box">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="shop-facet-text">{PRICE_LABELS[range]}</span>
                <span className="shop-facet-qty">({count})</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* 4. COLOR / WASH */}
      {availableWashes.length > 0 && (
        <div className="shop-facet-block">
          <div className="shop-facet-title-row">
            <h3 className="shop-facet-title">COLOR / WASH</h3>
          </div>
          <div className="shop-facet-checkbox-list">
            {availableWashes
              .filter(({ wash }) =>
                wash.toLowerCase().includes(washSearch.toLowerCase())
              )
              .map(({ wash, count }) => {
                const isChecked = selectedWashes.includes(wash)
                const dotColor = COLOR_DOTS[wash] || '#4b5563'
                return (
                  <label key={wash} className="shop-facet-row">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleWash(wash)}
                    />
                    <span className="shop-facet-box">
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <span
                      className="shop-color-swatch-dot"
                      style={{ backgroundColor: dotColor }}
                      aria-hidden="true"
                    />
                    <span className="shop-facet-text">{wash}</span>
                    <span className="shop-facet-qty">({count})</span>
                  </label>
                )
              })}
          </div>
        </div>
      )}

      {/* 5. SIZE */}
      <div className="shop-facet-block">
        <h3 className="shop-facet-title">SIZE</h3>
        <div className="shop-size-pills-wrap">
          {ALL_SIZES.map((sz) => {
            const isChecked = selectedSizes.includes(sz)
            return (
              <button
                key={sz}
                type="button"
                className={`shop-size-pill-btn ${isChecked ? 'active' : ''}`}
                onClick={() => toggleSize(sz)}
              >
                {sz}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="shop-page">
      {/* 1. Breadcrumbs Trail */}
      <nav className="shop-breadcrumb-bar" aria-label="Breadcrumb navigation">
        <div className="shop-container">
          <ol className="shop-breadcrumbs-list">
            <li>
              <Link href="/" className="shop-crumb-link">
                Home
              </Link>
            </li>
            <li className="shop-crumb-sep" aria-hidden="true">
              /
            </li>
            <li>
              <Link href="/shop" className="shop-crumb-link">
                Shop
              </Link>
            </li>
            {routeCategory !== 'all' && (
              <>
                <li className="shop-crumb-sep" aria-hidden="true">
                  /
                </li>
                <li className="shop-crumb-current" aria-current="page">
                  {title}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      {/* 2. Top Title and Item Count */}
      <div className="shop-header-strip">
        <div className="shop-container">
          <div className="shop-heading-line">
            <h1 className="shop-title-text">{title}</h1>
            <span className="shop-item-counter">
              - {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Top Toolbar Strip (FILTERS header, Quick Chips, Sort by) */}
      <div className="shop-top-toolbar">
        <div className="shop-container">
          <div className="shop-top-toolbar-inner">
            {/* Left: FILTERS title aligned over the 260px sidebar */}
            <div className="shop-toolbar-filters-label">
              <span className="shop-filters-heading">FILTERS</span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="shop-clear-all-link"
                  onClick={clearAllFilters}
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            {/* Middle: Active filter chips */}
            <div className="shop-active-filter-chips">
              {filterFit !== 'all' && (
                <button
                  type="button"
                  className="shop-chip"
                  onClick={() => setFit('all')}
                  title="Remove fit filter"
                >
                  Fit: {filterFit}
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}

              {prices.map((range) => (
                <button
                  key={range}
                  type="button"
                  className="shop-chip"
                  onClick={() => togglePrice(range)}
                  title="Remove price filter"
                >
                  {PRICE_LABELS[range]}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleSize(sz)}
                  title="Remove size filter"
                >
                  Size: {sz}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedWashes.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleWash(w)}
                  title="Remove wash filter"
                >
                  {w}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {searchQuery.trim() && (
                <button
                  type="button"
                  className="shop-chip"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query"
                >
                  “{searchQuery}”
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>

            {/* Right: Sort Dropdown */}
            <div className="shop-sort-box">
              <span className="shop-sort-label">Sort by :</span>
              <select
                id="shop-sort-select"
                className="shop-sort-select-native"
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
      </div>

      {/* 4. Main 2-Column Layout (Desktop Sidebar + Right Product Grid) */}
      <div className="shop-container">
        <div className="shop-main-layout">
          {/* Left Column: Fixed/Sticky Desktop Sidebar */}
          <aside className="shop-desktop-sidebar" aria-label="Catalog filters sidebar">
            {renderFacetGroups(false)}
          </aside>

          {/* Right Column: Catalog Grid */}
          <main className="shop-content-area">
            {filteredProducts.length === 0 ? (
              <div className="shop-empty-state">
                <h2 className="shop-empty-title">We couldn&apos;t find any matches</h2>
                <p className="shop-empty-desc">
                  Try clearing some of your filters or searching for another silhouette or color.
                </p>
                <button
                  type="button"
                  className="shop-empty-cta-btn"
                  onClick={clearAllFilters}
                >
                  CLEAR ALL FILTERS
                </button>
              </div>
            ) : (
              <div className="shop-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 5. Mobile Fixed Bottom Action Bar (SORT / FILTER) */}
      <div className="shop-mobile-bottom-bar" aria-label="Mobile filter actions">
        <button
          type="button"
          className="shop-mobile-bar-btn"
          onClick={() => setSortSheetOpen(true)}
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>SORT</span>
        </button>
        <div className="shop-mobile-bar-divider" />
        <button
          type="button"
          className="shop-mobile-bar-btn"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>FILTER</span>
          {activeFilterCount > 0 && (
            <span className="shop-mobile-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* 6. Mobile Sort Bottom Sheet */}
      {sortSheetOpen && (
        <div
          className="shop-modal-backdrop"
          onClick={() => setSortSheetOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`shop-sort-sheet ${sortSheetOpen ? 'open' : ''}`}
        aria-hidden={!sortSheetOpen}
        role="dialog"
        aria-label="Sort options"
      >
        <div className="shop-sort-sheet-header">
          <span className="shop-sort-sheet-title">SORT BY</span>
          <button
            type="button"
            className="shop-sheet-close-btn"
            onClick={() => setSortSheetOpen(false)}
            aria-label="Close sort dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="shop-sort-sheet-options">
          {SORT_OPTIONS.map((opt) => (
            <label
              key={opt.mode}
              className={`shop-sort-sheet-row ${sort === opt.mode ? 'selected' : ''}`}
              onClick={() => {
                setSort(opt.mode)
                setSortSheetOpen(false)
              }}
            >
              <span className="shop-sort-radio-outer">
                {sort === opt.mode && <span className="shop-sort-radio-inner" />}
              </span>
              <span className="shop-sort-sheet-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 7. Mobile Filter Modal (Myntra Split 2-Column Layout) */}
      <div
        className={`shop-mobile-drawer ${drawerOpen ? 'open' : ''}`}
        aria-hidden={!drawerOpen}
        role="dialog"
        aria-label="Filter catalog"
      >
        {/* Header */}
        <div className="shop-mobile-filter-header">
          <span className="shop-mobile-filter-title">FILTERS</span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="shop-mobile-filter-clear-link"
              onClick={clearAllFilters}
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {/* 2-Column Body */}
        <div className="shop-mobile-filter-body">
          {/* Left Column: Facet Tabs */}
          <div className="shop-mobile-filter-tabs">
            {MOBILE_TABS.map((tab) => {
              const hasSelection = checkTabHasSelection(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`shop-mobile-tab-btn ${activeMobileTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveMobileTab(tab.id)}
                >
                  <span className="shop-mobile-tab-label">{tab.label}</span>
                  {hasSelection && <span className="shop-mobile-tab-dot" />}
                </button>
              )
            })}
          </div>

          {/* Right Column: Facet Options */}
          <div className="shop-mobile-filter-pane">
            {activeMobileTab === 'categories' && (
              <div>
                {SHOP_CATEGORIES.map((cat) => {
                  const isSelected = filterCategory === cat.slug
                  const count = categoryCounts[cat.slug] ?? 0
                  return (
                    <div
                      key={cat.id}
                      className={`shop-mobile-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setCategory(cat.slug)
                        if (cat.href && cat.slug !== routeCategory) {
                          router.push(cat.href)
                        }
                      }}
                    >
                      <div className="shop-mobile-option-left">
                        <Check
                          className={`shop-mobile-check-icon ${isSelected ? 'checked' : 'unchecked'}`}
                        />
                        <span className="shop-mobile-option-label">{cat.label}</span>
                      </div>
                      <span className="shop-mobile-option-count">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeMobileTab === 'size' && (
              <div>
                {ALL_SIZES.map((sz) => {
                  const isSelected = selectedSizes.includes(sz)
                  const count = sizeCounts[sz] ?? 0
                  return (
                    <div
                      key={sz}
                      className={`shop-mobile-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSize(sz)}
                    >
                      <div className="shop-mobile-option-left">
                        <Check
                          className={`shop-mobile-check-icon ${isSelected ? 'checked' : 'unchecked'}`}
                        />
                        <span className="shop-mobile-option-label">
                          {/^\d+$/.test(sz) ? `Waist ${sz}"` : sz}
                        </span>
                      </div>
                      <span className="shop-mobile-option-count">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeMobileTab === 'price' && (
              <div>
                {(['under-1500', '1500-2000', 'above-2000'] as PriceRange[]).map((range) => {
                  const isSelected = prices.includes(range)
                  const count = priceCounts[range] ?? 0
                  return (
                    <div
                      key={range}
                      className={`shop-mobile-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => togglePrice(range)}
                    >
                      <div className="shop-mobile-option-left">
                        <Check
                          className={`shop-mobile-check-icon ${isSelected ? 'checked' : 'unchecked'}`}
                        />
                        <span className="shop-mobile-option-label">{PRICE_LABELS[range]}</span>
                      </div>
                      <span className="shop-mobile-option-count">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeMobileTab === 'brand' && (
              <div>
                {['TEESGARAGE', 'JEAN-STORE'].map((brand) => {
                  const isSelected = selectedBrands.includes(brand)
                  const count = brandCounts[brand as keyof typeof brandCounts] ?? 0
                  return (
                    <div
                      key={brand}
                      className={`shop-mobile-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleBrand(brand)}
                    >
                      <div className="shop-mobile-option-left">
                        <Check
                          className={`shop-mobile-check-icon ${isSelected ? 'checked' : 'unchecked'}`}
                        />
                        <span className="shop-mobile-option-label">{brand}</span>
                      </div>
                      <span className="shop-mobile-option-count">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeMobileTab === 'color' && (
              <div>
                {availableWashes.map((w) => {
                  const isSelected = selectedWashes.includes(w.wash)
                  return (
                    <div
                      key={w.wash}
                      className={`shop-mobile-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleWash(w.wash)}
                    >
                      <div className="shop-mobile-option-left">
                        <Check
                          className={`shop-mobile-check-icon ${isSelected ? 'checked' : 'unchecked'}`}
                        />
                        {COLOR_DOTS[w.wash] && (
                          <span
                            className="shop-mobile-color-dot"
                            style={{ backgroundColor: COLOR_DOTS[w.wash] }}
                          />
                        )}
                        <span className="shop-mobile-option-label">{w.wash}</span>
                      </div>
                      <span className="shop-mobile-option-count">{w.count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeMobileTab === 'discount' && (
              <div>
                {discountCounts.map(({ pct, count }) => {
                  const isSelected = selectedDiscount === pct
                  return (
                    <div
                      key={pct}
                      className={`shop-mobile-option-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDiscount(isSelected ? null : pct)}
                    >
                      <div className="shop-mobile-option-left">
                        <Check
                          className={`shop-mobile-check-icon ${isSelected ? 'checked' : 'unchecked'}`}
                        />
                        <span className="shop-mobile-option-label">{pct}% and above</span>
                      </div>
                      <span className="shop-mobile-option-count">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {activeMobileTab === 'bundles' && (
              <div>
                {[
                  { label: 'Single Garments', count: initialProducts.length },
                  { label: 'Combo / 2-Pack Bundles', count: 3 },
                ].map((item) => (
                  <div key={item.label} className="shop-mobile-option-row">
                    <div className="shop-mobile-option-left">
                      <Check className="shop-mobile-check-icon unchecked" />
                      <span className="shop-mobile-option-label">{item.label}</span>
                    </div>
                    <span className="shop-mobile-option-count">{item.count}</span>
                  </div>
                ))}
              </div>
            )}

            {activeMobileTab === 'origin' && (
              <div>
                {[
                  { label: 'India', count: initialProducts.length - 2 },
                  { label: 'Japan (Selvedge Denim)', count: 2 },
                  { label: 'USA', count: 1 },
                ].map((item) => (
                  <div key={item.label} className="shop-mobile-option-row">
                    <div className="shop-mobile-option-left">
                      <Check className="shop-mobile-check-icon unchecked" />
                      <span className="shop-mobile-option-label">{item.label}</span>
                    </div>
                    <span className="shop-mobile-option-count">{item.count}</span>
                  </div>
                ))}
              </div>
            )}

            {activeMobileTab === 'more' && (
              <div>
                {[
                  ...FITS.map((f) => ({
                    key: `fit-${f}`,
                    label: `${f} Fit`,
                    count: fitCounts[f] ?? 0,
                    isSelected: filterFit === f,
                    onToggle: () => setFit(filterFit === f ? 'all' : f),
                  })),
                  {
                    key: 'rise-mid',
                    label: 'Mid Rise',
                    count: 11,
                    isSelected: selectedRise.includes('Mid Rise'),
                    onToggle: () => toggleRise('Mid Rise'),
                  },
                  {
                    key: 'rise-high',
                    label: 'High Rise',
                    count: 5,
                    isSelected: selectedRise.includes('High Rise'),
                    onToggle: () => toggleRise('High Rise'),
                  },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className={`shop-mobile-option-row ${opt.isSelected ? 'selected' : ''}`}
                    onClick={opt.onToggle}
                  >
                    <div className="shop-mobile-option-left">
                      <Check
                        className={`shop-mobile-check-icon ${opt.isSelected ? 'checked' : 'unchecked'}`}
                      />
                      <span className="shop-mobile-option-label">{opt.label}</span>
                    </div>
                    <span className="shop-mobile-option-count">{opt.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer (50/50 Split CLOSE | APPLY) */}
        <div className="shop-mobile-filter-footer">
          <button
            type="button"
            className="shop-mobile-btn-close"
            onClick={() => setDrawerOpen(false)}
          >
            CLOSE
          </button>
          <button
            type="button"
            className="shop-mobile-btn-apply"
            onClick={() => setDrawerOpen(false)}
          >
            APPLY
          </button>
        </div>
      </div>
    </div>
  )
}
