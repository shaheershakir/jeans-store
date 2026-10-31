'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart,
  ShoppingBag,
  MoreHorizontal,
  ChevronDown,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react'
import { useCartStore, useUIStore, useAuthStore, useFavoriteStore } from '@/lib/store'
import type { Product } from '@/lib/constants'
import { PRODUCTS } from '@/lib/constants'
import { getProductUrl, getProductSlug } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

interface WishlistProduct {
  id: string
  name: string
  variant: string
  price: string
  priceNum: number
  image: string
  swatches: string[]
  href: string
  category: string
  inWishlist: boolean
}

function productToWishlistItem(p: Product, inWishlist: boolean = true): WishlistProduct {
  const color = p.color || p.variants?.[0]?.color || 'Standard'
  const size = p.sizes?.[0] || 'L'
  const image = p.img || p.images?.[0] || '/hero-man.jpg'
  const COLOR_HEX: Record<string, string> = {
    black: '#141414',
    white: '#f5f5f5',
    grey: '#9e9e9e',
    gray: '#9e9e9e',
    ash: '#9e9e9e',
    navy: '#1b2b48',
    blue: '#2563eb',
    green: '#1e3a2b',
    forest: '#1e3a2b',
    beige: '#d6c8b2',
    cream: '#ede6d8',
    olive: '#556b2f',
    brown: '#5c4033',
    red: '#991b1b',
    charcoal: '#222222',
    waffle: '#d9cdbe'
  }
  let swatches = ['#141414']
  if (p.variants && p.variants.length > 0) {
    const colors = Array.from(new Set(p.variants.map((v) => v.color.toLowerCase()).filter(Boolean)))
    if (colors.length > 1) {
      swatches = colors.slice(0, 4).map((c) => COLOR_HEX[c] || '#333333')
    } else if (colors.length === 1) {
      swatches = [COLOR_HEX[colors[0]] || '#333333']
    }
  } else if (p.color) {
    if (p.color.includes('/')) {
      swatches = p.color.split('/').map((s) => COLOR_HEX[s.trim().toLowerCase()] || '#333333')
    } else {
      swatches = [COLOR_HEX[p.color.toLowerCase()] || '#333333']
    }
  }
  return {
    id: p.id,
    name: p.name,
    variant: `${color}  •  ${size}`,
    price: p.price,
    priceNum: p.priceNum,
    image,
    swatches,
    href: getProductUrl(p),
    category: p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'Apparel',
    inWishlist
  }
}

