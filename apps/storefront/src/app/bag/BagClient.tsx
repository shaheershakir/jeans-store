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
      <div className="bag-page">
        <div className="bag-container">
          <div className="bag-empty-wrap">
            <div className="bag-empty-icon">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <span className="cart-sys-label" style={{ display: 'block', marginBottom: '8px' }}>
              BAG STATUS // EMPTY
            </span>
            <h1 className="bag-empty-title">
              Your Shopping Bag is Empty
            </h1>
            <p className="bag-empty-desc">
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
    <div className="bag-page">
      <div className="bag-container">
        {/* ── Breadcrumb Navigation ── */}
        <nav className="bag-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep" aria-hidden="true">/</span>
          <span className="current">Shopping Bag</span>
        </nav>

        {/* ── Page Header ── */}
        <header className="bag-header">
          <div className="bag-header-left">
            <div className="bag-manifest-eyebrow">
              <span>MANIFEST // {count} {count === 1 ? 'GARMENT' : 'GARMENTS'}</span>
              <span className="bag-manifest-pill">~{weightDisplay} HEAVYWEIGHT COTTON</span>
            </div>
            <h1 className="bag-title">Shopping Bag</h1>
          </div>
          <Link href="/shop" className="bag-continue-link">
            ← Continue Shopping
          </Link>
        </header>

        {/* ── 2-Column Responsive Layout Grid ── */}
        <div className="bag-grid">
          {/* ── Left Column: Garment Items ── */}
          <section className="bag-items-col" aria-label="Selected Garments">

            {/* Garment Cards */}
            {items.map((item) => (
              <article
                key={`${item.id}-${item.variantId ?? item.size}`}
                className="bag-item-card"
              >
                {/* Garment Thumbnail */}
                <Link href={getProductUrl(item)} className="bag-item-media" tabIndex={-1}>
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={120}
                    height={150}
                    className="bag-item-img"
                    sizes="(max-width: 768px) 90px, 120px"
                  />
                </Link>

                {/* Garment Information */}
                <div className="bag-item-details">
                  <div className="bag-item-heading-group">
                    <Link href={getProductUrl(item)} className="bag-item-title-link">
                      <h2 className="bag-item-title">{item.name}</h2>
                    </Link>

                    <div className="bag-item-badges">
                      {item.color && (
                        <span className="bag-item-badge">{item.color}</span>
                      )}
                      <span className="bag-item-badge fit-badge">
                        {item.fit ? `${item.fit} Fit` : 'Relaxed Fit'}
                      </span>
                      <span className="bag-item-badge">
                        Size {item.size}
                      </span>
                    </div>

                    <div className="bag-item-stock-status">
                      <span className="bag-item-stock-dot" />
                      <span>In stock · Ready to dispatch</span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Single Unit Price */}
                  <div className="bag-item-controls">
                    <div className="bag-stepper" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        className="bag-stepper-btn"
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(item.id, item.size, -1, item.variantId)}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="bag-stepper-count">{item.qty}</span>
                      <button
                        type="button"
                        className="bag-stepper-btn"
                        aria-label="Increase quantity"
                        onClick={() => updateQty(item.id, item.size, 1, item.variantId)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="bag-item-unit-price">
                      {formatPrice(item.priceNum)} each
                    </span>
                  </div>
                </div>

                {/* Item Actions & Line Total */}
                <div className="bag-item-actions-col">
                  <button
                    type="button"
                    className="bag-item-delete-btn"
                    aria-label={`Remove ${item.name} from bag`}
                    onClick={() => removeItem(item.id, item.size, item.variantId)}
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="bag-item-total-price">
                    {formatPrice(item.priceNum * item.qty)}
                  </div>
                </div>
              </article>
            ))}

            {/* Manifest Footer Actions */}
            <div className="bag-footer-actions">
              <button
                type="button"
                onClick={clearCart}
                className="bag-clear-btn"
              >
                Clear entire bag
              </button>
              <span className="bag-tax-note">
                ✦ All domestic prices inclusive of 5% GST &amp; applicable apparel duties
              </span>
            </div>
          </section>

          {/* ── Right Column: Sticky Summary Sidebar ── */}
          <aside className="bag-summary-col" aria-label="Order Summary and Checkout">
            <div className="bag-summary-card">
              <div className="bag-summary-header">
                <span className="bag-summary-eyebrow">SUMMARY // BREAKDOWN</span>
                <h2 className="bag-summary-title">Order Summary</h2>
              </div>

              {/* Delivery PIN Code Verification */}
              <div className="bag-pin-section">
                <div className="bag-pin-header-row">
                  <label htmlFor="bag-pincode-input" className="bag-pin-label">
                    Delivery Destination
                  </label>
                  {isAuthenticated && addresses && addresses.length > 0 && (
                    <Link href="/profile?tab=addresses" className="bag-pin-saved-link">
                      Saved addresses
                    </Link>
                  )}
                </div>

                <div className="bag-pin-input-wrap">
                  <input
                    id="bag-pincode-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="Enter 6-digit PIN code (e.g. 682001)"
                    className={`bag-pin-input ${pincodeError ? 'has-error' : ''}`}
                    aria-label="Delivery PIN code"
                  />
                  {pincodeLoading && (
                    <span className="bag-pin-loader">Locating…</span>
                  )}
                </div>

                {pincodeLocation && (
                  <div className="bag-pin-destination-badge">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Delivering to <strong>{pincodeLocation}</strong></span>
                  </div>
                )}

                {pincodeError && (
                  <p role="alert" className="bag-pin-error">
                    {pincodeError}
                  </p>
                )}
                {quoteError && !pincodeError && (
                  <p role="alert" className="bag-pin-error">
                    {quoteError}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bag-breakdown">
                <div className="bag-breakdown-row">
                  <span>Bag Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="bag-breakdown-row">
                  <span>Delivery Charge</span>
                  <span>
                    {quoteLoading ? (
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>Calculating…</span>
                    ) : quote ? (
                      quote.shipping === 0 ? (
                        <span className="bag-free-shipping-tag">FREE</span>
                      ) : (
                        formatPrice(quote.shipping)
                      )
                    ) : isFreeShippingUnlocked ? (
                      <span className="bag-free-shipping-tag">FREE</span>
                    ) : deliveryState ? (
                      'Calculating…'
                    ) : (
                      'Enter PIN code'
                    )}
                  </span>
                </div>

                <div className="bag-breakdown-row total-row">
                  <span>Estimated Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Estimated Delivery Promise Box */}
              <div className="bag-delivery-promise">
                <div className="bag-delivery-icon-box">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="bag-delivery-text-group">
                  <span className="bag-delivery-title">Estimated Delivery</span>
                  <span className="bag-delivery-desc">
                    {quote?.deliveryEstimation?.exactDeliveryDate ? (
                      quote.deliveryEstimation.exactDeliveryDate
                    ) : pincode.length === 6 ? (
                      /^(67|68|69)/.test(pincode) ? '2 to 5 business days (Kerala Express)' : '7 to 14 business days (National Courier)'
                    ) : (
                      'Enter PIN code for delivery window'
                    )}
                  </span>
                  <span className="bag-delivery-sub">
                    Direct dispatch from Kannur
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <Link href="/bag/checkout" className="bag-checkout-cta">
                <span>Proceed to Checkout</span>
                <span aria-hidden="true">→</span>
              </Link>

              {/* Security & Customer Assurance */}
              <div className="bag-trust-strip">
                <div className="bag-trust-item">
                  <ShieldCheck className="w-4 h-4 bag-trust-icon" />
                  <span>256-bit encrypted secure Razorpay payment</span>
                </div>
                <div className="bag-trust-item">
                  <RefreshCw className="w-4 h-4 bag-trust-icon" />
                  <span>Free 7-day doorstep size &amp; fit exchanges</span>
                </div>
              </div>

              {/* Payment Methods Pill Strip */}
              <div className="bag-payment-methods">
                <span className="bag-payment-pill">UPI</span>
                <span className="bag-payment-pill">GPay</span>
                <span className="bag-payment-pill">PhonePe</span>
                <span className="bag-payment-pill">Paytm</span>
                <span className="bag-payment-pill">Cards</span>
                <span className="bag-payment-pill">NetBanking</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Fixed Mobile Sticky Bottom Action Bar (< 768px) ── */}
      <div className="bag-mobile-sticky-bar" aria-label="Mobile Checkout Bar">
        <div className="bag-mobile-sticky-info">
          <span className="bag-mobile-sticky-label">Estimated Total</span>
          <span className="bag-mobile-sticky-total">{formatPrice(total)}</span>
        </div>
        <Link href="/bag/checkout" className="bag-mobile-sticky-btn">
          <span>Checkout</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}

