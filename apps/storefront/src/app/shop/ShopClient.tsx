'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Check,
  Star,
} from 'lucide-react'
import type { Product, Fit } from '@/lib/constants'
import { FITS } from '@/lib/constants'
import type { PriceRange, SortMode } from '@/lib/store'
import { useCartStore, useFilterStore } from '@/lib/store'
import { filterAndSortProducts } from '@/lib/utils'
import ProductCard from '@/components/ProductCard'
import { trackEvent } from '@/lib/analytics'
import { getProductSlug } from '@/lib/products'

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
  { id: 'stripes', slug: 'stripes', href: '/shop/stripes', label: 'Stripes' },
  { id: 'fullsleeve', slug: 'fullsleeve', href: '/shop/fullsleeve', label: 'Fullsleeve' },
  { id: 'drsleeve', slug: 'drsleeve', href: '/shop/drsleeve', label: '3/4 Sleeve (Drsleeve)' },
  { id: 'printed-tees', slug: 'printed-tees', href: '/shop/printed-tees', label: 'Printed Tees' },
  { id: 'ringer-tees', slug: 'ringer-tees', href: '/shop/ringer-tees', label: 'Ringer Tees' },
  { id: 'henley', slug: 'henley', href: '/shop/henley', label: 'Henley' },
  { id: 'trackpants', slug: 'trackpants', href: '/shop/trackpants', label: 'Trackpants' },
  { id: 'sweatpants', slug: 'sweatpants', href: '/shop/sweatpants', label: 'Sweatpants' },
  { id: 'sale', slug: 'sale', href: '/shop/sale', label: 'Sale & Archive' },
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const ALL_WAIST_SIZES = ['30', '32', '34', '36', '38']

const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#09090b' },
  { name: 'White', hex: '#f8fafc' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Grey', hex: '#64748b' },
  { name: 'Beige', hex: '#d6c7b2' },
  { name: 'Green', hex: '#166534' },
  { name: 'Red', hex: '#831843' },
]

export type FacetKey =
  | 'categories'
  | 'size'
  | 'waistSize'
  | 'color'
  | 'price'
  | 'fit'
  | 'fabric'
  | 'material'
  | 'sleeveLength'
  | 'neckType'
  | 'pattern'
  | 'printStyle'
  | 'trimColor'
  | 'buttons'
  | 'length'
  | 'closure'
  | 'pockets'
  | 'use'
  | 'legStyle'
  | 'rise'
  | 'availability'
  | 'discount'
  | 'rating'
  | 'collection'

const FACET_TITLES: Record<FacetKey, string> = {
  categories: 'CATEGORIES',
  size: 'SIZE',
  waistSize: 'WAIST SIZE',
  color: 'COLOR',
  price: 'PRICE',
  fit: 'FIT',
  fabric: 'FABRIC',
  material: 'MATERIAL',
  sleeveLength: 'SLEEVE LENGTH',
  neckType: 'NECK TYPE',
  pattern: 'PATTERN',
  printStyle: 'PRINT STYLE',
  trimColor: 'COLLAR / TRIM COLOR',
  buttons: 'BUTTONS',
  length: 'LENGTH',
  closure: 'CLOSURE',
  pockets: 'POCKETS',
  use: 'USE / OCCASION',
  legStyle: 'LEG STYLE',
  rise: 'RISE',
  availability: 'AVAILABILITY',
  discount: 'DISCOUNT RANGE',
  rating: 'RATING',
  collection: 'COLLECTION',
}

