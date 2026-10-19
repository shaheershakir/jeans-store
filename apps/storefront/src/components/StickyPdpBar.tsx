'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Product } from '@/lib/constants'

interface StickyPdpBarProps {
  product: Product
  selectedSize: string
  availableSizes?: string[]
  isNumeric?: boolean
  added?: boolean
  onAddToCart: () => void
  onBuyNow?: () => void
  // Optional backwards-compatibility props
  selectedColor?: string
  sizeOptions?: string[]
  productImage?: string
  onSizeChange?: (size: string) => void
  isAdded?: boolean
}

export default function StickyPdpBar({
  product,
  selectedSize,
  availableSizes = [],
  isNumeric = false,
  added = false,
  onAddToCart,
  onBuyNow,
  isAdded,
}: StickyPdpBarProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  const isCartAdded = added || Boolean(isAdded)

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

  const isAvailable = availableSizes.length === 0 || availableSizes.includes(selectedSize)

  return createPortal(
    <aside
      className={`pdp-sticky-bar ${visible ? 'visible' : ''}`}
      aria-hidden={!visible}
      aria-label="Sticky actions bar"
    >
      <div className="pdp-sticky-bar-inner">
        <div id="pdp-sticky-actions" className="pdp-actions-group pdp-sticky-actions-group">
          <button
            id="pdp-sticky-add-to-cart-btn"
            type="button"
            className={`pdp-add-to-cart-btn ${isCartAdded ? 'added' : ''}`}
            onClick={onAddToCart}
            disabled={!isAvailable}
          >
            {isCartAdded ? (
              <span>✓ Added to Shopping Bag</span>
            ) : (
              <>
                <span>Add to Bag — {isNumeric ? `${selectedSize}"` : selectedSize}</span>
                <span className="pdp-btn-price-tag">{product.price}</span>
              </>
            )}
          </button>

          <button
            id="pdp-sticky-buy-now-btn"
            type="button"
            className="pdp-buy-now-btn"
            onClick={onBuyNow}
            disabled={!isAvailable}
          >
            Buy Now
          </button>
        </div>
      </div>
    </aside>,
    document.body
  )
}
