'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function CartDrawer() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const addresses = useAuthStore((state) => state.addresses)

  const [deliveryQuote, setDeliveryQuote] = useState<{
    shipping: number
    total: number
  } | null>(null)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
  }, [])

  const open = overlay === 'cart'
  const subtotal = cartSubtotal(items)
  const count = cartCount(items)

  const isLoggedIn = Boolean(isAuthenticated || user)
  const savedAddress = useMemo(() => {
    if (!isLoggedIn || !addresses || addresses.length === 0) return null
    return addresses.find((a) => a.isDefault) || addresses[0]
  }, [isLoggedIn, addresses])

  const hasSavedAddress = Boolean(savedAddress)

  const isKerala = useMemo(() => {
    if (!savedAddress) return false
    const state = savedAddress.state?.toLowerCase() || ''
    const pin = savedAddress.pincode?.replace(/\D/g, '') || ''
    return state.includes('kerala') || pin.startsWith('67') || pin.startsWith('68') || pin.startsWith('69')
  }, [savedAddress])

  // Total estimated shipment weight (standard tee/bottomwear ~350g)
  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => sum + 350 * item.qty, 0)
  }, [items])

  // Weight-based paid delivery rates from admin:
  // Kerala: base ₹60 (up to 500g) + ₹20 per additional 500g
  // Outside Kerala: base ₹90 (up to 500g) + ₹30 per additional 500g
  const fallbackShipping = useMemo(() => {
    const baseRate = isKerala ? 60 : 90
    const addRate = isKerala ? 20 : 30
    const extraUnits = Math.ceil(Math.max(0, totalWeight - 500) / 500)
    return baseRate + extraUnits * addRate
  }, [isKerala, totalWeight])

  const shippingFee = hasSavedAddress
    ? (deliveryQuote?.shipping ?? fallbackShipping)
    : 0
  const totalWithShipping = subtotal + shippingFee

  // Live delivery quote fetching when open & address available
  useEffect(() => {
    if (!open || !hasSavedAddress || !savedAddress || items.length === 0) {
      setDeliveryQuote(null)
      setIsQuoteLoading(false)
      return
    }

    const controller = new AbortController()
    setIsQuoteLoading(true)

    fetch(`${API_URL}/api/orders/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: savedAddress.state || 'Kerala',
        pincode: savedAddress.pincode?.replace(/\D/g, '').slice(0, 6) || undefined,
        items: items.map((item) => ({
          id: String(item.id),
          variantId: typeof item.variantId === 'number' && item.variantId > 0 ? item.variantId : undefined,
          size: String(item.size),
          quantity: item.qty
        }))
      }),
      signal: controller.signal
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Quote failed')
        setDeliveryQuote({
          shipping: Number(data.shipping ?? fallbackShipping),
          total: Number(data.total ?? (subtotal + fallbackShipping))
        })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Keep fallback shipping
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsQuoteLoading(false)
      })

    return () => controller.abort()
  }, [open, hasSavedAddress, savedAddress, items, subtotal, fallbackShipping])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) closeOverlay()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOverlay])

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div
      className={`fixed inset-0 z-[99999] flex justify-end bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] max-[640px]:items-end ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div
        className={`relative flex h-[100dvh] w-full max-w-[420px] flex-col bg-white text-[#111827] shadow-[-12px_0_36px_rgba(0,0,0,0.12)] transition-transform duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] max-[640px]:max-h-[92dvh] max-[640px]:max-w-full max-[640px]:rounded-t-[20px] ${
          open
            ? 'translate-x-0 max-[640px]:translate-y-0'
            : 'translate-x-full max-[640px]:translate-x-0 max-[640px]:translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Your Bag"
      >
        {/* Mobile Pull Handle */}
        <div
          className="hidden max-[640px]:mx-auto max-[640px]:mb-1 max-[640px]:mt-2.5 max-[640px]:block max-[640px]:h-1 max-[640px]:w-10 max-[640px]:shrink-0 max-[640px]:rounded-full max-[640px]:bg-[#e5e7eb]"
          aria-hidden="true"
        />

        {/* 1. Header with Logo, Close & Title */}
        <div className="shrink-0 p-6 pb-4 border-b border-[#f4f4f5]">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={closeOverlay}
              className="inline-flex items-center no-underline"
              aria-label="TEESGARAGE Home"
            >
              <Image
                src="/teesgarage-logo.svg"
                alt="TEESGARAGE"
                width={110}
                height={30}
                priority
                className="h-[22px] w-auto"
              />
            </Link>

            <button
              type="button"
              onClick={closeOverlay}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#f4f4f5] text-[#111111] transition-colors hover:bg-[#e4e4e7] active:scale-95"
              aria-label="Close bag drawer"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </div>

          <h2 className="mt-4 flex items-baseline font-brand text-[22px] sm:text-[24px] font-bold text-[#111111] leading-none">
            Your Bag <span className="ml-1.5 font-normal font-sans text-[17px] text-[#71717a]">({count})</span>
          </h2>
        </div>

        {/* 2. Items List */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a]">
              <ShoppingBag className="h-7 w-7 stroke-[1.8]" />
            </div>
            <h3 className="font-brand text-[18px] font-bold text-[#111827]">Your bag is empty</h3>
            <p className="mt-1 mb-6 font-ui text-[13px] text-[#71717a] max-w-[240px]">
              Looks like you haven&apos;t added any garments to your bag yet.
            </p>
            <Link
              href="/shop"
              onClick={closeOverlay}
              className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#111111] px-6 font-brand text-[12.5px] font-semibold text-white hover:bg-black transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-[#f4f4f5] [scrollbar-width:thin]">
            {items.map((item) => {
              const itemTotal = item.priceNum * item.qty
              return (
                <div
                  key={`${item.id}-${item.variantId ?? item.size}`}
                  className="py-4 flex gap-3.5"
                >
                  {/* Thumbnail */}
                  <Link
                    href={getProductUrl(item)}
                    onClick={closeOverlay}
                    className="relative w-[68px] h-[78px] shrink-0 overflow-hidden rounded-[8px] bg-[#f4f4f5]"
                    tabIndex={-1}
                  >
                    <Image
                      src={item.img}
                      alt={item.name}
                      fill
                      sizes="70px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Title & Price Row */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={getProductUrl(item)}
                          onClick={closeOverlay}
                          className="font-brand text-[13.5px] font-bold text-[#111827] leading-snug truncate hover:underline"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                        <span className="font-brand text-[14px] font-bold text-[#111827] tabular-nums shrink-0">
                          {formatPrice(itemTotal)}
                        </span>
                      </div>

                      {/* Variant Subline */}
                      <p className="font-ui text-[12px] text-[#71717a] truncate mt-0.5">
                        {item.color || 'Standard'} &nbsp;/&nbsp; {item.size}
                      </p>
                    </div>

                    {/* Stepper on left, Trash on right */}
                    <div className="mt-2.5 flex items-center justify-between">
                      {/* Stepper pill */}
                      <div
                        className="inline-flex items-center rounded-[6px] border border-[#e5e7eb] bg-white h-7"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.size, -1, item.variantId)}
                          className="w-7 h-7 flex items-center justify-center text-[#71717a] hover:text-[#111111] hover:bg-black/5 rounded-l-[5px] transition-colors cursor-pointer"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="min-w-6 px-1 text-center font-ui text-[12px] font-bold text-[#111111] tabular-nums select-none">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.size, 1, item.variantId)}
                          className="w-7 h-7 flex items-center justify-center text-[#71717a] hover:text-[#111111] hover:bg-black/5 rounded-r-[5px] transition-colors cursor-pointer"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Trash icon */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.size, item.variantId)}
                        className="p-1 text-[#71717a] hover:text-[#dc2626] transition-colors cursor-pointer"
                        aria-label={`Remove ${item.name} from bag`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.8]" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 3. Sticky Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#f4f4f5] bg-white p-6 pt-4">
            {hasSavedAddress && savedAddress ? (
              <div className="flex flex-col gap-2">
                {/* Subtotal */}
                <div className="flex items-center justify-between font-ui text-[13px] text-[#6b7280]">
                  <span>Subtotal</span>
                  <span className="font-brand font-bold text-[#111827] tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {/* Delivery charge */}
                <div className="flex items-center justify-between font-ui text-[13px] text-[#6b7280]">
                  <span className="flex items-center gap-1.5">
                    <span>Delivery</span>
                    <span className="text-[11.5px] text-[#9ca3af] truncate max-w-[170px]" title={`${savedAddress.city ? `${savedAddress.city}, ` : ''}${savedAddress.state || savedAddress.pincode}`}>
                      ({savedAddress.city ? `${savedAddress.city}, ` : ''}{savedAddress.state || savedAddress.pincode})
                    </span>
                  </span>
                  <span>
                    {isQuoteLoading ? (
                      <span className="text-[11.5px] text-[#9ca3af]">Calculating…</span>
                    ) : (
                      <span className="font-brand font-bold text-[#111827] tabular-nums">
                        {formatPrice(shippingFee)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-[#f4f4f5] my-0.5" />

                {/* Estimated Total */}
                <div className="flex items-center justify-between font-brand">
                  <span className="text-[14.5px] font-bold text-[#111827]">Estimated total</span>
                  <span className="text-[17px] font-bold text-[#111827] tabular-nums">{formatPrice(totalWithShipping)}</span>
                </div>

                {/* Subline with delivery destination and parcel weight */}
                <p className="mt-0.5 mb-3 font-ui text-[11px] text-[#71717a] flex items-center justify-between">
                  <span>Delivering to {savedAddress.pincode} ({isKerala ? 'Kerala' : 'Outside Kerala'})</span>
                  <span>{totalWeight}g</span>
                </p>
              </div>
            ) : (
              <div>
                {/* Subtotal */}
                <div className="flex items-center justify-between font-ui text-[13px] text-[#6b7280]">
                  <span>Subtotal</span>
                  <span className="font-brand font-bold text-[#111827] tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {/* Total before delivery */}
                <div className="mt-2 flex items-center justify-between font-brand">
                  <span className="text-[14.5px] font-bold text-[#111827]">Total before delivery</span>
                  <span className="text-[17px] font-bold text-[#111827] tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                {/* Subline */}
                <p className="mt-1 mb-4 font-ui text-[11.5px] text-[#9ca3af]">
                  Delivery calculated at checkout
                </p>
              </div>
            )}

            {/* Primary CTA */}
            <Link
              href="/checkout"
              onClick={closeOverlay}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#111111] hover:bg-black font-brand text-[13.5px] font-semibold text-white no-underline transition-colors shadow-xs"
            >
              <span>Proceed to checkout</span>
              <ArrowRight className="h-4 w-4 stroke-[2]" />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/bag"
              onClick={closeOverlay}
              className="mt-2.5 flex h-11 w-full cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white hover:bg-[#fafafa] font-brand text-[13px] font-semibold text-[#111111] no-underline transition-colors"
            >
              <span>View full bag ({count})</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
