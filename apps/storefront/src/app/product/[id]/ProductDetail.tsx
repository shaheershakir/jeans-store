'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Heart,
  ShoppingBag,
  MapPin,
  Pencil,
  Plus,
  Check,
  X
} from 'lucide-react'
import type { Product, ProductDesign } from '@/lib/constants'
import { useCartStore, useUIStore, usePreferencesStore, useFavoriteStore, useSearchHistoryStore } from '@/lib/store'
import SizeGuideModal from '@/components/SizeGuideModal'
import RelatedProducts from '@/components/RelatedProducts'
import StickyPdpBar from '@/components/StickyPdpBar'
import { getAvailableProductSizes, getProductCheckoutUrl, getProductSlug, slugify } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'
import { ProductDetailSkeleton } from '@/components/skeletons/StorefrontSkeletons'

// Map category ID → breadcrumb label + route
const CATEGORY_META: Record<string, { label: string; href: string }> = {
  stripes: { label: 'Stripes', href: '/shop/stripes' },
  fullsleeve: { label: 'Fullsleeve Tees', href: '/shop/fullsleeve' },
  drsleeve: { label: 'Drsleeve Tees', href: '/shop/drsleeve' },
  'printed-tees': { label: 'Printed Tees', href: '/shop/printed-tees' },
  'ringer-tees': { label: 'Ringer Tees', href: '/shop/ringer-tees' },
  henley: { label: 'Henley Tees', href: '/shop/henley' },
  waffle: { label: 'Waffle Knit', href: '/shop/waffle' },
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

function ProductDetailContent({ product }: { product: Product }) {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // Filter active designs
  const designs = useMemo(() => {
    return (product.designs || []).filter((d) => d.status !== 'Inactive')
  }, [product.designs])

  const initialDesignSlug = searchParams.get('design')?.toLowerCase() || null

  const [selectedDesignSlug, setSelectedDesignSlug] = useState<string | null>(() => {
    if (initialDesignSlug) return initialDesignSlug
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('design')
      if (q) return q.toLowerCase()
    }
    return designs[0]?.slug?.toLowerCase() || null
  })

  // Sync state if searchParams updates
  useEffect(() => {
    const q = searchParams.get('design')?.toLowerCase()
    if (q && q !== selectedDesignSlug) {
      setSelectedDesignSlug(q)
    }
  }, [searchParams, selectedDesignSlug])

  // Active design object
  const selectedDesign = useMemo(() => {
    if (designs.length === 0) return null
    if (selectedDesignSlug) {
      const match = designs.find(
        (d) =>
          d.slug.toLowerCase() === selectedDesignSlug ||
          slugify(d.name) === selectedDesignSlug
      )
      if (match) return match
    }
    return designs[0]
  }, [designs, selectedDesignSlug])

  // Delivery Pincode Box state
  const [deliveryPin, setDeliveryPin] = useState<string>('560001')
  const [deliveryCity, setDeliveryCity] = useState<string>('Bengaluru')
  const [isEditingPin, setIsEditingPin] = useState<boolean>(false)
  const [pinInput, setPinInput] = useState<string>('560001')
  const [pinLoading, setPinLoading] = useState<boolean>(false)
  const [pinError, setPinError] = useState<string | null>(null)

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

  // Available sizes calculated for the selected design or product
  const availableSizes = useMemo(() => {
    if (selectedDesign) {
      if (selectedDesign.variants && selectedDesign.variants.length > 0) {
        const sizes = selectedDesign.variants
          .filter(
            (v) => v.status === 'Active' && (!product.trackInventory || v.stock - v.reserved > 0)
          )
          .map((v) => String(v.size))
        if (sizes.length > 0) return Array.from(new Set(sizes))
      }
      if (product.variants && product.variants.length > 0 && selectedDesign.id != null) {
        const matching = product.variants.filter((v) => v.designId === selectedDesign.id)
        if (matching.length > 0) {
          const sizes = matching
            .filter(
              (v) => v.status === 'Active' && (!product.trackInventory || v.stock - v.reserved > 0)
            )
            .map((v) => String(v.size))
          if (sizes.length > 0) return Array.from(new Set(sizes))
        }
      }
    }

    return product.variants?.length
      ? Array.from(
          new Set(
            product.variants
              .filter(
                (variant) =>
                  variant.status === 'Active' &&
                  (!product.trackInventory || variant.stock - variant.reserved > 0)
              )
              .map((variant) => String(variant.size))
          )
        )
      : getAvailableProductSizes(product)
  }, [product, selectedDesign])

  const isNumeric = availableSizes.length > 0 && availableSizes.every((s) => /^\d+$/.test(s))

  // Canonical title and imagery matching the exact reference mockup
  const isThermalWaffle = product.name.toLowerCase().includes('thermal waffle')
  const title = isThermalWaffle ? 'Thermal Waffle Knit Tee' : product.name

  // Build image list (prefer selected design gallery)
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
    if (selectedDesign?.images && selectedDesign.images.length > 0) {
      return selectedDesign.images
    }
    const raw = (
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.img, product.img2]
    ).filter(Boolean) as string[]

    const unique = Array.from(new Set(raw))
    return unique.length > 0 ? unique : [product.img]
  }, [product, isThermalWaffle, selectedDesign])

  // Price calculation with design override support
  const currentPriceNum = selectedDesign?.priceOverride ?? product.priceNum
  const currentPrice = selectedDesign?.priceOverride
    ? `₹${selectedDesign.priceOverride.toLocaleString('en-IN')}`
    : product.price
  const originalPrice = product.compareAtPrice ?? Math.round(currentPriceNum * 1.286)
  const discountPercent =
    originalPrice > currentPriceNum
      ? Math.round(((originalPrice - currentPriceNum) / originalPrice) * 100)
      : 0

  const catMeta = (product.category ? CATEGORY_META[product.category] : null) ?? {
    label: 'All Garments',
    href: '/shop'
  }

  // Ensure active image index is valid when gallery changes
  useEffect(() => {
    if (activeImageIdx >= images.length) {
      setActiveImageIdx(0)
    }
  }, [images.length, activeImageIdx])

  // Keep size selection valid when design/variants change
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes.includes('S') ? 'S' : availableSizes[0])
    }
  }, [availableSizes, selectedSize, setSelectedSize])

  useEffect(() => {
    let isSubscribed = true
    const hydrateAndSelect = async () => {
      await Promise.all([
        useUIStore.persist.rehydrate(),
        useCartStore.persist.rehydrate(),
        usePreferencesStore.persist.rehydrate(),
        useFavoriteStore.persist.rehydrate(),
        useSearchHistoryStore.persist.rehydrate()
      ])
      useSearchHistoryStore.getState().addRecentlyViewed(product.id)
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

    if (typeof window !== 'undefined') {
      const savedPin = localStorage.getItem('teesgarage-delivery-pin')
      if (savedPin) {
        setDeliveryPin(savedPin)
        setPinInput(savedPin)
      }
      const savedCity = localStorage.getItem('teesgarage-delivery-city')
      if (savedCity) {
        setDeliveryCity(savedCity)
      }
    }

    return () => {
      isSubscribed = false
    }
  }, [availableSizes, setSelectedSize, product.id])

  const handleStartEditPin = () => {
    setPinInput(deliveryPin)
    setPinError(null)
    setIsEditingPin(true)
  }

  const handleCancelEditPin = () => {
    setIsEditingPin(false)
    setPinError(null)
  }

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanPin = pinInput.trim()
    if (!/^\d{6}$/.test(cleanPin)) {
      setPinError('Enter a valid 6-digit PIN')
      return
    }
    setPinLoading(true)
    setPinError(null)
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
      const data = await res.json()
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0]
        const district = po.District || po.Name || 'India'
        setDeliveryPin(cleanPin)
        setDeliveryCity(district)
        setIsEditingPin(false)
        if (typeof window !== 'undefined') {
          localStorage.setItem('teesgarage-delivery-pin', cleanPin)
          localStorage.setItem('teesgarage-delivery-city', district)
        }
      } else {
        setPinError('Invalid pincode or not serviceable')
      }
    } catch {
      setPinError('Failed to verify pincode')
    } finally {
      setPinLoading(false)
    }
  }

  // Track PDP view
  useEffect(() => {
    trackEvent('product_viewed', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: currentPriceNum,
      currency: 'INR',
      design: selectedDesign?.name,
      color: selectedDesign ? selectedDesign.name : (selectedColor || product.color),
      selected_size: selectedSize,
      sizes_available: availableSizes,
      in_stock: availableSizes.length > 0
    })
  }, [product.id, selectedDesign, currentPriceNum])

  function handleSelectDesign(design: ProductDesign) {
    const slug = design.slug || slugify(design.name)
    setSelectedDesignSlug(slug.toLowerCase())
    setActiveImageIdx(0)

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('design', slug)
      window.history.replaceState(null, '', url.pathname + url.search)
    }

    trackEvent('product_variant_selected', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      variant_type: 'design',
      design_id: design.id,
      design_name: design.name,
      design_slug: design.slug,
      in_stock: true
    })
  }

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
      color: selectedDesign ? selectedDesign.name : selectedColor,
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
        price: currentPriceNum
      })
    } else {
      trackEvent('product_unfavorited', {
        product_id: product.id,
        product_name: product.name
      })
    }
  }

  function handleAddToCart(sourceLocation: 'pdp' | 'sticky_bar' = 'pdp') {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) return
    addItem(
      product.id,
      selectedSize,
      product,
      selectedDesign ? selectedDesign.name : (selectedColor || undefined),
      selectedDesign?.id,
      selectedDesign?.name,
      currentPriceNum,
      images[0] || product.img
    )
    setAdded(true)
    const label = selectedDesign ? `${product.name} - ${selectedDesign.name}` : product.name
    showToast(`Added ${label} (${selectedSize}) to bag`)
    setTimeout(() => setAdded(false), 2000)
    setTimeout(() => {
      openOverlay('cart')
    }, 320)

    const cartPayload = {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: currentPriceNum,
      currency: 'INR',
      design_id: selectedDesign?.id,
      design_name: selectedDesign?.name,
      color: selectedDesign?.name || selectedColor || product.color,
      size: selectedSize,
      quantity: 1,
      source_location: sourceLocation,
      in_stock: true
    }
    trackEvent('add_to_cart', cartPayload)
    trackEvent('product_added_to_cart', cartPayload)
  }

  function handleBuyNow(sourceLocation: 'pdp' | 'sticky_bar' = 'pdp') {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) return

    trackEvent('product_buy_now_clicked', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: currentPriceNum,
      currency: 'INR',
      design_id: selectedDesign?.id,
      design_name: selectedDesign?.name,
      color: selectedDesign?.name || selectedColor || product.color,
      size: selectedSize,
      quantity: 1,
      source_location: sourceLocation,
      in_stock: true
    })

    const checkoutUrl = getProductCheckoutUrl(product, {
      size: selectedSize,
      color: selectedDesign ? selectedDesign.name : (selectedColor || undefined),
      design: selectedDesign?.slug,
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
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-all duration-300"
            />
          </div>

          {/* Thumbnails Reel Below Hero */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-3 mt-4" role="group" aria-label="Thumbnail angles">
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
                    <Image src={src} alt="" fill sizes="120px" className="object-cover" />
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
          <h1 className="text-3xl lg:text-[34px] font-bold text-gray-950 tracking-tight leading-tight mb-2">
            {title}
          </h1>

          {/* Optional Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Price & Discount Row */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl lg:text-[28px] font-bold text-gray-950 tabular-nums">
              {currentPrice}
            </span>
            <span className="text-base sm:text-lg text-gray-400 line-through font-normal tabular-nums">
              ₹{(isThermalWaffle ? 1799 : originalPrice).toLocaleString('en-IN')}
            </span>
            {discountPercent > 0 && (
              <span className="bg-[#e6f4ea] text-[#137333] text-xs font-bold px-2.5 py-1 rounded-full">
                {isThermalWaffle ? 22 : discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Taxes Notice */}
          <div className="text-xs text-gray-400 mb-6">Inclusive of all taxes</div>

          {/* Design / Print Selector (when multi-design product) */}
          {designs.length > 0 ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 text-sm text-gray-900">
                <span>
                  Design: <strong className="font-bold text-gray-950">{selectedDesign?.name}</strong>
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {designs.length} {designs.length === 1 ? 'Design' : 'Designs'}
                </span>
              </div>

              <div
                className="grid grid-cols-3 sm:grid-cols-4 gap-2.5"
                role="radiogroup"
                aria-label="Select graphic design"
              >
                {designs.map((design) => {
                  const isSelected =
                    selectedDesign?.slug === design.slug ||
                    selectedDesign?.id === design.id ||
                    (selectedDesign && slugify(selectedDesign.name) === slugify(design.name))
                  const thumb = design.images?.[0] || product.img
                  return (
                    <button
                      key={design.slug || design.name}
                      type="button"
                      onClick={() => handleSelectDesign(design)}
                      className={`group relative rounded-xl border p-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-black bg-neutral-50 ring-1 ring-black shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-neutral-50/50'
                      }`}
                      aria-checked={isSelected ? 'true' : 'false'}
                      role="radio"
                    >
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100 mb-2">
                        <Image
                          src={thumb}
                          alt={design.name}
                          fill
                          sizes="(max-width: 640px) 30vw, 120px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="text-xs font-bold text-gray-950 truncate">{design.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 font-medium tabular-nums">
                        {design.priceOverride ? `₹${design.priceOverride.toLocaleString('en-IN')}` : product.price}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Standard Colorway Selector (when no designs) */
            <div className="mb-6">
              <div className="text-sm text-gray-900 mb-3">
                Color: <strong className="font-bold text-gray-950">{selectedColor}</strong>
              </div>

              <div
                className="flex items-center gap-2.5 sm:gap-3 flex-wrap"
                role="group"
                aria-label="Color choices"
              >
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
          )}

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

            <div
              className="flex items-center gap-2.5 sm:gap-3 flex-wrap"
              role="group"
              aria-label="Size choices"
            >
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
          <div className="bg-[#f9f9f9] border border-gray-100 rounded-2xl p-4 mb-6">
            {isEditingPin ? (
              <form onSubmit={handlePinSubmit} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setPinInput(val)
                      }}
                      placeholder="Enter 6-digit PIN"
                      disabled={pinLoading}
                      autoFocus
                      className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs font-mono font-medium text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pinLoading || pinInput.length !== 6}
                    className="h-9 px-3 rounded-lg bg-black text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1 shrink-0"
                  >
                    {pinLoading ? (
                      <span>Checking...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Check</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditPin}
                    disabled={pinLoading}
                    className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:text-black cursor-pointer shrink-0"
                  >
                    Cancel
                  </button>
                </div>
                {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm text-gray-700">
                      <span>Deliver to</span>
                      <strong className="font-bold text-gray-950">
                        {deliveryCity}, {deliveryPin}
                      </strong>
                      <button
                        type="button"
                        onClick={handleStartEditPin}
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
                      Paid delivery calculated by area and parcel weight
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartEditPin}
                  className="text-xs font-bold text-gray-950 hover:underline shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
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
                title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
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
                disabled={availableSizes.length > 0 && !availableSizes.includes(selectedSize)}
                className={`flex-1 h-12 rounded-xl text-white font-brand text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-[0.99] touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${
                  added ? 'bg-[#15803d]' : 'bg-black hover:bg-neutral-900'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{added ? 'ADDED TO BAG' : `ADD TO BAG  —  ${currentPrice}`}</span>
              </button>
            </div>

            {/* Buy Now Button */}
            <button
              id="pdp-buy-now-btn"
              type="button"
              onClick={() => handleBuyNow('pdp')}
              disabled={availableSizes.length > 0 && !availableSizes.includes(selectedSize)}
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
                aria-expanded={openAccordion.details}
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                  Details
                </span>
                <Plus
                  className={`w-4 h-4 transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    openAccordion.details ? 'rotate-45 text-black' : 'rotate-0 text-gray-600'
                  }`}
                />
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  openAccordion.details
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    <p className="mb-2">
                      {product.desc ||
                        'Heavyweight 320 GSM honeycomb waffle knit providing natural warmth, stretch recovery, and ribbed storm cuffs.'}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                      <li>Silhouette with ergonomic shoulder slope</li>
                      <li>Sleeve: Full sleeve with 2.5" stretch-ribbed storm cuffs</li>
                      <li>Collar: 1.25" twin-needle bound ribbed crew collar</li>
                      <li>
                        Construction: High-density waffle stitch retaining drape wash after wash
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Material & care Accordion */}
            <div className="border-b border-gray-200/80">
              <button
                type="button"
                onClick={() => toggleAccordion('material')}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group"
                aria-expanded={openAccordion.material}
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                  Material &amp; care
                </span>
                <Plus
                  className={`w-4 h-4 transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    openAccordion.material ? 'rotate-45 text-black' : 'rotate-0 text-gray-600'
                  }`}
                />
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  openAccordion.material
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                      <li>Fabric: 100% Combed Cotton Honeycomb Waffle (320 GSM)</li>
                      <li>Machine wash cold with like colors inside out</li>
                      <li>Use mild detergent; do not bleach or dry clean</li>
                      <li>
                        Tumble dry low or dry flat in natural shade to preserve knit structure
                      </li>
                      <li>Warm iron inside out if needed; avoid direct iron on badges/prints</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping charges Accordion */}
            <div className="border-b border-gray-200/80">
              <button
                type="button"
                onClick={() => toggleAccordion('shipping')}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group"
                aria-expanded={openAccordion.shipping}
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-black">
                  Shipping charges
                </span>
                <Plus
                  className={`w-4 h-4 transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    openAccordion.shipping ? 'rotate-45 text-black' : 'rotate-0 text-gray-600'
                  }`}
                />
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  openAccordion.shipping
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    <p className="mb-2">
                      Orders are processed and dispatched within 24 hours from our fulfillment hub.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                      <li>Direct fulfillment from Kannur, Kerala</li>
                      <li>Kerala delivery: 2-5 business days (standard ₹60 base rate)</li>
                      <li>Outside Kerala: 7-14 business days (standard ₹90 base rate)</li>
                      <li>Weight-based parcel shipping calculated at checkout</li>
                      <li>7-day doorstep return and instant size exchange guarantee</li>
                    </ul>
                  </div>
                </div>
              </div>
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
        selectedColor={selectedDesign ? selectedDesign.name : selectedColor}
        displayPrice={currentPrice}
        productImage={images[activeImageIdx] || images[0] || product.img}
        onSizeChange={handleSelectSize}
      />

      {/* ── Size & Fit Guide Modal ── */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        productCategory={product.category}
      />
    </div>
  )
}

export default function ProductDetail({ product }: { product: Product }) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent product={product} />
    </Suspense>
  )
}
