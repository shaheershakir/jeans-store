'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  MapPin,
  Pencil,
  Plus,
  Minus,
  X
} from 'lucide-react'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore, usePreferencesStore, useFavoriteStore } from '@/lib/store'
import SizeGuideModal from '@/components/SizeGuideModal'
import RelatedProducts from '@/components/RelatedProducts'
import StickyPdpBar from '@/components/StickyPdpBar'
import { getAvailableProductSizes, getProductCheckoutUrl, getProductSlug } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

// Map category ID → breadcrumb label + route
const CATEGORY_META: Record<string, { label: string; href: string }> = {
  stripes: { label: 'Stripes', href: '/shop/stripes' },
  fullsleeve: { label: 'Fullsleeve Tees', href: '/shop/fullsleeve' },
  drsleeve: { label: 'Drsleeve Tees', href: '/shop/drsleeve' },
  'printed-tees': { label: 'Printed Tees', href: '/shop/printed-tees' },
  'ringer-tees': { label: 'Ringer Tees', href: '/shop/ringer-tees' },
  henley: { label: 'Henley Tees', href: '/shop/henley' },
  trackpants: { label: 'Trackpants', href: '/shop/trackpants' },
  sweatpants: { label: 'Sweatpants', href: '/shop/sweatpants' },
  tops: { label: 'T-Shirts', href: '/shop' },
  't-shirts': { label: 'T-Shirts', href: '/shop' }
}

