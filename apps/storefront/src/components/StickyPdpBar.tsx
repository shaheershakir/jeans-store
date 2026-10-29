'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/constants'

interface StickyPdpBarProps {
  product: Product
  selectedSize: string
  availableSizes?: string[]
  isNumeric?: boolean
  added?: boolean
  onAddToCart: () => void
  onBuyNow?: () => void
  selectedColor?: string
  displayPrice?: string
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
  selectedColor,
  displayPrice,
  sizeOptions,
  productImage,
  onSizeChange,
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
      // Sticky bar should slide in at the bottom when user has scrolled PAST the Buy Now button.
      // Top header sits at ~72px, so rect.bottom <= 72 means the Buy Now button has left the viewport.
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

  const isAvailableForSelected =
    availableSizes.length === 0 || availableSizes.includes(selectedSize)

  const thumbImage =
    productImage ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.img ||
    '/mock-assets/pdp/hero_clean_high.png'

  const SIZE_ORDER: Record<string, number> = {
    XS: 1,
    S: 2,
    M: 3,
    L: 4,
    XL: 5,
    XXL: 6,
    '2XL': 6,
    '3XL': 7,
  }

  const rawSizes =
    sizeOptions && sizeOptions.length > 0
      ? sizeOptions
      : product.sizes && product.sizes.length > 0
        ? product.sizes
        : ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  const displaySizes = [...rawSizes].sort((a, b) => {
    const aOrder = SIZE_ORDER[a.toUpperCase()]
    const bOrder = SIZE_ORDER[b.toUpperCase()]
    if (aOrder && bOrder) return aOrder - bOrder
    const aNum = parseInt(a, 10)
    const bNum = parseInt(b, 10)
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    return 0
  })

  const colorOrWash = selectedColor || product.color || ''

  return createPortal(
    <aside
      className={`hidden md:block fixed inset-x-0 bottom-0 z-[90] border-t border-black/[0.08] bg-white/[0.98] px-4 sm:px-6 lg:px-8 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-[120%] opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
      aria-label="Sticky actions bar"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Desktop & Tablet View (md+) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Thumbnail + Title + Price & Wash */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative h-12 w-12 lg:h-[50px] lg:w-[50px] shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-black/5">
              <Image
                src={thumbImage}
                alt={product.name}
                fill
                sizes="56px"
                className="object-cover object-center"
              />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14.5px] lg:text-[15px] font-bold text-gray-950 leading-tight max-w-[280px] lg:max-w-[440px]">
                {product.name}
              </div>
              <div className="text-[13px] text-gray-500 leading-tight mt-1 flex items-center gap-1.5">
                <span className="font-bold text-gray-950">{displayPrice || product.price}</span>
                {colorOrWash && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="truncate">{colorOrWash}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Size Selector & Add to Bag Button */}
          <div className="flex items-center gap-3 lg:gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-gray-500 font-medium mr-1.5 select-none">
                Size:
              </span>
              {displaySizes.map((size) => {
                const isSelected = selectedSize === size
                const isAvailable = availableSizes.length === 0 || availableSizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => onSizeChange?.(size)}
                    className={`min-w-[38px] h-[38px] px-2.5 rounded-lg flex items-center justify-center text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-[#f4f4f5] text-gray-800 hover:bg-[#e4e4e7]'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                    aria-label={`Select size ${size}`}
                  >
                    {isNumeric ? `${size}"` : size}
                  </button>
                )
              })}
            </div>

            <button
              id="pdp-sticky-add-to-cart-btn"
              type="button"
              onClick={onAddToCart}
              disabled={!isAvailableForSelected}
              className={`h-[42px] px-7 rounded-full flex items-center gap-2 text-[13.5px] font-bold tracking-tight transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer ${
                isCartAdded
                  ? 'bg-[#166534] text-white shadow-[0_4px_16px_rgba(22,101,52,0.3)]'
                  : 'bg-[#111111] text-white hover:bg-[#27272a]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0 stroke-[2.2]" />
              <span>
                {isCartAdded
                  ? '✓ Added to Bag'
                  : `Add to Bag — ${isNumeric ? `${selectedSize}"` : selectedSize}`}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile View (< md) */}
        <div className="flex md:hidden flex-col gap-2.5">
          {/* Top row: Thumbnail + Title + Price/Color */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-black/5">
              <Image
                src={thumbImage}
                alt={product.name}
                fill
                sizes="44px"
                className="object-cover object-center"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-gray-950 leading-tight">
                {product.name}
              </div>
              <div className="text-[12px] text-gray-500 leading-tight mt-0.5 flex items-center gap-1.5">
                <span className="font-bold text-gray-950">{displayPrice || product.price}</span>
                {colorOrWash && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="truncate">{colorOrWash}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom row: Size selector pills + Add to Bag button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 shrink-0 max-w-[55vw]">
              {displaySizes.map((size) => {
                const isSelected = selectedSize === size
                const isAvailable = availableSizes.length === 0 || availableSizes.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => onSizeChange?.(size)}
                    className={`min-w-[32px] h-[36px] px-2 rounded-lg flex items-center justify-center text-[12px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#111111] text-white shadow-xs'
                        : 'bg-[#f4f4f5] text-gray-800 hover:bg-[#e4e4e7]'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                    aria-label={`Select size ${size}`}
                  >
                    {isNumeric ? `${size}"` : size}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={onAddToCart}
              disabled={!isAvailableForSelected}
              className={`flex-1 h-[36px] px-3.5 rounded-full flex items-center justify-center gap-1.5 text-[12px] font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                isCartAdded
                  ? 'bg-[#166534] text-white'
                  : 'bg-[#111111] text-white hover:bg-[#27272a]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              <span>
                {isCartAdded
                  ? 'Added'
                  : `Add to Bag — ${isNumeric ? `${selectedSize}"` : selectedSize}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>,
    document.body
  )
}
