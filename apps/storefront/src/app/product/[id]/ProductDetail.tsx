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
    <div className="pdp-container">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="pdp-crumb-link">
          Home
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <Link href="/shop" className="pdp-crumb-link">
          Shop
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <Link href={catMeta.href} className="pdp-crumb-link">
          {catMeta.label}
        </Link>
        <span className="crumb-sep" aria-hidden="true">
          /
        </span>
        <span className="crumb-current">{product.name}</span>
      </nav>

      {/* ── Main 2-Column Split: Product Card Aesthetics ── */}
      <div className="pdp-layout">
        {/* ── COLUMN 1: Product Media Showcase Card ── */}
        <section className="pdp-showcase-card apple-product-card" aria-label="Product imagery">
          {/* Main Hero Image Stage */}
          <div className="pdp-hero-stage product-image-container">
            {/* Top-Left Circular Floating Favorite Button */}
            <button
              type="button"
              className={`product-fav-btn ${mounted && isFavorite ? 'active' : ''} ${favAnimate ? 'pop' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={
                mounted && isFavorite
                  ? `Remove ${product.name} from favorites`
                  : `Add ${product.name} to favorites`
              }
              title={mounted && isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`fav-heart-icon ${mounted && isFavorite ? 'filled' : ''}`}
                fill={mounted && isFavorite ? '#e11d48' : 'none'}
                stroke={mounted && isFavorite ? '#e11d48' : '#18181b'}
                strokeWidth={mounted && isFavorite ? 2 : 1.75}
              />
            </button>

            {/* Top-Right Bold Black Badge Pill */}
            {badgeText && (
              <span className="product-badge-pill" aria-label={`Badge: ${badgeText}`}>
                {badgeText}
              </span>
            )}

            {/* Clickable Main Image */}
            <div
              className="pdp-hero-img-wrap"
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
                className="pdp-hero-img"
              />
            </div>

            {/* Stage Left/Right Quick Chevrons (visible on hover) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pdp-stage-nav-btn prev"
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
                  className="pdp-stage-nav-btn next"
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
              <div className="card-pagination-dots" role="tablist" aria-label="Angle selector">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`dot ${activeImageIdx === idx ? 'active' : ''}`}
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
              className="pdp-expand-badge"
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
            <div className="pdp-angle-reel" role="group" aria-label="Product views gallery">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pdp-angle-thumb ${activeImageIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`Select angle view ${idx + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={130}
                    height={165}
                    className="pdp-angle-thumb-img"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── COLUMN 2: Product Details & Purchase Card ── */}
        <section className="pdp-details-card apple-product-card" aria-label="Product details and purchase options">
          {/* Overline / Fit Tag */}
          <div className="product-fit-overline pdp-fit-overline">
            {categoryFitOverline}
          </div>

          {/* Product Headline */}
          <h1 className="pdp-product-title">{product.name}</h1>

          {/* Price & Live Stock Row */}
          <div className="product-price-swatches-row pdp-price-stock-row">
            <div className="pdp-price-wrap">
              <span className="product-price pdp-price">{product.price}</span>
              <span className="pdp-price-tax-hint">MRP inclusive of all taxes</span>
            </div>

            {availableSizes.length > 0 ? (
              <div className="pdp-stock-badge in-stock">
                <span className="pdp-stock-pulse-dot" />
                <span>In Stock, Ready to Ship</span>
              </div>
            ) : (
              <div className="pdp-stock-badge out-of-stock">
                <span>Out of Stock</span>
              </div>
            )}
          </div>

          {/* Subtle Card Separator */}
          <div className="pdp-card-divider" />

          {/* Product Narrative */}
          <p className="pdp-narrative">{product.desc}</p>

          {/* Colorway & Swatches Section */}
          <div className="pdp-option-section">
            <div className="pdp-option-header-row">
              <span className="pdp-option-label">
                Color: <strong className="pdp-option-val">{selectedColor || 'Standard'}</strong>
              </span>
              <span className="product-wash-label pdp-wash-label">{colorWashLabel}</span>
            </div>

            {swatches.length > 0 && (
              <div className="product-color-swatches pdp-color-swatches" role="group" aria-label="Color choices">
                {swatches.map((swatch, idx) => (
                  <button
                    key={swatch.name}
                    type="button"
                    className={`product-color-swatch-dot pdp-color-swatch-dot ${
                      selectedColor.toLowerCase() === swatch.name.toLowerCase() ? 'active' : ''
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
          <div className="pdp-option-section">
            <div className="pdp-option-header-row">
              <span className="pdp-option-label">
                Select {isNumeric ? 'Waist' : 'Size'}:{' '}
                <strong className="pdp-option-val">
                  {selectedSize}
                  {isNumeric ? '"' : ''}
                </strong>
              </span>
              <div className="pdp-size-links">
                <Link href="/profile?tab=preferences" className="pdp-size-guide-link">
                  Fit Profile ⚙
                </Link>
                <a href="#size-guide" className="pdp-size-guide-link" onClick={handleSizeGuide}>
                  Size Guide ↗
                </a>
              </div>
            </div>

            {/* Preference Match Indicator Banner */}
            {selectedSize === (isNumeric ? preferences.waistSize : preferences.topSize) && (
              <div className="pdp-pref-match-banner">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Auto-selected from your <strong>Fit &amp; Size Profile</strong> (
                  {isNumeric ? `Waist ${preferences.waistSize}"` : `Size ${preferences.topSize}`})
                </span>
              </div>
            )}

            {/* Size Grid Pills */}
            <div className="pdp-sizes-grid" role="group" aria-label="Size choices">
              {sizeOptions.map((size) => {
                const isAvailable = availableSizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    className={`pdp-size-cell ${size === selectedSize ? 'selected' : ''}`}
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
                <p className="pdp-stock-message">Size availability is not listed.</p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div id="pdp-main-actions" className="pdp-actions-group">
            <button
              id="pdp-add-to-cart-btn"
              type="button"
              className={`pdp-add-to-cart-btn ${added ? 'added' : ''}`}
              onClick={() => handleAddToCart('pdp')}
              disabled={!availableSizes.includes(selectedSize)}
            >
              {added ? (
                <span>✓ Added to Shopping Bag</span>
              ) : (
                <>
                  <span>Add to Bag — {isNumeric ? `${selectedSize}"` : selectedSize}</span>
                  <span className="pdp-btn-price-tag">{product.price}</span>
                </>
              )}
            </button>

            <button
              id="pdp-buy-now-btn"
              type="button"
              className="pdp-buy-now-btn"
              onClick={() => handleBuyNow('pdp')}
              disabled={!availableSizes.includes(selectedSize)}
            >
              Buy Now
            </button>
          </div>

          {/* Service & Delivery Inset Card */}
          <div className="pdp-service-inset">
            <div className="pdp-service-item">
              <Truck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong>Calculated Delivery Dispatch</strong>
                <p>Delivery charges computed dynamically at checkout based on destination.</p>
              </div>
            </div>
            <div className="pdp-service-item">
              <RefreshCw className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong>7-Day Doorstep Size Exchanges</strong>
                <p>Easy doorstep reverse pickup and fast size exchange with no questions asked.</p>
              </div>
            </div>
            <div className="pdp-service-item">
              <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong>Signature Heavyweight Quality</strong>
                <p>{product.fabric || '100% Combed Cotton'} · Resilient knit engineered to retain drape.</p>
              </div>
            </div>
          </div>

          {/* Specification Accordions */}
          <div className="pdp-accordions">
            <details className="pdp-details-item" open>
              <summary className="pdp-summary">
                <span>Material &amp; Construction</span>
                <span className="summary-indicator">+</span>
              </summary>
              <div className="pdp-details-body">
                <p>
                  {product.material ||
                    product.fabric ||
                    'See the product description for fabric composition and construction details.'}
                  {product.pattern ? ` · ${product.pattern}` : ''}
                </p>
              </div>
            </details>

            <details className="pdp-details-item">
              <summary className="pdp-summary">
                <span>Care Instructions</span>
                <span className="summary-indicator">+</span>
              </summary>
              <div className="pdp-details-body">
                <p>
                  Wash inside out in cold water with mild detergent. Hang dry in shade. Avoid machine drying to preserve natural patina and knit structure.
                </p>
              </div>
            </details>

            <details className="pdp-details-item">
              <summary className="pdp-summary">
                <span>Exchanges &amp; Guarantee</span>
                <span className="summary-indicator">+</span>
              </summary>
              <div className="pdp-details-body">
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
          className="pdp-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded product image viewer"
          onClick={closeLightbox}
        >
          {/* Lightbox Top Header Bar */}
          <div className="pdp-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-lightbox-info">
              <span className="pdp-lightbox-title">{product.name}</span>
              <span className="pdp-lightbox-counter">
                {lightboxIndex + 1} / {images.length}
              </span>
            </div>
            <button
              type="button"
              className="pdp-lightbox-close"
              onClick={closeLightbox}
              aria-label="Close expanded view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Stage */}
          <div className="pdp-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {/* Previous Button */}
            {images.length > 1 && (
              <button
                type="button"
                className="pdp-lightbox-nav-btn pdp-lightbox-prev"
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
            <div className="pdp-lightbox-img-wrap">
              <Image
                src={images[lightboxIndex]}
                alt={`${product.name} enlarged view ${lightboxIndex + 1}`}
                fill
                sizes="95vw"
                className="pdp-lightbox-img"
                priority
              />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                type="button"
                className="pdp-lightbox-nav-btn pdp-lightbox-next"
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
            <div className="pdp-lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pdp-lightbox-thumb ${i === lightboxIndex ? 'active' : ''}`}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Jump to image ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={56}
                    height={75}
                    className="pdp-lightbox-thumb-img"
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
