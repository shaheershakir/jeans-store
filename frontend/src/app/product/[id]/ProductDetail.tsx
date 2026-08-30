'use client'

import type { MouseEvent } from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { SIZES, SWATCHES } from '@/lib/constants'
import { useCartStore, useUIStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

export default function ProductDetail({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const selectedSize = useUIStore((state) => state.selectedSize)
  const activeSwatch = useUIStore((state) => state.activeSwatch)
  const deliveryChecked = useUIStore((state) => state.deliveryChecked)
  const setSelectedSize = useUIStore((state) => state.setSelectedSize)
  const setActiveSwatch = useUIStore((state) => state.setActiveSwatch)
  const setDeliveryChecked = useUIStore((state) => state.setDeliveryChecked)
  const showToast = useUIStore((state) => state.showToast)
  const openOverlay = useUIStore((state) => state.openOverlay)

  const [added, setAdded] = useState(false)
  const [pincode, setPincode] = useState('')

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  function handleAddToCart() {
    addItem(product.id, selectedSize)
    setAdded(true)
    showToast(`Added ${product.name} (Waist ${selectedSize}") to your bag`)
    setTimeout(() => setAdded(false), 1800)
    openOverlay('cart')
  }

  function handleBuyNow() {
    addItem(product.id, selectedSize)
    openOverlay('cart')
  }

  function handleSizeGuide(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    showToast(
      'Size Guide: 28 (28" Waist) · 30 (30" Waist) · 32 (32" Waist) · 34 (34" Waist) · 36 (36" Waist)'
    )
  }

  function handlePincodeCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!pincode || pincode.trim().length < 6) {
      showToast('Please enter a valid 6-digit pincode')
      return
    }
    setDeliveryChecked(true)
    showToast(`Pincode ${pincode} verified · Express Delivery Available`)
  }

  return (
    <div className="pdp-container">
      {/* Breadcrumb Navigation */}
      <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Archive</Link>
        <span className="crumb-sep">/</span>
        <Link href="/">Denim</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{product.name}</span>
      </nav>

      <div className="pdp-layout">
        {/* Gallery Column */}
        <div className="pdp-gallery">
          <div className="pdp-image-frame main-image">
            <Image
              src={product.img}
              alt={product.name}
              width={900}
              height={1100}
              priority
              className="pdp-img"
            />
            {product.badge && <span className="pdp-badge">{product.badge}</span>}
          </div>
          {product.img2 && (
            <div className="pdp-image-frame alt-image">
              <Image
                src={product.img2}
                alt={`${product.name} alternate view`}
                width={900}
                height={1100}
                className="pdp-img"
              />
            </div>
          )}
        </div>

        {/* Product Details & Actions Column */}
        <div className="pdp-sidebar">
          <div className="pdp-meta-header">
            <span className="pdp-category-eyebrow">
              {product.fit} Cut · 14oz Shuttle Loom Denim
            </span>
            <h1 className="pdp-headline">{product.name}</h1>

            <div className="pdp-rating-row">
              <span className="pdp-stars">★★★★★</span>
              <span className="pdp-reviews-count">4.9 (126 reviews)</span>
              <span className="pdp-stock-indicator">✓ In Stock, Ready to Ship</span>
            </div>

            <div className="pdp-pricing-block">
              <span className="pdp-current-price">{product.price}</span>
              <s className="pdp-orig-price">{formatPrice(product.priceNum + 500)}</s>
              <span className="pdp-discount-pill">Special Edition</span>
            </div>
          </div>

          <p className="pdp-narrative">{product.desc}</p>

          {/* Wash Switcher */}
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

          {/* Size Picker */}
          <div className="pdp-option-section">
            <div className="option-label-row">
              <span className="option-title">
                Select Waist: <strong className="option-value">{selectedSize}&quot;</strong>
              </span>
              <a href="#size-guide" className="pdp-size-guide-link" onClick={handleSizeGuide}>
                Size Guide ↗
              </a>
            </div>
            <div className="pdp-sizes-grid">
              {SIZES.map((size) => (
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

          {/* Full Width Action CTAs */}
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
                  <span>Add to Bag — {selectedSize}&quot;</span>
                  <span className="pdp-btn-price-tag">{product.price}</span>
                </>
              )}
            </button>

            <button type="button" className="pdp-buy-now-btn" onClick={handleBuyNow}>
              Buy Now with Instant Express
            </button>
          </div>

          {/* Pincode & Delivery Checker */}
          <form className="pdp-pincode-card" onSubmit={handlePincodeCheck}>
            <div className="pincode-header">
              <span className="pincode-icon">⌖</span>
              <span className="pincode-title">Check Delivery &amp; COD Availability</span>
            </div>
            <div className="pincode-input-row">
              <input
                type="text"
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="pincode-field"
              />
              <button type="submit" className="pincode-submit-btn">
                Check
              </button>
            </div>
            {deliveryChecked ? (
              <div className="pincode-success-msg">
                <span className="check-icon">✓</span>
                <span>Express 2–4 Day Delivery &amp; COD available for this area</span>
              </div>
            ) : (
              <p className="pincode-note">Orders dispatched within 24 hours from Mumbai facility.</p>
            )}
          </form>

          {/* Collapsible Accordions */}
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
    </div>
  )
}
