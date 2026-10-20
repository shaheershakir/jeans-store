'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag,
  Trash2,
  Truck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
  MapPin,
  Lock
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'

interface DeliveryQuote {
  subtotal: number
  shipping: number
  total: number
  weightGrams: number
  deliveryEstimation?: {
    minDays: number
    maxDays: number
    exactDeliveryDate?: string
    zone: 'kerala' | 'restOfIndia'
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function BagClient() {
  const items = useCartStore((state) => state.items)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)

  const addresses = useAuthStore((state) => state.addresses)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [deliveryState, setDeliveryState] = useState('')
  const [pincode, setPincode] = useState('')
  const [pincodeLocation, setPincodeLocation] = useState('')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
  }, [])

  // Auto-fill delivery destination if saved address is available
  useEffect(() => {
    if (!deliveryState && addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr?.state) {
        setDeliveryState(defaultAddr.state)
        if (defaultAddr.pincode) {
          setPincode(defaultAddr.pincode)
        }
        if (defaultAddr.city && defaultAddr.state) {
          setPincodeLocation(`${defaultAddr.city}, ${defaultAddr.state}`)
        }
      }
    }
  }, [addresses, deliveryState])

  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setPincode(cleaned)
    setPincodeError('')

    if (cleaned.length === 6) {
      setPincodeLoading(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`)
        const data = await res.json()
        if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0]
          const district = po.District || po.Name || ''
          const state = po.State || ''
          setPincodeLocation(district ? `${district}, ${state}` : state)
          setDeliveryState(state)
          setPincodeError('')
        } else {
          setPincodeError('Invalid PIN code or location not found')
          setPincodeLocation('')
          setDeliveryState('')
        }
      } catch {
        setPincodeError('Unable to verify PIN code')
      } finally {
        setPincodeLoading(false)
      }
    } else {
      setPincodeLocation('')
      setDeliveryState('')
    }
  }

  // Fetch delivery quote
  useEffect(() => {
    if (!deliveryState || items.length === 0) {
      setQuote(null)
      setQuoteError('')
      setQuoteLoading(false)
      return
    }

    const controller = new AbortController()
    setQuote(null)
    setQuoteError('')
    setQuoteLoading(true)

    void fetch(`${API_URL}/api/orders/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: deliveryState,
        pincode: pincode.length === 6 ? pincode : undefined,
        items: items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          size: String(item.size),
          quantity: item.qty
        }))
      }),
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Could not calculate delivery for this bag.')
        setQuote(payload as DeliveryQuote)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setQuoteError(error instanceof Error ? error.message : 'Could not calculate delivery for this bag.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false)
      })

    return () => controller.abort()
  }, [deliveryState, pincode, items])

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const shipping = quote?.shipping ?? 0
  const total = quote ? quote.total : subtotal

  const FREE_SHIPPING_THRESHOLD = 1999
  const isFreeShippingUnlocked = subtotal >= FREE_SHIPPING_THRESHOLD
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const totalGrams = items.reduce((acc, item) => acc + item.qty * 380, 0)
  const weightDisplay = totalGrams >= 1000 ? `${(totalGrams / 1000).toFixed(1)}kg` : `${totalGrams}g`

  if (count === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-200px)] bg-paper px-[4%] pb-24 pt-9 [@media(max-width:768px)]:px-4 [@media(max-width:768px)]:pb-[calc(90px+env(safe-area-inset-bottom,0px))] [@media(max-width:768px)]:pt-5">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="mx-auto mb-[100px] mt-[60px] max-w-[600px] rounded-[10px] border border-line bg-paper px-6 py-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="mb-5 inline-flex h-[72px] w-[72px] items-center justify-center rounded-full border border-line bg-bone text-ink-muted">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <span className="cart-sys-label" style={{ display: 'block', marginBottom: '8px' }}>
              BAG STATUS // EMPTY
            </span>
            <h1 className="mb-3 font-brand text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink">
              Your Shopping Bag is Empty
            </h1>
            <p className="mx-auto mb-7 max-w-[440px] font-ui text-[15px] font-normal leading-[1.6] text-ink-secondary">
              Explore our heavyweight stripes, vintage-wash t-shirts, and structured relaxed silhouettes to build your wardrobe.
            </p>
            <Link href="/shop" className="button primary" style={{ padding: '14px 36px', fontSize: '14px' }}>
              Explore Garments <i>↗</i>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-200px)] bg-paper px-[4%] pb-24 pt-9 [@media(max-width:768px)]:px-4 [@media(max-width:768px)]:pb-[calc(90px+env(safe-area-inset-bottom,0px))] [@media(max-width:768px)]:pt-5">
      <div className="mx-auto w-full max-w-[1280px]">
        {/* ── Breadcrumb Navigation ── */}
        <nav className="mb-6 flex items-center gap-2 font-ui text-[12px] font-medium uppercase leading-[18px] tracking-[0.05em] text-ink-secondary" aria-label="Breadcrumb">
          <Link href="/" className="text-ink-secondary transition-colors duration-150 hover:text-ink">Home</Link>
          <span className="text-ink-muted" aria-hidden="true">/</span>
          <span className="font-semibold text-ink">Shopping Bag</span>
        </nav>

        {/* ── Page Header ── */}
        <header className="mb-8 flex shrink-0 flex-wrap items-end justify-between gap-5 border-b border-line px-6 pb-5 pt-5 [@media(max-width:640px)]:px-5 [@media(max-width:640px)]:pt-3">
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 font-brand text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-ink-muted">
              <span>MANIFEST // {count} {count === 1 ? 'GARMENT' : 'GARMENTS'}</span>
              <span className="inline-block rounded-full border border-line bg-bone px-[7px] py-0.5 text-[10px] font-semibold leading-none text-ink-secondary">~{weightDisplay} HEAVYWEIGHT COTTON</span>
            </div>
            <h1 className="m-0 flex items-baseline font-brand text-[clamp(28px,3.5vw,38px)] font-bold leading-[1.15] tracking-[-0.03em] text-ink">Shopping Bag</h1>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 font-ui text-[13px] font-medium leading-none text-ink-secondary underline underline-offset-4 transition-colors duration-150 hover:text-ink">
            ← Continue Shopping
          </Link>
        </header>

        {/* ── 2-Column Responsive Layout Grid ── */}
        <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)] items-start gap-12 [@media(max-width:1024px)]:grid-cols-[minmax(0,1.25fr)_minmax(320px,380px)] [@media(max-width:1024px)]:gap-8 [@media(max-width:768px)]:grid-cols-1 [@media(max-width:768px)]:gap-7">
          {/* ── Left Column: Garment Items ── */}
          <section className="flex min-w-0 flex-col gap-5" aria-label="Selected Garments">

            {/* Garment Cards */}
            {items.map((item) => (
              <article
                key={`${item.id}-${item.variantId ?? item.size}`}
                className="grid grid-cols-[120px_minmax(0,1fr)_auto] gap-5 rounded-[6px] border border-line bg-paper p-5 transition-[border-color,box-shadow] duration-[180ms] ease-[ease] hover:border-line-strong hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] [@media(max-width:768px)]:grid-cols-[88px_minmax(0,1fr)] [@media(max-width:768px)]:gap-3.5 [@media(max-width:768px)]:p-3.5"
              >
                {/* Garment Thumbnail */}
                <Link href={getProductUrl(item)} className="group relative aspect-[4/5] w-[120px] shrink-0 overflow-hidden rounded-[3px] bg-bone [@media(max-width:768px)]:w-[88px]" tabIndex={-1}>
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={120}
                    height={150}
                    className="h-full w-full shrink-0 rounded-[8px] bg-[#f4f4f5] object-cover [transition:transform_0.3s_ease] group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 90px, 120px"
                  />
                </Link>

                {/* Garment Information */}
                <div className="flex min-w-0 flex-col justify-between">
                  <div className="flex flex-col gap-1">
                    <Link href={getProductUrl(item)} className="group/title">
                      <h2 className="m-0 font-brand text-[16px] font-semibold leading-[1.35] text-ink [overflow-wrap:anywhere] group-hover/title:underline group-hover/title:underline-offset-[3px]">{item.name}</h2>
                    </Link>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {item.color && (
                        <span className="inline-flex items-center rounded-[4px] border border-line bg-bone px-2 py-[3px] font-ui text-[11.5px] font-medium leading-[1.3] text-ink-secondary">{item.color}</span>
                      )}
                      <span className="inline-flex items-center rounded-[4px] border border-line bg-[#f4f4f5] px-2 py-[3px] font-ui text-[11.5px] font-semibold leading-[1.3] text-ink">
                        {item.fit ? `${item.fit} Fit` : 'Relaxed Fit'}
                      </span>
                      <span className="inline-flex items-center rounded-[4px] border border-line bg-bone px-2 py-[3px] font-ui text-[11.5px] font-medium leading-[1.3] text-ink-secondary">
                        Size {item.size}
                      </span>
                    </div>

                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#047857]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                      <span>In stock · Ready to dispatch</span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Single Unit Price */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-4">
                    <div className="inline-flex h-9 select-none items-center overflow-hidden rounded-[3px] border border-line-strong bg-paper" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        className="flex h-9 min-h-9 w-9 min-w-9 cursor-pointer touch-manipulation items-center justify-center border-0 bg-transparent font-ui text-[14px] font-medium leading-[21px] text-ink transition-[background,transform] duration-150 hover:bg-bone active:bg-bone"
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(item.id, item.size, -1, item.variantId)}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="min-w-8 px-1 text-center font-ui text-[13px] font-semibold leading-[normal] [font-feature-settings:'tnum'] text-ink">{item.qty}</span>
                      <button
                        type="button"
                        className="flex h-9 min-h-9 w-9 min-w-9 cursor-pointer touch-manipulation items-center justify-center border-0 bg-transparent font-ui text-[14px] font-medium leading-[21px] text-ink transition-[background,transform] duration-150 hover:bg-bone active:bg-bone"
                        aria-label="Increase quantity"
                        onClick={() => updateQty(item.id, item.size, 1, item.variantId)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-ui text-[13px] font-medium leading-[normal] text-ink-secondary">
                      {formatPrice(item.priceNum)} each
                    </span>
                  </div>
                </div>

                {/* Item Actions & Line Total */}
                <div className="flex shrink-0 flex-col items-end justify-between text-right [@media(max-width:768px)]:col-span-full [@media(max-width:768px)]:mt-2 [@media(max-width:768px)]:flex-row [@media(max-width:768px)]:items-center [@media(max-width:768px)]:border-t [@media(max-width:768px)]:border-dashed [@media(max-width:768px)]:border-line [@media(max-width:768px)]:pt-3">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 cursor-pointer touch-manipulation items-center justify-center rounded-[3px] border border-transparent bg-transparent text-ink-muted transition-all duration-150 hover:border-[#fee2e2] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                    aria-label={`Remove ${item.name} from bag`}
                    onClick={() => removeItem(item.id, item.size, item.variantId)}
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="font-brand text-[18px] font-bold leading-none tracking-[-0.01em] [font-feature-settings:'tnum'] text-ink [@media(max-width:768px)]:text-[16px]">
                    {formatPrice(item.priceNum * item.qty)}
                  </div>
                </div>
              </article>
            ))}

            {/* Manifest Footer Actions */}
            <div className="flex flex-col flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3.5">
              <button
                type="button"
                onClick={clearCart}
                className="cursor-pointer border-0 bg-transparent p-0 font-ui text-[12.5px] font-medium leading-[normal] text-ink-secondary underline underline-offset-[3px] transition-colors duration-150 hover:text-[#dc2626]"
              >
                Clear entire bag
              </button>
              <span className="font-ui text-[12px] font-normal leading-[normal] text-ink-muted">
                ✦ All domestic prices inclusive of 5% GST &amp; applicable apparel duties
              </span>
            </div>
          </section>

          {/* ── Right Column: Sticky Summary Sidebar ── */}
          <aside className="sticky top-24 [@media(max-width:768px)]:static" aria-label="Order Summary and Checkout">
            <div className="rounded-[10px] border border-line bg-paper p-7 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]">
              <div className="mb-5 border-b border-line pb-4">
                <span className="mb-1 block font-brand text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-ink-muted">SUMMARY // BREAKDOWN</span>
                <h2 className="m-0 font-brand text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">Order Summary</h2>
              </div>

              {/* Delivery PIN Code Verification */}
              <div className="mb-[22px] flex flex-col gap-2">
                <div className="flex items-center justify-between text-[12px] leading-[18px]">
                  <label htmlFor="bag-pincode-input" className="font-brand text-[11.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-secondary">
                    Delivery Destination
                  </label>
                  {isAuthenticated && addresses && addresses.length > 0 && (
                    <Link href="/profile?tab=addresses" className="text-[11.5px] text-ink underline underline-offset-[3px]">
                      Saved addresses
                    </Link>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    id="bag-pincode-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="Enter 6-digit PIN code (e.g. 682001)"
                    className={`h-11 w-full rounded-[3px] border bg-paper px-3.5 font-ui text-[14.5px] font-normal leading-[normal] text-ink outline-none transition-[border-color,box-shadow] duration-150 touch-manipulation [@media(pointer:coarse)]:text-[16px] focus:border-ink focus:shadow-[0_0_0_1px_var(--ink)] ${pincodeError ? 'border-[#dc2626]' : 'border-line-strong'}`}
                    aria-label="Delivery PIN code"
                  />
                  {pincodeLoading && (
                    <span className="absolute right-3 text-[11px] text-ink-muted">Locating…</span>
                  )}
                </div>

                {pincodeLocation && (
                  <div className="mt-1 flex items-center gap-1.5 rounded-[4px] border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-2 text-[12px] leading-[18px] text-[#065f46]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Delivering to <strong>{pincodeLocation}</strong></span>
                  </div>
                )}

                {pincodeError && (
                  <p role="alert" className="m-0 mt-0.5 text-[11.5px] leading-[normal] text-[#dc2626]">
                    {pincodeError}
                  </p>
                )}
                {quoteError && !pincodeError && (
                  <p role="alert" className="m-0 mt-0.5 text-[11.5px] leading-[normal] text-[#dc2626]">
                    {quoteError}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mb-5 flex flex-col gap-3 border-y border-line py-[18px]">
                <div className="flex items-center justify-between font-ui text-[13.5px] font-normal leading-[normal] [font-feature-settings:'tnum'] text-ink-secondary">
                  <span>Bag Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between font-ui text-[13.5px] font-normal leading-[normal] [font-feature-settings:'tnum'] text-ink-secondary">
                  <span>Delivery Charge</span>
                  <span>
                    {quoteLoading ? (
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>Calculating…</span>
                    ) : quote ? (
                      quote.shipping === 0 ? (
                        <span className="font-bold tracking-[0.04em] text-[#047857]">FREE</span>
                      ) : (
                        formatPrice(quote.shipping)
                      )
                    ) : isFreeShippingUnlocked ? (
                      <span className="font-bold tracking-[0.04em] text-[#047857]">FREE</span>
                    ) : deliveryState ? (
                      'Calculating…'
                    ) : (
                      'Enter PIN code'
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-line pt-3 font-brand text-[18px] font-bold leading-[normal] tracking-[-0.01em] text-ink">
                  <span>Estimated Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Estimated Delivery Promise Box */}
              <div className="mb-6 flex items-start gap-3 rounded-[3px] border border-[#bbf7d0] bg-[#f4fbf7] px-4 py-3.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#dcfce7] text-[#15803d]">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 font-brand text-[11px] font-bold uppercase leading-[normal] tracking-[0.05em] text-[#166534]">Estimated Delivery</span>
                  <span className="font-ui text-[13px] font-medium leading-[normal] text-ink">
                    {quote?.deliveryEstimation?.exactDeliveryDate ? (
                      quote.deliveryEstimation.exactDeliveryDate
                    ) : pincode.length === 6 ? (
                      /^(67|68|69)/.test(pincode) ? '2 to 5 business days (Kerala Express)' : '7 to 14 business days (National Courier)'
                    ) : (
                      'Enter PIN code for delivery window'
                    )}
                  </span>
                  <span className="font-ui text-[11.5px] font-normal leading-[normal] text-ink-secondary">
                    Direct dispatch from Kannur
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <Link href="/bag/checkout" className="flex w-full cursor-pointer touch-manipulation select-none items-center justify-between rounded-[3px] border border-ink bg-ink px-[22px] py-4 font-brand text-[13.5px] font-bold uppercase leading-[normal] tracking-[0.06em] text-paper no-underline shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px hover:border-[#181c24] hover:bg-[#181c24] hover:text-paper hover:shadow-[0_4px_16px_rgba(0,0,0,0.14)] [@media(max-width:768px)]:hidden">
                <span>Proceed to Checkout</span>
                <span aria-hidden="true">→</span>
              </Link>

              {/* Security & Customer Assurance */}
              <div className="mt-[22px] flex flex-col gap-2.5 border-t border-line pt-[18px] font-ui text-[12px] font-normal leading-[normal] text-ink-secondary">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#059669]" />
                  <span>256-bit encrypted secure Razorpay payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 shrink-0 text-[#059669]" />
                  <span>Free 7-day doorstep size &amp; fit exchanges</span>
                </div>
              </div>

              {/* Payment Methods Pill Strip */}
              <div className="mt-[18px] flex flex-wrap items-center justify-center gap-2 border-t border-dashed border-line pt-3.5">
                <span className="rounded-[4px] border border-line bg-bone px-2 py-1 font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-muted">UPI</span>
                <span className="rounded-[4px] border border-line bg-bone px-2 py-1 font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-muted">GPay</span>
                <span className="rounded-[4px] border border-line bg-bone px-2 py-1 font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-muted">PhonePe</span>
                <span className="rounded-[4px] border border-line bg-bone px-2 py-1 font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-muted">Paytm</span>
                <span className="rounded-[4px] border border-line bg-bone px-2 py-1 font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-muted">Cards</span>
                <span className="rounded-[4px] border border-line bg-bone px-2 py-1 font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink-muted">NetBanking</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Fixed Mobile Sticky Bottom Action Bar (< 768px) ── */}
      <div className="hidden [@media(max-width:768px)]:fixed [@media(max-width:768px)]:bottom-0 [@media(max-width:768px)]:left-0 [@media(max-width:768px)]:right-0 [@media(max-width:768px)]:z-[45] [@media(max-width:768px)]:flex [@media(max-width:768px)]:items-center [@media(max-width:768px)]:justify-between [@media(max-width:768px)]:gap-4 [@media(max-width:768px)]:border-t [@media(max-width:768px)]:border-line-strong [@media(max-width:768px)]:bg-[rgba(255,255,255,0.94)] [@media(max-width:768px)]:px-4 [@media(max-width:768px)]:pb-[calc(12px+env(safe-area-inset-bottom,0px))] [@media(max-width:768px)]:pt-3 [@media(max-width:768px)]:shadow-[0_-4px_20px_rgba(0,0,0,0.08)] [@media(max-width:768px)]:backdrop-blur-[18px] [@media(max-width:768px)]:backdrop-saturate-[1.8]" aria-label="Mobile Checkout Bar">
        <div className="flex flex-col">
          <span className="font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.06em] text-ink-secondary">Estimated Total</span>
          <span className="font-brand text-[18px] font-bold leading-[normal] [font-feature-settings:'tnum'] text-ink">{formatPrice(total)}</span>
        </div>
        <Link href="/bag/checkout" className="inline-flex touch-manipulation items-center gap-1.5 rounded-[3px] bg-ink px-[22px] py-3 font-brand text-[13px] font-bold uppercase leading-[normal] tracking-[0.05em] text-paper no-underline">
          <span>Checkout</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}

