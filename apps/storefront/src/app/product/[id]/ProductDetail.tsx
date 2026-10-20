'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  ShoppingBag,
  ArrowRight,
  Truck,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore, usePreferencesStore, useFavoriteStore } from '@/lib/store'
import SizeGuideModal from '@/components/SizeGuideModal'
import ProductReviews from '@/components/ProductReviews'
import RelatedProducts from '@/components/RelatedProducts'
import StickyPdpBar from '@/components/StickyPdpBar'
import { getAvailableProductSizes, getProductCheckoutUrl, getProductSlug } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

const COLOR_HEX: Record<string, string> = {
  black: '#171717',
  white: '#f5f3ed',
  navy: '#1e3157',
  grey: '#85878b',
  gray: '#85878b',
  ash: '#85878b',
  blue: '#436fa8',
  green: '#3e7558',
  olive: '#747947',
  red: '#a63836',
  beige: '#d8c7a7',
  charcoal: '#414347',
  cream: '#eee9dd',
  ecru: '#eee9dd',
  'washed black': '#1e1e1e',
  'vintage acid black': '#242426'
}

// Map category ID → breadcrumb label + route
const CATEGORY_META: Record<string, { label: string; href: string }> = {
  stripes: { label: 'Stripes', href: '/shop/stripes' },
  fullsleeve: { label: 'Fullsleeve', href: '/shop/fullsleeve' },
  drsleeve: { label: 'Drsleeve', href: '/shop/drsleeve' },
  'printed-tees': { label: 'Printed Tees', href: '/shop/printed-tees' },
  'ringer-tees': { label: 'Ringer Tees', href: '/shop/ringer-tees' },
  henley: { label: 'Henley', href: '/shop/henley' },
  trackpants: { label: 'Trackpants', href: '/shop/trackpants' },
  sweatpants: { label: 'Sweatpants', href: '/shop/sweatpants' },
  tops: { label: 'T-Shirts', href: '/shop' },
  't-shirts': { label: 'T-Shirts', href: '/shop' }
}

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)
  const selectedSize = useUIStore((state) => state.selectedSize)
  const setSelectedSize = useUIStore((state) => state.setSelectedSize)
  const showToast = useUIStore((state) => state.showToast)
  const openOverlay = useUIStore((state) => state.openOverlay)

  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const isFavorite = useFavoriteStore((state) => state.isFavorite(product.id))

  const [mounted, setMounted] = useState<boolean>(false)
  const [favAnimate, setFavAnimate] = useState<boolean>(false)
  const [added, setAdded] = useState<boolean>(false)
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Color options
  const colorOptions = useMemo(
    () =>
      product.variants?.length
        ? Array.from(
            new Set(
              product.variants
                .filter((variant) => variant.status === 'Active')
                .map((variant) => variant.color)
            )
          )
        : product.color
          ? [product.color]
          : [],
    [product]
  )
  const [selectedColor, setSelectedColor] = useState<string>(() => colorOptions[0] ?? '')

  // Swatches derived to match the exact ProductCard reference design
  const swatches = useMemo(() => {
    if (product.variants?.length) {
      const uniqueColors = Array.from(
        new Set(
          product.variants
            .filter((v) => v.status === 'Active')
            .map((v) => v.color)
            .filter(Boolean)
        )
      )
      if (uniqueColors.length > 1) {
        return uniqueColors.map((col) => ({
          name: col,
          hex: COLOR_HEX[col.toLowerCase()] || '#171717'
        }))
      }
    }
    if (product.color && product.color.includes('/')) {
      const parts = product.color.split('/').map((s) => s.trim())
      return parts.map((name, idx) => ({
        name,
        hex: idx === 0 ? (COLOR_HEX[name.toLowerCase()] || '#171717') : (COLOR_HEX[name.toLowerCase()] || '#85878b')
      }))
    }
    const mainCol = product.color || 'Washed Black'
    const altCol =
      mainCol.toLowerCase().includes('black') || mainCol.toLowerCase().includes('charcoal')
        ? 'Ash'
        : 'Black'
    return [
      { name: mainCol, hex: COLOR_HEX[mainCol.toLowerCase()] || '#171717' },
      { name: altCol, hex: COLOR_HEX[altCol.toLowerCase()] || '#85878b' }
    ]
  }, [product])

  const colorWashLabel =
    product.wash ||
    (swatches.length > 1
      ? `${swatches[0].name} / ${swatches[1].name}`
      : product.color || 'Washed Black / Ash')

  // Sizes available
  const sizeOptions = useMemo(
    () =>
      product.variants?.length
        ? Array.from(
            new Set(
              product.variants
                .filter(
                  (variant) =>
                    variant.status === 'Active' && variant.color === selectedColor
                )
                .map((variant) => String(variant.size))
            )
          )
        : product.sizes?.map(String) ?? [],
    [product, selectedColor]
  )

  const availableSizes = useMemo(
    () =>
      product.variants?.length
        ? Array.from(
            new Set(
              product.variants
                .filter(
                  (variant) =>
                    variant.status === 'Active' &&
                    variant.color === selectedColor &&
                    variant.stock - variant.reserved > 0
                )
                .map((variant) => String(variant.size))
            )
          )
        : getAvailableProductSizes(product),
    [product, selectedColor]
  )
  const isNumeric = sizeOptions.length > 0 && sizeOptions.every((s) => /^\d+$/.test(s))

  // Build image list — only authentic images of this garment
  const images = useMemo(() => {
    const raw = (
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.img, product.img2]
    ).filter(Boolean) as string[]

    const unique = Array.from(new Set(raw))
    return unique.length > 0 ? unique : [product.img]
  }, [product])

  const catMeta =
    (product.category ? CATEGORY_META[product.category] : null) ?? {
      label: 'All Garments',
      href: '/shop'
    }

  useEffect(() => {
    if (colorOptions.length > 0 && !colorOptions.includes(selectedColor)) {
      setSelectedColor(colorOptions[0])
    }
  }, [colorOptions, selectedColor])

  const preferences = usePreferencesStore((state) => state.preferences)

  useEffect(() => {
    let isSubscribed = true
    const hydrateAndSelect = async () => {
      await Promise.all([
        useUIStore.persist.rehydrate(),
        useCartStore.persist.rehydrate(),
        usePreferencesStore.persist.rehydrate(),
        useFavoriteStore.persist.rehydrate()
      ])
      if (isSubscribed) {
        setMounted(true)
        const recommended = usePreferencesStore
          .getState()
          .getRecommendedSize(availableSizes, product.category)
        const current = useUIStore.getState().selectedSize
        setSelectedSize(
          availableSizes.includes(recommended)
            ? recommended
            : availableSizes.includes(current)
              ? current
              : availableSizes[0] ?? ''
        )
      }
    }
    void hydrateAndSelect()
    return () => {
      isSubscribed = false
    }
  }, [availableSizes, product.category, setSelectedSize])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  // Keyboard navigation & body scroll lock for expanded lightbox
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + images.length) % images.length : 0
        )
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % images.length : 0
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxIndex, images.length, closeLightbox])

  // Track PDP view on mount or when product ID changes
  useEffect(() => {
    trackEvent('product_viewed', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: product.priceNum,
      currency: 'INR',
      fit: product.fit,
      color: selectedColor || product.color,
      selected_size: selectedSize,
      sizes_available: availableSizes,
      in_stock: availableSizes.length > 0
    })
  }, [product.id])

  function handleSelectColor(color: string) {
    setSelectedColor(color)
    trackEvent('product_variant_selected', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      variant_type: 'color',
      color,
      size: selectedSize,
      in_stock: availableSizes.length > 0
    })
  }

  function handleSelectSize(size: string) {
    setSelectedSize(size)
    trackEvent('product_variant_selected', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      variant_type: 'size',
      color: selectedColor,
      size,
      in_stock: availableSizes.includes(size)
    })
  }

  function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    toggleFavorite(product.id)
    setFavAnimate(true)
    setTimeout(() => setFavAnimate(false), 400)

    const nextState = !isFavorite
    showToast(nextState ? `Saved ${product.name} to favorites` : 'Removed from favorites')

    if (nextState) {
      trackEvent('product_favorited', {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        price: product.priceNum
      })
    } else {
      trackEvent('product_unfavorited', {
        product_id: product.id,
        product_name: product.name
      })
    }
  }

  function handleAddToCart(sourceLocation: 'pdp' | 'sticky_bar' = 'pdp') {
    if (!availableSizes.includes(selectedSize)) return
    addItem(product.id, selectedSize, product, selectedColor || undefined)
    setAdded(true)
    showToast(
      `Added ${product.name} (${isNumeric ? `Waist ${selectedSize}"` : `Size ${selectedSize}`}) to bag`
    )
    setTimeout(() => setAdded(false), 1800)
    openOverlay('cart')

    trackEvent('product_added_to_cart', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: product.priceNum,
      currency: 'INR',
      fit: product.fit,
      color: selectedColor || product.color,
      size: selectedSize,
      quantity: 1,
      source_location: sourceLocation,
      in_stock: true
    })
  }

  function handleBuyNow(sourceLocation: 'pdp' | 'sticky_bar' = 'pdp') {
    if (!availableSizes.includes(selectedSize)) return

    trackEvent('product_buy_now_clicked', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: product.priceNum,
      currency: 'INR',
      fit: product.fit,
      color: selectedColor || product.color,
      size: selectedSize,
      quantity: 1,
      source_location: sourceLocation,
      in_stock: true
    })

    const checkoutUrl = getProductCheckoutUrl(product, {
      size: selectedSize,
      color: selectedColor || undefined,
      qty: 1
    })
    router.push(checkoutUrl)
  }

  function handleSizeGuide(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    trackEvent('product_size_guide_opened', {
      product_id: product.id,
      product_name: product.name,
      category: product.category
    })
    setIsSizeGuideOpen(true)
  }

  const badgeText = product.badge || 'NEW'
  const fitText = product.fit ? `${product.fit.toUpperCase()} FIT` : 'RELAXED FIT'
  const categoryFitOverline = [
    product.category?.replaceAll('-', ' ').toUpperCase(),
    fitText
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto max-w-[1360px] px-[clamp(16px,3.2vw,40px)] pt-6 pb-24 font-ui max-[639px]:px-4 max-[639px]:pt-[18px] max-[639px]:pb-[calc(84px+env(safe-area-inset-bottom,0px))]">
      {/* ── Breadcrumb Navigation ── */}
      <nav
        className="mb-6 flex items-center gap-2 font-ui text-[11px] font-medium uppercase tracking-[0.025em] text-[#747d80]"
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="text-[#71717a] no-underline transition-colors hover:text-[#111827]"
        >
          Home
        </Link>
        <span className="text-[#a1a1aa] opacity-40" aria-hidden="true">
          /
        </span>
        <Link
          href="/shop"
          className="text-[#71717a] no-underline transition-colors hover:text-[#111827]"
        >
          Shop
        </Link>
        <span className="text-[#a1a1aa] opacity-40" aria-hidden="true">
          /
        </span>
        <Link
          href={catMeta.href}
          className="text-[#71717a] no-underline transition-colors hover:text-[#111827]"
        >
          {catMeta.label}
        </Link>
        <span className="text-[#a1a1aa] opacity-40" aria-hidden="true">
          /
        </span>
        <span className="max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#172126]">
          {product.name}
        </span>
      </nav>

      {/* ── Main 2-Column Split: Product Card Aesthetics ── */}
      <div className="grid grid-cols-[1.08fr_0.92fr] items-start gap-[clamp(24px,3.5vw,44px)] max-[1080px]:grid-cols-1 max-[1080px]:gap-7">
        {/* ── COLUMN 1: Product Media Showcase Card ── */}
        <section
          className="group/stage relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-black/5 bg-[#fbfbfa] p-2 pb-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/[0.08] hover:shadow-[0_10px_32px_rgba(0,0,0,0.06)]"
          aria-label="Product imagery"
        >
          {/* Main Hero Image Stage */}
          <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-t-sm bg-[#f4f4f2]">
            {/* Top-Left Circular Floating Favorite Button */}
            <button
              type="button"
              className={`absolute left-3.5 top-3.5 z-10 flex h-10 w-10 touch-manipulation cursor-pointer items-center justify-center rounded-full border-0 bg-white p-0 text-[#18181b] shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-[transform,background,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.08] hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.16)] active:scale-[0.92] ${
                mounted && isFavorite ? 'shadow-[0_4px_14px_rgba(225,29,72,0.22)]' : ''
              } ${favAnimate ? 'animate-heart-pop' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={
                mounted && isFavorite
                  ? `Remove ${product.name} from favorites`
                  : `Add ${product.name} to favorites`
              }
              title={mounted && isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`h-[17px] w-[17px] transition-[transform,stroke,fill] duration-200 ease-[ease] ${
                  favAnimate ? 'animate-heart-pop-icon' : ''
                }`}
                fill={mounted && isFavorite ? '#e11d48' : 'none'}
                stroke={mounted && isFavorite ? '#e11d48' : '#18181b'}
                strokeWidth={mounted && isFavorite ? 2 : 1.75}
              />
            </button>

            {/* Top-Right Bold Black Badge Pill */}
            {badgeText && (
              <span
                className="pointer-events-none absolute right-3.5 top-3.5 z-10 rounded-sm bg-[#09090b] px-3 py-[5px] font-brand text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                aria-label={`Badge: ${badgeText}`}
              >
                {badgeText}
              </span>
            )}

            {/* Clickable Main Image */}
            <div
              className="relative h-full w-full cursor-zoom-in overflow-hidden"
              onClick={() => openLightbox(activeImageIdx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openLightbox(activeImageIdx)
                }
              }}
              aria-label={`Enlarge ${product.name} image angle ${activeImageIdx + 1}`}
            >
              <Image
                src={images[activeImageIdx] || product.img}
                alt={`${product.name} — angle ${activeImageIdx + 1}`}
                width={900}
                height={1125}
                priority
                className="block h-full w-full object-cover transition-opacity duration-[250ms] group-hover/stage:scale-[1.025]"
              />
            </div>

            {/* Stage Left/Right Quick Chevrons (visible on hover) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 z-[9] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#18181b] opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur-md backdrop-saturate-[1.8] transition-[opacity,transform,background] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/stage:opacity-[0.88] hover:scale-[1.08] hover:bg-white hover:opacity-100! active:scale-[0.92]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIdx(
                      (prev) => (prev - 1 + images.length) % images.length
                    )
                  }}
                  aria-label="Previous view angle"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-[9] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#18181b] opacity-0 shadow-[0_2px_10px_rgba(0,0,0,0.12)] backdrop-blur-md backdrop-saturate-[1.8] transition-[opacity,transform,background] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/stage:opacity-[0.88] hover:scale-[1.08] hover:bg-white hover:opacity-100! active:scale-[0.92]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImageIdx((prev) => (prev + 1) % images.length)
                  }}
                  aria-label="Next view angle"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Bottom-Left Carousel Pagination Dots */}
            {images.length > 1 && (
              <div
                className="absolute bottom-3.5 left-4 z-10 flex items-center gap-1.5 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.45))]"
                role="tablist"
                aria-label="Angle selector"
              >
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`cursor-pointer rounded-full border-0 p-0 transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      activeImageIdx === idx
                        ? 'h-2 w-2 scale-[1.2] bg-white'
                        : 'h-1.5 w-1.5 bg-white/55'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImageIdx(idx)
                    }}
                    aria-label={`Switch to image view ${idx + 1}`}
                    role="tab"
                    aria-selected={activeImageIdx === idx}
                  />
                ))}
              </div>
            )}

            {/* Bottom-Right Zoom Expand Button */}
            <button
              type="button"
              className="absolute bottom-3 right-3.5 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#18181b] opacity-[0.85] shadow-[0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-[10px] transition-[transform,background,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.08] hover:bg-white hover:opacity-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-[0.92]"
              onClick={(e) => {
                e.stopPropagation()
                openLightbox(activeImageIdx)
              }}
              title="Click to view full image"
              aria-label={`Expand view of angle ${activeImageIdx + 1}`}
            >
              <Maximize2 className="w-4 h-4 text-zinc-800" />
            </button>
          </div>

          {/* Thumbnail Reel Under Hero Image */}
          {images.length > 1 && (
            <div
              className="flex items-center gap-2.5 overflow-x-auto px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Product views gallery"
            >
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`relative h-[86px] w-[68px] shrink-0 cursor-pointer overflow-hidden rounded-[9px] border-2 bg-[#eeede7] p-0 transition-[opacity,transform,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    activeImageIdx === idx
                      ? 'scale-[1.03] border-[#111] opacity-100 shadow-[0_0_0_1px_#111,0_4px_12px_rgba(0,0,0,0.12)]'
                      : 'border-transparent opacity-65 hover:-translate-y-0.5 hover:border-black/25 hover:opacity-95'
                  }`}
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`Select angle view ${idx + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={130}
                    height={165}
                    className="block h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── COLUMN 2: Product Details & Purchase Card ── */}
        <section
          className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-[#fbfbfa] p-2 pb-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/[0.08] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
          aria-label="Product details and purchase options"
        >
          {/* Overline / Fit Tag */}
          <div className="mb-1.5 font-ui text-[11px] font-bold uppercase tracking-[0.08em] text-[#8e8e93]">
            {categoryFitOverline}
          </div>

          {/* Product Headline */}
          <h1 className="mb-3 font-brand text-[clamp(24px,2.4vw,34px)] font-bold leading-[1.18] tracking-[-0.025em] text-[#111827]">
            {product.name}
          </h1>

          {/* Price & Live Stock Row */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-ui text-[13.5px] font-bold leading-none tracking-[-0.02em] text-[#282c3f] tabular-nums">
                {product.price}
              </span>
              <span className="font-ui text-[11.5px] font-medium text-[#71717a]">
                MRP inclusive of all taxes
              </span>
            </div>

            {availableSizes.length > 0 ? (
              <div className="inline-flex items-center gap-[7px] rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[11px] py-1 font-ui text-[11px] font-semibold tracking-[0.02em] text-[#047857]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_0_0_rgba(16,185,129,0.6)] animate-[stockPulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                <span>In Stock, Ready to Ship</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-[7px] rounded-full border border-[#e4e4e7] bg-[#f4f4f5] px-[11px] py-1 font-ui text-[11px] font-semibold tracking-[0.02em] text-[#71717a]">
                <span>Out of Stock</span>
              </div>
            )}
          </div>

          {/* Subtle Card Separator */}
          <div className="mt-1.5 mb-4 h-px bg-black/[0.06]" />

          {/* Product Narrative */}
          <p className="mb-5 font-ui text-[14px] leading-[1.62] text-[#52525b]">{product.desc}</p>

          {/* Colorway & Swatches Section */}
          <div className="mb-5">
            <div className="mb-2.5 flex items-center justify-between font-ui text-[13px]">
              <span className="text-[13px] text-[#3f3f46]">
                Color: <strong className="font-bold text-[#111827]">{selectedColor || 'Standard'}</strong>
              </span>
              <span className="mb-2 truncate font-ui text-[11.5px] font-medium text-[#94969f]">
                {colorWashLabel}
              </span>
            </div>

            {swatches.length > 0 && (
              <div
                className="flex items-center gap-2.5"
                role="group"
                aria-label="Color choices"
              >
                {swatches.map((swatch, idx) => (
                  <button
                    key={swatch.name}
                    type="button"
                    className={`h-[22px] w-[22px] cursor-pointer rounded-full border-0 p-0 outline-none transition-[transform,box-shadow] duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.18] ${
                      selectedColor.toLowerCase() === swatch.name.toLowerCase()
                        ? 'shadow-[0_0_0_2px_#fff,0_0_0_4px_#111]'
                        : ''
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    onClick={() => handleSelectColor(swatch.name)}
                    title={swatch.name}
                    aria-label={`Select ${swatch.name}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Size Picker Section */}
          <div className="mb-5">
            <div className="mb-2.5 flex items-center justify-between font-ui text-[13px]">
              <span className="text-[13px] text-[#3f3f46]">
                Select {isNumeric ? 'Waist' : 'Size'}:{' '}
                <strong className="font-bold text-[#111827]">
                  {selectedSize}
                  {isNumeric ? '"' : ''}
                </strong>
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/profile?tab=preferences"
                  className="cursor-pointer font-ui text-[12px] font-medium text-[#71717a] underline underline-offset-2 transition-colors hover:text-[#111827]"
                >
                  Fit Profile ⚙
                </Link>
                <a
                  href="#size-guide"
                  className="cursor-pointer font-ui text-[12px] font-medium text-[#71717a] underline underline-offset-2 transition-colors hover:text-[#111827]"
                  onClick={handleSizeGuide}
                >
                  Size Guide ↗
                </a>
              </div>
            </div>

            {/* Preference Match Indicator Banner */}
            {selectedSize === (isNumeric ? preferences.waistSize : preferences.topSize) && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-[2px] border border-[#bbf7d0] bg-[#f1f0eb] px-3 py-[7px] font-ui text-[12px] font-medium text-[#166534] shadow-[0_1px_3px_rgba(22,101,52,0.05)] animate-[fadeInPref_0.25s_cubic-bezier(0.16,1,0.3,1)]">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Auto-selected from your <strong className="font-bold text-[#14532d]">Fit &amp; Size Profile</strong> (
                  {isNumeric ? `Waist ${preferences.waistSize}"` : `Size ${preferences.topSize}`})
                </span>
              </div>
            )}

            {/* Size Grid Pills */}
            <div
              className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2"
              role="group"
              aria-label="Size choices"
            >
              {sizeOptions.map((size) => {
                const isAvailable = availableSizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    className={`flex h-12 cursor-pointer touch-manipulation items-center justify-center rounded-[2px] border font-brand text-[13.5px] font-semibold leading-[1.5] tabular-nums transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:cursor-not-allowed disabled:border-[#e4e4e7] disabled:bg-[#f4f4f5] disabled:text-[#a1a1aa] disabled:line-through disabled:opacity-[0.42] ${
                      size === selectedSize
                        ? '-translate-y-px border-[#172126] bg-[#172126] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
                        : 'border-black/[0.09] bg-white text-[#18181b] enabled:hover:-translate-y-px enabled:hover:border-[#111] enabled:hover:bg-white enabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] enabled:active:scale-[0.96]'
                    }`}
                    onClick={() => handleSelectSize(size)}
                    disabled={!isAvailable}
                    aria-label={isAvailable ? `Select size ${size}` : `Size ${size} is out of stock`}
                  >
                    {size}
                    {isNumeric ? '"' : ''}
                  </button>
                )
              })}
              {sizeOptions.length === 0 && (
                <p className="mt-2 font-ui text-[13px] leading-[1.45] text-[#71797c]">
                  Size availability is not listed.
                </p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div
            id="pdp-main-actions"
            data-pdp-actions
            className="my-3 mb-5 flex flex-col gap-2.5"
          >
            <button
              id="pdp-add-to-cart-btn"
              type="button"
              className={`flex min-h-12 w-full cursor-pointer items-center rounded-[2px] border px-5 font-brand text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_3px_12px_rgba(0,0,0,0.1)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] enabled:hover:-translate-y-[1.5px] enabled:hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] enabled:active:scale-[0.97] enabled:active:bg-black disabled:cursor-not-allowed disabled:border-[#e4e4e7] disabled:bg-[#e4e4e7] disabled:text-[#a1a1aa] disabled:shadow-none disabled:opacity-[0.55] ${
                added
                  ? 'justify-center border-[#166534] bg-[#166534] text-white shadow-[0_4px_16px_rgba(22,101,52,0.3)]'
                  : 'justify-between border-[#111] bg-[#172126]'
              }`}
              onClick={() => handleAddToCart('pdp')}
              disabled={!availableSizes.includes(selectedSize)}
            >
              {added ? (
                <span>✓ Added to Shopping Bag</span>
              ) : (
                <>
                  <span>Add to Bag — {isNumeric ? `${selectedSize}"` : selectedSize}</span>
                  <span className="font-brand text-[13px] font-bold tracking-[-0.01em] text-white opacity-95">
                    {product.price}
                  </span>
                </>
              )}
            </button>

            <button
              id="pdp-buy-now-btn"
              type="button"
              className="flex h-12 min-h-12 w-full cursor-pointer items-center justify-center rounded-[2px] border border-[#111] bg-[#172126] font-brand text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] enabled:hover:-translate-y-px enabled:hover:bg-[#111] enabled:hover:text-white enabled:hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:border-[#e4e4e7] disabled:bg-[#172126] disabled:text-[#a1a1aa] disabled:opacity-[0.55]"
              onClick={() => handleBuyNow('pdp')}
              disabled={!availableSizes.includes(selectedSize)}
            >
              Buy Now
            </button>
          </div>

          {/* Service & Delivery Inset Card */}
          <div className="my-2.5 mb-[22px] flex flex-col gap-[13px] rounded-[14px] border border-black/5 bg-[#f4f3ee] px-[18px] py-4">
            <div className="flex items-start gap-3 font-ui">
              <Truck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="mb-0.5 block text-[12.5px] font-semibold text-[#18181b]">
                  Calculated Delivery Dispatch
                </strong>
                <p className="m-0 text-[12px] leading-[1.45] text-[#71717a]">
                  Delivery charges computed dynamically at checkout based on destination.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 font-ui">
              <RefreshCw className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="mb-0.5 block text-[12.5px] font-semibold text-[#18181b]">
                  7-Day Doorstep Size Exchanges
                </strong>
                <p className="m-0 text-[12px] leading-[1.45] text-[#71717a]">
                  Easy doorstep reverse pickup and fast size exchange with no questions asked.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 font-ui">
              <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="mb-0.5 block text-[12.5px] font-semibold text-[#18181b]">
                  Signature Heavyweight Quality
                </strong>
                <p className="m-0 text-[12px] leading-[1.45] text-[#71717a]">
                  {product.fabric || '100% Combed Cotton'} · Resilient knit engineered to retain drape.
                </p>
              </div>
            </div>
          </div>

          {/* Specification Accordions */}
          <div className="mt-1 border-t border-black/[0.08]">
            <details className="group/open border-b border-black/[0.08]" open>
              <summary className="flex cursor-pointer list-none items-center justify-between py-[15px] font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#27272a] transition-colors select-none hover:text-black [&::-webkit-details-marker]:hidden">
                <span>Material &amp; Construction</span>
                <span className="text-[16px] font-normal text-[#71717a] transition-[transform,color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-open/open:rotate-45 group-open/open:text-black">
                  +
                </span>
              </summary>
              <div className="pb-[15px] font-ui text-[13px] leading-[1.62] text-[#52525b]">
                <p>
                  {product.material ||
                    product.fabric ||
                    'See the product description for fabric composition and construction details.'}
                  {product.pattern ? ` · ${product.pattern}` : ''}
                </p>
              </div>
            </details>

            <details className="group/open border-b border-black/[0.08]">
              <summary className="flex cursor-pointer list-none items-center justify-between py-[15px] font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#27272a] transition-colors select-none hover:text-black [&::-webkit-details-marker]:hidden">
                <span>Care Instructions</span>
                <span className="text-[16px] font-normal text-[#71717a] transition-[transform,color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-open/open:rotate-45 group-open/open:text-black">
                  +
                </span>
              </summary>
              <div className="pb-[15px] font-ui text-[13px] leading-[1.62] text-[#52525b]">
                <p>
                  Wash inside out in cold water with mild detergent. Hang dry in shade. Avoid machine drying to preserve natural patina and knit structure.
                </p>
              </div>
            </details>

            <details className="group/open border-b border-black/[0.08]">
              <summary className="flex cursor-pointer list-none items-center justify-between py-[15px] font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#27272a] transition-colors select-none hover:text-black [&::-webkit-details-marker]:hidden">
                <span>Exchanges &amp; Guarantee</span>
                <span className="text-[16px] font-normal text-[#71717a] transition-[transform,color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-open/open:rotate-45 group-open/open:text-black">
                  +
                </span>
              </summary>
              <div className="pb-[15px] font-ui text-[13px] leading-[1.62] text-[#52525b]">
                <p>
                  Doorstep reverse pickup within 7 days of delivery. Instant size exchanges with no questions asked.
                </p>
              </div>
            </details>
          </div>
        </section>
      </div>

      {/* ── Community Ratings & Customer Reviews ── */}
      <ProductReviews productId={product.id} productName={product.name} />

      {/* ── Curated Recommendations / Complete the Fit ── */}
      <RelatedProducts currentProduct={product} />

      {/* ── Sticky Bottom Floating Bar on Scroll (Past Buy Now) ── */}
      <StickyPdpBar
        product={product}
        selectedSize={selectedSize}
        availableSizes={availableSizes}
        isNumeric={isNumeric}
        added={added}
        onAddToCart={() => handleAddToCart('sticky_bar')}
        onBuyNow={() => handleBuyNow('sticky_bar')}
      />

      {/* ── Interactive Apple-style Size & Fit Guide Modal ── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        productCategory={product.category}
        productFit={product.fit}
      />

      {/* ── Expanded Image Lightbox Modal ── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[99999] flex select-none flex-col justify-between bg-[rgba(8,10,14,0.95)] p-5 px-6 backdrop-blur-2xl animate-[pdpLightboxFadeIn_0.2s_cubic-bezier(0.16,1,0.3,1)] max-[640px]:px-3.5 max-[640px]:py-4"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded product image viewer"
          onClick={closeLightbox}
        >
          {/* Lightbox Top Header Bar */}
          <div
            className="z-10 mx-auto flex w-full max-w-[1300px] items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-brand text-[16px] font-bold tracking-[-0.01em] text-white">
                {product.name}
              </span>
              <span className="rounded-full border border-white/12 bg-white/10 px-[9px] py-[3px] font-ui text-[12px] font-semibold text-[#a1a1aa]">
                {lightboxIndex + 1} / {images.length}
              </span>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/[0.18] bg-white/12 text-white transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 hover:bg-white/25 active:scale-95"
              onClick={closeLightbox}
              aria-label="Close expanded view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Stage */}
          <div
            className="relative mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 items-center justify-center py-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            {images.length > 1 && (
              <button
                type="button"
                className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/22 bg-white/14 text-white backdrop-blur-md transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.08] hover:bg-white/30 active:scale-[0.94] max-[640px]:h-10 max-[640px]:w-10"
                onClick={() =>
                  setLightboxIndex(
                    (prev) => (prev! - 1 + images.length) % images.length
                  )
                }
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Expanded Image */}
            <div className="relative flex h-full max-h-[74vh] w-full max-w-[860px] items-center justify-center">
              <Image
                src={images[lightboxIndex]}
                alt={`${product.name} enlarged view ${lightboxIndex + 1}`}
                fill
                sizes="95vw"
                className="rounded-[10px] object-contain shadow-[0_12px_48px_rgba(0,0,0,0.4)]"
                priority
              />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/22 bg-white/14 text-white backdrop-blur-md transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.08] hover:bg-white/30 active:scale-[0.94] max-[640px]:h-10 max-[640px]:w-10"
                onClick={() =>
                  setLightboxIndex((prev) => (prev! + 1) % images.length)
                }
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Bar */}
          {images.length > 1 && (
            <div
              className="mx-auto flex w-full max-w-[1000px] items-center justify-center gap-2.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`relative h-[66px] w-[50px] shrink-0 cursor-pointer overflow-hidden rounded-sm border-2 bg-white/[0.08] p-0 transition-all duration-[180ms] ${
                    i === lightboxIndex
                      ? 'scale-[1.06] border-white opacity-100 shadow-[0_4px_14px_rgba(0,0,0,0.3)]'
                      : 'border-transparent opacity-55 hover:opacity-90'
                  }`}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Jump to image ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={56}
                    height={75}
                    className="block h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