const CATEGORY_FACETS: Record<string, FacetKey[]> = {
  all: [
    'categories',
    'size',
    'color',
    'price',
    'fit',
    'fabric',
    'pattern',
    'availability',
    'discount',
    'rating',
    'collection',
  ],
  stripes: [
    'size',
    'color',
    'fit',
    'sleeveLength',
    'neckType',
    'price',
    'fabric',
    'pattern',
    'availability',
    'discount',
    'rating',
  ],
  fullsleeve: [
    'size',
    'color',
    'fit',
    'neckType',
    'fabric',
    'price',
    'pattern',
    'availability',
    'discount',
    'rating',
  ],
  drsleeve: [
    'size',
    'color',
    'fit',
    'neckType',
    'fabric',
    'price',
    'pattern',
    'availability',
    'discount',
    'rating',
  ],
  'printed-tees': [
    'size',
    'color',
    'fit',
    'sleeveLength',
    'printStyle',
    'neckType',
    'price',
    'fabric',
    'availability',
    'discount',
    'rating',
  ],
  'ringer-tees': [
    'size',
    'color',
    'fit',
    'sleeveLength',
    'trimColor',
    'neckType',
    'price',
    'fabric',
    'availability',
    'discount',
    'rating',
  ],
  henley: [
    'size',
    'color',
    'fit',
    'sleeveLength',
    'buttons',
    'fabric',
    'price',
    'pattern',
    'availability',
    'discount',
    'rating',
  ],
  trackpants: [
    'waistSize',
    'color',
    'fit',
    'length',
    'material',
    'closure',
    'pockets',
    'price',
    'use',
    'availability',
    'discount',
    'rating',
  ],
  sweatpants: [
    'waistSize',
    'color',
    'fit',
    'legStyle',
    'material',
    'rise',
    'pockets',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  sale: [
    'size',
    'color',
    'fit',
    'price',
    'fabric',
    'discount',
    'availability',
    'rating',
  ],
}

interface ShopClientProps {
  initialProducts: Product[]
  category?: string
  initialCategories?: string[]
  initialFit?: string
  title: string
  description?: string
  slug?: string
}

export default function ShopClient({
  initialProducts,
  category: routeCategory = 'all',
  initialCategories,
  initialFit,
  title,
  slug = 'all',
}: ShopClientProps) {
  const filterCategories = useFilterStore((s) => s.categories)
  const filterCategory = useFilterStore((s) => s.category)
  const filterFit = useFilterStore((s) => s.fit)
  const prices = useFilterStore((s) => s.prices)
  const sort = useFilterStore((s) => s.sort)
  const searchQuery = useFilterStore((s) => s.searchQuery)
  const setCategory = useFilterStore((s) => s.setCategory)
  const setCategories = useFilterStore((s) => s.setCategories)
  const toggleCategory = useFilterStore((s) => s.toggleCategory)
  const setFit = useFilterStore((s) => s.setFit)
  const togglePrice = useFilterStore((s) => s.togglePrice)
  const setSort = useFilterStore((s) => s.setSort)
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery)
  const resetFilters = useFilterStore((s) => s.reset)

  // Drawer & Sheet state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      trackEvent('product_list_viewed', {
        list_id: `shop_${slug}`,
        list_name: title || 'Shop',
        products: initialProducts.slice(0, 24).map((p, idx) => ({
          product_id: p.id,
          product_name: p.name,
          product_slug: getProductSlug(p),
          category: p.category,
          price: p.priceNum,
          position: idx + 1
        }))
      })
    }
  }, [slug, title])

  // Category-specific and store-wide filter states
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedWaistSizes, setSelectedWaistSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedFits, setSelectedFits] = useState<string[]>([])
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedSleeveLengths, setSelectedSleeveLengths] = useState<string[]>([])
  const [selectedNeckTypes, setSelectedNeckTypes] = useState<string[]>([])
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])
  const [selectedPrintStyles, setSelectedPrintStyles] = useState<string[]>([])
  const [selectedTrimColors, setSelectedTrimColors] = useState<string[]>([])
  const [selectedButtons, setSelectedButtons] = useState<string[]>([])
  const [selectedLengths, setSelectedLengths] = useState<string[]>([])
  const [selectedClosures, setSelectedClosures] = useState<string[]>([])
  const [selectedPockets, setSelectedPockets] = useState<string[]>([])
  const [selectedUses, setSelectedUses] = useState<string[]>([])
  const [selectedLegStyles, setSelectedLegStyles] = useState<string[]>([])
  const [selectedRises, setSelectedRises] = useState<string[]>([])
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null)
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  // Active category facets
  const activeFacets = useMemo(() => {
    // If on a dedicated category route (e.g. /shop/stripes, /shop/trackpants)
    if (routeCategory !== 'all') {
      const list = CATEGORY_FACETS[routeCategory] || CATEGORY_FACETS.all
      return list.filter((f) => f !== 'categories')
    }

    // On /shop:
    // When one or more categories are selected, show 'categories' at top and union all specific facets
    if (filterCategories.length > 0) {
      const union = new Set<FacetKey>()
      filterCategories.forEach((cat) => {
        const facets = CATEGORY_FACETS[cat] || []
        facets.forEach((f) => {
          if (f !== 'categories') union.add(f)
        })
      })
      return ['categories', ...Array.from(union)] as FacetKey[]
    }

    // Default on /shop with no category filter active: show store-wide facets
    return CATEGORY_FACETS.all
  }, [routeCategory, filterCategories])

  // Mobile Drawer Tab selection
  const [activeMobileTab, setActiveMobileTab] = useState<FacetKey>(() => {
    return routeCategory === 'all' ? 'categories' : (activeFacets[0] || 'size')
  })

  useEffect(() => {
    if (routeCategory !== 'all' && activeMobileTab === 'categories') {
      setActiveMobileTab(activeFacets[0] || 'size')
    } else if (!activeFacets.includes(activeMobileTab)) {
      setActiveMobileTab(activeFacets[0] || 'size')
    }
  }, [routeCategory, activeFacets, activeMobileTab])

  // Synchronise route category, initialCategories and initialFit on mount
  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useFilterStore.persist.rehydrate()
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories)
    } else if (routeCategory && routeCategory !== 'all') {
      setCategories([routeCategory])
    }
    if (initialFit && FITS.includes(initialFit as Fit)) {
      setFit(initialFit as Fit)
    }
  }, [routeCategory, initialCategories, initialFit, setCategories, setFit])

  // Sync query parameters on /shop route
  useEffect(() => {
    if (routeCategory !== 'all') return
    if (typeof window === 'undefined') return

    const currentUrl = new URL(window.location.href)
    if (filterCategories.length > 0) {
      currentUrl.searchParams.set('category', filterCategories.join(','))
    } else {
      currentUrl.searchParams.delete('category')
    }

    const nextRelative = currentUrl.pathname + (currentUrl.search ? currentUrl.search : '')
    const currentRelative = window.location.pathname + window.location.search
    if (nextRelative !== currentRelative) {
      window.history.replaceState(null, '', nextRelative)
    }
  }, [routeCategory, filterCategories])

  // Scroll lock
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

  // Filter products by combining all facets with AND logic
  const filteredProducts = useMemo(() => {
    const activeCats =
      routeCategory !== 'all'
        ? [routeCategory]
        : (filterCategories.length > 0 ? filterCategories : 'all')

    return filterAndSortProducts(
      filterFit,
      prices,
      sort,
      initialProducts,
      activeCats,
      searchQuery,
      selectedSizes,
      [],
      {
        fits: selectedFits,
        colors: selectedColors,
        fabrics: selectedFabrics,
        materials: selectedMaterials,
        sleeveLengths: selectedSleeveLengths,
        neckTypes: selectedNeckTypes,
        patterns: selectedPatterns,
        printStyles: selectedPrintStyles,
        trimColors: selectedTrimColors,
        buttons: selectedButtons,
        waistSizes: selectedWaistSizes,
        lengths: selectedLengths,
        closures: selectedClosures,
        pockets: selectedPockets,
        uses: selectedUses,
        legStyles: selectedLegStyles,
        rises: selectedRises,
        availability: selectedAvailability,
        discount: selectedDiscount,
        rating: selectedRating,
        collections: selectedCollections,
      }
    )
  }, [
    routeCategory,
    filterCategories,
    filterFit,
    prices,
    sort,
    initialProducts,
    searchQuery,
    selectedSizes,
    selectedFits,
    selectedColors,
    selectedFabrics,
    selectedMaterials,
    selectedSleeveLengths,
    selectedNeckTypes,
    selectedPatterns,
    selectedPrintStyles,
    selectedTrimColors,
    selectedButtons,
    selectedWaistSizes,
    selectedLengths,
    selectedClosures,
    selectedPockets,
    selectedUses,
    selectedLegStyles,
    selectedRises,
    selectedAvailability,
    selectedDiscount,
    selectedRating,
    selectedCollections,
  ])

  // Generic toggle helper
  const toggleStringItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    setter((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    )
  }

  const clearAllFilters = () => {
    resetFilters()
    setSelectedSizes([])
    setSelectedWaistSizes([])
    setSelectedColors([])
    setSelectedFits([])
    setSelectedFabrics([])
    setSelectedMaterials([])
    setSelectedSleeveLengths([])
    setSelectedNeckTypes([])
    setSelectedPatterns([])
    setSelectedPrintStyles([])
    setSelectedTrimColors([])
    setSelectedButtons([])
    setSelectedLengths([])
    setSelectedClosures([])
    setSelectedPockets([])
    setSelectedUses([])
    setSelectedLegStyles([])
    setSelectedRises([])
    setSelectedAvailability(null)
    setSelectedDiscount(null)
    setSelectedRating(null)
    setSelectedCollections([])
    if (routeCategory !== 'all') {
      setCategories([routeCategory])
    } else {
      setCategories([])
    }
  }

  // Active filter count
  const activeFilterCount =
    (routeCategory === 'all' ? filterCategories.length : 0) +
    (filterFit !== 'all' ? 1 : 0) +
    selectedFits.length +
    prices.length +
    selectedSizes.length +
    selectedWaistSizes.length +
    selectedColors.length +
    selectedFabrics.length +
    selectedMaterials.length +
    selectedSleeveLengths.length +
    selectedNeckTypes.length +
    selectedPatterns.length +
    selectedPrintStyles.length +
    selectedTrimColors.length +
    selectedButtons.length +
    selectedLengths.length +
    selectedClosures.length +
    selectedPockets.length +
    selectedUses.length +
    selectedLegStyles.length +
    selectedRises.length +
    (selectedAvailability !== null ? 1 : 0) +
    (selectedDiscount !== null ? 1 : 0) +
    (selectedRating !== null ? 1 : 0) +
    selectedCollections.length +
    (searchQuery.trim() ? 1 : 0)

  // Scoped product pool for count calculation
  const poolForCounts = useMemo(() => {
    if (routeCategory !== 'all') {
      return initialProducts.filter(
        (p) => p.category?.toLowerCase() === routeCategory.toLowerCase()
      )
    }
    if (filterCategories.length === 0) return initialProducts

    return initialProducts.filter((p) => {
      return filterCategories.some((cat) => {
        if (cat === 'sale') {
          return p.badge?.toLowerCase() === 'sale' || p.priceNum <= 1500
        }
        return p.category?.toLowerCase() === cat
      })
    })
  }, [initialProducts, routeCategory, filterCategories])

  // Counts for facets
  const counts = useMemo(() => {
    const map: Record<string, number> = {}

    // Categories (store-wide)
    SHOP_CATEGORIES.forEach((c) => {
      if (c.slug === 'all') map[`cat-${c.slug}`] = initialProducts.length
      else if (c.slug === 'sale')
        map[`cat-${c.slug}`] = initialProducts.filter(
          (p) => p.badge?.toLowerCase() === 'sale' || p.priceNum <= 1500
        ).length
      else
        map[`cat-${c.slug}`] = initialProducts.filter(
          (p) => p.category?.toLowerCase() === c.slug
        ).length
    })

    // Size
    ALL_SIZES.forEach((sz) => {
      map[`size-${sz}`] = poolForCounts.filter((p) => p.sizes?.includes(sz)).length
    })

    // Waist size
    ALL_WAIST_SIZES.forEach((ws) => {
      map[`waist-${ws}`] = poolForCounts.filter(
        (p) => p.waistSize?.includes(ws) || p.sizes?.includes(ws)
      ).length
    })

    // Color
    COLOR_PALETTE.forEach(({ name }) => {
      map[`color-${name}`] = poolForCounts.filter(
        (p) =>
          p.color?.toLowerCase() === name.toLowerCase() ||
          p.wash?.toLowerCase().includes(name.toLowerCase())
      ).length
    })

    // Price
    map['price-under-1500'] = poolForCounts.filter((p) => p.priceNum < 1500).length
    map['price-1500-2000'] = poolForCounts.filter(
      (p) => p.priceNum >= 1500 && p.priceNum <= 1999
    ).length
    map['price-above-2000'] = poolForCounts.filter((p) => p.priceNum >= 2000).length

    // Fit
    ;['Slim', 'Regular', 'Relaxed', 'Oversized', 'Boxy', 'Baggy'].forEach((f) => {
      map[`fit-${f}`] = poolForCounts.filter((p) => p.fit === f).length
    })

    // Fabric
    ;['Cotton', 'Cotton blend', 'Polyester', 'French terry', 'Fleece'].forEach(
      (fb) => {
        map[`fabric-${fb}`] = poolForCounts.filter(
          (p) =>
            p.fabric?.toLowerCase() === fb.toLowerCase() ||
            p.material?.toLowerCase() === fb.toLowerCase()
        ).length
      }
    )

    // Material (Bottomwear)
    ;['Nylon-Cotton', 'Poly-Tricot', 'Taslan Nylon', 'Cotton', 'French terry', 'Fleece'].forEach(
      (mat) => {
        map[`mat-${mat}`] = poolForCounts.filter(
          (p) =>
            p.material?.toLowerCase() === mat.toLowerCase() ||
            p.fabric?.toLowerCase() === mat.toLowerCase()
        ).length
      }
    )

    // Sleeve length
    ;['Short Sleeve', 'Full Sleeve', '3/4 Sleeve'].forEach((sl) => {
      map[`sleeve-${sl}`] = poolForCounts.filter((p) => p.sleeveLength === sl).length
    })

    // Neck type
    ;['Crew neck', 'V-neck'].forEach((nk) => {
      map[`neck-${nk}`] = poolForCounts.filter((p) => p.neckType === nk).length
    })

    // Pattern
    ;['Solid', 'Striped', 'Printed', 'Color-block'].forEach((pt) => {
      map[`pattern-${pt}`] = poolForCounts.filter((p) => p.pattern === pt).length
    })

    // Print style
    ;['Graphic', 'Typography', 'Abstract', 'Minimal'].forEach((ps) => {
      map[`print-${ps}`] = poolForCounts.filter((p) => p.printStyle === ps).length
    })

    // Collar / trim color
    ;['Cobalt', 'Forest Green', 'Chocolate', 'Navy'].forEach((tc) => {
      map[`trim-${tc}`] = poolForCounts.filter((p) => p.trimColor === tc).length
    })

    // Buttons
    ;['2-button', '3-button', '4-button'].forEach((btn) => {
      map[`btn-${btn}`] = poolForCounts.filter((p) => p.buttons === btn).length
    })

    // Length
    ;['Full Length', 'Ankle Length'].forEach((len) => {
      map[`len-${len}`] = poolForCounts.filter((p) => p.length === len).length
    })

    // Closure
    ;['Drawstring', 'Elastic waist'].forEach((cl) => {
      map[`closure-${cl}`] = poolForCounts.filter((p) => p.closure === cl).length
    })

    // Pockets
    ;['Cargo Pockets', 'Zippered Pockets', 'Slash Pockets'].forEach((pk) => {
      map[`pocket-${pk}`] = poolForCounts.filter((p) => p.pockets === pk).length
    })

    // Use
    ;['Sports', 'Casual', 'Training'].forEach((u) => {
      map[`use-${u}`] = poolForCounts.filter((p) => p.use === u).length
    })

    // Leg style
    ;['Cuffed', 'Open hem'].forEach((ls) => {
      map[`leg-${ls}`] = poolForCounts.filter((p) => p.legStyle === ls).length
    })

    // Rise
    ;['Mid-rise', 'High-rise'].forEach((rs) => {
      map[`rise-${rs}`] = poolForCounts.filter((p) => p.rise === rs).length
    })

    // Availability
    map['avail-in-stock'] = poolForCounts.filter((p) => p.inStock !== false).length
    map['avail-out-of-stock'] = poolForCounts.filter((p) => p.inStock === false).length

    // Discount
    ;[10, 20, 30, 40, 50].forEach((pct) => {
      map[`disc-${pct}`] = poolForCounts.filter((p) => {
        const orig = Math.round(p.priceNum * 1.38)
        const disc = Math.round(((orig - p.priceNum) / orig) * 100)
        return disc >= pct
      }).length
    })

    // Rating
    map['rate-4'] = poolForCounts.filter((p) => (p.rating ?? 4.5) >= 4).length
    map['rate-3'] = poolForCounts.filter((p) => (p.rating ?? 4.5) >= 3).length

    // Collection
    ;['New arrivals', 'Bestsellers', 'Featured'].forEach((col) => {
      map[`col-${col}`] = poolForCounts.filter(
        (p) => p.collection === col || p.badge?.toLowerCase() === col.toLowerCase()
      ).length
    })

    return map
  }, [poolForCounts, initialProducts])

  // Check if a facet key has active selections
  const checkFacetHasSelection = (key: FacetKey): boolean => {
    switch (key) {
      case 'categories':
        return filterCategories.length > 0
      case 'size':
        return selectedSizes.length > 0
      case 'waistSize':
        return selectedWaistSizes.length > 0
      case 'color':
        return selectedColors.length > 0
      case 'price':
        return prices.length > 0
      case 'fit':
        return selectedFits.length > 0 || filterFit !== 'all'
      case 'fabric':
        return selectedFabrics.length > 0
      case 'material':
        return selectedMaterials.length > 0
      case 'sleeveLength':
        return selectedSleeveLengths.length > 0
      case 'neckType':
        return selectedNeckTypes.length > 0
      case 'pattern':
        return selectedPatterns.length > 0
      case 'printStyle':
        return selectedPrintStyles.length > 0
      case 'trimColor':
        return selectedTrimColors.length > 0
      case 'buttons':
        return selectedButtons.length > 0
      case 'length':
        return selectedLengths.length > 0
      case 'closure':
        return selectedClosures.length > 0
      case 'pockets':
        return selectedPockets.length > 0
      case 'use':
        return selectedUses.length > 0
      case 'legStyle':
        return selectedLegStyles.length > 0
      case 'rise':
        return selectedRises.length > 0
      case 'availability':
        return selectedAvailability !== null
      case 'discount':
        return selectedDiscount !== null
      case 'rating':
        return selectedRating !== null
      case 'collection':
        return selectedCollections.length > 0
      default:
        return false
    }
  }

  // Render individual facet block
  const renderFacetBlock = (key: FacetKey, isDrawer = false) => {
    // CATEGORIES: Shown ONLY on /shop route (routeCategory === 'all')
    if (key === 'categories') {
      if (routeCategory !== 'all') return null
      const isAllChecked = filterCategories.length === 0

      return (
        <div key="facet-categories" className="shop-facet-block">
          <h3 className="shop-facet-title">CATEGORIES</h3>
          <div className="shop-facet-checkbox-list">
            <label className="shop-facet-row">
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={() => setCategories([])}
              />
              <span className="shop-facet-box">
                {isAllChecked && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              <span className="shop-facet-text">All Garments</span>
              <span className="shop-facet-qty">({initialProducts.length})</span>
            </label>

            {SHOP_CATEGORIES.filter((cat) => cat.slug !== 'all').map((cat) => {
              const isChecked = filterCategories.includes(cat.slug)
              const count = counts[`cat-${cat.slug}`] ?? 0
              return (
                <label key={cat.slug} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.slug)}
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
      )
    }

    if (key === 'size') {
      return (
        <div key="facet-size" className="shop-facet-block">
          <h3 className="shop-facet-title">SIZE</h3>
          <div className="shop-size-pills-wrap">
            {ALL_SIZES.map((sz) => {
              const isChecked = selectedSizes.includes(sz)
              const count = counts[`size-${sz}`] ?? 0
              return (
                <button
                  key={sz}
                  type="button"
                  className={`shop-size-pill-btn ${isChecked ? 'active' : ''}`}
                  onClick={() => toggleStringItem(setSelectedSizes, sz)}
                  title={`${sz} (${count} available)`}
                >
                  {sz}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'waistSize') {
      return (
        <div key="facet-waist" className="shop-facet-block">
          <h3 className="shop-facet-title">WAIST SIZE</h3>
          <div className="shop-size-pills-wrap">
            {ALL_WAIST_SIZES.map((ws) => {
              const isChecked = selectedWaistSizes.includes(ws)
              const count = counts[`waist-${ws}`] ?? 0
              return (
                <button
                  key={ws}
                  type="button"
                  className={`shop-size-pill-btn ${isChecked ? 'active' : ''}`}
                  onClick={() => toggleStringItem(setSelectedWaistSizes, ws)}
                  title={`Waist ${ws}" (${count} available)`}
                >
                  {ws}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'color') {
      return (
        <div key="facet-color" className="shop-facet-block">
          <h3 className="shop-facet-title">COLOR</h3>
          <div className="shop-facet-checkbox-list">
            {COLOR_PALETTE.map(({ name, hex }) => {
              const isChecked = selectedColors.includes(name)
              const count = counts[`color-${name}`] ?? 0
              return (
                <label key={name} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedColors, name)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span
                    className="shop-color-swatch-dot"
                    style={{ backgroundColor: hex }}
                    aria-hidden="true"
                  />
                  <span className="shop-facet-text">{name}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'price') {
      return (
        <div key="facet-price" className="shop-facet-block">
          <h3 className="shop-facet-title">PRICE</h3>
          <div className="shop-facet-checkbox-list">
            {(Object.keys(PRICE_LABELS) as PriceRange[]).map((range) => {
              const isChecked = prices.includes(range)
              const count = counts[`price-${range}`] ?? 0
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
      )
    }

    if (key === 'fit') {
      const fitOptions = ['Slim', 'Regular', 'Relaxed', 'Oversized', 'Boxy', 'Baggy']
      return (
        <div key="facet-fit" className="shop-facet-block">
          <h3 className="shop-facet-title">FIT</h3>
          <div className="shop-facet-checkbox-list">
            {fitOptions.map((f) => {
              const isChecked = selectedFits.includes(f) || filterFit === f
              const count = counts[`fit-${f}`] ?? 0
              return (
                <label key={f} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (filterFit === f) setFit('all')
                      toggleStringItem(setSelectedFits, f)
                    }}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{f}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'fabric') {
      const fabricOptions = ['Cotton', 'Cotton blend', 'Polyester', 'French terry', 'Fleece']
      return (
        <div key="facet-fabric" className="shop-facet-block">
          <h3 className="shop-facet-title">FABRIC</h3>
          <div className="shop-facet-checkbox-list">
            {fabricOptions.map((fb) => {
              const isChecked = selectedFabrics.includes(fb)
              const count = counts[`fabric-${fb}`] ?? 0
              return (
                <label key={fb} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedFabrics, fb)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{fb}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'material') {
      const materialOptions = [
        'Nylon-Cotton',
        'Poly-Tricot',
        'Taslan Nylon',
        'Cotton',
        'French terry',
        'Fleece',
      ]
      return (
        <div key="facet-material" className="shop-facet-block">
          <h3 className="shop-facet-title">MATERIAL</h3>
          <div className="shop-facet-checkbox-list">
            {materialOptions.map((mat) => {
              const isChecked = selectedMaterials.includes(mat)
              const count = counts[`mat-${mat}`] ?? 0
              return (
                <label key={mat} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedMaterials, mat)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{mat}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'sleeveLength') {
      const sleeveOptions = ['Short Sleeve', 'Full Sleeve', '3/4 Sleeve']
      return (
        <div key="facet-sleeve" className="shop-facet-block">
          <h3 className="shop-facet-title">SLEEVE LENGTH</h3>
          <div className="shop-facet-checkbox-list">
            {sleeveOptions.map((sl) => {
              const isChecked = selectedSleeveLengths.includes(sl)
              const count = counts[`sleeve-${sl}`] ?? 0
              return (
                <label key={sl} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedSleeveLengths, sl)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{sl}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'neckType') {
      const neckOptions = ['Crew neck', 'V-neck']
      return (
        <div key="facet-neck" className="shop-facet-block">
          <h3 className="shop-facet-title">NECK TYPE</h3>
          <div className="shop-facet-checkbox-list">
            {neckOptions.map((nk) => {
              const isChecked = selectedNeckTypes.includes(nk)
              const count = counts[`neck-${nk}`] ?? 0
              return (
                <label key={nk} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedNeckTypes, nk)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{nk}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'pattern') {
      const patternOptions = ['Solid', 'Striped', 'Printed', 'Color-block']
      return (
        <div key="facet-pattern" className="shop-facet-block">
          <h3 className="shop-facet-title">PATTERN</h3>
          <div className="shop-facet-checkbox-list">
            {patternOptions.map((pt) => {
              const isChecked = selectedPatterns.includes(pt)
              const count = counts[`pattern-${pt}`] ?? 0
              return (
                <label key={pt} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedPatterns, pt)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{pt}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'printStyle') {
      const printOptions = ['Graphic', 'Typography', 'Abstract', 'Minimal']
      return (
        <div key="facet-print" className="shop-facet-block">
          <h3 className="shop-facet-title">PRINT STYLE</h3>
          <div className="shop-facet-checkbox-list">
            {printOptions.map((ps) => {
              const isChecked = selectedPrintStyles.includes(ps)
              const count = counts[`print-${ps}`] ?? 0
              return (
                <label key={ps} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedPrintStyles, ps)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{ps}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'trimColor') {
      const trimOptions = ['Cobalt', 'Forest Green', 'Chocolate', 'Navy']
      return (
        <div key="facet-trim" className="shop-facet-block">
          <h3 className="shop-facet-title">COLLAR / TRIM COLOR</h3>
          <div className="shop-facet-checkbox-list">
            {trimOptions.map((tc) => {
              const isChecked = selectedTrimColors.includes(tc)
              const count = counts[`trim-${tc}`] ?? 0
              return (
                <label key={tc} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedTrimColors, tc)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{tc}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'buttons') {
      const buttonOptions = ['2-button', '3-button', '4-button']
      return (
        <div key="facet-buttons" className="shop-facet-block">
          <h3 className="shop-facet-title">BUTTONS</h3>
          <div className="shop-facet-checkbox-list">
            {buttonOptions.map((btn) => {
              const isChecked = selectedButtons.includes(btn)
              const count = counts[`btn-${btn}`] ?? 0
              return (
                <label key={btn} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedButtons, btn)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{btn}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'length') {
      const lengthOptions = ['Full Length', 'Ankle Length']
      return (
        <div key="facet-length" className="shop-facet-block">
          <h3 className="shop-facet-title">LENGTH</h3>
          <div className="shop-facet-checkbox-list">
            {lengthOptions.map((len) => {
              const isChecked = selectedLengths.includes(len)
              const count = counts[`len-${len}`] ?? 0
              return (
                <label key={len} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedLengths, len)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{len}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'closure') {
      const closureOptions = ['Drawstring', 'Elastic waist']
      return (
        <div key="facet-closure" className="shop-facet-block">
          <h3 className="shop-facet-title">CLOSURE</h3>
          <div className="shop-facet-checkbox-list">
            {closureOptions.map((cl) => {
              const isChecked = selectedClosures.includes(cl)
              const count = counts[`closure-${cl}`] ?? 0
              return (
                <label key={cl} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedClosures, cl)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{cl}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'pockets') {
      const pocketOptions = ['Cargo Pockets', 'Zippered Pockets', 'Slash Pockets']
      return (
        <div key="facet-pockets" className="shop-facet-block">
          <h3 className="shop-facet-title">POCKETS</h3>
          <div className="shop-facet-checkbox-list">
            {pocketOptions.map((pk) => {
              const isChecked = selectedPockets.includes(pk)
              const count = counts[`pocket-${pk}`] ?? 0
              return (
                <label key={pk} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedPockets, pk)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{pk}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'use') {
      const useOptions = ['Sports', 'Casual', 'Training']
      return (
        <div key="facet-use" className="shop-facet-block">
          <h3 className="shop-facet-title">USE / OCCASION</h3>
          <div className="shop-facet-checkbox-list">
            {useOptions.map((u) => {
              const isChecked = selectedUses.includes(u)
              const count = counts[`use-${u}`] ?? 0
              return (
                <label key={u} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedUses, u)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{u}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'legStyle') {
      const legOptions = ['Cuffed', 'Open hem']
      return (
        <div key="facet-leg" className="shop-facet-block">
          <h3 className="shop-facet-title">LEG STYLE</h3>
          <div className="shop-facet-checkbox-list">
            {legOptions.map((ls) => {
              const isChecked = selectedLegStyles.includes(ls)
              const count = counts[`leg-${ls}`] ?? 0
              return (
                <label key={ls} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedLegStyles, ls)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{ls}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'rise') {
      const riseOptions = ['Mid-rise', 'High-rise']
      return (
        <div key="facet-rise" className="shop-facet-block">
          <h3 className="shop-facet-title">RISE</h3>
          <div className="shop-facet-checkbox-list">
            {riseOptions.map((rs) => {
              const isChecked = selectedRises.includes(rs)
              const count = counts[`rise-${rs}`] ?? 0
              return (
                <label key={rs} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedRises, rs)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{rs}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'availability') {
      const availOptions = [
        { id: 'in-stock', label: 'In stock', count: counts['avail-in-stock'] ?? 0 },
        { id: 'out-of-stock', label: 'Out of stock', count: counts['avail-out-of-stock'] ?? 0 },
      ]
      return (
        <div key="facet-avail" className="shop-facet-block">
          <h3 className="shop-facet-title">AVAILABILITY</h3>
          <div className="shop-facet-checkbox-list">
            {availOptions.map(({ id, label, count }) => {
              const isChecked = selectedAvailability === id
              return (
                <label key={id} className="shop-facet-row">
                  <input
                    type="radio"
                    name={isDrawer ? 'drawer-avail' : 'sidebar-avail'}
                    checked={isChecked}
                    onChange={() => setSelectedAvailability(isChecked ? null : id)}
                    onClick={() => {
                      if (isChecked) setSelectedAvailability(null)
                    }}
                  />
                  <span className="shop-facet-radio" />
                  <span className="shop-facet-text">{label}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'discount') {
      const discounts = [10, 20, 30, 40, 50]
      return (
        <div key="facet-discount" className="shop-facet-block">
          <h3 className="shop-facet-title">DISCOUNT RANGE</h3>
          <div className="shop-facet-checkbox-list">
            {discounts.map((pct) => {
              const isChecked = selectedDiscount === pct
              const count = counts[`disc-${pct}`] ?? 0
              return (
                <label key={pct} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setSelectedDiscount(isChecked ? null : pct)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{pct}% and above</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'rating') {
      const ratingOptions = [
        { val: 4, label: '4★ and above', count: counts['rate-4'] ?? 0 },
        { val: 3, label: '3★ and above', count: counts['rate-3'] ?? 0 },
      ]
      return (
        <div key="facet-rating" className="shop-facet-block">
          <h3 className="shop-facet-title">CUSTOMER RATING</h3>
          <div className="shop-facet-checkbox-list">
            {ratingOptions.map(({ val, label, count }) => {
              const isChecked = selectedRating === val
              return (
                <label key={val} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setSelectedRating(isChecked ? null : val)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{label}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'collection') {
      const collectionOptions = ['New arrivals', 'Bestsellers', 'Featured']
      return (
        <div key="facet-collection" className="shop-facet-block">
          <h3 className="shop-facet-title">COLLECTION</h3>
          <div className="shop-facet-checkbox-list">
            {collectionOptions.map((col) => {
              const isChecked = selectedCollections.includes(col)
              const count = counts[`col-${col}`] ?? 0
              return (
                <label key={col} className="shop-facet-row">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedCollections, col)}
                  />
                  <span className="shop-facet-box">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="shop-facet-text">{col}</span>
                  <span className="shop-facet-qty">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="shop-page">
      {/* 1. Breadcrumbs */}
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

      {/* 3. Top Toolbar Strip */}
      <div className="shop-top-toolbar">
        <div className="shop-container">
          <div className="shop-top-toolbar-inner">
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
              {routeCategory === 'all' &&
                filterCategories.map((catSlug) => {
                  const catLabel =
                    SHOP_CATEGORIES.find((c) => c.slug === catSlug)?.label || catSlug
                  return (
                    <button
                      key={`chip-cat-${catSlug}`}
                      type="button"
                      className="shop-chip"
                      onClick={() => toggleCategory(catSlug)}
                      title={`Remove ${catLabel} filter`}
                    >
                      Category: {catLabel}
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  )
                })}

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

              {selectedFits.map((f) => (
                <button
                  key={`chip-fit-${f}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedFits, f)}
                >
                  Fit: {f}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {prices.map((range) => (
                <button
                  key={`chip-p-${range}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => togglePrice(range)}
                >
                  {PRICE_LABELS[range]}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedSizes.map((sz) => (
                <button
                  key={`chip-sz-${sz}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedSizes, sz)}
                >
                  Size: {sz}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedWaistSizes.map((ws) => (
                <button
                  key={`chip-ws-${ws}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedWaistSizes, ws)}
                >
                  Waist: {ws}&quot;
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedColors.map((col) => (
                <button
                  key={`chip-c-${col}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedColors, col)}
                >
                  Color: {col}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedFabrics.map((fb) => (
                <button
                  key={`chip-fb-${fb}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedFabrics, fb)}
                >
                  Fabric: {fb}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedMaterials.map((mat) => (
                <button
                  key={`chip-mat-${mat}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedMaterials, mat)}
                >
                  Material: {mat}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedSleeveLengths.map((sl) => (
                <button
                  key={`chip-sl-${sl}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedSleeveLengths, sl)}
                >
                  Sleeve: {sl}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedNeckTypes.map((nk) => (
                <button
                  key={`chip-nk-${nk}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedNeckTypes, nk)}
                >
                  Neck: {nk}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedPatterns.map((pt) => (
                <button
                  key={`chip-pt-${pt}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedPatterns, pt)}
                >
                  Pattern: {pt}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedPrintStyles.map((ps) => (
                <button
                  key={`chip-ps-${ps}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedPrintStyles, ps)}
                >
                  Print: {ps}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedTrimColors.map((tc) => (
                <button
                  key={`chip-tc-${tc}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedTrimColors, tc)}
                >
                  Trim: {tc}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedButtons.map((btn) => (
                <button
                  key={`chip-btn-${btn}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedButtons, btn)}
                >
                  Buttons: {btn}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedLengths.map((len) => (
                <button
                  key={`chip-len-${len}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedLengths, len)}
                >
                  Length: {len}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedClosures.map((cl) => (
                <button
                  key={`chip-cl-${cl}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedClosures, cl)}
                >
                  Closure: {cl}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedPockets.map((pk) => (
                <button
                  key={`chip-pk-${pk}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedPockets, pk)}
                >
                  Pockets: {pk}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedUses.map((u) => (
                <button
                  key={`chip-u-${u}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedUses, u)}
                >
                  Use: {u}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedLegStyles.map((ls) => (
                <button
                  key={`chip-ls-${ls}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedLegStyles, ls)}
                >
                  Leg: {ls}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedRises.map((rs) => (
                <button
                  key={`chip-rs-${rs}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedRises, rs)}
                >
                  Rise: {rs}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedAvailability && (
                <button
                  type="button"
                  className="shop-chip"
                  onClick={() => setSelectedAvailability(null)}
                >
                  Availability: {selectedAvailability === 'in-stock' ? 'In stock' : 'Out of stock'}
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}

              {selectedDiscount !== null && (
                <button
                  type="button"
                  className="shop-chip"
                  onClick={() => setSelectedDiscount(null)}
                >
                  {selectedDiscount}%+ Off
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}

              {selectedRating !== null && (
                <button
                  type="button"
                  className="shop-chip"
                  onClick={() => setSelectedRating(null)}
                >
                  {selectedRating}★ & above
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}

              {selectedCollections.map((col) => (
                <button
                  key={`chip-col-${col}`}
                  type="button"
                  className="shop-chip"
                  onClick={() => toggleStringItem(setSelectedCollections, col)}
                >
                  {col}
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
                  &ldquo;{searchQuery}&rdquo;
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

      {/* 4. Main 2-Column Layout */}
      <div className="shop-container">
        <div className="shop-main-layout">
          {/* Left Column: Fixed/Sticky Desktop Sidebar */}
          <aside className="shop-desktop-sidebar" aria-label="Catalog filters sidebar">
            <div className="shop-facets-sidebar-inner">
              {activeFacets.map((facetKey) => renderFacetBlock(facetKey, false))}
            </div>
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

      {/* 5. Mobile Fixed Bottom Action Bar */}
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

      {/* 7. Mobile Filter Modal (2-Column Split Body) */}
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
          {/* Left Column: Facet Tabs for Active Category */}
          <div className="shop-mobile-filter-tabs">
            {activeFacets.map((facetKey) => {
              const hasSelection = checkFacetHasSelection(facetKey)
              return (
                <button
                  key={facetKey}
                  type="button"
                  className={`shop-mobile-tab-btn ${activeMobileTab === facetKey ? 'active' : ''}`}
                  onClick={() => setActiveMobileTab(facetKey)}
                >
                  <span className="shop-mobile-tab-label">
                    {FACET_TITLES[facetKey]}
                  </span>
                  {hasSelection && <span className="shop-mobile-tab-dot" />}
                </button>
              )
            })}
          </div>

          {/* Right Column: Facet Options for Active Tab */}
          <div className="shop-mobile-filter-pane">
            <div style={{ padding: '12px 16px' }}>
              {renderFacetBlock(activeMobileTab, true)}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
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
            APPLY {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
