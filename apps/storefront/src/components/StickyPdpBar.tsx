'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import type { Product } from '@/lib/constants'
import { getAvailableProductSizes, getProductSizeOptions } from '@/lib/products'

interface StickyPdpBarProps {
  product: Product
  selectedColor?: string
  selectedSize: string
  sizeOptions?: string[]
  availableSizes?: string[]
  productImage?: string
  onSizeChange: (size: string) => void
  onAddToCart: () => void
  isAdded: boolean
}

export default function StickyPdpBar({
  product,
  selectedColor,
  selectedSize,
  sizeOptions,
  availableSizes: propAvailableSizes,
  productImage,
  onSizeChange,
  onAddToCart,
  isAdded,
}: StickyPdpBarProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  const rawSizes = useMemo(
    () => (sizeOptions && sizeOptions.length > 0 ? sizeOptions : getProductSizeOptions(product)),
    [sizeOptions, product]
  )
  const availableSizes = useMemo(
    () =>
      propAvailableSizes && propAvailableSizes.length > 0
        ? propAvailableSizes
        : getAvailableProductSizes(product),
    [propAvailableSizes, product]
  )
  const isNumeric = rawSizes.length > 0 && rawSizes.every((size) => /^\d+$/.test(size))

  // Ensure portal only mounts on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const getTarget = () =>
      document.getElementById('pdp-buy-now-btn') ||
      document.getElementById('pdp-main-actions') ||
      document.querySelector('.pdp-actions-group')

    let target = getTarget()

    const checkVisibility = () => {
      if (!target) {
        target = getTarget()
      }
      if (!target) return

      const rect = target.getBoundingClientRect()
      // Sticky bar should stick to the bottom when the user has scrolled PAST the Buy Now button.
      // Account for the sticky header (~72px height)
      const isPast = rect.bottom <= 72
      setVisible(isPast)
    }

    // Initial check
    checkVisibility()

    let rafId: number
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(checkVisibility)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    let observer: IntersectionObserver | null = null
    if (target) {
      observer = new IntersectionObserver(
        () => {
          checkVisibility()
        },
        {
          rootMargin: '-72px 0px 0px 0px',
          threshold: [0, 1],
        }
      )
      observer.observe(target)
    }

    return () => {
      if (observer) observer.disconnect()
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [mounted])

  if (!mounted) return null

  const imageSrc = productImage || product.img || product.images?.[0] || '/icon.svg'
  const variantText = selectedColor || product.color || product.wash || product.fit || 'Regular'

  return createPortal(
    <aside
      className={`apple-sticky-bar ${visible ? 'visible' : ''}`}
      aria-hidden={!visible}
      aria-label="Quick order bar"
    >
      <div className="apple-sticky-inner">
        {/* Left: Product Thumbnail & Meta */}
        <div className="apple-sticky-product">
          <div className="apple-sticky-thumb">
            <Image
              src={imageSrc}
              alt={product.name}
              width={44}
              height={44}
              className="apple-sticky-img"
              priority={false}
            />
          </div>
          <div className="apple-sticky-info">
            <h4 className="apple-sticky-title" title={product.name}>
              {product.name}
            </h4>
            <p className="apple-sticky-meta">
              <span className="apple-sticky-price">{product.price}</span>
              <span className="apple-sticky-dot">·</span>
              <span className="apple-sticky-variant">{variantText}</span>
            </p>
          </div>
        </div>

        {/* Right: Size Switcher & Quick Add Pill */}
        <div className="apple-sticky-actions">
          {rawSizes.length > 0 && (
            <div className="apple-sticky-size-pill-group">
              <span className="apple-sticky-size-label">Size:</span>
              <div className="apple-sticky-sizes" role="group" aria-label="Select size">
                {rawSizes.map((size) => {
                  const isAvailable = availableSizes.includes(size)
                  const isSelected = selectedSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`apple-sticky-size-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => onSizeChange(size)}
                      disabled={!isAvailable}
                      aria-label={isAvailable ? `Select size ${size}` : `Size ${size} is out of stock`}
                      aria-pressed={isSelected}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <button
            id="pdp-sticky-add-to-cart-btn"
            type="button"
            className={`apple-sticky-buy-btn ${isAdded ? 'added' : ''}`}
            onClick={onAddToCart}
            disabled={!availableSizes.includes(selectedSize)}
            aria-label={`Add ${product.name} size ${selectedSize} to bag`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 stroke-[2]" />
                <span>
                  Add to Bag — {selectedSize ? (isNumeric ? `${selectedSize}"` : selectedSize) : 'Select Size'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>,
    document.body
  )
}
