'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Truck,
  MapPin,
  ArrowRight,
  Plus,
  Heart,
  Trash2,
  RefreshCw,
  Lock,
  Shield,
  Check
} from 'lucide-react'
import {
  cartCount,
  cartSubtotal,
  useCartStore,
  useUIStore,
  useAuthStore,
  useFavoriteStore,
  type CartItem
} from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { PRODUCTS, type Product } from '@/lib/constants'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const FREE_SHIPPING_THRESHOLD = 3000

interface DeliveryQuote {
  subtotal: number
  shipping: number
  total: number
  weightGrams: number
}

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const addItem = useCartStore((state) => state.addItem)

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
    void useUIStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  // Auto-fill from user's default saved address
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

  const verifyPincode = async (code: string) => {
    const cleaned = code.replace(/\D/g, '').slice(0, 6)
    if (cleaned.length !== 6) {
      setPincodeError('Please enter a valid 6-digit PIN code')
      return
    }

    setPincodeLoading(true)
    setPincodeError('')

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
  }

  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setPincode(cleaned)
    setPincodeError('')
    if (cleaned.length === 6) {
      void verifyPincode(cleaned)
    } else {
      setPincodeLocation('')
      setDeliveryState('')
      setQuote(null)
    }
  }

  // Delivery quote calculation
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
        if (!response.ok) throw new Error(payload.error || 'Could not calculate delivery for this cart.')
        setQuote(payload as DeliveryQuote)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setQuoteError(error instanceof Error ? error.message : 'Could not calculate delivery for this cart.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false)
      })
    return () => controller.abort()
  }, [deliveryState, items])

  const open = overlay === 'cart'
  const subtotal = cartSubtotal(items)
  const count = cartCount(items)

  // Free shipping calculation
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

  // Move item to wishlist
  const handleMoveToWishlist = (item: CartItem) => {
    toggleFavorite(item.id)
    removeItem(item.id, item.size, item.variantId)
    showToast(`Moved ${item.name} to wishlist`)
  }

  // Clear bag
  const handleClearBag = () => {
    clearCart()
    showToast('Shopping bag cleared')
  }

  // Curated cross-sell recommendations
  const crossSellProducts = useMemo(() => {
    const inCartIds = new Set(items.map((i) => i.id))
    return PRODUCTS.filter((p) => !inCartIds.has(p.id)).slice(0, 3)
  }, [items])

  const handleQuickAdd = (product: Product) => {
    const defaultSize = product.sizes?.[0] || 'M'
    addItem(product.id, defaultSize, product)
    showToast(`Added ${product.name} (${defaultSize}) to bag`)
  }

  return (
    <div
      className={`cart-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
        {/* Mobile Pull Handle */}
        <div className="cart-drawer-handle" aria-hidden="true" />

        {/* 1. Header */}
        <div className="bag-header">
          <div className="bag-header-info">
            <span className="bag-eyebrow">TEESGARAGE</span>
            <h2 className="bag-title">
              Your Bag <span>({count})</span>
            </h2>
            <p className="bag-subtitle">Looks good on you.</p>
          </div>
          <button
            className="bag-close-btn"
            type="button"
            aria-label="Close shopping bag"
            onClick={closeOverlay}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="bag-body">
          {/* 2. Free Shipping Progress Bar */}
          <div className="bag-shipping-box">
          <div className="bag-shipping-row">
            <div className="bag-shipping-left">
              <Truck className="h-4 w-4 text-zinc-800 shrink-0" />
              <span>
                {amountToFreeShipping > 0 ? (
                  <>
                    Add <strong>{formatPrice(amountToFreeShipping)}</strong> more for free shipping
                  </>
                ) : (
                  <strong>You&apos;ve unlocked free shipping!</strong>
                )}
              </span>
            </div>
            <span className="bag-shipping-goal">{formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
          </div>
          <div className="bag-shipping-bar-track">
            <div
              className="bag-shipping-bar-fill"
              style={{ width: `${freeShippingPct}%` }}
            />
          </div>
        </div>

        {/* 3. Delivery Section */}
        <div className="bag-delivery-section">
          <div className="bag-delivery-header">
            <div className="bag-delivery-title">
              <MapPin className="h-4 w-4 text-zinc-700" />
              <span>Delivery to</span>
            </div>
            {addresses && addresses.length > 0 ? (
              <Link
                href="/profile?tab=addresses"
                onClick={closeOverlay}
                className="bag-delivery-add"
              >
                Saved addresses
              </Link>
            ) : (
              <Link
                href={isAuthenticated ? '/profile?tab=addresses' : '/login?redirect=/profile'}
                onClick={closeOverlay}
                className="bag-delivery-add"
              >
                + Add new
              </Link>
            )}
          </div>
          <div className="bag-delivery-input-row">
            <input
              id="bag-delivery-pincode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder="Enter 6-digit PIN code (e.g. 682001)"
              aria-label="Delivery PIN code"
              className="bag-pincode-input"
            />
            <button
              type="button"
              className="bag-check-btn"
              onClick={() => verifyPincode(pincode)}
              disabled={pincodeLoading}
            >
              {pincodeLoading ? 'Checking…' : 'Check'}
            </button>
          </div>

          {pincodeLocation && !pincodeError && (
            <p className="bag-delivery-verified">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>
                Delivering to <strong>{pincodeLocation}</strong>
                {quote ? ` · Delivery: ${quote.shipping === 0 ? 'Free' : formatPrice(quote.shipping)}` : ''}
              </span>
            </p>
          )}

          {!pincodeLocation && !pincodeError && (
            <p className="bag-delivery-note">
              Enter your pincode to see delivery options and charges.
            </p>
          )}

          {pincodeError && (
            <p role="alert" className="bag-delivery-error">
              {pincodeError}
            </p>
          )}
          {quoteError && !pincodeError && (
            <p role="alert" className="bag-delivery-error">
              {quoteError}
            </p>
          )}
        </div>

        {/* 4. Items List */}
        <div className="bag-items-section">
          <div className="bag-items-header">
            <span className="bag-items-title">Items ({count})</span>
            {count > 0 && (
              <button
                type="button"
                className="bag-clear-btn"
                onClick={handleClearBag}
              >
                Clear bag
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bag-empty-state">
              <p className="bag-empty-title">Your bag is empty</p>
              <p className="bag-empty-desc">
                Find your fit from our heavyweight combed cotton collections.
              </p>
              <Link
                href="/shop"
                className="bag-empty-cta"
                onClick={closeOverlay}
              >
                Explore shop ↗
              </Link>
            </div>
          ) : (
            <div className="bag-items-list">
              {items.map((item) => (
                <div className="bag-item" key={`${item.id}-${item.variantId ?? item.size}`}>
                  <Link href={getProductUrl(item)} onClick={closeOverlay}>
                    <Image
                      src={item.img}
                      alt={item.name}
                      width={76}
                      height={92}
                      className="bag-item-img"
                    />
                  </Link>

                  <div className="bag-item-content">
                    <div className="bag-item-top">
                      <div className="bag-item-meta">
                        <div className="bag-item-title-row">
                          <Link href={getProductUrl(item)} onClick={closeOverlay}>
                            <h4 className="bag-item-title">{item.name}</h4>
                          </Link>
                          <button
                            className="bag-item-remove-x"
                            type="button"
                            title="Remove item"
                            onClick={() => removeItem(item.id, item.size, item.variantId)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="bag-item-spec-row">
                          <p className="bag-item-spec">
                            {[
                              item.color,
                              item.fit ? `${item.fit} Fit` : null,
                              `Size ${item.size}`
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <strong className="bag-item-price bag-item-price-desktop">
                            {formatPrice(item.priceNum * item.qty)}
                          </strong>
                        </div>

                        <strong className="bag-item-price bag-item-price-mobile">
                          {formatPrice(item.priceNum * item.qty)}
                        </strong>
                      </div>
                    </div>

                    <div className="bag-item-actions">
                      <div className="bag-stepper">
                        <button
                          type="button"
                          className="bag-stepper-btn"
                          onClick={() => updateQty(item.id, item.size, -1, item.variantId)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="bag-stepper-count">{item.qty}</span>
                        <button
                          type="button"
                          className="bag-stepper-btn"
                          onClick={() => updateQty(item.id, item.size, 1, item.variantId)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="bag-wishlist-btn"
                        onClick={() => handleMoveToWishlist(item)}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        <span>Move to wishlist</span>
                      </button>

                      <button
                        type="button"
                        className="bag-trash-btn"
                        onClick={() => removeItem(item.id, item.size, item.variantId)}
                        title="Delete item"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. You might also like (Cross-sell grid) */}
          {crossSellProducts.length > 0 && (
            <div className="bag-crosssell">
              <div className="bag-crosssell-header">
                <span className="bag-crosssell-title">You might also like</span>
                <Link
                  href="/shop"
                  onClick={closeOverlay}
                  className="bag-crosssell-link"
                >
                  See all →
                </Link>
              </div>

              <div className="bag-crosssell-grid">
                {crossSellProducts.map((p) => (
                  <div key={`cross-${p.id}`} className="bag-crosssell-card">
                    <Link
                      href={getProductUrl(p)}
                      onClick={closeOverlay}
                      className="bag-crosssell-img-wrap"
                      aria-label={`View ${p.name}`}
                    >
                      <Image
                        src={p.img}
                        alt={p.name}
                        width={120}
                        height={120}
                        className="bag-crosssell-img"
                      />
                    </Link>
                    <div className="bag-crosssell-info">
                      <div className="bag-crosssell-meta">
                        <Link
                          href={getProductUrl(p)}
                          onClick={closeOverlay}
                          className="bag-crosssell-name-link"
                        >
                          <p className="bag-crosssell-name" title={p.name}>
                            {p.name}
                          </p>
                        </Link>
                        <p className="bag-crosssell-price">{formatPrice(p.priceNum)}</p>
                      </div>
                      <button
                        type="button"
                        className="bag-crosssell-add-btn"
                        title={`Add ${p.name} to bag`}
                        aria-label={`Add ${p.name} to bag`}
                        onClick={() => handleQuickAdd(p)}
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span className="bag-crosssell-add-text">Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        {/* 6. Footer & Totals */}
        {items.length > 0 && (
          <div className="bag-footer">
            <div className="bag-summary">
              <div className="bag-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(quote?.subtotal ?? subtotal)}</span>
              </div>
              <div className="bag-summary-row">
                <span>Delivery charge</span>
                <span>
                  {quote
                    ? quote.shipping === 0
                      ? 'Free'
                      : formatPrice(quote.shipping)
                    : deliveryState
                      ? 'Calculating…'
                      : 'Enter PIN code'}
                </span>
              </div>
              <div className="bag-summary-row total">
                <span>Total before delivery</span>
                <span className="price">{formatPrice(quote?.total ?? subtotal)}</span>
              </div>
            </div>

            <div className="bag-footer-actions">
              <Link
                href="/bag/checkout"
                className="bag-checkout-btn"
                onClick={closeOverlay}
              >
                <span>Proceed to checkout</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
              <Link
                href="/bag"
                className="bag-view-btn"
                onClick={closeOverlay}
              >
                <span>View full bag ({count})</span>
              </Link>
            </div>

            <div className="bag-trust-badges">
              <div className="bag-trust-badge">
                <RefreshCw className="h-3 w-3 shrink-0" />
                <span>Free 7-day exchanges</span>
              </div>
              <div className="bag-trust-badge">
                <Lock className="h-3 w-3 shrink-0" />
                <span>Secure Razorpay payment</span>
              </div>
              <div className="bag-trust-badge">
                <Shield className="h-3 w-3 shrink-0" />
                <span>Easy returns</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
