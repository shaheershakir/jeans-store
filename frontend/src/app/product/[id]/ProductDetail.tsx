'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Maximize2, X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { Product } from '@/lib/constants'
import { SIZES, SWATCHES } from '@/lib/constants'
import { useCartStore, useUIStore, usePreferencesStore } from '@/lib/store'
import SizeGuideModal from '@/components/SizeGuideModal'
import ProductReviews from '@/components/ProductReviews'
import RelatedProducts from '@/components/RelatedProducts'
import StickyPdpBar from '@/components/StickyPdpBar'

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
  't-shirts': { label: 'T-Shirts', href: '/shop' },
}

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)
  const selectedSize = useUIStore((state) => state.selectedSize)
  const activeSwatch = useUIStore((state) => state.activeSwatch)
  const setSelectedSize = useUIStore((state) => state.setSelectedSize)
  const setActiveSwatch = useUIStore((state) => state.setActiveSwatch)
  const showToast = useUIStore((state) => state.showToast)
  const openOverlay = useUIStore((state) => state.openOverlay)

  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : SIZES
  const isNumeric = availableSizes.every((s) => /^\d+$/.test(s))

  // Build image list — from images array or fallback [img, img2]
  const images = (product.images && product.images.length > 0
    ? product.images
    : [product.img, product.img2]
  ).filter(Boolean) as string[]

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [added, setAdded] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)

  const catMeta =
    (product.category ? CATEGORY_META[product.category] : null) ??
    { label: 'All Garments', href: '/shop' }

  const preferences = usePreferencesStore((state) => state.preferences)
  const getRecommendedSize = usePreferencesStore((state) => state.getRecommendedSize)

  useEffect(() => {
    let isMounted = true
    const hydrateAndSelect = async () => {
      await Promise.all([
        useUIStore.persist.rehydrate(),
        useCartStore.persist.rehydrate(),
        usePreferencesStore.persist.rehydrate()
      ])
      if (isMounted) {
        // Auto-select preferred size from user's Fit & Size Profile
        const recommended = usePreferencesStore.getState().getRecommendedSize(availableSizes, product.category)
        setSelectedSize(recommended)
      }
    }
    void hydrateAndSelect()
    return () => {
      isMounted = false
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
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0))
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0))
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

  function handleAddToCart() {
    addItem(product.id, selectedSize)
    setAdded(true)
    showToast(`Added ${product.name} (${isNumeric ? `Waist ${selectedSize}"` : `Size ${selectedSize}`}) to your bag`)
    setTimeout(() => setAdded(false), 1800)
    openOverlay('cart')
  }

  function handleBuyNow() {
    addItem(product.id, selectedSize)
    router.push('/checkout')
  }

  function handleSizeGuide(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setIsSizeGuideOpen(true)
  }

  return (
    <div className="pdp-container">
      {/* ── Breadcrumb ── */}
      <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="pdp-crumb-link">Home</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <Link href="/shop" className="pdp-crumb-link">Shop</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <Link href={catMeta.href} className="pdp-crumb-link">{catMeta.label}</Link>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="crumb-current">{product.name}</span>
      </nav>

      <div className="pdp-layout">
        {/* ── 2-Column Product Gallery Grid ── */}
        <div className="pdp-gallery-grid" aria-label="Product image gallery">
          {images.map((src, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className={`pdp-gallery-card ${images.length === 1 ? 'single-span' : ''}`}
              onClick={() => openLightbox(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openLightbox(i)
                }
              }}
              aria-label={`View enlarged ${product.name} image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${product.name} angle ${i + 1}`}
                width={800}
                height={1067}
                priority={i < 2}
                className="pdp-gallery-card-img"
              />

              {i === 0 && product.badge && (
                <span className="pdp-badge">{product.badge}</span>
              )}

              {/* Corner Expand Action Button */}
              <button
                type="button"
                className="pdp-expand-badge"
                onClick={(e) => {
                  e.stopPropagation()
                  openLightbox(i)
                }}
                title="Click to view full image"
                aria-label={`Expand view of image ${i + 1}`}
              >
                <Maximize2 className="w-3.5 h-3.5 text-zinc-700" />
              </button>
            </div>
          ))}
        </div>

        {/* ── Product Details & Actions Column ── */}
        <div className="pdp-sidebar">
          <div className="pdp-meta-header">
            <span className="pdp-category-eyebrow">
              {product.fit
                ? `${product.fit} Cut · 14oz Shuttle Loom Denim`
                : (product.category?.toUpperCase() ?? 'WARDROBE ESSENTIAL')}
            </span>
            <h1 className="pdp-headline">{product.name}</h1>

            <div className="pdp-stock-row">
              <span className="pdp-stock-indicator">In Stock, Ready to Ship</span>
            </div>

            <div className="pdp-pricing-block">
              <span className="pdp-current-price">{product.price}</span>
            </div>
          </div>

          <p className="pdp-narrative">{product.desc}</p>

          {/* Colorway / Wash Switcher */}
          {Boolean(product.wash) && (
            <div className="pdp-option-section">
              <div className="option-label-row">
                <span className="option-title">
                  Wash: <strong className="option-value">{SWATCHES[activeSwatch]?.name || product.wash}</strong>
                </span>
              </div>
              <div className="swatches-row">
                {SWATCHES.map((swatch, index) => (
                  <button
                    key={swatch.name}
                    type="button"
                    className={`pdp-swatch-circle ${swatch.className} ${index === activeSwatch ? 'active' : ''}`}
                    title={swatch.name}
                    onClick={() => setActiveSwatch(index)}
                    aria-label={`Select ${swatch.name} wash`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Picker */}
          <div className="pdp-option-section">
            <div className="option-label-row">
              <span className="option-title">
                Select {isNumeric ? 'Waist' : 'Size'}:{' '}
                <strong className="option-value">{selectedSize}{isNumeric ? '"' : ''}</strong>
              </span>
              <div className="flex items-center gap-3">
                <Link href="/profile?tab=preferences" className="pdp-size-guide-link !text-zinc-500 hover:!text-black">
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
                  Auto-selected from your <strong>Fit &amp; Size Profile</strong> ({isNumeric ? `Waist ${preferences.waistSize}"` : `Size ${preferences.topSize}`})
                </span>
              </div>
            )}

            <div className="pdp-sizes-grid">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`pdp-size-cell ${size === selectedSize ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                  aria-label={`Select size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="pdp-actions-group">
            <button
              type="button"
              className={`pdp-add-to-cart-btn ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
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

            <button type="button" className="pdp-buy-now-btn" onClick={handleBuyNow}>
              Buy Now with Instant Express
            </button>
          </div>

          {/* Delivery info */}
          <div className="pdp-delivery-card">
            <div className="delivery-card-header">
              <span className="delivery-icon">✦</span>
              <span className="delivery-title">Delivery and Dispatch</span>
            </div>
            <p className="delivery-detail">
              Orders dispatch within 24 hours from our Mumbai facility. Standard transit takes 2 to 4 business days across India. Free shipping on all orders above ₹1,499.
            </p>
          </div>

          {/* Accordions */}
          <div className="pdp-accordions">
            <details className="pdp-details-item" open>
              <summary className="pdp-summary">
                <span>Material &amp; Construction</span>
                <span className="summary-indicator">+</span>
              </summary>
              <div className="pdp-details-body">
                <p>
                  100% long-staple Indian cotton ring-spun yarn. 13.8 oz rigid denim with a subtle crosshatch grain. Custom copper hardware, zip fly, and reinforced bar tacks at all stress points.
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
                  Wash inside out in cold water using mild detergent. Hang dry in shade. Avoid machine drying to preserve natural indigo patina and shape memory.
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
        </div>
      </div>
      
      {/* ── Community Ratings & Customer Reviews ── */}
      <ProductReviews productId={product.id} productName={product.name} />

      {/* ── Curated Recommendations / Complete the Fit ── */}
      <RelatedProducts currentProduct={product} />

      {/* ── Sticky Quick-Order Bar on Scroll ── */}
      <StickyPdpBar
        product={product}
        selectedSize={selectedSize}
        onSizeChange={(sz) => setSelectedSize(sz)}
        onAddToCart={handleAddToCart}
        isAdded={added}
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
          <div
            className="pdp-lightbox-stage"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            {images.length > 1 && (
              <button
                type="button"
                className="pdp-lightbox-nav-btn pdp-lightbox-prev"
                onClick={() => setLightboxIndex((prev) => (prev! - 1 + images.length) % images.length)}
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
                onClick={() => setLightboxIndex((prev) => (prev! + 1) % images.length)}
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
