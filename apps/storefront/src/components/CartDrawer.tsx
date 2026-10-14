'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cartCount, cartSubtotal, useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry']
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface DeliveryQuote { subtotal: number; shipping: number; total: number; weightGrams: number }

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const addresses = useAuthStore((state) => state.addresses)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [deliveryState, setDeliveryState] = useState('')
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (!deliveryState && addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr?.state) {
        setDeliveryState(defaultAddr.state)
      }
    }
  }, [addresses, deliveryState])

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
      body: JSON.stringify({ state: deliveryState, items: items.map((item) => ({ id: item.id, variantId: item.variantId, size: String(item.size), quantity: item.qty })) }),
      signal: controller.signal
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not calculate delivery for this cart.')
      setQuote(payload as DeliveryQuote)
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setQuoteError(error instanceof Error ? error.message : 'Could not calculate delivery for this cart.')
    }).finally(() => { if (!controller.signal.aborted) setQuoteLoading(false) })
    return () => controller.abort()
  }, [deliveryState, items])

  const open = overlay === 'cart'
  const subtotal = cartSubtotal(items)

  return (
    <div
      className={`cart-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
        <div className="cart-header">
          <div className="cart-title-wrap">
            <span className="cart-sys-label">MANIFEST // BAG SPEC</span>
            <h2>
              Your Bag <span className="cart-count-badge">({cartCount(items)})</span>
            </h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close bag" onClick={closeOverlay}>
            ✕
          </button>
        </div>

        <div className="cart-delivery-note">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-2)' }}>
              Delivery Location
            </span>
            {addresses && addresses.length > 0 ? (
              <Link
                href="/profile?tab=addresses"
                onClick={closeOverlay}
                style={{ fontSize: '12px', color: 'var(--ink-3)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Saved address
              </Link>
            ) : (
              <Link
                href={isAuthenticated ? '/profile?tab=addresses' : '/login?redirect=/profile'}
                onClick={closeOverlay}
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}
              >
                + Add location
              </Link>
            )}
          </div>
          <select
            id="cart-delivery-state"
            value={deliveryState}
            onChange={(event) => setDeliveryState(event.target.value)}
            style={{
              height: '40px',
              width: '100%',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              padding: '0 12px',
              fontSize: '13px',
              color: 'var(--ink)',
              fontFamily: 'inherit'
            }}
          >
            <option value="">Select location</option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {quoteLoading && <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--ink-3)' }}>Calculating delivery…</p>}
          {quote && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--ink-2)' }}>
              Estimated parcel weight: {quote.weightGrams.toLocaleString('en-IN')} g
            </p>
          )}
          {quoteError && (
            <p role="alert" style={{ margin: '6px 0 0', fontSize: '11px', color: '#dc2626' }}>
              {quoteError}
            </p>
          )}
        </div>

        <div className="cart-items-list">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-badge">BAG STATUS // EMPTY</span>
              <h3 className="cart-empty-title">Nothing here yet</h3>
              <p>Your bag is empty. Find your fit and add your first piece.</p>
              <button type="button" className="button primary" onClick={closeOverlay}>
                Continue shopping <i>↗</i>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={`${item.id}-${item.variantId ?? item.size}`}>
                <Image src={item.img} alt={item.name} width={68} height={84} className="cart-item-img" />
                <div className="cart-item-details">
                  <div className="cart-item-top">
                    <div>
                      <h4 className="cart-item-title">{item.name}</h4>
                      <p className="cart-item-spec">
                        {[item.color, item.fit ? `${item.fit} Fit` : null, `Size ${item.size}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      className="cart-item-remove"
                      type="button"
                      title="Remove item"
                      onClick={() => removeItem(item.id, item.size, item.variantId)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-stepper">
                      <button type="button" className="cart-dec" onClick={() => updateQty(item.id, item.size, -1, item.variantId)}>
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" className="cart-inc" onClick={() => updateQty(item.id, item.size, 1, item.variantId)}>
                        +
                      </button>
                    </div>
                    <strong className="cart-item-price">{formatPrice(item.priceNum * item.qty)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{formatPrice(quote?.subtotal ?? subtotal)}</span>
              </div>
              <div className="summary-line">
                <span>Delivery charge</span>
                <span>{quote ? formatPrice(quote.shipping) : deliveryState ? 'Calculating…' : 'Select location'}</span>
              </div>
              <div className="summary-line total-line">
                <span>{quote ? 'Estimated total' : 'Subtotal before delivery'}</span>
                <span>{formatPrice(quote?.total ?? subtotal)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="button primary checkout-btn"
              onClick={closeOverlay}
            >
              Proceed to Checkout <i>↗</i>
            </Link>
            <p className="cart-guarantee">✦ Free 7-day exchanges · COD available across India</p>
          </div>
        )}
      </div>
    </div>
  )
}
