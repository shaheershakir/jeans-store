'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Check, ShoppingBag, X } from 'lucide-react'
import { useUIStore, useCartStore } from '@/lib/store'
import { getAvailableProductSizes, getProductSizeOptions } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

export default function Toast() {
  const toast = useUIStore((state) => state.toast)
  const hideToast = useUIStore((state) => state.hideToast)
  const sizePrompt = useUIStore((state) => state.sizePrompt)
  const closeSizePrompt = useUIStore((state) => state.closeSizePrompt)
  const showToast = useUIStore((state) => state.showToast)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  // Auto-dismiss sizePrompt on Escape key
  useEffect(() => {
    if (!sizePrompt) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSizePrompt()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sizePrompt, closeSizePrompt])

  const promptSizes = useMemo(() => {
    if (!sizePrompt) return []
    if (sizePrompt.availableSizes && sizePrompt.availableSizes.length > 0) {
      return sizePrompt.availableSizes
    }
    const avail = getAvailableProductSizes(sizePrompt.product)
    if (avail.length > 0) return avail
    return getProductSizeOptions(sizePrompt.product)
  }, [sizePrompt])

  function handleSelectSize(size: string) {
    if (!sizePrompt) return
    const { product, selectedColor } = sizePrompt

    addItem(product.id, size, product, selectedColor)
    closeSizePrompt()
    showToast(`Added ${product.name} (${size}) to your bag`)
    openOverlay('cart')

    trackEvent('product_added_to_cart', {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.priceNum,
      currency: 'INR',
      color: selectedColor || product.color,
      size,
      quantity: 1,
      source_location: 'product_card',
      in_stock: true
    })
  }

  // Interactive Size Selection Toast (Apple Glassmorphic Bottom Pill)
  if (sizePrompt) {
    const { product, selectedColor } = sizePrompt
    return (
      <aside
        className="toast-size-prompt-bar show"
        role="dialog"
        aria-label={`Select size for ${product.name}`}
      >
        <div className="toast-prompt-inner">
          <div className="toast-prompt-left">
            <div className="toast-prompt-thumb-wrap">
              <Image
                src={product.img}
                alt={product.name}
                width={40}
                height={40}
                className="toast-prompt-thumb"
              />
            </div>
            <div className="toast-prompt-meta">
              <span className="toast-prompt-title" title={product.name}>
                {product.name}
              </span>
              <span className="toast-prompt-hint">Choose your size to add to bag:</span>
            </div>
          </div>

          <div className="toast-prompt-sizes" role="group" aria-label="Available sizes">
            {promptSizes.map((size) => (
              <button
                key={size}
                type="button"
                className="toast-size-pill"
                onClick={() => handleSelectSize(size)}
                aria-label={`Add size ${size} to bag`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="toast-prompt-close"
          onClick={closeSizePrompt}
          aria-label="Dismiss size picker"
        >
          <X className="w-4 h-4" />
        </button>
      </aside>
    )
  }

  // Regular Apple-style Feedback Toast
  if (!toast) return null

  return (
    <div className="toast show" role="status" aria-live="polite">
      <div className="toast-feedback-inner">
        <Check className="toast-check-icon w-4 h-4 text-emerald-400 stroke-[2.5]" />
        <span className="toast-message">{toast}</span>
        <button
          type="button"
          className="toast-view-bag-btn"
          onClick={() => {
            hideToast()
            openOverlay('cart')
          }}
        >
          View Bag
        </button>
        <button
          type="button"
          className="toast-close-btn"
          aria-label="Dismiss notification"
          onClick={hideToast}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
