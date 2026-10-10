'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/constants'
import { SIZES, SWATCHES } from '@/lib/constants'
import { useCartStore, useUIStore } from '@/lib/store'
import SizeGuideModal from '@/components/SizeGuideModal'
import ProductReviews from '@/components/ProductReviews'
import RelatedProducts from '@/components/RelatedProducts'
import StickyPdpBar from '@/components/StickyPdpBar'

// Map category ID → breadcrumb label + route
const CATEGORY_META: Record<string, { label: string; href: string }> = {
  jeans: { label: 'Denim', href: '/shop/jeans' },
  'jeans-fit': { label: 'Denim', href: '/shop/jeans' },
  tops: { label: 'Tops & T-Shirts', href: '/shop/tops' },
  't-shirts': { label: 'Tops & T-Shirts', href: '/shop/tops' },
  shirts: { label: 'Shirts', href: '/shop/shirts' },
  hoodies: { label: 'Hoodies', href: '/shop/hoodies' },
  hats: { label: 'Accessories', href: '/shop/accessories' },
  accessories: { label: 'Accessories', href: '/shop/accessories' },
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

  // Build image list — main + alternate
  const images = [product.img, product.img2].filter(Boolean) as string[]
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)

  const catMeta =
    (product.category ? CATEGORY_META[product.category] : null) ??
    (product.fit ? CATEGORY_META['jeans'] : null) ??
    { label: 'All Garments', href: '/shop' }

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    if (!availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0] || '32')
    }
  }, [availableSizes, selectedSize, setSelectedSize])

  // Arrow navigation on gallery
  const prevImg = useCallback(() => {
    setActiveImg((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const nextImg = useCallback(() => {
    setActiveImg((i) => (i + 1) % images.length)
  }, [images.length])

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
        {/* ── Gallery Column ── */}
        <div className="pdp-gallery">
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="pdp-thumb-strip" aria-label="Product images">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pdp-thumb-btn ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === activeImg}
                >
                  <Image
                    src={src}
                    alt={`${product.name} view ${i + 1}`}
                    width={80}
                    height={100}
                    className="pdp-thumb-img"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main image + arrow nav */}
          <div className="pdp-main-img-wrap">
            {images.map((src, i) => (
              <div
                key={i}
                className={`pdp-main-img-slide ${i === activeImg ? 'active' : ''}`}
                aria-hidden={i !== activeImg}
              >
                <Image
                  src={src}
                  alt={i === 0 ? product.name : `${product.name} alternate view`}
                  width={900}
                  height={1100}
                  priority={i === 0}
                  className="pdp-img"
                />
              </div>
            ))}

            {product.badge && (
              <span className="pdp-badge">{product.badge}</span>
            )}

            {/* Arrow navigation — only shown when more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="pdp-img-arrow pdp-img-prev"
                  aria-label="Previous image"
                  onClick={prevImg}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="pdp-img-arrow pdp-img-next"
                  aria-label="Next image"
                  onClick={nextImg}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Dot indicators */}
                <div className="pdp-img-dots" aria-label="Image navigation">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`pdp-img-dot ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Go to image ${i + 1}`}
                      aria-pressed={i === activeImg}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
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

          {/* Wash Switcher (for Denim) */}
          {(product.wash || product.category === 'jeans') && (
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
              <a href="#size-guide" className="pdp-size-guide-link" onClick={handleSizeGuide}>
                Size Guide ↗
              </a>
            </div>
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
    </div>
  )
}
