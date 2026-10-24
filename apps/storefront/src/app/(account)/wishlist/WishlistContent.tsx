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
import { getProductUrl } from '@/lib/products'

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
  const image = p.img || p.images?.[0] || '/mock-assets/prod-1-clean.jpg'
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

const INITIAL_WISHLIST_PRODUCTS: WishlistProduct[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    name: 'Vintage Skate Micro-Stripe Tee',
    variant: 'Washed Black / Ash  •  L',
    price: '₹1,249',
    priceNum: 1249,
    image: '/mock-assets/product-vintage-skate-clean.jpg',
    swatches: ['#1c1c1c', '#c4c4c4'],
    href: '/shop',
    category: 'Stripes',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    name: 'Doodle Archive Oversized Tee',
    variant: 'Off White  •  XL',
    price: '₹1,099',
    priceNum: 1099,
    image: '/mock-assets/product-doodle-archive-clean.jpg',
    swatches: ['#ded9ce', '#6e6e6e'],
    href: '/shop',
    category: 'Printed tees',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    name: 'Good Days Ahead Tee',
    variant: 'Forest Green  •  M',
    price: '₹1,249',
    priceNum: 1249,
    image: '/mock-assets/product-good-days-ahead-clean.jpg',
    swatches: ['#1c382b', '#dedad2'],
    href: '/shop',
    category: 'Printed tees',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000104',
    name: 'Daisy Minimal Tee',
    variant: 'Black  •  L',
    price: '₹1,099',
    priceNum: 1099,
    image: '/mock-assets/product-daisy-minimal-clean.jpg',
    swatches: ['#111111', '#dedad2'],
    href: '/shop',
    category: 'Printed tees',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000105',
    name: 'Classic Stripe Tee',
    variant: 'White / Black  •  M',
    price: '₹1,249',
    priceNum: 1249,
    image: '/mock-assets/wishlist-classic-stripe.jpg',
    swatches: ['#111111', '#dedad2'],
    href: '/shop',
    category: 'Stripes',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000106',
    name: 'Better Days Tee',
    variant: 'Off White  •  L',
    price: '₹1,199',
    priceNum: 1199,
    image: '/mock-assets/wishlist-better-days.jpg',
    swatches: ['#dedad2', '#4b5548'],
    href: '/shop',
    category: 'Printed tees',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000107',
    name: 'Classic Trackpants',
    variant: 'Black  •  L',
    price: '₹1,699',
    priceNum: 1699,
    image: '/mock-assets/wishlist-classic-trackpants.jpg',
    swatches: ['#111111', '#dedad2'],
    href: '/shop',
    category: 'Trackpants',
    inWishlist: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000108',
    name: 'Essential Sweatpants',
    variant: 'Grey  •  L',
    price: '₹1,699',
    priceNum: 1699,
    image: '/mock-assets/wishlist-essential-sweatpants.jpg',
    swatches: ['#dedad2', '#222222'],
    href: '/shop',
    category: 'Sweatpants',
    inWishlist: true,
  },
]

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
      // If user has no favorites yet, provide recommendations from live catalog
      const recommendations = catalog.slice(0, 4).map((p) => productToWishlistItem(p, false))
      setItems(recommendations)
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
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortOption === 'price-low') return a.priceNum - b.priceNum
    if (sortOption === 'price-high') return b.priceNum - a.priceNum
    return 0
  })

  return (
    <>
      {/* Header Row: Title, Item Count & Sort Dropdown */}
      <header className="mb-7 flex items-end justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start">
        <div>
          <h1 className="font-brand text-[32px] md:text-[36px] font-bold tracking-[-0.02em] text-[#111111] leading-tight">
            My Wishlist
          </h1>
          <p className="mt-1 font-ui text-[14.5px] text-[#666666]">
            Items you love, all in one place.
          </p>
        </div>

        {/* Right: Items Count & Sort Pill */}
        <div className="flex items-center gap-4.5 self-end max-[640px]:self-auto max-[640px]:w-full max-[640px]:justify-between">
          <span className="font-ui text-[13px] font-medium text-[#777777] whitespace-nowrap">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>

          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="appearance-none bg-white border border-black/15 hover:border-black/25 text-[#111111] font-ui text-[13px] font-semibold py-2 pl-4 pr-9 rounded-[10px] shadow-2xs cursor-pointer focus:outline-hidden focus:border-black transition-colors"
              aria-label="Sort wishlist items"
            >
              <option value="recent">Recently added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#555555] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
          </div>
        </div>
      </header>

      {/* Product Cards 3-Column Grid */}
      <div className="grid grid-cols-3 gap-5 max-[1024px]:grid-cols-2 max-[540px]:grid-cols-1">
        {sortedItems.map((product) => {
          return (
            <div
              key={product.id}
              className="group relative flex flex-col rounded-[20px] bg-white border border-black/8 p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:border-black/15"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[1/1.08] overflow-hidden rounded-[14px] bg-[#eeece6]">
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
                  className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-xs transition-transform duration-150 hover:scale-110 active:scale-95"
                  aria-label={
                    product.inWishlist
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                >
                  <Heart
                    className="h-4 w-4 fill-[#111111] stroke-[#111111]"
                  />
                </button>
              </div>

              {/* Product Typography & Info — Exact match with ProductCard */}
              <div className="mt-3.5 flex flex-1 flex-col min-w-0">
                {/* Overline / Fit or Category Tag */}
                <div className="mb-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">
                  {product.category}
                </div>

                {/* Product Title */}
                <Link
                  href={product.href}
                  className="text-inherit no-underline"
                >
                  <h3
                    className="mb-1 truncate font-brand text-[16px] sm:text-[17px] font-bold leading-[1.28] tracking-[-0.015em] text-[#111827] transition-colors duration-150 hover:text-black"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                </Link>

                {/* Color / Wash / Variant Label */}
                <p className="mb-2.5 truncate font-ui text-[12.5px] font-medium text-[#71717a]">
                  {product.variant}
                </p>

                {/* Price and Color Swatches Row */}
                <div className="mt-auto mb-3.5 flex items-center justify-between">
                  <span className="font-brand text-[19px] sm:text-[21px] font-bold leading-none tracking-[-0.02em] text-[#111827] tabular-nums">
                    {product.price}
                  </span>

                  <div className="flex items-center gap-1.5" aria-label="Available colors">
                    {product.swatches.map((color, idx) => (
                      <span
                        key={idx}
                        className="inline-block h-[13px] w-[13px] rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Row: Add to Bag (solid) + More options (outline) matching ProductCard styling */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-3.5 rounded-[10px] bg-[#111111] hover:bg-[#27272a] active:scale-[0.97] active:bg-black text-white font-brand text-[12px] sm:text-[12.5px] font-bold uppercase tracking-[0.08em] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4 stroke-[2]" />
                  <span>ADD TO BAG</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMenuId(activeMenuId === product.id ? null : product.id)
                    }
                    className="w-11 h-11 rounded-[10px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-2xs"
                    aria-label={`Options for ${product.name}`}
                  >
                    <MoreHorizontal className="w-4 h-4 stroke-[2]" />
                  </button>

                  {/* Options Menu Popover */}
                  {activeMenuId === product.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 bottom-[calc(100%+8px)] z-50 w-48 rounded-[12px] bg-white p-1.5 shadow-xl border border-black/10 animate-in fade-in zoom-in-95 duration-150 font-ui">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-semibold text-[#111] hover:bg-black/4 rounded-[8px] text-left cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>
                        <Link
                          href={product.href}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-semibold text-[#111] hover:bg-black/4 rounded-[8px] text-left"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Product</span>
                        </Link>
                        <div className="my-1 h-px bg-black/8" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFromWishlist(product.id, product.name)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50 rounded-[8px] text-left cursor-pointer"
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
          )
        })}
      </div>
    </>
  )
}

