'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/lib/constants'
import { cartCount, cartSubtotal, useCartStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

interface CheckoutForm {
  name: string
  phone: string
  email: string
  address: string
  apartment: string
  city: string
  state: string
  pincode: string
  notes: string
}

const INITIAL_FORM: CheckoutForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  pincode: '',
  notes: ''
}

export default function CheckoutClient() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const [form, setForm] = useState<CheckoutForm>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string
    summary: string
    handoffType: 'whatsapp' | 'email'
  } | null>(null)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
  }, [])

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CheckoutForm, string>> = {}

    if (!form.name.trim()) nextErrors.name = 'Full name is required'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Valid 10-digit phone number is required'
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      nextErrors.email = 'Valid email address is required'
    }
    if (!form.address.trim()) nextErrors.address = 'Street address is required'
    if (!form.city.trim()) nextErrors.city = 'City is required'
    if (!form.state.trim()) nextErrors.state = 'State is required'
    if (!form.pincode.trim() || form.pincode.replace(/\D/g, '').length !== 6) {
      nextErrors.pincode = 'Valid 6-digit PIN code is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const orderId = `INF-${Date.now().toString().slice(-6)}`
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '')

    const itemLines = items
      .map((item, index) => {
        const spec = [item.fit ? `${item.fit} Fit` : null, `Size ${item.size}`, item.wash]
          .filter(Boolean)
          .join(', ')
        return `${index + 1}. ${item.name} (${spec})\n   Qty: ${item.qty} | ${formatPrice(item.priceNum * item.qty)}`
      })
      .join('\n')

    const messageLines = [
      `*INFIT ORDER REQUEST [${orderId}]*`,
      '--------------------------------',
      '*Customer Information:*',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Email: ${form.email.trim()}`,
      '',
      '*Delivery Address:*',
      form.address.trim(),
      form.apartment.trim() ? form.apartment.trim() : null,
      `${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
      form.notes.trim() ? `Delivery Notes: ${form.notes.trim()}` : null,
      '',
      '*Ordered Silhouettes:*',
      itemLines,
      '',
      '*Bill Summary:*',
      `Subtotal: ${formatPrice(subtotal)}`,
      `Shipping: ${shipping === 0 ? 'FREE' : formatPrice(shipping)}`,
      `Total Payable: ${formatPrice(total)}`,
      'Payment Preference: Cash on Delivery / UPI on Confirmation',
      '--------------------------------',
      'Please confirm availability and dispatch schedule.'
    ]
      .filter(Boolean)
      .join('\n')

    let handoffType: 'whatsapp' | 'email' = 'email'

    if (whatsappNumber) {
      handoffType = 'whatsapp'
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageLines)}`
      window.open(waUrl, '_blank')
    } else {
      handoffType = 'email'
      const mailtoUrl = `mailto:orders@infit.in?subject=${encodeURIComponent(
        `INFIT Order ${orderId} - ${form.name.trim()}`
      )}&body=${encodeURIComponent(messageLines)}`
      window.open(mailtoUrl, '_blank')
    }

    // Persist order manifest to backend database
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:4000'
    void fetch(`${backendUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: orderId,
        store: 'infit',
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim(),
        address: form.address.trim(),
        apartment: form.apartment.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        notes: form.notes.trim() || undefined,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          fit: item.fit,
          size: String(item.size),
          price: item.price,
          priceNum: item.priceNum,
          quantity: item.qty,
          img: item.img
        })),
        subtotal,
        shipping,
        total,
        handoffType
      })
    }).catch((err) => {
      console.warn('[INFIT] Order persistence note:', err)
    })

    // Save to local storage for user order history
    try {
      const existingOrdersStr = typeof window !== 'undefined' ? localStorage.getItem('infit-orders') : null
      const existingOrders = existingOrdersStr ? JSON.parse(existingOrdersStr) : []
      const newStoredOrder = {
        orderId,
        date: 'Today, Just now',
        status: 'Confirmed',
        expectedDelivery: 'In 2–4 business days',
        items: items.map((i) => ({ ...i })),
        subtotal,
        shipping,
        total,
        shippingAddress: `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} · ${form.pincode.trim()}`
      }
      localStorage.setItem('infit-orders', JSON.stringify([newStoredOrder, ...existingOrders]))
    } catch (e) {
      console.warn('Failed to store order locally', e)
    }

    setSubmittedOrder({
      orderId,
      summary: messageLines,
      handoffType
    })

    clearCart()
  }

  if (submittedOrder) {
    return (
      <main className="checkout-page">
        <div className="checkout-container confirmation-card">
          <div className="confirmation-header">
            <span className="confirmation-badge">ORDER INITIATED</span>
            <h1 className="confirmation-title">Thank you, {form.name.split(' ')[0]}.</h1>
            <p className="confirmation-lead">
              Reference code: <strong>{submittedOrder.orderId}</strong>
            </p>
          </div>

          <div className="confirmation-body">
            <p>
              Your order summary was handed off via{' '}
              {submittedOrder.handoffType === 'whatsapp' ? 'WhatsApp' : 'email'} to our studio team.
              We will confirm your sizing, reserve the pairs from inventory, and send tracking
              details once dispatched.
            </p>

            <details className="confirmation-details">
              <summary>View order transmission copy</summary>
              <pre className="order-summary-raw">{submittedOrder.summary}</pre>
            </details>
          </div>

          <div className="confirmation-actions">
            <Link href="/" className="button primary">
              Return to Catalog
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (count === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-container empty-checkout-card">
          <span className="cart-empty-badge">BAG EMPTY</span>
          <h1 className="empty-title">Your shopping bag is empty</h1>
          <p className="empty-desc">
            Select a denim silhouette and choose your waist size before checking out.
          </p>
          <Link href="/" className="button primary">
            Explore All Silhouettes <i>↗</i>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Storefront</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Checkout</span>
          </nav>
          <h1 className="checkout-title">Order Checkout</h1>
          <p className="checkout-subtitle">
            Provide your delivery details. We will prepare your dispatch manifest and hand off the order
            to our studio team.
          </p>
        </div>

        <div className="checkout-grid">
          {/* Order Form */}
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <h2 className="section-heading">1. Contact Information</h2>
              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Kabir Mehta"
                    className={errors.name ? 'has-error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="field-group">
                  <label htmlFor="phone">Phone Number (10 digits) *</label>
                  <input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="9876543210"
                    className={errors.phone ? 'has-error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="kabir@example.com"
                    className={errors.email ? 'has-error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-heading">2. Delivery Address</h2>
              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="address">Street Address *</label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="14 Lotus Court, Bandra West"
                    className={errors.address ? 'has-error' : ''}
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="apartment">Apartment, Floor, Suite (Optional)</label>
                  <input
                    id="apartment"
                    type="text"
                    value={form.apartment}
                    onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                    placeholder="Flat 4B, 4th Floor"
                  />
                </div>
              </div>

              <div className="form-row form-row-3">
                <div className="field-group">
                  <label htmlFor="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Mumbai"
                    className={errors.city ? 'has-error' : ''}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="state">State *</label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Maharashtra"
                    className={errors.state ? 'has-error' : ''}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="pincode">PIN Code *</label>
                  <input
                    id="pincode"
                    type="text"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="400050"
                    className={errors.pincode ? 'has-error' : ''}
                  />
                  {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="notes">Delivery Notes (Optional)</label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Leave with security or call on arrival"
                  />
                </div>
              </div>
            </div>

            <div className="form-section submit-section">
              <button type="submit" className="button primary checkout-submit-btn">
                <span>
                  {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
                    ? 'Place Order via WhatsApp'
                    : 'Place Order via Email'}
                </span>
                <span>{formatPrice(total)} ↗</span>
              </button>
              <p className="submit-footnote">
                No upfront card payment required. Payment is collected via Cash on Delivery or UPI
                upon order confirmation by our studio.
              </p>
            </div>
          </form>

          {/* Order Summary Sidebar */}
          <aside className="checkout-summary-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <span className="summary-label">MANIFEST // {count} ITEMS</span>
                <h2 className="summary-title">Bag Summary</h2>
              </div>

              <div className="summary-items">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="summary-item">
                    <Image
                      src={item.img}
                      alt={item.name}
                      width={56}
                      height={70}
                      className="summary-item-img"
                    />
                    <div className="summary-item-info">
                      <h3 className="summary-item-name">{item.name}</h3>
                      <p className="summary-item-meta">
                        {[item.fit ? `${item.fit} Fit` : null, `Size ${item.size}`, `Qty ${item.qty}`].filter(Boolean).join(' · ')}
                      </p>
                      <span className="summary-item-price">
                        {formatPrice(item.priceNum * item.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="total-row total-row-final">
                  <span>Estimated Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="summary-badges">
                <div className="badge-item">
                  <span className="badge-icon">✓</span>
                  <span>Free 7-Day Size Exchanges</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">✓</span>
                  <span>24h Dispatch from Mumbai</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">✓</span>
                  <span>Cash on Delivery Supported</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
