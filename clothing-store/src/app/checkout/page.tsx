'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cartCount, cartSubtotal, useCartStore, useUIStore } from '@/lib/store'
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, STORE_NAME } from '@/lib/constants'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const showToast = useUIStore((state) => state.showToast)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [placed, setPlaced] = useState(false)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
  }, [])

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE
  const total = subtotal + shipping

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPlaced(true)
    showToast('Order confirmed! Our dispatch concierge is preparing your pieces.')
    clearCart()
  }

  if (placed) {
    return (
      <div className="container" style={{ padding: '80px 16px', maxWidth: '560px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '12px' }}>
          Thank You, {name || 'Valued Customer'}!
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '28px' }}>
          Your order has been logged into our atelier dispatch system. You will receive an SMS and WhatsApp tracking update within 2 hours.
        </p>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '32px', textAlign: 'left', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery:</span>
            <strong>2–3 Business Days</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
            <strong>Cash on Delivery / UPI upon Handover</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
            <strong>₹{total.toLocaleString()}</strong>
          </div>
        </div>
        <Link href="/" className="btn-add-to-cart" style={{ display: 'inline-flex', width: 'auto', padding: '0 32px' }}>
          Return to Studio Catalog
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 16px', maxWidth: '480px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Your Bag is Empty</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You have no garments currently in your bag to checkout.
        </p>
        <Link href="/" className="btn-add-to-cart" style={{ display: 'inline-flex', width: 'auto', padding: '0 28px' }}>
          Browse Collection
        </Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '40px 16px 80px', maxWidth: '960px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '28px' }}>
        Instant Express Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px' }}>
        {/* Shipping Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Shipping Destination
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun Mehta"
              style={{ width: '100%', height: '44px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '0 12px', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width: '100%', height: '44px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '0 12px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                style={{ width: '100%', height: '44px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '0 12px', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Delivery Address *
            </label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat / House No, Building, Street, Landmark"
              style={{ width: '100%', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                style={{ width: '100%', height: '44px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '0 12px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                PIN Code *
              </label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="400001"
                style={{ width: '100%', height: '44px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', padding: '0 12px', fontSize: '14px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-add-to-cart" style={{ marginTop: '12px' }}>
            Confirm Order &amp; Express Dispatch →
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
            Order Summary ({count})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Image src={it.img} alt={it.name} width={50} height={62} style={{ borderRadius: '4px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Size: {it.size} · Color: {it.color} · Qty: {it.quantity}</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{it.price}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Express Delivery</span>
              <span>{shipping === 0 ? 'FREE' : '₹99'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <span>Total Due</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
