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
  'flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[2px] border border-[#d2d3ce] bg-white font-ui text-[11.5px] font-semibold leading-[17.25px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#ff3f6c]'
const SIZE_PILL_ACTIVE =
  'flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[2px] border border-store-ink bg-store-ink font-ui text-[11.5px] font-semibold leading-[17.25px] text-white transition-all duration-150'

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
    const facetBlockClass = isDrawer
      ? 'border-b-0 pb-4 pt-1'
      : 'border-b border-store-line py-4 first:pt-0 last:border-b-0'
    const facetTitleClass = isDrawer
      ? 'hidden'
      : 'mb-3 font-brand text-[12.5px] font-bold uppercase leading-[16.25px] tracking-[0.04em] text-[#59666c]'
    // CATEGORIES: Shown ONLY on /shop route (routeCategory === 'all')
    if (key === 'categories') {
      if (routeCategory !== 'all') return null
      const isAllChecked = filterCategories.length === 0

      return (
        <div key="facet-categories" className={facetBlockClass}>
          <h3 className={facetTitleClass}>CATEGORIES</h3>
          <div className="flex flex-col gap-[9px]">
            <label className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
              <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                type="checkbox"
                checked={isAllChecked}
                onChange={() => setCategories([])}
              />
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                {isAllChecked && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">All Garments</span>
              <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({initialProducts.length})</span>
            </label>

            {SHOP_CATEGORIES.filter((cat) => cat.slug !== 'all').map((cat) => {
              const isChecked = filterCategories.includes(cat.slug)
              const count = counts[`cat-${cat.slug}`] ?? 0
              return (
                <label key={cat.slug} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{cat.label}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'size') {
      return (
        <div key="facet-size" className={facetBlockClass}>
          <h3 className={facetTitleClass}>SIZE</h3>
          <div className="flex flex-wrap gap-[7px]">
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
        </div>
      )
    }

    if (key === 'waistSize') {
      return (
        <div key="facet-waist" className={facetBlockClass}>
          <h3 className={facetTitleClass}>WAIST SIZE</h3>
          <div className="flex flex-wrap gap-[7px]">
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
        </div>
      )
    }

    if (key === 'color') {
      return (
        <div key="facet-color" className={facetBlockClass}>
          <h3 className={facetTitleClass}>COLOR</h3>
          <div className="flex flex-col gap-[9px]">
            {COLOR_PALETTE.map(({ name, hex }) => {
              const isChecked = selectedColors.includes(name)
              const count = counts[`color-${name}`] ?? 0
              return (
                <label key={name} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedColors, name)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span
                    className="h-[13px] w-[13px] shrink-0 rounded-full border border-black/[0.12]"
                    style={{ backgroundColor: hex }}
                    aria-hidden="true"
                  />
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{name}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (key === 'price') {
      return (
        <div key="facet-price" className={facetBlockClass}>
          <h3 className={facetTitleClass}>PRICE</h3>
          <div className="flex flex-col gap-[9px]">
            {(Object.keys(PRICE_LABELS) as PriceRange[]).map((range) => {
              const isChecked = prices.includes(range)
              const count = counts[`price-${range}`] ?? 0
              return (
                <label key={range} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePrice(range)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{PRICE_LABELS[range]}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-fit" className={facetBlockClass}>
          <h3 className={facetTitleClass}>FIT</h3>
          <div className="flex flex-col gap-[9px]">
            {fitOptions.map((f) => {
              const isChecked = selectedFits.includes(f) || filterFit === f
              const count = counts[`fit-${f}`] ?? 0
              return (
                <label key={f} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (filterFit === f) setFit('all')
                      toggleStringItem(setSelectedFits, f)
                    }}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{f}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-fabric" className={facetBlockClass}>
          <h3 className={facetTitleClass}>FABRIC</h3>
          <div className="flex flex-col gap-[9px]">
            {fabricOptions.map((fb) => {
              const isChecked = selectedFabrics.includes(fb)
              const count = counts[`fabric-${fb}`] ?? 0
              return (
                <label key={fb} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedFabrics, fb)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{fb}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-material" className={facetBlockClass}>
          <h3 className={facetTitleClass}>MATERIAL</h3>
          <div className="flex flex-col gap-[9px]">
            {materialOptions.map((mat) => {
              const isChecked = selectedMaterials.includes(mat)
              const count = counts[`mat-${mat}`] ?? 0
              return (
                <label key={mat} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedMaterials, mat)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{mat}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-sleeve" className={facetBlockClass}>
          <h3 className={facetTitleClass}>SLEEVE LENGTH</h3>
          <div className="flex flex-col gap-[9px]">
            {sleeveOptions.map((sl) => {
              const isChecked = selectedSleeveLengths.includes(sl)
              const count = counts[`sleeve-${sl}`] ?? 0
              return (
                <label key={sl} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedSleeveLengths, sl)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{sl}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-neck" className={facetBlockClass}>
          <h3 className={facetTitleClass}>NECK TYPE</h3>
          <div className="flex flex-col gap-[9px]">
            {neckOptions.map((nk) => {
              const isChecked = selectedNeckTypes.includes(nk)
              const count = counts[`neck-${nk}`] ?? 0
              return (
                <label key={nk} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedNeckTypes, nk)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{nk}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-pattern" className={facetBlockClass}>
          <h3 className={facetTitleClass}>PATTERN</h3>
          <div className="flex flex-col gap-[9px]">
            {patternOptions.map((pt) => {
              const isChecked = selectedPatterns.includes(pt)
              const count = counts[`pattern-${pt}`] ?? 0
              return (
                <label key={pt} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedPatterns, pt)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{pt}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-print" className={facetBlockClass}>
          <h3 className={facetTitleClass}>PRINT STYLE</h3>
          <div className="flex flex-col gap-[9px]">
            {printOptions.map((ps) => {
              const isChecked = selectedPrintStyles.includes(ps)
              const count = counts[`print-${ps}`] ?? 0
              return (
                <label key={ps} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedPrintStyles, ps)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{ps}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-trim" className={facetBlockClass}>
          <h3 className={facetTitleClass}>COLLAR / TRIM COLOR</h3>
          <div className="flex flex-col gap-[9px]">
            {trimOptions.map((tc) => {
              const isChecked = selectedTrimColors.includes(tc)
              const count = counts[`trim-${tc}`] ?? 0
              return (
                <label key={tc} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedTrimColors, tc)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{tc}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-buttons" className={facetBlockClass}>
          <h3 className={facetTitleClass}>BUTTONS</h3>
          <div className="flex flex-col gap-[9px]">
            {buttonOptions.map((btn) => {
              const isChecked = selectedButtons.includes(btn)
              const count = counts[`btn-${btn}`] ?? 0
              return (
                <label key={btn} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedButtons, btn)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{btn}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-length" className={facetBlockClass}>
          <h3 className={facetTitleClass}>LENGTH</h3>
          <div className="flex flex-col gap-[9px]">
            {lengthOptions.map((len) => {
              const isChecked = selectedLengths.includes(len)
              const count = counts[`len-${len}`] ?? 0
              return (
                <label key={len} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedLengths, len)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{len}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-closure" className={facetBlockClass}>
          <h3 className={facetTitleClass}>CLOSURE</h3>
          <div className="flex flex-col gap-[9px]">
            {closureOptions.map((cl) => {
              const isChecked = selectedClosures.includes(cl)
              const count = counts[`closure-${cl}`] ?? 0
              return (
                <label key={cl} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedClosures, cl)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{cl}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-pockets" className={facetBlockClass}>
          <h3 className={facetTitleClass}>POCKETS</h3>
          <div className="flex flex-col gap-[9px]">
            {pocketOptions.map((pk) => {
              const isChecked = selectedPockets.includes(pk)
              const count = counts[`pocket-${pk}`] ?? 0
              return (
                <label key={pk} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedPockets, pk)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{pk}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-use" className={facetBlockClass}>
          <h3 className={facetTitleClass}>USE / OCCASION</h3>
          <div className="flex flex-col gap-[9px]">
            {useOptions.map((u) => {
              const isChecked = selectedUses.includes(u)
              const count = counts[`use-${u}`] ?? 0
              return (
                <label key={u} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedUses, u)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{u}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-leg" className={facetBlockClass}>
          <h3 className={facetTitleClass}>LEG STYLE</h3>
          <div className="flex flex-col gap-[9px]">
            {legOptions.map((ls) => {
              const isChecked = selectedLegStyles.includes(ls)
              const count = counts[`leg-${ls}`] ?? 0
              return (
                <label key={ls} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedLegStyles, ls)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{ls}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-rise" className={facetBlockClass}>
          <h3 className={facetTitleClass}>RISE</h3>
          <div className="flex flex-col gap-[9px]">
            {riseOptions.map((rs) => {
              const isChecked = selectedRises.includes(rs)
              const count = counts[`rise-${rs}`] ?? 0
              return (
                <label key={rs} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedRises, rs)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{rs}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-avail" className={facetBlockClass}>
          <h3 className={facetTitleClass}>AVAILABILITY</h3>
          <div className="flex flex-col gap-[9px]">
            {availOptions.map(({ id, label, count }) => {
              const isChecked = selectedAvailability === id
              return (
                <label key={id} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="radio"
                    name={isDrawer ? 'drawer-avail' : 'sidebar-avail'}
                    checked={isChecked}
                    onChange={() => setSelectedAvailability(isChecked ? null : id)}
                    onClick={() => {
                      if (isChecked) setSelectedAvailability(null)
                    }}
                  />
                  <span className="relative h-4 w-4 shrink-0 rounded-[2px] border-[1.5px] border-[#c8cbc7] transition-[border-color] duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink peer-checked:after:absolute peer-checked:after:inset-[3px] peer-checked:after:rounded-full peer-checked:after:bg-[#ff3f6c] peer-checked:after:content-['']" />
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{label}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-discount" className={facetBlockClass}>
          <h3 className={facetTitleClass}>DISCOUNT RANGE</h3>
          <div className="flex flex-col gap-[9px]">
            {discounts.map((pct) => {
              const isChecked = selectedDiscount === pct
              const count = counts[`disc-${pct}`] ?? 0
              return (
                <label key={pct} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setSelectedDiscount(isChecked ? null : pct)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{pct}% and above</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-rating" className={facetBlockClass}>
          <h3 className={facetTitleClass}>CUSTOMER RATING</h3>
          <div className="flex flex-col gap-[9px]">
            {ratingOptions.map(({ val, label, count }) => {
              const isChecked = selectedRating === val
              return (
                <label key={val} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setSelectedRating(isChecked ? null : val)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{label}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
        <div key="facet-collection" className={facetBlockClass}>
          <h3 className={facetTitleClass}>COLLECTION</h3>
          <div className="flex flex-col gap-[9px]">
            {collectionOptions.map((col) => {
              const isChecked = selectedCollections.includes(col)
              const count = counts[`col-${col}`] ?? 0
              return (
                <label key={col} className="relative flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] leading-[20.25px]">
                  <input className="peer pointer-events-none absolute h-0 w-0 opacity-0"
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStringItem(setSelectedCollections, col)}
                  />
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-[#c8cbc7] bg-white text-white transition-all duration-[120ms] peer-checked:border-store-ink peer-checked:bg-store-ink">
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-ui text-[13px] font-normal leading-[19.5px] text-[#282c3f]">{col}</span>
                  <span className="ml-0.5 font-ui text-[11px] leading-[16.5px] text-[#94969f]">({count})</span>
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
    <div className="min-h-dvh bg-store-paper pb-10 font-ui text-store-ink [@media(max-width:768px)]:pb-[70px] [&_:is(a,button,input,select,textarea):focus-visible]:outline-2 [&_:is(a,button,input,select,textarea):focus-visible]:outline-[#31586f] [&_:is(a,button,input,select,textarea):focus-visible]:outline-offset-[3px]">
      {/* 1. Breadcrumbs */}
      <nav className="pt-3.5 pb-2.5" aria-label="Breadcrumb navigation">
        <div className="mx-auto max-w-[1440px] px-[3%] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
          <ol className="flex list-none items-center gap-1.5 font-ui text-[12px] leading-[18px] text-store-muted">
            <li>
              <Link href="/" className="text-store-muted no-underline [transition:color_0.15s_ease] hover:text-[#ff3f6c]">
                Home
              </Link>
            </li>
            <li className="text-[11px] leading-[16.5px] text-[#878b94]" aria-hidden="true">
              /
            </li>
            <li>
              <Link href="/shop" className="text-store-muted no-underline [transition:color_0.15s_ease] hover:text-[#ff3f6c]">
                Shop
              </Link>
            </li>
            {routeCategory !== 'all' && (
              <>
                <li className="text-[11px] leading-[16.5px] text-[#878b94]" aria-hidden="true">
                  /
                </li>
                <li className="font-semibold text-store-muted" aria-current="page">
                  {title}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      {/* 2. Top Title and Item Count */}
      <div className="pt-1 pb-3.5">
        <div className="mx-auto max-w-[1440px] px-[3%] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-baseline gap-2">
            <h1 className="font-brand text-[clamp(16px,2vw,19px)] font-bold tracking-[-0.055em] text-store-ink">{title}</h1>
            <span className="font-ui text-[13.5px] font-normal leading-[20.25px] text-store-muted">
              - {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Top Toolbar Strip */}
      <div className="border-y border-store-line bg-store-paper [@media(max-width:768px)]:hidden">
        <div className="mx-auto max-w-[1440px] px-[3%] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
          <div className="flex h-[50px] items-center justify-between">
            <div className="flex h-full w-[250px] shrink-0 items-center justify-between border-r border-line pr-5 text-[#59666c]">
              <span className="font-brand text-[13.5px] font-bold uppercase leading-[20.25px] tracking-[0.04em] text-[#59666c]">FILTERS</span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent font-ui text-[11px] font-bold uppercase leading-[16.5px] tracking-[0.02em] text-[#ff3f6c]"
                  onClick={clearAllFilters}
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            {/* Middle: Active filter chips */}
            <div className="flex flex-1 items-center gap-2 overflow-x-auto pl-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {routeCategory === 'all' &&
                filterCategories.map((catSlug) => {
                  const catLabel =
                    SHOP_CATEGORIES.find((c) => c.slug === catSlug)?.label || catSlug
                  return (
                    <button
                      key={`chip-cat-${catSlug}`}
                      type="button"
                      className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
                  onClick={() => toggleStringItem(setSelectedRises, rs)}
                >
                  Rise: {rs}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {selectedAvailability && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
                  onClick={() => setSelectedAvailability(null)}
                >
                  Availability: {selectedAvailability === 'in-stock' ? 'In stock' : 'Out of stock'}
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}

              {selectedDiscount !== null && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
                  onClick={() => setSelectedDiscount(null)}
                >
                  {selectedDiscount}%+ Off
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}

              {selectedRating !== null && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
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
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
                  onClick={() => toggleStringItem(setSelectedCollections, col)}
                >
                  {col}
                  <X className="h-3 w-3 ml-1" />
                </button>
              ))}

              {searchQuery.trim() && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-[2px] border border-[#d2d3ce] bg-white px-2.5 py-1 font-ui text-[12px] leading-[18px] text-store-ink transition-all duration-150 hover:border-[#8f9da0] hover:bg-[#f2f1ed] hover:text-[#991b1b]"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query"
                >
                  &ldquo;{searchQuery}&rdquo;
                  <X className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>

            {/* Right: Sort Dropdown */}
            <div className="flex shrink-0 items-center gap-2 pl-3">
              <span className="whitespace-nowrap font-ui text-[13px] font-normal leading-[19.5px] text-[#7e818c]">Sort by :</span>
              <select
                id="shop-sort-select"
                className="h-[34px] cursor-pointer rounded-[2px] border border-[#c8cbc7] bg-white px-2.5 font-brand text-[13px] font-semibold text-[#282c3f] outline-none"
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
      <div className="mx-auto max-w-[1440px] px-[3%] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pb-[calc(68px+env(safe-area-inset-bottom,0px))]">
        <div className="mt-3.5 grid grid-cols-[250px_1fr] items-start gap-8 [@media(max-width:768px)]:mt-1.5 [@media(max-width:768px)]:block [@media(max-width:768px)]:pb-[calc(72px+env(safe-area-inset-bottom,0px))]">
          {/* Left Column: Fixed/Sticky Desktop Sidebar */}
          <aside className="sticky top-[90px] max-h-[calc(100vh-105px)] overflow-y-auto border-r border-store-line bg-store-paper pr-[18px] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-[2px] [&::-webkit-scrollbar-thumb]:bg-[#d4d5d9] [@media(max-width:768px)]:hidden" aria-label="Catalog filters sidebar">
            <div>
              {activeFacets.map((facetKey) => renderFacetBlock(facetKey, false))}
            </div>
          </aside>

          {/* Right Column: Catalog Grid */}
          <main className="min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="mx-auto my-10 max-w-[500px] rounded-[8px] border border-dashed border-[#d4d5d9] bg-[#fafafb] px-5 py-16 text-center">
                <h2 className="mb-1.5 font-brand text-[18px] font-bold leading-[21.6px] text-[#282c3f]">We couldn&apos;t find any matches</h2>
                <p className="mb-5 font-ui text-[13.5px] leading-[1.5] text-[#7e818c]">
                  Try clearing some of your filters or searching for another silhouette or color.
                </p>
                <button
                  type="button"
                  className="cursor-pointer rounded-[2px] border-0 bg-store-ink px-5 py-2.5 font-brand text-[12.5px] font-bold leading-[18.75px] tracking-[0.03em] text-white transition-opacity duration-150 hover:opacity-[0.92]"
                  onClick={clearAllFilters}
                >
                  CLEAR ALL FILTERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-x-4 gap-y-6 [@media(max-width:1200px)]:grid-cols-3 [@media(max-width:768px)]:grid-cols-2 [@media(max-width:768px)]:gap-x-2.5 [@media(max-width:768px)]:gap-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
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
