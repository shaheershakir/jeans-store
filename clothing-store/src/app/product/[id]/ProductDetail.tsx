'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ClothingProduct } from '@/lib/types'
import {
  useCartStore,
  useUIStore,
  useRecentlyViewedStore
} from '@/lib/store'
import ProductCard from '@/components/ProductCard'

export default function ProductDetail({
  product,
  relatedProducts
}: {
  product: ClothingProduct
  relatedProducts: ClothingProduct[]
}) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useUIStore((state) => state.openCart)
  const openSizeGuide = useUIStore((state) => state.openSizeGuide)
  const showToast = useUIStore((state) => state.showToast)
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addViewed)
  const viewedIds = useRecentlyViewedStore((state) => state.viewedIds)

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Selection states
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '')
  // Default to first available size
  const defaultSize =
    product.sizes.find((s) => s.status !== 'out_of_stock')?.size || product.sizes[0]?.size || 'M'
  const [selectedSize, setSelectedSize] = useState(defaultSize)

  // Button state
  const [added, setAdded] = useState(false)

  // Sticky CTA visibility on scroll
  const [showStickyBar, setShowStickyBar] = useState(false)
  const mainCtaRef = useRef<HTMLDivElement>(null)

  // Review filter state
  const [reviewFilter, setReviewFilter] = useState<'all' | 'photos' | 'verified' | 'true-to-size'>('all')

  useEffect(() => {
    // Rehydrate stores safely
    void useCartStore.persist.rehydrate()
    void useRecentlyViewedStore.persist.rehydrate()

    addRecentlyViewed(product.id)

    // IntersectionObserver to show mobile sticky bar when main CTA scrolls out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When main CTA is NOT intersecting and is above the viewport, show sticky bar
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0.1 }
    )

    if (mainCtaRef.current) {
      observer.observe(mainCtaRef.current)
    }

    return () => observer.disconnect()
  }, [product.id, addRecentlyViewed])

  // Current selected size metadata
  const currentSizeOption = product.sizes.find((s) => s.size === selectedSize)
  const isOutOfStock = currentSizeOption?.status === 'out_of_stock'
  const isLowStock = currentSizeOption?.status === 'low_stock'

  function handleColorSelect(colorName: string, imageIndex?: number) {
    setSelectedColor(colorName)
    if (typeof imageIndex === 'number' && product.gallery[imageIndex]) {
      setActiveImageIndex(imageIndex)
    }
  }

  function handleAddToCart() {
    if (isOutOfStock) return
    addItem(product, selectedSize, selectedColor)
    setAdded(true)
    showToast(`Added ${product.name} (${selectedSize} · ${selectedColor}) to your bag`)
    setTimeout(() => setAdded(false), 2000)
    openCart()
  }

  function handleBuyNow() {
    if (isOutOfStock) return
    addItem(product, selectedSize, selectedColor)
    router.push('/checkout')
  }

  function handlePrevImage() {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.gallery.length - 1))
  }

  function handleNextImage() {
    setActiveImageIndex((prev) => (prev < product.gallery.length - 1 ? prev + 1 : 0))
  }

  function scrollToReviews() {
    const el = document.getElementById('reviews-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  // Filtered reviews
  const filteredReviews = product.reviews.filter((r) => {
    if (reviewFilter === 'photos') return !!r.photoUrl
    if (reviewFilter === 'verified') return r.verified
    if (reviewFilter === 'true-to-size') return r.fitFeedback === 'True to Size'
    return true
  })

  return (
    <div className="pdp-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Collection</Link>
          <span className="breadcrumb-sep">/</span>
          <Link href={`/?category=${product.category}`}>
            {product.category.toUpperCase()}
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Above The Fold: Gallery & Info Grid */}
        <div className="pdp-main-grid">
          {/* Column 1: Image Gallery */}
          <div className="gallery-wrapper">
            <div className="gallery-carousel-viewport">
              {product.badge && (
                <span className="gallery-badge">{product.badge}</span>
              )}

              {/* Mobile slide counter pill */}
              <span className="gallery-counter-pill">
                {activeImageIndex + 1} / {product.gallery.length}
              </span>

              {/* Carousel Track */}
              <div
                className="gallery-carousel-track"
                style={{
                  transform: `translateX(-${activeImageIndex * 100}%)`
                }}
              >
                {product.gallery.map((item, idx) => (
                  <div key={item.id} className="gallery-slide">
                    <Image
                      src={item.url}
                      alt={item.alt}
                      width={900}
                      height={1125}
                      priority={idx === 0}
                      sizes="(max-width: 768px) 100vw, 55vw"
                    />
                  </div>
                ))}
              </div>

              {/* Prev / Next Arrows */}
              <button
                type="button"
                className="gallery-nav-arrow prev"
                onClick={handlePrevImage}
                aria-label="Previous product image"
              >
                ‹
              </button>
              <button
                type="button"
                className="gallery-nav-arrow next"
                onClick={handleNextImage}
                aria-label="Next product image"
              >
                ›
              </button>
            </div>

            {/* Thumbnails Navigation Row */}
            <div className="gallery-thumbnails">
              {product.gallery.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`gallery-thumb-btn ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`View ${item.label} shot`}
                >
                  <Image
                    src={item.url}
                    alt={item.alt}
                    width={72}
                    height={90}
                  />
                  <span className="gallery-thumb-tag">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Product Info & Purchase Controls */}
          <div className="pdp-info-sidebar">
            <div>
              <span className="pdp-eyebrow">
                {product.category.toUpperCase()} · {product.fit.toUpperCase()}
              </span>
              <h1 className="pdp-title">{product.name}</h1>
            </div>

            {/* Rating & Reviews Bar */}
            <div
              className="pdp-reviews-row"
              onClick={scrollToReviews}
              role="button"
              tabIndex={0}
            >
              <div className="stars-row" aria-label={`Rating ${product.reviewsSummary.rating} out of 5`}>
                {'★★★★★'}
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {product.reviewsSummary.rating}
              </span>
              <span className="pdp-reviews-count">
                ({product.reviewsSummary.reviewCount} Reviews)
              </span>
              <span className="pdp-reviews-recommend">
                {product.reviewsSummary.recommendPercentage}% Recommend
              </span>
            </div>

            {/* Price Block */}
            <div className="pdp-price-box">
              <span className="pdp-current-price">{product.price}</span>
              {product.originalPrice && (
                <span className="pdp-original-price">
                  {product.originalPrice}
                </span>
              )}
              {product.originalPrice && (
                <span className="pdp-discount-pill">33% OFF</span>
              )}
              <span className="pdp-tax-note">
                MRP inclusive of all taxes · Free delivery eligible
              </span>
            </div>

            {/* Single Sentence Key Selling Point Highlight */}
            <div className="pdp-benefit-box">
              <span>{product.sellingPoint}</span>
            </div>

            {/* Color Swatch Selector */}
            <div className="pdp-option-group">
              <div className="pdp-option-header">
                <span className="pdp-option-label">
                  Color:
                  <strong className="pdp-option-active-name">{selectedColor}</strong>
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {product.colors.length} Available
                </span>
              </div>
              <div className="pdp-swatches-grid">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={`pdp-swatch-item ${c.name === selectedColor ? 'active' : ''}`}
                    onClick={() => handleColorSelect(c.name, c.imageIndex)}
                    title={c.name}
                    aria-label={`Select ${c.name}`}
                  >
                    <span
                      className="pdp-swatch-color"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector with Stock Statuses */}
            <div className="pdp-option-group">
              <div className="pdp-option-header">
                <span className="pdp-option-label">
                  Select Size:
                  <strong className="pdp-option-active-name">{selectedSize}</strong>
                </span>
                <button
                  type="button"
                  className="pdp-size-guide-btn"
                  onClick={openSizeGuide}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="10" rx="2" />
                    <line x1="6" y1="7" x2="6" y2="11" />
                    <line x1="10" y1="7" x2="10" y2="13" />
                    <line x1="14" y1="7" x2="14" y2="11" />
                    <line x1="18" y1="7" x2="18" y2="13" />
                  </svg>
                  Size Guide ↗
                </button>
              </div>

              <div className="pdp-sizes-grid">
                {product.sizes.map((s) => {
                  const isCurrent = s.size === selectedSize
                  const isOut = s.status === 'out_of_stock'
                  const isLow = s.status === 'low_stock'

                  return (
                    <button
                      key={s.size}
                      type="button"
                      disabled={isOut}
                      className={`pdp-size-tile ${isCurrent ? 'active' : ''} ${isLow ? 'low-stock' : ''} ${isOut ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedSize(s.size)}
                      aria-label={`Size ${s.size} ${isLow ? '(Low Stock)' : ''} ${isOut ? '(Out of Stock)' : ''}`}
                    >
                      <span>{s.size}</span>
                      {isLow && (
                        <span className="size-low-badge">
                          {s.stockCount ? `${s.stockCount} left` : 'Low'}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stock Availability Callout */}
            {isOutOfStock ? (
              <div className="pdp-stock-status low">
                <span className="stock-indicator-dot" />
                <span>Size {selectedSize} is currently sold out · Back in stock soon</span>
              </div>
            ) : isLowStock ? (
              <div className="pdp-stock-status low">
                <span className="stock-indicator-dot" />
                <span>
                  🔥 Only {currentSizeOption?.stockCount || 2} units left in Size {selectedSize} — order soon
                </span>
              </div>
            ) : (
              <div className="pdp-stock-status">
                <span className="stock-indicator-dot" />
                <span>In Stock · Ready to dispatch from Mumbai within 24 hours</span>
              </div>
            )}

            {/* Primary & Secondary Action CTAs */}
            <div ref={mainCtaRef} className="pdp-actions-group">
              <button
                type="button"
                disabled={isOutOfStock}
                className={`btn-add-to-cart ${added ? 'added' : ''}`}
                onClick={handleAddToCart}
              >
                {added ? (
                  <span>✓ Added to Shopping Bag</span>
                ) : isOutOfStock ? (
                  <span>Out of Stock</span>
                ) : (
                  <>
                    <span>Add to Bag — Size {selectedSize}</span>
                    <span style={{ opacity: 0.75 }}>•</span>
                    <span>{product.price}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                className="btn-buy-now"
                onClick={handleBuyNow}
              >
                Instant Express Checkout
              </button>
            </div>

            {/* 3-Point Trust Signals Row */}
            <div className="trust-signals-row">
              <div className="trust-signal-item">
                <span className="trust-signal-icon">🚚</span>
                <div className="trust-signal-text">
                  <span className="trust-signal-title">Free Express Delivery</span>
                  <span className="trust-signal-sub">Orders above ₹999</span>
                </div>
              </div>

              <div className="trust-signal-item">
                <span className="trust-signal-icon">🔄</span>
                <div className="trust-signal-text">
                  <span className="trust-signal-title">7-Day Doorstep Returns</span>
                  <span className="trust-signal-sub">Instant size exchange</span>
                </div>
              </div>

              <div className="trust-signal-item">
                <span className="trust-signal-icon">🔒</span>
                <div className="trust-signal-text">
                  <span className="trust-signal-title">Encrypted Checkout</span>
                  <span className="trust-signal-sub">100% secure payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Below The Fold Sections */}
        <div className="pdp-below-fold">
          {/* Section 1: Product Narrative & Craft Story */}
          <section>
            <div className="section-header">
              <span className="section-eyebrow">Design &amp; Materiality</span>
              <h2 className="section-title">The Engineering Behind The Piece</h2>
            </div>
            <div className="description-grid">
              <p className="description-lead">{product.desc}</p>
              <p className="description-story">{product.detailsStory}</p>
            </div>
          </section>

          {/* Section 2: Specifications Table */}
          <section>
            <div className="section-header">
              <span className="section-eyebrow">Technical Blueprint</span>
              <h2 className="section-title">Garment Specifications</h2>
            </div>
            <div className="specs-table-wrapper">
              <div className="specs-grid">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="spec-cell">
                    <span className="spec-label">{spec.label}</span>
                    <span className="spec-value">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Fit Guide & Model Measurements */}
          <section>
            <div className="section-header">
              <span className="section-eyebrow">Silhouette &amp; Fit Confidence</span>
              <h2 className="section-title">How It Fits</h2>
            </div>
            <div className="fit-guide-card">
              <div className="fit-spectrum">
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Silhouette Spectrum
                </span>
                <div className="fit-spectrum-bar">
                  <div className="fit-spectrum-fill" />
                </div>
                <div className="fit-labels-row">
                  <span>Tight</span>
                  <span>Slim</span>
                  <span>Regular</span>
                  <span className="active-fit">Relaxed / Boxy</span>
                  <span>Oversized</span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Cut with wide chest volume, dropped shoulder seams, and relaxed sleeve openings for an effortless contemporary drape.
                </p>
              </div>

              <div className="model-stats-box">
                <span className="model-stats-title">Model Measurements</span>
                <div className="model-stats-grid">
                  <div className="model-stat-pill">
                    Height: <strong>{product.modelInfo.height}</strong>
                  </div>
                  <div className="model-stat-pill">
                    Weight: <strong>{product.modelInfo.weight}</strong>
                  </div>
                  {product.modelInfo.chest && (
                    <div className="model-stat-pill">
                      Chest: <strong>{product.modelInfo.chest}</strong>
                    </div>
                  )}
                  <div className="model-stat-pill">
                    Wearing Size: <strong>{product.modelInfo.sizeWorn}</strong>
                  </div>
                </div>
                <p className="model-fit-advice">{product.modelInfo.fitNote}</p>
              </div>
            </div>
          </section>

          {/* Section 4: Customer Reviews */}
          <section id="reviews-section">
            <div className="section-header">
              <span className="section-eyebrow">Social Proof &amp; Feedback</span>
              <h2 className="section-title">Verified Customer Reviews</h2>
            </div>

            <div className="reviews-container">
              {/* Rating Distribution Card */}
              <div className="reviews-summary-card">
                <div className="rating-score-box">
                  <span className="rating-big-number">
                    {product.reviewsSummary.rating}
                  </span>
                  <div className="rating-stars-large">{'★★★★★'}</div>
                  <span className="rating-subtext">
                    Based on {product.reviewsSummary.reviewCount} customer ratings
                  </span>
                </div>

                <div className="rating-bars-list">
                  {product.reviewsSummary.distribution.map((dist) => (
                    <div key={dist.stars} className="rating-bar-row">
                      <span className="bar-star-label">{dist.stars} Star</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                      <span className="bar-percentage">{dist.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Filter Pills */}
              <div className="reviews-filter-row">
                <button
                  type="button"
                  className={`review-filter-chip ${reviewFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('all')}
                >
                  All ({product.reviews.length})
                </button>
                <button
                  type="button"
                  className={`review-filter-chip ${reviewFilter === 'photos' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('photos')}
                >
                  With Photos
                </button>
                <button
                  type="button"
                  className={`review-filter-chip ${reviewFilter === 'verified' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('verified')}
                >
                  Verified Buyers
                </button>
                <button
                  type="button"
                  className={`review-filter-chip ${reviewFilter === 'true-to-size' ? 'active' : ''}`}
                  onClick={() => setReviewFilter('true-to-size')}
                >
                  Fit: True to Size
                </button>
              </div>

              {/* Reviews Grid */}
              <div className="reviews-grid">
                {filteredReviews.map((rev) => (
                  <div key={rev.id} className="review-card">
                    <div className="review-card-header">
                      <div className="review-author-info">
                        <span className="review-author-name">
                          {rev.author}
                          {rev.verified && (
                            <span className="verified-badge">✓ Verified Buyer</span>
                          )}
                        </span>
                        <span className="review-meta">
                          {rev.location ? `${rev.location} · ` : ''}{rev.date}
                        </span>
                      </div>
                      <div className="review-stars">
                        {'★'.repeat(rev.rating)}
                      </div>
                    </div>

                    <div className="review-badges-row">
                      <span className="review-chip">Size: {rev.sizePurchased}</span>
                      <span className="review-chip">{rev.fitFeedback}</span>
                    </div>

                    <h3 className="review-title">{rev.title}</h3>
                    <p className="review-comment">{rev.comment}</p>

                    {rev.photoUrl && (
                      <Image
                        src={rev.photoUrl}
                        alt="Customer review photo"
                        width={68}
                        height={68}
                        className="review-photo-thumb"
                      />
                    )}

                    <div className="review-helpful-action">
                      <span>Was this helpful?</span>
                      <button
                        type="button"
                        className="review-helpful-btn"
                        onClick={() => showToast('Thank you for your feedback')}
                      >
                        Yes ({rev.helpfulCount})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Frequently Asked Questions (FAQ) */}
          {product.faqs.length > 0 && (
            <section>
              <div className="section-header">
                <span className="section-eyebrow">Assistance &amp; Clarity</span>
                <h2 className="section-title">Frequently Asked Questions</h2>
              </div>
              <div className="faq-list">
                {product.faqs.map((faq, idx) => (
                  <details
                    key={faq.question}
                    className="faq-item"
                    open={idx === 0}
                  >
                    <summary className="faq-summary">
                      <span>{faq.question}</span>
                      <span className="faq-indicator">+</span>
                    </summary>
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Section 6: Related & Recommended Products */}
          {relatedProducts.length > 0 && (
            <section>
              <div className="section-header">
                <span className="section-eyebrow">Pair It With</span>
                <h2 className="section-title">Recommended Layering Pieces</h2>
              </div>
              <div className="related-grid">
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} product={rel} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Purchase Bar */}
      <div className={`mobile-sticky-bar ${showStickyBar ? 'visible' : ''}`}>
        <div className="sticky-bar-info">
          <Image
            src={product.img}
            alt={product.name}
            width={44}
            height={44}
            className="sticky-bar-thumb"
          />
          <div className="sticky-bar-details">
            <span className="sticky-bar-name">{product.name}</span>
            <div className="sticky-bar-price-row">
              <span className="sticky-bar-price">{product.price}</span>
              <span className="sticky-bar-size-label">Size: {selectedSize}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          className={`sticky-bar-btn ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
        >
          {added ? '✓ Added' : isOutOfStock ? 'Sold Out' : 'Add to Bag'}
        </button>
      </div>
    </div>
  )
}
