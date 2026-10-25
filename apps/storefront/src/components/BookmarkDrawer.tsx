'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Bookmark,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Check
} from 'lucide-react'
import {
  useCartStore,
  useUIStore,
  useFavoriteStore,
  type CartItem
} from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { PRODUCTS, type Product } from '@/lib/constants'

export default function BookmarkDrawer() {
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const favorites = useFavoriteStore((state) => state.favorites)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const clearFavorites = useFavoriteStore((state) => state.clearFavorites)
  const addItem = useCartStore((state) => state.addItem)

  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  const isOpen = overlay === 'bookmark'

  useEffect(() => {
    void useFavoriteStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.products) && data.products.length > 0) {
            setCatalog(data.products)
          }
        })
        .catch(() => {})
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeOverlay()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeOverlay])

  // Filter bookmarked products from catalog
  const bookmarkedProducts = useMemo(() => {
    const favSet = new Set(favorites.map(String))
    return catalog.filter((product) => favSet.has(String(product.id)))
  }, [favorites, catalog])

  const totalValue = useMemo(() => {
    return bookmarkedProducts.reduce((sum, item) => sum + (item.priceNum || 0), 0)
  }, [bookmarkedProducts])

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }))
  }

  const handleAddToCart = (product: Product) => {
    const defaultSize = product.sizes?.[0] || 'M'
    const chosenSize = selectedSizes[product.id] || defaultSize
    setAddingId(product.id)

    addItem(product.id, chosenSize, product)
    showToast(`Added ${product.name} (${chosenSize}) to bag`)

    setAddedIds((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddingId(null)
    }, 400)
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }))
    }, 2000)
  }

  const handleAddAllToBag = () => {
    if (bookmarkedProducts.length === 0) return
    for (const product of bookmarkedProducts) {
      const defaultSize = product.sizes?.[0] || 'M'
      const chosenSize = selectedSizes[product.id] || defaultSize
      addItem(product.id, chosenSize, product)
    }
    showToast(`Added all ${bookmarkedProducts.length} items to bag`)
    openOverlay('cart')
  }

  const handleRemove = (product: Product) => {
    toggleFavorite(product.id)
    showToast(`Removed ${product.name} from bookmarks`)
  }

  return (
    <div
      className={`fixed inset-0 z-[99999] flex justify-end bg-[rgba(0,0,0,0.45)] backdrop-blur-[4px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div
        className={`relative flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-white text-[#111827] shadow-[-12px_0_36px_rgba(0,0,0,0.12)] transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Bookmarks drawer"
      >
        {/* Header */}
        <div className="flex shrink-0 items-end justify-between border-b border-black/8 px-6 pb-5 pt-6">
          <div>
            <span className="mb-0.5 block font-brand text-[11px] font-bold uppercase tracking-[0.14em] text-[#71717a]">
              TEESGARAGE
            </span>
            <h2 className="m-0 flex items-baseline font-brand text-[28px] sm:text-[32px] font-bold leading-[1.15] tracking-[-0.03em] text-[#111827]">
              Your Bookmarks{' '}
              <span className="ml-1.5 font-sans text-lg font-medium text-[#6b7280]">
                ({bookmarkedProducts.length})
              </span>
            </h2>
            <p className="mb-0 mt-1 font-ui text-[13px] text-[#6b7280]">
              Pieces you love, saved for quick access.
            </p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-[#f4f4f5] text-[#374151] transition-colors hover:bg-[#e4e4e7]"
            aria-label="Close bookmarks"
            onClick={closeOverlay}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-6 py-4 [scrollbar-color:#e4e4e7_transparent] [scrollbar-width:thin]">
          {bookmarkedProducts.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a]">
                <Bookmark className="h-6 w-6 stroke-[1.75]" />
              </div>
              <h3 className="font-brand text-[20px] font-bold text-[#111827]">
                Your saved list is empty
              </h3>
              <p className="mt-1.5 max-w-[280px] font-ui text-[13.5px] leading-relaxed text-[#6b7280]">
                Bookmark garments while exploring to keep them within reach.
              </p>
              <Link
                href="/shop"
                onClick={closeOverlay}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#111827] px-6 font-brand text-[13px] font-bold tracking-wide text-white transition-colors hover:bg-black"
              >
                <span>Explore Collection</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-black/6">
              {bookmarkedProducts.map((product) => {
                const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL']
                const currentSize = selectedSizes[product.id] || sizes[0]
                const isAdded = addedIds[product.id]
                const isAdding = addingId === product.id
                const originalPrice = Math.round(product.priceNum * 1.286)

                return (
                  <div key={product.id} className="group py-4.5 first:pt-1 last:pb-2">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <Link
                        href={getProductUrl(product)}
                        onClick={closeOverlay}
                        className="relative h-[100px] w-[80px] shrink-0 overflow-hidden rounded-[14px] bg-[#eeece6]"
                      >
                        <Image
                          src={product.img || '/mock-assets/prod-1-clean.jpg'}
                          alt={product.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>

                      {/* Info & Controls */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={getProductUrl(product)}
                              onClick={closeOverlay}
                              className="min-w-0"
                            >
                              <span className="block font-ui text-[10px] font-bold uppercase tracking-wider text-[#8e8e93]">
                                {product.category || 'Apparel'}
                              </span>
                              <h4 className="truncate font-brand text-[15px] font-bold text-[#111827] transition-colors hover:text-black">
                                {product.name}
                              </h4>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleRemove(product)}
                              className="shrink-0 p-1 text-[#8e8e93] transition-colors hover:text-red-600 cursor-pointer"
                              aria-label={`Remove ${product.name} from bookmarks`}
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-brand text-[15px] font-extrabold text-[#111827]">
                              {product.price}
                            </span>
                            {originalPrice > product.priceNum && (
                              <span className="font-ui text-[12px] text-[#8e8e93] line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Size selector & Add to bag row */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {/* Size Pills */}
                          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                            {sizes.slice(0, 5).map((size) => {
                              const isSelected = currentSize === size
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => handleSelectSize(product.id, size)}
                                  className={`flex h-7 min-w-7 items-center justify-center rounded-[7px] px-1.5 font-ui text-[11px] font-semibold transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#111827] text-white shadow-2xs'
                                      : 'bg-[#f4f4f5] text-[#374151] hover:bg-[#e4e4e7]'
                                  }`}
                                >
                                  {size}
                                </button>
                              )
                            })}
                          </div>

                          {/* Add to Bag CTA */}
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={isAdding}
                            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-3 font-brand text-[11.5px] font-bold uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${
                              isAdded
                                ? 'bg-[#15803d]'
                                : 'bg-[#111827] hover:bg-black'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Added</span>
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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {bookmarkedProducts.length > 0 && (
          <div className="shrink-0 border-t border-black/8 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-ui text-[13px] text-[#6b7280]">
                Saved value ({bookmarkedProducts.length} items)
              </span>
              <span className="font-brand text-[16px] font-bold text-[#111827]">
                {formatPrice(totalValue)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAddAllToBag}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] font-brand text-[13.5px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-black cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Move All to Bag</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={clearFavorites}
                  className="font-ui text-[12px] font-semibold text-[#8e8e93] hover:text-red-600 transition-colors cursor-pointer underline underline-offset-2"
                >
                  Clear all bookmarks
                </button>
                <Link
                  href="/bookmark"
                  onClick={closeOverlay}
                  className="font-ui text-[12px] font-semibold text-[#111827] hover:text-black transition-colors underline underline-offset-2"
                >
                  View full page
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
