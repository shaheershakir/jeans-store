'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Check,
  Star,
  ChevronDown,
  ChevronUp,
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

const SIZE_PILL_INACTIVE =
  'flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white font-ui text-xs font-semibold text-gray-800 transition-colors duration-150 hover:border-gray-400'
const SIZE_PILL_ACTIVE =
  'flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-black bg-black font-ui text-xs font-semibold text-white shadow-xs transition-colors duration-150'

const SHOP_CATEGORIES = [
  { id: 'all', slug: 'all', href: '/shop', label: 'All Garments' },
  { id: 'stripes', slug: 'stripes', href: '/shop/stripes', label: 'Stripes' },
  { id: 'fullsleeve', slug: 'fullsleeve', href: '/shop/fullsleeve', label: 'Fullsleeve' },
  { id: 'drsleeve', slug: 'drsleeve', href: '/shop/drsleeve', label: '3/4 Sleeve (Drsleeve)' },
  { id: 'printed-tees', slug: 'printed-tees', href: '/shop/printed-tees', label: 'Printed Tees' },
  { id: 'ringer-tees', slug: 'ringer-tees', href: '/shop/ringer-tees', label: 'Ringer Tees' },
  { id: 'henley', slug: 'henley', href: '/shop/henley', label: 'Henley' },
  { id: 'waffle', slug: 'waffle', href: '/shop/waffle', label: 'Waffle' },
  { id: 'trackpants', slug: 'trackpants', href: '/shop/trackpants', label: 'Trackpants' },
  { id: 'sweatpants', slug: 'sweatpants', href: '/shop/sweatpants', label: 'Sweatpants' },
  { id: 'sale', slug: 'sale', href: '/shop/sale', label: 'Sale & Archive' },
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const ALL_WAIST_SIZES = ['30', '32', '34', '36', '38']

const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Navy', hex: '#1b2b48' },
  { name: 'Grey', hex: '#6b7280' },
  { name: 'Beige', hex: '#c9b89d' },
  { name: 'Green', hex: '#3a6946' },
  { name: 'Red', hex: '#8b1e2d' },
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

const FACET_DISPLAY_NAMES: Record<FacetKey, string> = {
  categories: 'Categories',
  size: 'Size',
  waistSize: 'Waist Size',
  color: 'Color',
  price: 'Price',
  fit: 'Fit',
  fabric: 'Fabric',
  material: 'Material',
  sleeveLength: 'Sleeve Length',
  neckType: 'Neck Type',
  pattern: 'Pattern',
  printStyle: 'Print Style',
  trimColor: 'Collar / Trim Color',
  buttons: 'Buttons',
  length: 'Length',
  closure: 'Closure',
  pockets: 'Pockets',
  use: 'Use / Occasion',
  legStyle: 'Leg Style',
  rise: 'Rise',
  availability: 'Availability',
  discount: 'Discount range',
  rating: 'Customer rating',
  collection: 'Collection',
}

const CATEGORY_FACETS: Record<string, FacetKey[]> = {
  all: [
    'categories',
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
    'collection',
  ],
  stripes: [
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  fullsleeve: [
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  drsleeve: [
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  'printed-tees': [
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  'ringer-tees': [
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  henley: [
    'size',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  trackpants: [
    'waistSize',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  sweatpants: [
    'waistSize',
    'color',
    'price',
    'availability',
    'discount',
    'rating',
  ],
  sale: [
    'categories',
    'size',
    'color',
    'price',
    'availability',
    'discount',
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setDrawerOpen(false)
        setSortSheetOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  // Collapsible accordion state for facets (Size and Color open by default)
  const [openFacets, setOpenFacets] = useState<Record<string, boolean>>({
    size: true,
    color: true,
    waistSize: true,
    categories: true,
    price: false,
    availability: false,
    discount: false,
    rating: false,
    fit: false,
    fabric: false,
    material: false,
    sleeveLength: false,
    neckType: false,
    pattern: false,
    printStyle: false,
    trimColor: false,
    buttons: false,
    length: false,
    closure: false,
    pockets: false,
    use: false,
    legStyle: false,
    rise: false,
    collection: false,
  })

  const toggleFacet = (key: string) => {
    setOpenFacets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

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
    if (key === 'categories' && routeCategory !== 'all') return null

    const isOpen = isDrawer ? true : (openFacets[key] ?? false)
    const titleText = FACET_DISPLAY_NAMES[key] || key

    let content: React.ReactNode = null

    if (key === 'categories') {
      const isAllChecked = filterCategories.length === 0
      content = (
        <div className="flex flex-col gap-2.5">
          <label className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
            <input
              className="peer pointer-events-none absolute h-0 w-0 opacity-0"
              type="checkbox"
              checked={isAllChecked}
              onChange={() => setCategories([])}
            />
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
              {isAllChecked && <Check className="h-3 w-3 stroke-[3]" />}
            </span>
            <span className="font-ui text-[13px] font-normal text-gray-900">All Garments</span>
            <span className="ml-0.5 font-ui text-[12px] text-gray-400">({initialProducts.length})</span>
          </label>

          {SHOP_CATEGORIES.filter((cat) => cat.slug !== 'all').map((cat) => {
            const isChecked = filterCategories.includes(cat.slug)
            const count = counts[`cat-${cat.slug}`] ?? 0
            return (
              <label key={cat.slug} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCategory(cat.slug)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{cat.label}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'size') {
      content = (
        <div className="grid grid-cols-5 gap-2">
          {ALL_SIZES.map((sz) => {
            const isChecked = selectedSizes.includes(sz)
            const count = counts[`size-${sz}`] ?? 0
            return (
              <button
                key={sz}
                type="button"
                className={isChecked ? SIZE_PILL_ACTIVE : SIZE_PILL_INACTIVE}
                onClick={() => toggleStringItem(setSelectedSizes, sz)}
                title={`${sz} (${count} available)`}
              >
                {sz}
              </button>
            )
          })}
        </div>
      )
    } else if (key === 'waistSize') {
      content = (
        <div className="grid grid-cols-5 gap-2">
          {ALL_WAIST_SIZES.map((ws) => {
            const isChecked = selectedWaistSizes.includes(ws)
            const count = counts[`waist-${ws}`] ?? 0
            return (
              <button
                key={ws}
                type="button"
                className={isChecked ? SIZE_PILL_ACTIVE : SIZE_PILL_INACTIVE}
                onClick={() => toggleStringItem(setSelectedWaistSizes, ws)}
                title={`Waist ${ws}" (${count} available)`}
              >
                {ws}
              </button>
            )
          })}
        </div>
      )
    } else if (key === 'color') {
      content = (
        <div className="flex flex-col gap-2.5">
          {COLOR_PALETTE.map(({ name, hex }) => {
            const isChecked = selectedColors.includes(name)
            const count = counts[`color-${name}`] ?? 0
            return (
              <label key={name} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedColors, name)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: hex }}
                  aria-hidden="true"
                />
                <span className="font-ui text-[13px] font-normal text-gray-900">{name}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'price') {
      content = (
        <div className="flex flex-col gap-2.5">
          {(Object.keys(PRICE_LABELS) as PriceRange[]).map((range) => {
            const isChecked = prices.includes(range)
            const count = counts[`price-${range}`] ?? 0
            return (
              <label key={range} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => togglePrice(range)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{PRICE_LABELS[range]}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'fit') {
      const fitOptions = ['Slim', 'Regular', 'Relaxed', 'Oversized', 'Boxy', 'Baggy']
      content = (
        <div className="flex flex-col gap-2.5">
          {fitOptions.map((f) => {
            const isChecked = selectedFits.includes(f) || filterFit === f
            const count = counts[`fit-${f}`] ?? 0
            return (
              <label key={f} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    if (filterFit === f) setFit('all')
                    toggleStringItem(setSelectedFits, f)
                  }}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{f}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'fabric') {
      const fabricOptions = ['Cotton', 'Cotton blend', 'Polyester', 'French terry', 'Fleece']
      content = (
        <div className="flex flex-col gap-2.5">
          {fabricOptions.map((fb) => {
            const isChecked = selectedFabrics.includes(fb)
            const count = counts[`fabric-${fb}`] ?? 0
            return (
              <label key={fb} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedFabrics, fb)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{fb}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'material') {
      const materialOptions = [
        'Nylon-Cotton',
        'Poly-Tricot',
        'Taslan Nylon',
        'Cotton',
        'French terry',
        'Fleece',
      ]
      content = (
        <div className="flex flex-col gap-2.5">
          {materialOptions.map((mat) => {
            const isChecked = selectedMaterials.includes(mat)
            const count = counts[`mat-${mat}`] ?? 0
            return (
              <label key={mat} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedMaterials, mat)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{mat}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'sleeveLength') {
      const sleeveOptions = ['Short Sleeve', 'Full Sleeve', '3/4 Sleeve']
      content = (
        <div className="flex flex-col gap-2.5">
          {sleeveOptions.map((sl) => {
            const isChecked = selectedSleeveLengths.includes(sl)
            const count = counts[`sleeve-${sl}`] ?? 0
            return (
              <label key={sl} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedSleeveLengths, sl)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{sl}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'neckType') {
      const neckOptions = ['Round neck / Crewneck', 'High neck', 'Polo collar', 'Henley']
      content = (
        <div className="flex flex-col gap-2.5">
          {neckOptions.map((nk) => {
            const isChecked = selectedNeckTypes.includes(nk)
            const count = counts[`neck-${nk}`] ?? 0
            return (
              <label key={nk} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedNeckTypes, nk)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{nk}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'pattern') {
      const patternOptions = ['Striped', 'Solid', 'Printed']
      content = (
        <div className="flex flex-col gap-2.5">
          {patternOptions.map((pt) => {
            const isChecked = selectedPatterns.includes(pt)
            const count = counts[`pat-${pt}`] ?? 0
            return (
              <label key={pt} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedPatterns, pt)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{pt}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'printStyle') {
      const printOptions = ['Back print', 'Chest print', 'Subtle typography']
      content = (
        <div className="flex flex-col gap-2.5">
          {printOptions.map((ps) => {
            const isChecked = selectedPrintStyles.includes(ps)
            const count = counts[`print-${ps}`] ?? 0
            return (
              <label key={ps} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedPrintStyles, ps)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{ps}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'trimColor') {
      const trimOptions = ['White / Cream', 'Black', 'Contrast rib']
      content = (
        <div className="flex flex-col gap-2.5">
          {trimOptions.map((tc) => {
            const isChecked = selectedTrimColors.includes(tc)
            const count = counts[`trim-${tc}`] ?? 0
            return (
              <label key={tc} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedTrimColors, tc)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{tc}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'buttons') {
      const buttonOptions = ['2-button placket', '3-button placket']
      content = (
        <div className="flex flex-col gap-2.5">
          {buttonOptions.map((btn) => {
            const isChecked = selectedButtons.includes(btn)
            const count = counts[`btn-${btn}`] ?? 0
            return (
              <label key={btn} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedButtons, btn)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{btn}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'length') {
      const lengthOptions = ['Full length', 'Cropped / Ankle']
      content = (
        <div className="flex flex-col gap-2.5">
          {lengthOptions.map((len) => {
            const isChecked = selectedLengths.includes(len)
            const count = counts[`len-${len}`] ?? 0
            return (
              <label key={len} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedLengths, len)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{len}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'closure') {
      const closureOptions = ['Drawstring elastic', 'Internal drawstring']
      content = (
        <div className="flex flex-col gap-2.5">
          {closureOptions.map((cl) => {
            const isChecked = selectedClosures.includes(cl)
            const count = counts[`cl-${cl}`] ?? 0
            return (
              <label key={cl} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedClosures, cl)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{cl}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'pockets') {
      const pocketOptions = ['Zipper pockets', 'Deep side pockets', 'Cargo pockets']
      content = (
        <div className="flex flex-col gap-2.5">
          {pocketOptions.map((pk) => {
            const isChecked = selectedPockets.includes(pk)
            const count = counts[`pk-${pk}`] ?? 0
            return (
              <label key={pk} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedPockets, pk)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{pk}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'use') {
      const useOptions = ['Athletic / Training', 'Casual streetwear', 'Loungewear']
      content = (
        <div className="flex flex-col gap-2.5">
          {useOptions.map((u) => {
            const isChecked = selectedUses.includes(u)
            const count = counts[`use-${u}`] ?? 0
            return (
              <label key={u} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedUses, u)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{u}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'legStyle') {
      const legOptions = ['Cuffed', 'Open hem']
      content = (
        <div className="flex flex-col gap-2.5">
          {legOptions.map((ls) => {
            const isChecked = selectedLegStyles.includes(ls)
            const count = counts[`leg-${ls}`] ?? 0
            return (
              <label key={ls} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedLegStyles, ls)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{ls}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'rise') {
      const riseOptions = ['Mid-rise', 'High-rise']
      content = (
        <div className="flex flex-col gap-2.5">
          {riseOptions.map((rs) => {
            const isChecked = selectedRises.includes(rs)
            const count = counts[`rise-${rs}`] ?? 0
            return (
              <label key={rs} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedRises, rs)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{rs}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'availability') {
      const availOptions = [
        { id: 'in-stock', label: 'In stock', count: counts['avail-in-stock'] ?? 0 },
        { id: 'out-of-stock', label: 'Out of stock', count: counts['avail-out-of-stock'] ?? 0 },
      ]
      content = (
        <div className="flex flex-col gap-2.5">
          {availOptions.map(({ id, label, count }) => {
            const isChecked = selectedAvailability === id
            return (
              <label key={id} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setSelectedAvailability(isChecked ? null : id)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{label}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'discount') {
      const discounts = [10, 20, 30, 40, 50]
      content = (
        <div className="flex flex-col gap-2.5">
          {discounts.map((pct) => {
            const isChecked = selectedDiscount === pct
            const count = counts[`disc-${pct}`] ?? 0
            return (
              <label key={pct} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setSelectedDiscount(isChecked ? null : pct)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{pct}% and above</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'rating') {
      const ratingOptions = [
        { val: 4, label: '4★ and above', count: counts['rate-4'] ?? 0 },
        { val: 3, label: '3★ and above', count: counts['rate-3'] ?? 0 },
      ]
      content = (
        <div className="flex flex-col gap-2.5">
          {ratingOptions.map(({ val, label, count }) => {
            const isChecked = selectedRating === val
            return (
              <label key={val} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setSelectedRating(isChecked ? null : val)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{label}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    } else if (key === 'collection') {
      const collectionOptions = ['New arrivals', 'Bestsellers', 'Featured']
      content = (
        <div className="flex flex-col gap-2.5">
          {collectionOptions.map((col) => {
            const isChecked = selectedCollections.includes(col)
            const count = counts[`col-${col}`] ?? 0
            return (
              <label key={col} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13px]">
                <input
                  className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleStringItem(setSelectedCollections, col)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-white text-white transition-colors peer-checked:border-black peer-checked:bg-black">
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span className="font-ui text-[13px] font-normal text-gray-900">{col}</span>
                <span className="ml-0.5 font-ui text-[12px] text-gray-400">({count})</span>
              </label>
            )
          })}
        </div>
      )
    }

    if (!content) return null

    if (isDrawer) {
      return (
        <div key={`drawer-facet-${key}`} className="border-b-0 pb-4 pt-1">
          {content}
        </div>
      )
    }

    return (
      <div key={`facet-${key}`} className="py-3.5">
        <button
          type="button"
          onClick={() => toggleFacet(key)}
          className="flex w-full cursor-pointer select-none items-center justify-between py-1 text-left"
          aria-expanded={isOpen}
        >
          <span className="font-brand text-[13px] font-bold text-gray-900">
            {titleText}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-700" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-700" />
          )}
        </button>
        {isOpen && <div className="pt-3 pb-1">{content}</div>}
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white pb-16 font-ui text-gray-900 [@media(max-width:768px)]:pb-[70px]">
      {/* 1. Breadcrumbs */}
      <nav className="pt-4 pb-2" aria-label="Breadcrumb navigation">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <ol className="flex list-none items-center gap-2 font-ui text-xs text-gray-500">
            <li>
              <Link href="/" className="hover:text-black transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-400 select-none" aria-hidden="true">
              /
            </li>
            <li>
              <Link href="/shop" className="hover:text-black transition-colors">
                Shop
              </Link>
            </li>
            {routeCategory !== 'all' && (
              <>
                <li className="text-gray-400 select-none" aria-hidden="true">
                  /
                </li>
                <li className="text-gray-800 font-medium" aria-current="page">
                  {title}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      {/* 2. Top Title and Item Count */}
      <div className="pt-1 pb-4">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-brand text-2xl sm:text-[28px] font-bold tracking-tight text-gray-950">
              {title}
            </h1>
            <span className="font-ui text-base sm:text-lg font-normal text-gray-500">
              &middot; {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Catalog Section with Unified Sidebar & Content */}
      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex items-start">
            {/* Left Column: Fixed/Sticky Desktop Sidebar */}
            <aside
              className="w-[240px] lg:w-[250px] shrink-0 sticky top-[80px] max-h-[calc(100vh-90px)] overflow-y-auto border-r border-gray-200 pr-6 pt-5 pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-width:768px)]:hidden"
              aria-label="Catalog filters sidebar"
            >
              {/* Header: FILTERS and Clear all */}
              <div className="flex items-center justify-between pb-4">
                <span className="font-brand text-[13px] font-bold uppercase tracking-[0.06em] text-gray-900">
                  FILTERS
                </span>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent font-ui text-xs font-normal text-gray-500 transition-colors hover:text-black"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
              </div>

              {/* Accordion Facet Blocks */}
              <div className="divide-y divide-gray-200 border-t border-gray-200">
                {activeFacets.map((facetKey) => renderFacetBlock(facetKey, false))}
              </div>
            </aside>

            {/* Right Column: Catalog Content */}
            <main className="flex-1 min-w-0 pl-0 md:pl-6 lg:pl-8 pt-4 pb-12">
              {/* Sort Dropdown Row */}
              <div className="flex items-center justify-end pb-5">
                <span className="whitespace-nowrap font-ui text-[13px] font-normal text-gray-500 mr-2">
                  Sort by :
                </span>
                <div className="relative inline-block">
                  <select
                    id="shop-sort-select"
                    className="appearance-none cursor-pointer rounded-lg border border-gray-200 bg-white py-1.5 pl-3.5 pr-8 font-ui text-xs font-semibold text-gray-900 shadow-xs hover:border-gray-300 focus:outline-none"
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
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="mx-auto my-12 max-w-[500px] rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-12 text-center">
                  <h2 className="mb-2 font-brand text-lg font-bold text-gray-900">
                    We couldn&apos;t find any matches
                  </h2>
                  <p className="mb-6 font-ui text-sm text-gray-500">
                    Try clearing some of your filters or searching for another silhouette or color.
                  </p>
                  <button
                    type="button"
                    className="cursor-pointer rounded-xl bg-black px-6 py-3 font-brand text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-opacity hover:opacity-90"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-4 xl:gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      selectedSize={selectedSizes[0] || 'L'}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* 5 & 6. Mobile Actions & Modals (Portaled to document.body to stick directly to device viewport) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <>
          {/* Mobile Fixed Bottom Action Bar */}
          <div className="fixed inset-x-0 bottom-0 z-[95] hidden h-[calc(54px+env(safe-area-inset-bottom,0px))] w-full border-t border-black/[0.08] bg-[rgba(255,255,255,0.94)] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.05),0_-1px_3px_rgba(0,0,0,0.03)] [@media(max-width:768px)]:flex [@media(max-width:768px)]:items-stretch" aria-label="Mobile filter actions">
            <button
              type="button"
              className="flex flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-2 border-0 bg-transparent font-brand text-[12.5px] font-bold uppercase leading-[18.75px] tracking-[0.06em] text-store-ink [-webkit-tap-highlight-color:transparent] [transition:transform_0.12s_cubic-bezier(0.16,1,0.3,1),background-color_0.15s_ease] active:bg-black/[0.04]"
              onClick={() => setSortSheetOpen(true)}
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>SORT</span>
            </button>
            <div className="h-[22px] w-px self-center bg-black/[0.08]" />
            <button
              type="button"
              className="flex flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-2 border-0 bg-transparent font-brand text-[12.5px] font-bold uppercase leading-[18.75px] tracking-[0.06em] text-store-ink [-webkit-tap-highlight-color:transparent] [transition:transform_0.12s_cubic-bezier(0.16,1,0.3,1),background-color_0.15s_ease] active:bg-black/[0.04]"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>FILTER</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-store-ink px-1 font-mono text-[10px] font-bold leading-[15px] text-white">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Mobile Sort Bottom Sheet */}
          {sortSheetOpen && (
            <div
              className="fixed inset-0 z-[99998] hidden bg-[rgba(0,0,0,0.55)] [animation:fadeInModalBackdrop_0.2s_ease] [@media(max-width:768px)]:block"
              onClick={() => setSortSheetOpen(false)}
              aria-hidden="true"
            />
          )}
          <div
            className={`fixed inset-x-0 bottom-0 z-[99999] hidden max-h-[80vh] overflow-y-auto rounded-t-2xl bg-store-paper shadow-[0_-4px_24px_rgba(0,0,0,0.18)] [transition:transform_0.25s_cubic-bezier(0.16,1,0.3,1),visibility_0.25s] [@media(max-width:768px)]:block ${sortSheetOpen ? 'visible pointer-events-auto [transform:translateY(0)]' : 'invisible pointer-events-none [transform:translateY(100%)]'}`}
            aria-hidden={!sortSheetOpen}
            role="dialog"
            aria-label="Sort options"
          >
            <div className="flex items-center justify-between border-b border-[#f3f4f6] px-5 py-4">
              <span className="font-brand text-[13.5px] font-bold leading-[20.25px] tracking-[0.04em] text-[#282c3f]">SORT BY</span>
              <button
                type="button"
                className="flex cursor-pointer items-center justify-center border-0 bg-transparent p-1 text-[#878b94]"
                onClick={() => setSortSheetOpen(false)}
                aria-label="Close sort dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col pb-5 pt-1.5">
              {SORT_OPTIONS.map((opt) => (
                <label
                  key={opt.mode}
                  className={`flex cursor-pointer items-center gap-3.5 px-5 py-3.5 [transition:background_0.15s_ease] ${sort === opt.mode ? 'bg-[#fafafb]' : ''}`}
                  onClick={() => {
                    setSort(opt.mode)
                    setSortSheetOpen(false)
                  }}
                >
                  <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${sort === opt.mode ? 'border-[#ff3f6c]' : 'border-[#d4d5d9]'}`}>
                    {sort === opt.mode && <span className="h-2 w-2 rounded-full bg-[#ff3f6c]" />}
                  </span>
                  <span className="font-ui text-[13.5px] font-medium leading-[20.25px] text-[#282c3f]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mobile Filter Modal (2-Column Split Body) */}
          <div
            className={`fixed inset-0 z-[99999] hidden h-[100dvh] w-screen flex-col overflow-hidden bg-white [transition:transform_0.28s_cubic-bezier(0.16,1,0.3,1),visibility_0.28s] [@media(max-width:768px)]:flex ${drawerOpen ? 'visible pointer-events-auto [transform:translateY(0)]' : 'invisible pointer-events-none [transform:translateY(100%)]'}`}
            aria-hidden={!drawerOpen}
            role="dialog"
            aria-label="Filter catalog"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-store-line bg-store-paper px-5 py-4">
              <span className="font-brand text-[15px] font-bold uppercase leading-[22.5px] tracking-[0.05em] text-[#282c3f]">FILTERS</span>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent px-2 py-1 font-brand text-[12px] font-bold leading-[18px] tracking-[0.04em] text-[#ff3f6c]"
                    onClick={clearAllFilters}
                  >
                    CLEAR ALL
                  </button>
                )}
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-1 text-[#555964] [transition:color_0.15s,background-color_0.15s] hover:bg-[#f3f4f6] hover:text-[#111827]"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 2-Column Body */}
            <div className="flex flex-1 overflow-hidden bg-white">
              {/* Left Column: Facet Tabs for Active Category */}
              <div className="flex w-[38%] min-w-[125px] max-w-[155px] shrink-0 flex-col overflow-y-auto border-r border-[#eaeaec] bg-[#f5f5f6] [-webkit-overflow-scrolling:touch]">
                {activeFacets.map((facetKey) => {
                  const hasSelection = checkFacetHasSelection(facetKey)
                  return (
                    <button
                      key={facetKey}
                      type="button"
                      className={`relative flex w-full cursor-pointer items-center justify-between border-0 border-b border-[#eaeaec] px-3.5 py-4 text-left font-ui text-[13.5px] leading-[20.25px] text-[#282c3f] [transition:background_0.15s_ease,font-weight_0.15s_ease] ${activeMobileTab === facetKey ? '-mr-px border-r border-r-white bg-white font-bold' : 'bg-[#f5f5f6] font-medium'}`}
                      onClick={() => setActiveMobileTab(facetKey)}
                    >
                      <span className="flex-1 leading-[1.3]">
                        {FACET_TITLES[facetKey]}
                      </span>
                      {hasSelection && <span className="ml-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-[#ff3f6c]" />}
                    </button>
                  )
                })}
              </div>

              {/* Right Column: Facet Options for Active Tab */}
              <div className="flex-1 overflow-y-auto bg-white [-webkit-overflow-scrolling:touch]">
                <div className="px-4 py-3">
                  {renderFacetBlock(activeMobileTab, true)}
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="flex h-[52px] shrink-0 border-t border-store-line bg-[rgba(248,247,243,0.97)]">
              <button
                type="button"
                className="flex flex-1 cursor-pointer items-center justify-center rounded-[2px] border-0 border-r border-[#eaeaec] bg-store-ink font-brand text-[13px] font-bold uppercase leading-[19.5px] tracking-[0.05em] text-white [transition:background_0.15s_ease] active:bg-[#f5f5f6]"
                onClick={() => setDrawerOpen(false)}
              >
                CLOSE
              </button>
              <button
                type="button"
                className="flex flex-1 cursor-pointer items-center justify-center rounded-[2px] border-0 bg-store-ink font-brand text-[13px] font-bold uppercase leading-[19.5px] tracking-[0.05em] text-white [transition:background_0.15s_ease] active:bg-[#fff5f7]"
                onClick={() => setDrawerOpen(false)}
              >
                APPLY {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
