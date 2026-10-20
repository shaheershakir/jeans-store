'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  User,
  ShoppingBag,
  MoreHorizontal,
  ChevronDown,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react'
import { useCartStore, useUIStore, useAuthStore, useFavoriteStore } from '@/lib/store'

// ─── Sidebar Navigation Links ────────────────────────────────────────────────

const ACCOUNT_NAV_LINKS = [
  { label: 'My Account', href: '/profile', Icon: User, id: 'account' },
  { label: 'Orders', href: '/orders', Icon: Package, id: 'orders' },
  { label: 'Wishlist', href: '/wishlist', Icon: Heart, id: 'wishlist' },
  { label: 'Addresses', href: '/profile?tab=addresses', Icon: MapPin, id: 'addresses' },
  { label: 'Payment Methods', href: '/profile?tab=payment', Icon: CreditCard, id: 'payment' },
  { label: 'Account Settings', href: '/profile?tab=settings', Icon: Settings, id: 'settings' },
]

// ─── Wishlist Items Matching Mockup 1:1 ───────────────────────────────────────

interface WishlistProduct {
  id: number
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

const INITIAL_WISHLIST_PRODUCTS: WishlistProduct[] = [
  {
    id: 101,
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
    id: 102,
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
    id: 103,
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
    id: 104,
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
    id: 105,
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
    id: 106,
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
    id: 107,
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
    id: 108,
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
  const [items, setItems] = useState<WishlistProduct[]>(INITIAL_WISHLIST_PRODUCTS)
  const [sortOption, setSortOption] = useState<'recent' | 'price-low' | 'price-high'>('recent')
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)
  const logout = useAuthStore((s) => s.logout)
  const favorites = useFavoriteStore((s) => s.favorites)
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  const handleToggleWishlist = (id: number, name: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inWishlist: !item.inWishlist } : item))
    )
    toggleFavorite(id)
    const current = items.find((i) => i.id === id)
    if (current?.inWishlist) {
      showToast(`Removed ${name} from wishlist`)
    } else {
      showToast(`Saved ${name} to wishlist`)
    }
  }

  const handleRemoveFromWishlist = (id: number, name: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    toggleFavorite(id)
    setActiveMenuId(null)
    showToast(`Removed ${name} from wishlist`)
  }

  const handleAddToCart = (product: WishlistProduct) => {
    // Extract size from variant string or default 'L'
    const sizeMatch = product.variant.match(/•\s*([A-Z0-9]+)$/)
    const size = sizeMatch ? sizeMatch[1].trim() : 'L'
    addItem(product.id, size)
    showToast(`Added ${product.name} to bag`)
    openOverlay('cart')
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortOption === 'price-low') return a.priceNum - b.priceNum
    if (sortOption === 'price-high') return b.priceNum - a.priceNum
    return 0
  })

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-black selection:text-white">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8 py-10 max-[768px]:py-6">
        <div className="flex gap-10 lg:gap-14 max-[860px]:flex-col">
          {/* ── Left Sidebar Navigation ─────────────────────────────── */}
          <aside className="w-[220px] shrink-0 max-[860px]:w-full" aria-label="Account Navigation">
            <nav className="flex flex-col gap-1 sticky top-[96px] max-[860px]:static max-[860px]:flex-row max-[860px]:overflow-x-auto max-[860px]:pb-3 max-[860px]:border-b max-[860px]:border-black/8 scrollbar-none">
              {ACCOUNT_NAV_LINKS.map(({ label, href, Icon, id }) => {
                const isActive = id === 'wishlist'
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-[12px] text-[13.5px] transition-colors whitespace-nowrap ${
                      isActive
                        ? 'font-bold text-[#111111] bg-[#e8e6e1]'
                        : 'font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isActive ? 'fill-[#111111] stroke-[#111111]' : 'stroke-[1.8]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </Link>
                )
              })}

              <div className="my-3.5 h-px bg-black/8 mx-2 max-[860px]:hidden" />

              <button
                type="button"
                className="flex items-center gap-3.5 px-4 py-3 rounded-[12px] text-[13.5px] font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4 transition-colors text-left cursor-pointer max-[860px]:whitespace-nowrap"
                onClick={logout}
              >
                <LogOut className="w-[18px] h-[18px] shrink-0 stroke-[1.8]" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            </nav>
          </aside>

          {/* ── Right Content Area ─────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Header Row: Title, Item Count & Sort Dropdown */}
            <header className="mb-7 flex items-end justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start">
              <div>
                <h1 className="text-[32px] md:text-[36px] font-extrabold tracking-[-0.03em] text-[#111111] leading-tight">
                  My Wishlist
                </h1>
                <p className="mt-1 text-[15px] text-[#666666]">
                  Items you love, all in one place.
                </p>
              </div>

              {/* Right: Items Count & Sort Pill */}
              <div className="flex items-center gap-4.5 self-end max-[640px]:self-auto max-[640px]:w-full max-[640px]:justify-between">
                <span className="text-[13.5px] font-medium text-[#777777] whitespace-nowrap">
                  12 items
                </span>

                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="appearance-none bg-white border border-black/15 hover:border-black/25 text-[#111111] text-[13px] font-semibold py-2 pl-4 pr-9 rounded-[10px] shadow-2xs cursor-pointer focus:outline-hidden focus:border-black transition-colors"
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

            {/* Product Cards 4-Column Grid */}
            <div className="grid grid-cols-4 gap-4.5 max-[1200px]:grid-cols-3 max-[900px]:grid-cols-2 max-[540px]:grid-cols-1">
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

                    {/* Product Typography & Info */}
                    <div className="mt-3 flex flex-col min-w-0 font-sans">
                      <h3 className="truncate text-[13.5px] font-bold leading-snug text-[#111111]">
                        {product.name}
                      </h3>

                      <p className="mt-0.5 text-[11.5px] text-[#777777] truncate font-normal">
                        {product.variant}
                      </p>

                      {/* Price and Color Swatches Row */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[16px] font-extrabold tracking-tight text-[#111111]">
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

                    {/* Actions Row: Add to Bag (solid) + More options (outline) */}
                    <div className="mt-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-2xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Add to Bag</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(activeMenuId === product.id ? null : product.id)
                          }
                          className="w-10 h-10 rounded-[10px] bg-white hover:bg-black/3 border border-black/15 text-[#111111] flex items-center justify-center transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-2xs"
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
                            <div className="absolute right-0 bottom-[calc(100%+8px)] z-50 w-48 rounded-[12px] bg-white p-1.5 shadow-xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
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
          </main>
        </div>
      </div>
    </div>
  )
}
