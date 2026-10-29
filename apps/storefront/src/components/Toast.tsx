'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { useUIStore, useCartStore, useAuthStore, cartSubtotal } from '@/lib/store'
import { getAvailableProductSizes, getProductSizeOptions } from '@/lib/products'
import { formatPrice } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

export default function Toast() {
  const router = useRouter()
  const toast = useUIStore((state) => state.toast)
  const hideToast = useUIStore((state) => state.hideToast)
  const sizePrompt = useUIStore((state) => state.sizePrompt)
  const closeSizePrompt = useUIStore((state) => state.closeSizePrompt)
  const showToast = useUIStore((state) => state.showToast)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const addresses = useAuthStore((state) => state.addresses)

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
  }, [])

  const isLoggedIn = Boolean(isAuthenticated || user)
  const savedAddress = useMemo(() => {
    if (!isLoggedIn || !addresses || addresses.length === 0) return null
    return addresses.find((a) => a.isDefault) || addresses[0]
  }, [isLoggedIn, addresses])

  const deliveryFee = useMemo(() => {
    if (!savedAddress) return null
    const state = savedAddress.state?.toLowerCase() || ''
    const pin = savedAddress.pincode?.replace(/\D/g, '') || ''
    const isKerala =
      state.includes('kerala') ||
      pin.startsWith('67') ||
      pin.startsWith('68') ||
      pin.startsWith('69')
    const totalWeight = items.reduce((sum, item) => sum + 350 * item.qty, 0)
    const baseRate = isKerala ? 60 : 90
    const addRate = isKerala ? 20 : 30
    const extraUnits = Math.ceil(Math.max(0, totalWeight - 500) / 500)
    return baseRate + extraUnits * addRate
  }, [savedAddress, items])

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

    trackEvent('add_to_cart', {
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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#111111]/95 text-white backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.25)] border border-white/10 max-w-[95vw] animate-fade-in"
        role="dialog"
        aria-label={`Select size for ${product.name}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
            <Image
              src={product.img}
              alt={product.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[11px] font-medium text-white/60">Choose size:</span>
            <span className="text-[12.5px] font-semibold text-white truncate max-w-[140px]" title={product.name}>
              {product.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Available sizes">
            {promptSizes.map((size) => (
              <button
                key={size}
                type="button"
                className="min-w-7 h-7 px-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black text-[12px] font-medium transition-colors cursor-pointer"
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
          className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
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
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 rounded-full bg-[#111111]/95 text-white backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.28)] border border-white/10 max-w-[94vw] transition-all animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <Check className="w-4 h-4 text-emerald-400 stroke-[2.5] shrink-0" />
      <span className="text-[12.5px] sm:text-[13px] text-white font-medium truncate max-w-[180px] sm:max-w-[280px]">
        {toast}
      </span>

      {deliveryFee !== null && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 border border-white/20 whitespace-nowrap shrink-0">
          Delivery {formatPrice(deliveryFee)}
        </span>
      )}

      <button
        type="button"
        className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[12px] font-semibold cursor-pointer transition-colors shrink-0"
        onClick={() => {
          hideToast()
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            router.push('/bag')
          } else {
            openOverlay('cart')
          }
        }}
      >
        View Bag
      </button>

      <button
        type="button"
        className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss notification"
        onClick={hideToast}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
