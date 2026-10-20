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
      document.querySelector('[data-pdp-actions]')

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
      className={`fixed inset-x-0 bottom-0 z-[90] border-t border-black/[0.08] bg-white/[0.96] px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-[20px] backdrop-saturate-[1.8] transition-[transform,opacity,visibility] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] max-[640px]:px-4 max-[640px]:pt-2.5 max-[640px]:pb-[calc(10px+env(safe-area-inset-bottom,0px))] ${
        visible ? 'visible translate-y-0 opacity-100' : 'invisible pointer-events-none translate-y-[105%] opacity-0'
      }`}
      aria-hidden={!visible}
      aria-label="Sticky actions bar"
    >
      <div className="mx-auto w-full max-w-[640px]">
        <div
          id="pdp-sticky-actions"
          className="m-0 grid w-full grid-cols-[1.25fr_1fr] gap-3 max-[640px]:grid-cols-[1.2fr_1fr] max-[640px]:gap-2"
        >
          <button
            id="pdp-sticky-add-to-cart-btn"
            type="button"
            className={`flex min-h-12 w-full items-center rounded-[2px] border px-5 font-brand text-[13px] font-bold uppercase tracking-[0.04em] text-white shadow-[0_3px_12px_rgba(0,0,0,0.1)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] enabled:hover:-translate-y-[1.5px] enabled:hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] enabled:active:scale-[0.97] enabled:active:bg-black disabled:cursor-not-allowed disabled:border-[#e4e4e7] disabled:bg-[#e4e4e7] disabled:text-[#a1a1aa] disabled:shadow-none disabled:opacity-[0.55] max-[640px]:h-[46px] max-[640px]:min-h-[46px] max-[640px]:px-3 max-[640px]:text-[12px] ${
              isCartAdded
                ? 'justify-center border-[#166534] bg-[#166534] text-white shadow-[0_4px_16px_rgba(22,101,52,0.3)]'
                : 'justify-between border-[#111] bg-[#172126]'
            }`}
            onClick={onAddToCart}
            disabled={!isAvailable}
          >
            {isCartAdded ? (
              <span>✓ Added to Shopping Bag</span>
            ) : (
              <>
                <span>Add to Bag - {isNumeric ? `${selectedSize}"` : selectedSize}</span>
                <span className="font-brand text-[13px] font-bold tracking-[-0.01em] opacity-95">
                  {product.price}
                </span>
              </>
            )}
          </button>

          <button
            id="pdp-sticky-buy-now-btn"
            type="button"
            className="flex h-12 min-h-12 w-full items-center justify-center rounded-[2px] border border-[#111] bg-[#172126] font-brand text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] enabled:hover:-translate-y-px enabled:hover:bg-[#111] enabled:hover:text-white enabled:hover:shadow-[0_4px_14px_rgba(0,0,0,0.12)] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:border-[#e4e4e7] disabled:bg-[#172126] disabled:text-[#a1a1aa] disabled:opacity-[0.55] max-[640px]:h-[46px] max-[640px]:min-h-[46px] max-[640px]:px-3 max-[640px]:text-[12px]"
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