// 7 exact colorway options from the reference mockup
const PDP_SWATCHES = [
  { name: 'Charcoal', hex: '#1f2022' },
  { name: 'White', hex: '#ffffff', isWhite: true },
  { name: 'Navy', hex: '#1e2f4d' },
  { name: 'Grey', hex: '#b0b5be' },
  { name: 'Beige', hex: '#c7b299' },
  { name: 'Green', hex: '#194d33' },
  { name: 'Red', hex: '#a93226' }
]

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
  const [selectedColor, setSelectedColor] = useState<string>('Charcoal')

  // Open/close states for the 3 accordions
  const [openAccordion, setOpenAccordion] = useState<{
    details: boolean
    material: boolean
    shipping: boolean
  }>({
    details: false,
    material: false,
    shipping: false
  })

  // Available sizes
  const availableSizes = useMemo(() => {
    return product.variants?.length
      ? Array.from(
          new Set(
            product.variants
              .filter(
                (variant) =>
                  variant.status === 'Active' && variant.stock - variant.reserved > 0
              )
              .map((variant) => String(variant.size))
          )
        )
      : getAvailableProductSizes(product)
  }, [product])

  const isNumeric = availableSizes.length > 0 && availableSizes.every((s) => /^\d+$/.test(s))

  // Canonical title and imagery matching the exact reference mockup
  const isThermalWaffle = product.name.toLowerCase().includes('thermal waffle')
  const title = isThermalWaffle ? 'Thermal Waffle Knit Tee' : product.name

  // Build image list
  const images = useMemo(() => {
    if (isThermalWaffle) {
      return [
        '/mock-assets/pdp/hero_clean_high.png',
        '/mock-assets/pdp/gallery_2.png',
        '/mock-assets/pdp/gallery_3.png',
        '/mock-assets/pdp/gallery_4.png',
        '/mock-assets/pdp/gallery_5.png'
      ]
    }
    const raw = (
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.img, product.img2]
    ).filter(Boolean) as string[]

    const unique = Array.from(new Set(raw))
    return unique.length > 0 ? unique : [product.img]
  }, [product, isThermalWaffle])

  const catMeta =
    (product.category ? CATEGORY_META[product.category] : null) ?? {
      label: 'All Garments',
      href: '/shop'
    }

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
        const current = useUIStore.getState().selectedSize
        if (current && availableSizes.includes(current)) {
          setSelectedSize(current)
        } else if (availableSizes.includes('S')) {
          setSelectedSize('S')
        } else if (availableSizes.length > 0) {
          setSelectedSize(availableSizes[0])
        }
      }
    }
    void hydrateAndSelect()
    return () => {
      isSubscribed = false
    }
  }, [availableSizes, setSelectedSize])

  // Track PDP view
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

  function handleSelectColor(colorName: string) {
    setSelectedColor(colorName)
    trackEvent('product_variant_selected', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      variant_type: 'color',
      color: colorName,
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
    showToast(nextState ? `Saved ${product.name} to wishlist` : 'Removed from wishlist')

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
    showToast(`Added ${product.name} (${selectedSize}) to bag`)
    setTimeout(() => setAdded(false), 2000)
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

  const toggleAccordion = (section: 'details' | 'material' | 'shipping') => {
    setOpenAccordion((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Calculate original price & discount
  const originalPrice = Math.round(product.priceNum * 1.286)
  const discountPercent = Math.round(((originalPrice - product.priceNum) / originalPrice) * 100)

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pt-6 pb-20 font-sans">
      {/* ── Breadcrumb Navigation ── */}
      <nav
        className="mb-6 flex items-center gap-1.5 text-xs text-gray-500 font-normal"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/shop" className="hover:text-gray-900 transition-colors">
          Shop
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={catMeta.href} className="hover:text-gray-900 transition-colors">
          {product.category === 'fullsleeve' ? 'Fullsleeve Tees' : catMeta.label}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900 truncate max-w-[260px] sm:max-w-none">
          {title}
        </span>
      </nav>

      {/* ── 2-Column Product Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* ── Left Column: Media Gallery ── */}
        <section className="lg:col-span-7 flex flex-col" aria-label="Product Gallery">
          {/* Main Hero Image */}
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#faf9f6] select-none shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <Image
              src={images[activeImageIdx] || product.img}
              alt={`${title} — view ${activeImageIdx + 1}`}
              fill
              priority
              className="object-cover transition-all duration-300"
            />

            {/* Left Chevron Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-800 hover:bg-gray-50 active:scale-95 transition-all touch-manipulation cursor-pointer"
                aria-label="Previous view angle"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
            )}

            {/* Right Chevron Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIdx((prev) => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-800 hover:bg-gray-50 active:scale-95 transition-all touch-manipulation cursor-pointer"
                aria-label="Next view angle"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            )}
          </div>

          {/* 5 Thumbnails Reel Below Hero */}
          {images.length > 1 && (
            <div
              className="grid grid-cols-5 gap-3 mt-4"
              role="group"
              aria-label="Thumbnail angles"
            >
              {images.map((src, idx) => {
                const isActive = activeImageIdx === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative aspect-square w-full rounded-xl overflow-hidden bg-[#faf9f6] cursor-pointer transition-all touch-manipulation ${
                      isActive
                        ? 'border-2 border-black opacity-100 shadow-xs'
                        : 'border border-gray-200/80 opacity-80 hover:opacity-100 hover:border-gray-400'
                    }`}
                    aria-label={`Select angle view ${idx + 1}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Right Column: Details & Purchase Actions ── */}
        <section
          className="lg:col-span-5 flex flex-col pt-1"
          aria-label="Product Specifications and Purchase"
        >
          {/* Eyebrow / Category */}
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {product.category?.replace('-', ' ').toUpperCase() || 'FULLSLEEVE'}
          </div>

          {/* Product Title */}
          <h1 className="text-3xl lg:text-[34px] font-bold text-gray-950 tracking-tight leading-tight mb-3">
            {title}
          </h1>

          {/* Price & Discount Row */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl lg:text-[28px] font-bold text-gray-950 tabular-nums">
              {product.price}
            </span>
            <span className="text-base sm:text-lg text-gray-400 line-through font-normal tabular-nums">
              ₹{(isThermalWaffle ? 1799 : originalPrice).toLocaleString('en-IN')}
            </span>
            <span className="bg-[#e6f4ea] text-[#137333] text-xs font-bold px-2.5 py-1 rounded-full">
              {isThermalWaffle ? 22 : discountPercent}% OFF
            </span>
          </div>

          {/* Taxes Notice */}
          <div className="text-xs text-gray-400 mb-6">
            Inclusive of all taxes
          </div>

          {/* Colorway Selector */}
          <div className="mb-6">
            <div className="text-sm text-gray-900 mb-3">
              Color: <strong className="font-bold text-gray-950">{selectedColor}</strong>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap" role="group" aria-label="Color choices">
              {PDP_SWATCHES.map((swatch) => {
                const isSelected = selectedColor.toLowerCase() === swatch.name.toLowerCase()
                return (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => handleSelectColor(swatch.name)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full cursor-pointer transition-all touch-manipulation outline-none ${
                      swatch.isWhite ? 'border border-gray-200' : ''
                    } ${
                      isSelected
                        ? 'ring-2 ring-black ring-offset-2 scale-105'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.name}
                    aria-label={`Select color ${swatch.name}`}
                  />
                )
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 text-sm text-gray-900">
              <span>
                Size: <strong className="font-bold text-gray-950">{selectedSize}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-black inline-flex items-center gap-0.5 cursor-pointer underline underline-offset-2"
              >
                <span>Size guide</span>
                <span className="text-sm leading-none">↗</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap" role="group" aria-label="Size choices">
              {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                const isAvailable = availableSizes.length > 0 ? availableSizes.includes(size) : true
                const isSelected = selectedSize === size
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectSize(size)}
                    className={`h-12 w-14 sm:w-16 rounded-xl flex items-center justify-center text-sm font-semibold transition-all touch-manipulation cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-black text-white border border-black shadow-xs'
                        : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Delivery Box */}
          <div className="bg-[#f9f9f9] border border-gray-100 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm text-gray-700">
                  <span>Deliver to</span>
                  <strong className="font-bold text-gray-950">Bengaluru, 560001</strong>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 inline-flex items-center cursor-pointer"
                    aria-label="Edit delivery pincode"
                  >
                    <Pencil className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                  <span className="text-emerald-600 font-semibold text-xs inline-flex items-center gap-1 ml-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    In stock
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Free delivery by Tue, 22 Oct · ₹40 delivery charge
                </div>
              </div>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-gray-950 hover:underline shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>

          {/* Action CTAs */}
          <div id="pdp-main-actions" data-pdp-actions className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-3">
              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-900 hover:border-gray-400 transition-colors shrink-0 touch-manipulation cursor-pointer active:scale-95 ${
                  favAnimate ? 'scale-110' : ''
                }`}
                aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className="w-5 h-5 transition-transform"
                  fill={mounted && isFavorite ? '#e11d48' : 'none'}
                  stroke={mounted && isFavorite ? '#e11d48' : 'currentColor'}
                  strokeWidth={1.75}
                />
              </button>

              {/* Add to Bag Button */}
              <button
                id="pdp-add-to-cart-btn"
                type="button"
                onClick={() => handleAddToCart('pdp')}
                disabled={!availableSizes.includes(selectedSize)}
                className="flex-1 h-12 rounded-xl bg-black text-white font-brand text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-900 transition-colors active:scale-[0.99] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{added ? 'ADDED TO BAG' : `ADD TO BAG  —  ${product.price}`}</span>
              </button>
            </div>

            {/* Buy Now Button */}
            <button
              id="pdp-buy-now-btn"
              type="button"
              onClick={() => handleBuyNow('pdp')}
              disabled={!availableSizes.includes(selectedSize)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white text-gray-950 font-brand text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors active:scale-[0.99] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              BUY NOW
            </button>
          </div>

          {/* ── Accordions: Details, Material & care, Shipping charges ── */}
          <div className="border-t border-gray-200/80">
            {/* Details Accordion */}
            <div className="border-b border-gray-200/80">
              <button
                type="button"
                onClick={() => toggleAccordion('details')}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group"
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                  Details
                </span>
                {openAccordion.details ? (
                  <Minus className="w-4 h-4 text-gray-600" />
                ) : (
                  <Plus className="w-4 h-4 text-gray-600" />
                )}
              </button>
              {openAccordion.details && (
                <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed animate-fadeIn">
                  <p className="mb-2">
                    {product.desc ||
                      'Heavyweight 320 GSM honeycomb waffle knit providing natural warmth, stretch recovery, and ribbed storm cuffs.'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-500">
                    <li>Fit: {product.fit || 'Regular'} silhouette with ergonomic shoulder slope</li>
                    <li>Sleeve: Full sleeve with 2.5" stretch-ribbed storm cuffs</li>
                    <li>Collar: 1.25" twin-needle bound ribbed crew collar</li>
                    <li>Construction: High-density waffle stitch retaining drape wash after wash</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Material & care Accordion */}
            <div className="border-b border-gray-200/80">
              <button
                type="button"
                onClick={() => toggleAccordion('material')}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group"
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                  Material &amp; care
                </span>
                {openAccordion.material ? (
                  <Minus className="w-4 h-4 text-gray-600" />
                ) : (
                  <Plus className="w-4 h-4 text-gray-600" />
                )}
              </button>
              {openAccordion.material && (
                <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed animate-fadeIn">
                  <ul className="list-disc list-inside space-y-1 text-gray-500">
                    <li>Fabric: 100% Combed Cotton Honeycomb Waffle (320 GSM)</li>
                    <li>Machine wash cold with like colors inside out</li>
                    <li>Use mild detergent; do not bleach or dry clean</li>
                    <li>Tumble dry low or dry flat in natural shade to preserve knit structure</li>
                    <li>Warm iron inside out if needed; avoid direct iron on badges/prints</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Shipping charges Accordion */}
            <div className="border-b border-gray-200/80">
              <button
                type="button"
                onClick={() => toggleAccordion('shipping')}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group"
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                  Shipping charges
                </span>
                {openAccordion.shipping ? (
                  <Minus className="w-4 h-4 text-gray-600" />
                ) : (
                  <Plus className="w-4 h-4 text-gray-600" />
                )}
              </button>
              {openAccordion.shipping && (
                <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed animate-fadeIn">
                  <p className="mb-2">
                    Orders are processed and dispatched within 24 hours from our fulfillment hub.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-500">
                    <li>Standard Delivery: 2-4 business days across India</li>
                    <li>Free shipping on all orders over ₹999</li>
                    <li>Flat ₹40 delivery fee for orders under ₹999</li>
                    <li>7-day doorstep return and instant size exchange guarantee</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── You May Also Like Section (Using Existing ProductCard) ── */}
      <div className="mt-16 sm:mt-24 -mx-4 sm:-mx-6 lg:-mx-8">
        <RelatedProducts currentProduct={product} />
      </div>

      {/* ── Sticky Mobile/Desktop Bottom Bar on Scroll ── */}
      <StickyPdpBar
        product={product}
        selectedSize={selectedSize}
        availableSizes={availableSizes}
        isNumeric={isNumeric}
        added={added}
        onAddToCart={() => handleAddToCart('sticky_bar')}
        onBuyNow={() => handleBuyNow('sticky_bar')}
        selectedColor={selectedColor}
        productImage={images[activeImageIdx] || product.img}
        onSizeChange={handleSelectSize}
      />

      {/* ── Size & Fit Guide Modal ── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        productCategory={product.category}
        productFit={product.fit}
      />
    </div>
  )
}