export default function WishlistContent() {
  const favorites = useFavoriteStore((s) => s.favorites)
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite)
  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS)
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [sortOption, setSortOption] = useState<'recent' | 'price-low' | 'price-high'>('recent')
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null)

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
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

  useEffect(() => {
    if (favorites.length > 0) {
      const favSet = new Set(favorites.map((f) => String(f)))
      const matched = catalog
        .filter((p) => favSet.has(String(p.id)))
        .map((p) => productToWishlistItem(p, true))
      setItems(matched)
    } else {
      setItems([])
    }
  }, [favorites, catalog])

  const handleToggleWishlist = (id: string, name: string) => {
    toggleFavorite(id)
    const wasIn = items.find((i) => String(i.id) === String(id))?.inWishlist
    setItems((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, inWishlist: !item.inWishlist } : item))
    )
    if (wasIn) {
      showToast(`Removed ${name} from wishlist`)
    } else {
      showToast(`Saved ${name} to wishlist`)
    }
  }

  const handleRemoveFromWishlist = (id: string, name: string) => {
    toggleFavorite(id)
    setItems((prev) => prev.filter((item) => String(item.id) !== String(id)))
    setActiveMenuId(null)
    showToast(`Removed ${name} from wishlist`)
  }

  const handleAddToCart = (product: WishlistProduct) => {
    // Extract size from variant string or default 'L'
    const sizeMatch = product.variant.match(/•\s*([A-Z0-9]+)$/)
    const size = sizeMatch ? sizeMatch[1].trim() : 'L'
    const catalogProduct = catalog.find((entry) => String(entry.id) === String(product.id))
    addItem(product.id, size, catalogProduct)
    showToast(`Added ${product.name} to bag`)
    openOverlay('cart')

    const cartPayload = {
      product_id: product.id,
      product_name: product.name,
      product_slug: catalogProduct ? getProductSlug(catalogProduct) : undefined,
      category: product.category,
      price: product.priceNum,
      currency: 'INR',
      size,
      quantity: 1,
      source_location: 'wishlist',
      in_stock: true
    }
    trackEvent('add_to_cart', cartPayload)
    trackEvent('product_added_to_cart', cartPayload)
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortOption === 'price-low') return a.priceNum - b.priceNum
    if (sortOption === 'price-high') return b.priceNum - a.priceNum
    return 0
  })

  return (
    <>
      {/* Header Row: Title, Item Count & Sort Dropdown */}
      <header className="mb-6 flex items-baseline justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start">
        <div>
          <h1 className="font-brand text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] text-[#111111] leading-tight">
            My Wishlist
          </h1>
          <p className="mt-1 font-ui text-[13.5px] text-[#666666]">
            Items you love, all in one place.
          </p>
        </div>

        {/* Right: Items Count & Sort Pill */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 self-baseline max-[640px]:self-auto max-[640px]:w-full max-[640px]:justify-between">
            <span className="font-ui text-[12.5px] font-medium text-[#777777] whitespace-nowrap">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>

            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="appearance-none bg-white border border-black/15 hover:border-black/25 text-[#111111] font-ui text-[12.5px] font-semibold py-1.5 pl-3.5 pr-8 rounded-[8px] shadow-2xs cursor-pointer focus:outline-hidden focus:border-black transition-colors"
                aria-label="Sort wishlist items"
              >
                <option value="recent">Recently added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#555555] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
            </div>
          </div>
        )}
      </header>

      {/* Empty State vs Product Cards 4-Column Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-black/[0.08] bg-white py-16 px-6 text-center my-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a]">
            <Heart className="h-6 w-6 stroke-[1.8]" />
          </div>
          <h2 className="font-brand text-[20px] font-bold text-[#111111]">
            No wishlist items
          </h2>
          <p className="mt-1 mb-6 font-ui text-[13px] text-[#71717a] max-w-[280px]">
            You haven&apos;t saved any garments to your wishlist yet.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#111111] px-6 font-brand text-[12.5px] font-semibold text-white hover:bg-black transition-colors"
          >
            Explore Garments
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3.5 xl:gap-4 max-[1240px]:grid-cols-3 max-[860px]:grid-cols-2 max-[500px]:grid-cols-1">
          {sortedItems.map((product) => {
          return (
            <div
              key={product.id}
              className="group relative flex flex-col rounded-[12px] bg-white border border-black/[0.08] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-black/15"
            >
              {/* Image Container - Flush with card edges, aspect matching screenshot (182 / 158) */}
              <div className="relative w-full aspect-[182/158] overflow-hidden bg-[#eeece6]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                />

                {/* Top-Right Round Heart Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleWishlist(product.id, product.name)
                  }}
                  className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 sm:h-7.5 sm:w-7.5 cursor-pointer items-center justify-center rounded-full bg-white shadow-xs transition-transform duration-150 hover:scale-110 active:scale-95"
                  aria-label={
                    product.inWishlist
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                >
                  <Heart
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                      product.inWishlist ? 'fill-[#111111] stroke-[#111111]' : 'fill-none stroke-[#111111]'
                    }`}
                  />
                </button>
              </div>

              {/* Product Typography & Info */}
              <div className="p-3 sm:p-3.5 flex flex-1 flex-col min-w-0">
                {/* Product Title */}
                <Link
                  href={product.href}
                  className="text-inherit no-underline"
                >
                  <h3
                    className="truncate font-brand text-[13px] sm:text-[13.5px] font-bold leading-tight tracking-[-0.01em] text-[#111827] transition-colors duration-150 hover:text-black"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                </Link>

                {/* Color / Wash / Variant Label */}
                <p className="mt-0.5 mb-2.5 truncate font-ui text-[11px] sm:text-[11.5px] font-medium text-[#71717a]">
                  {product.variant}
                </p>

                {/* Price and Color Swatches Row */}
                <div className="mt-auto mb-3 flex items-center justify-between">
                  <span className="font-brand text-[14.5px] sm:text-[15.5px] font-bold leading-none tracking-[-0.01em] text-[#111827] tabular-nums">
                    {product.price}
                  </span>

                  <div className="flex items-center gap-1.5" aria-label="Available colors">
                    {product.swatches.map((color, idx) => (
                      <span
                        key={idx}
                        className="inline-block h-[11px] w-[11px] rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions Row: Add to Bag (solid) + More options (outline) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-8.5 px-2.5 rounded-[7px] bg-[#111111] hover:bg-[#27272a] active:scale-[0.98] active:bg-black text-white font-ui text-[11.5px] font-semibold transition-all duration-150 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 stroke-[2]" />
                    <span>Add to Bag</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(activeMenuId === product.id ? null : product.id)
                      }
                      className="w-8.5 h-8.5 rounded-[7px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] flex items-center justify-center transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-2xs"
                      aria-label={`Options for ${product.name}`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 stroke-[2]" />
                    </button>

                    {/* Options Menu Popover */}
                    {activeMenuId === product.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 bottom-[calc(100%+8px)] z-50 w-44 rounded-[10px] bg-white p-1.5 shadow-xl border border-black/10 animate-in fade-in zoom-in-95 duration-150 font-ui">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-semibold text-[#111] hover:bg-black/4 rounded-[6px] text-left cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </button>
                          <Link
                            href={product.href}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-semibold text-[#111] hover:bg-black/4 rounded-[6px] text-left"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Product</span>
                          </Link>
                          <div className="my-1 h-px bg-black/8" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 rounded-[6px] text-left cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      )}
    </>
  )
}

