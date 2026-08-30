'use client'

import type { MouseEvent } from 'react'
import { useEffect } from 'react'
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

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  function handleAddToCart() {
    addItem(product.id, selectedSize)
    showToast(`Added ${product.name} (Size ${selectedSize}) to your bag`)
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

  function handlePincodeCheck() {
    setDeliveryChecked(true)
    showToast('Pincode verified · Express Shipping Available')
  }

  return (
    <>
      <div className="crumb">
        <Link href="/">Home</Link> / <Link href="/">Jeans</Link> / <b>{product.name}</b>
      </div>
      <div className="pdp">
        <div className="gallery">
          <Image
            src={product.img}
            alt={product.name}
            width={800}
            height={1000}
            priority
            style={{ objectFit: 'cover' }}
          />
          <Image
            src={product.img2}
            alt={`${product.name} details`}
            width={800}
            height={1000}
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="product-info">
          <p className="eyebrow">
            {product.fit} fit / {product.wash}
          </p>
          <h1>{product.name}</h1>
          <div className="rating">
            ★★★★★ <u>4.8 / 126 reviews</u>
          </div>
          <div className="price">
            {product.price} <s>{formatPrice(product.priceNum + 500)}</s> <span>23% off</span>
          </div>
          <p className="product-description">{product.desc}</p>
          <div className="wash-row">
            <span>
              Wash: <b className="wash-name">{SWATCHES[activeSwatch].name}</b>
            </span>
            {SWATCHES.map((swatch, index) => (
              <button
                key={swatch.name}
                type="button"
                className={`swatch ${swatch.className}${index === activeSwatch ? ' active' : ''}`}
                title={swatch.name}
                onClick={() => setActiveSwatch(index)}
              />
            ))}
          </div>
          <div className="size-row">
            <span>
              Choose size{' '}
              <a href="#size-guide" className="size-guide-btn" onClick={handleSizeGuide}>
                Size guide ↗
              </a>
            </span>
            <div>
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={size === selectedSize ? 'selected' : undefined}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="add-cart" onClick={handleAddToCart}>
            Add to bag <span className="pdp-btn-price">{product.price}</span>
          </button>
          <button type="button" className="buy-now" onClick={handleBuyNow}>
            Buy it now
          </button>
          <div className="delivery">
            <span>⌖</span>
            <div>
              <b>Delivering to India</b>
              <p>
                {deliveryChecked ? (
                  <span style={{ color: '#2e663b' }}>
                    ✓ Express Delivery available in 2-4 days (COD verified)
                  </span>
                ) : (
                  'Enter pincode to check delivery options'
                )}
              </p>
            </div>
            <button type="button" onClick={handlePincodeCheck}>
              Check
            </button>
          </div>
          <details open>
            <summary>
              Details &amp; fit <b>+</b>
            </summary>
            <p className="pdp-details-text">
              100% cotton · 13.5 oz raw denim · Mid rise · Structured through hip and leg · Tested for
              everyday mobility.
            </p>
          </details>
          <details>
            <summary>
              Shipping &amp; returns <b>+</b>
            </summary>
            <p>
              Free shipping on orders above ₹1,499. Easy 7-day doorstep exchange and hassle-free
              returns. Cash on Delivery available across 25,000+ pincodes.
            </p>
          </details>
        </div>
      </div>
    </>
  )
}
