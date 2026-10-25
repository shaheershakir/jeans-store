'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bookmark,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Check,
  ChevronDown
} from 'lucide-react'
import {
  useCartStore,
  useUIStore,
  useFavoriteStore
} from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { PRODUCTS, type Product } from '@/lib/constants'

export default function BookmarkClient() {
  const router = useRouter()
  const favorites = useFavoriteStore((state) => state.favorites)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const clearFavorites = useFavoriteStore((state) => state.clearFavorites)
  const addItem = useCartStore((state) => state.addItem)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)

  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortOption, setSortOption] = useState<'recent' | 'price-low' | 'price-high'>('recent')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    void useFavoriteStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()

    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          setCatalog(data.products)
        }
      })
      .catch(() => {})
  }, [])

  // Matched bookmarked products
  const bookmarkedProducts = useMemo(() => {
    const favSet = new Set(favorites.map(String))
    return catalog.filter((product) => favSet.has(String(product.id)))
  }, [favorites, catalog])

  // Extract categories present in bookmarks
  const availableCategories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of bookmarkedProducts) {
      if (p.category) cats.add(p.category)
    }
    return Array.from(cats)
  }, [bookmarkedProducts])

  // Filter and sort items
  const displayedItems = useMemo(() => {
    let items = [...bookmarkedProducts]
    if (selectedCategory !== 'all') {
      items = items.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase())
    }
    if (sortOption === 'price-low') {
      items.sort((a, b) => (a.priceNum || 0) - (b.priceNum || 0))
    } else if (sortOption === 'price-high') {
      items.sort((a, b) => (b.priceNum || 0) - (a.priceNum || 0))
    }
    return items
  }, [bookmarkedProducts, selectedCategory, sortOption])

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes?.[0] || 'M'
    setAddingId(product.id)
    addItem(product.id, defaultSize, product)
    showToast(`Added ${product.name} to bag`)

    setAddedIds((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddingId(null)
    }, 400)
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }))
    }, 2000)
  }

  const handleAddAllToBag = () => {
    if (displayedItems.length === 0) return
    for (const product of displayedItems) {
      const defaultSize = product.sizes?.[0] || 'M'
      addItem(product.id, defaultSize, product)
    }
    showToast(`Added all ${displayedItems.length} items to bag`)
    openOverlay('cart')
  }

  const handleRemove = (product: Product) => {
    toggleFavorite(product.id)
    showToast(`Removed from bookmarks`)
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-16">
      {/* ── Mobile Sticky Header (< md) ── */}
      <header className="sticky top-0 z-30 md:hidden flex items-center justify-between h-14 px-4 bg-[#FAF9F6]/95 backdrop-blur-xl border-b border-black/8 select-none">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 active:scale-95 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <h1 className="font-brand text-[17px] font-bold tracking-tight text-[#111111]">
            Bookmarks
          </h1>
          {bookmarkedProducts.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 font-sans text-[11px] font-bold text-white tabular-nums">
              {bookmarkedProducts.length}
            </span>
          )}
        </div>

        {bookmarkedProducts.length > 0 ? (
          <button
            type="button"
            onClick={clearFavorites}
            className="text-[12px] font-semibold text-zinc-500 hover:text-red-600 transition-colors cursor-pointer px-1 py-1"
          >
            Clear
          </button>
        ) : (
          <div className="w-9" />
        )}
      </header>

      {/* ── Main Content Container ── */}
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pt-4 md:pt-8">
        {/* Desktop Breadcrumbs & Header (hidden on mobile) */}
        <div className="hidden md:block mb-8">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold text-zinc-900">Bookmarks</span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-brand text-[34px] lg:text-[40px] font-bold tracking-tight text-[#111111] leading-tight">
                Bookmarks
              </h1>
              <p className="mt-1 font-ui text-[14.5px] text-zinc-500">
                All your saved pieces in one curated collection.
              </p>
            </div>

            {bookmarkedProducts.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-500">
                  {bookmarkedProducts.length} {bookmarkedProducts.length === 1 ? 'item' : 'items'}
                </span>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as 'recent' | 'price-low' | 'price-high')
                    }
                    className="appearance-none bg-white border border-black/10 hover:border-black/20 text-[#111111] text-[13px] font-semibold py-2 pl-3.5 pr-8 rounded-xl shadow-2xs cursor-pointer focus:outline-hidden transition-colors"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                </div>

                <button
                  type="button"
                  onClick={handleAddAllToBag}
                  className="flex h-10 items-center gap-2 rounded-xl bg-black px-4 font-brand text-[12.5px] font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add All to Bag</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Chips (Category Pills) ── */}
        {bookmarkedProducts.length > 0 && availableCategories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 mb-2 md:mb-6">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`h-8 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-white text-zinc-700 border border-black/8 hover:border-black/20'
              }`}
            >
              All ({bookmarkedProducts.length})
            </button>
            {availableCategories.map((cat) => {
              const count = bookmarkedProducts.filter((p) => p.category === cat).length
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-8 px-3.5 rounded-full text-[12px] font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white shadow-2xs'
                      : 'bg-white text-zinc-700 border border-black/8 hover:border-black/20'
                  }`}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* ── Empty State ── */}
        {bookmarkedProducts.length === 0 ? (
          <div className="flex min-h-[58vh] flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-black/6 text-zinc-400">
              <Bookmark className="h-7 w-7 stroke-[1.75]" />
            </div>
            <h2 className="font-brand text-[22px] sm:text-[26px] font-bold text-[#111111]">
              No bookmarks yet
            </h2>
            <p className="mt-2 max-w-[320px] font-ui text-[14px] leading-relaxed text-zinc-500">
              Save pieces you love while browsing to easily revisit and purchase them anytime.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex h-12 items-center gap-2.5 rounded-full bg-black px-7 font-brand text-[13.5px] font-bold tracking-wide text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-xs"
            >
              <span>Explore All Products</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* ── 2-Column Mobile / 4-Column Desktop Grid ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
            {displayedItems.map((product) => {
              const originalPrice = Math.round(product.priceNum * 1.286)
              const discountPercent = Math.round(((originalPrice - product.priceNum) / originalPrice) * 100)
              const isAdded = addedIds[product.id]
              const isAdding = addingId === product.id

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col rounded-[18px] bg-white border border-black/6 p-2.5 sm:p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-black/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[1/1.18] w-full overflow-hidden rounded-[14px] bg-[#eeece6]">
                    <Image
                      src={product.img || '/mock-assets/prod-1-clean.jpg'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                    />

                    {/* Unbookmark floating badge */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemove(product)
                      }}
                      className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-xs transition-transform hover:scale-110 active:scale-90"
                      aria-label={`Remove ${product.name} from bookmarks`}
                      title="Remove"
                    >
                      <Bookmark className="h-4 w-4 fill-black text-black stroke-[1.8]" />
                    </button>

                    {discountPercent > 0 && (
                      <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="mt-3 flex flex-1 flex-col justify-between">
                    <div>
                      <span className="block font-ui text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {product.category || 'Apparel'}
                      </span>
                      <Link
                        href={getProductUrl(product)}
                        className="mt-0.5 block font-brand text-[14px] sm:text-[15px] font-bold text-[#111111] leading-tight line-clamp-1 hover:underline"
                        title={product.name}
                      >
                        {product.name}
                      </Link>

                      {/* Pricing Row */}
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-brand text-[14px] sm:text-[15px] font-extrabold text-[#111111]">
                          {product.price}
                        </span>
                        {originalPrice > product.priceNum && (
                          <span className="font-ui text-[11.5px] text-zinc-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Add Button */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdding}
                      className={`mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl font-brand text-[11.5px] sm:text-[12px] font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 shadow-2xs ${
                        isAdded
                          ? 'bg-[#15803d]'
                          : 'bg-[#111111] hover:bg-black'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Added to Bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Add to Bag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
