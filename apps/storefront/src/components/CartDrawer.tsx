'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cartCount, cartSubtotal, useCartStore, useUIStore } from '@/lib/store'
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
  const [deliveryState, setDeliveryState] = useState('')
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

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
          <label htmlFor="cart-delivery-state" className="cart-delivery-note-text">Delivery is paid and based on location and total parcel weight.</label>
          <select id="cart-delivery-state" value={deliveryState} onChange={(event) => setDeliveryState(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink">
            <option value="">Choose delivery state to calculate</option>
            {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          {quoteLoading && <p className="mt-1 text-xs text-ink-3">Calculating delivery…</p>}
          {quote && <p className="mt-1 text-xs text-ink-2">Estimated parcel weight: {quote.weightGrams.toLocaleString('en-IN')} g</p>}
          {quoteError && <p role="alert" className="mt-1 text-xs text-danger">{quoteError}</p>}
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
                <span>{quote ? formatPrice(quote.shipping) : deliveryState ? 'Calculating…' : 'Choose state'}</span>
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
