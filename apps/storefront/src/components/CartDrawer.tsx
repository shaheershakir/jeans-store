'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cartCount, cartSubtotal, useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'

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
  }, [])

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/bag"
              onClick={closeOverlay}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink-secondary, #3f4753)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px'
              }}
            >
              View Full Bag ↗
            </Link>
            <button className="modal-close" type="button" aria-label="Close bag" onClick={closeOverlay}>
              ✕
            </button>
          </div>
        </div>

        <div className="cart-delivery-note">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-2)' }}>
              Delivery PIN Code
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
          <div style={{ position: 'relative' }}>
            <input
              id="cart-delivery-pincode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder="Enter 6-digit PIN code (e.g. 682001)"
              aria-label="Delivery PIN code"
              style={{
                height: '42px',
                width: '100%',
                borderRadius: '2px',
                border: pincodeError ? '1px solid #dc2626' : '1px solid var(--line, #d6d7d3)',
                background: 'var(--surface, #ffffff)',
                padding: '0 12px',
                fontSize: '13px',
                color: 'var(--ink, #0c0e12)',
                fontFamily: 'inherit',
                outline: 'none',
                boxShadow: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />
            {pincodeLoading && (
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  color: 'var(--ink-3, #71717a)'
                }}
              >
                Locating…
              </span>
            )}
          </div>
          {pincodeLocation && (
            <div style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink, #0c0e12)' }}>
              <span style={{ fontSize: '13px' }}>📍</span>
              <span>
                Delivering to <strong>{pincodeLocation}</strong>
              </span>
            </div>
          )}
          {quoteLoading && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--ink-3, #71717a)' }}>
              Calculating delivery…
            </p>
          )}
          {quote && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--ink-2, #374151)' }}>
              Delivery charge: <strong>{formatPrice(quote.shipping)}</strong>
            </p>
          )}
          {pincodeError && (
            <p role="alert" style={{ margin: '6px 0 0', fontSize: '11px', color: '#dc2626' }}>
              {pincodeError}
            </p>
          )}
          {quoteError && !pincodeError && (
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
                <Link href={getProductUrl(item)} onClick={closeOverlay}>
                  <Image src={item.img} alt={item.name} width={68} height={84} className="cart-item-img" />
                </Link>
                <div className="cart-item-details">
                  <div className="cart-item-top">
                    <div>
                      <Link href={getProductUrl(item)} onClick={closeOverlay}>
                        <h4 className="cart-item-title">{item.name}</h4>
                      </Link>
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
                <span>{quote ? formatPrice(quote.shipping) : deliveryState ? 'Calculating…' : 'Enter PIN code'}</span>
              </div>
              <div className="summary-line total-line">
                <span>{quote ? 'Estimated total' : 'Subtotal before delivery'}</span>
                <span>{formatPrice(quote?.total ?? subtotal)}</span>
              </div>
            </div>
            <div className="cart-footer-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/bag/checkout"
                className="button primary checkout-btn"
                onClick={closeOverlay}
              >
                Proceed to Checkout <i>↗</i>
              </Link>
              <Link
                href="/bag"
                className="button secondary cart-view-bag-btn"
                onClick={closeOverlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '11px 16px',
                  background: 'var(--bone, #f8f8f6)',
                  color: 'var(--ink, #0c0e12)',
                  border: '1px solid var(--line-strong, #d1d5db)',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>View Shopping Bag</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>({cartCount(items)})</span>
                <i>↗</i>
              </Link>
            </div>
            <p className="cart-guarantee">✦ Free 7-day exchanges · Secure Razorpay payment</p>
          </div>
        )}
      </div>
    </div>
  )
}
