'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  cartCount,
  cartSubtotal,
  useCartStore,
  useUIStore
} from '@/lib/store'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'

export default function CartDrawer() {
  const isCartOpen = useUIStore((state) => state.isCartOpen)
  const closeCart = useUIStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const diffToFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const shippingPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

  return (
    <div
      className={`cart-drawer-backdrop ${isCartOpen ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCart()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Shopping Bag ({count})</h2>
          <button
            type="button"
            className="cart-close-btn"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="cart-shipping-meter">
          <span className="shipping-meter-text">
            {diffToFree === 0 ? (
              <span>🎉 You have unlocked <strong>Free Express Delivery!</strong></span>
            ) : (
              <span>
                Add <strong>₹{diffToFree.toLocaleString()}</strong> more for Free Delivery
              </span>
            )}
          </span>
          <div className="shipping-meter-track">
            <div
              className="shipping-meter-fill"
              style={{ width: `${shippingPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        {items.length === 0 ? (
          <div className="cart-empty-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h3 className="cart-empty-title">Your bag is empty</h3>
            <p className="cart-empty-desc">
              Discover heavyweight tees, shirts, and contemporary silhouettes.
            </p>
            <button
              type="button"
              className="btn-add-to-cart"
              style={{ marginTop: '20px', width: 'auto', padding: '0 24px' }}
              onClick={closeCart}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-items-list">
            {items.map((item) => (
              <div key={item.id} className="cart-item-row">
                <Image
                  src={item.img}
                  alt={item.name}
                  width={72}
                  height={90}
                  className="cart-item-img"
                />
                <div className="cart-item-details">
                  <div>
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-meta">
                      Size: <strong>{item.size}</strong> · Color: <strong>{item.color}</strong>
                    </p>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-qty-picker">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="cart-qty-val">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-item-price">{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with Summary & Checkout */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-line">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-summary-line">
              <span>Standard Shipping</span>
              <span>{diffToFree === 0 ? 'FREE' : '₹99'}</span>
            </div>
            <div className="cart-summary-line total">
              <span>Estimated Total</span>
              <span>₹{(subtotal + (diffToFree === 0 ? 0 : 99)).toLocaleString()}</span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="cart-checkout-btn"
            >
              Checkout with Instant Express →
            </Link>
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              🔒 256-Bit Encrypted Checkout · Doorstep Reverse Exchanges
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
