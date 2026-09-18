'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '@/lib/constants'
import { cartCount, cartSubtotal, useCartStore, useUIStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  const open = overlay === 'cart'
  const subtotal = cartSubtotal(items)
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal
  const unlocked = remaining <= 0
  const shipping = unlocked ? 0 : SHIPPING_FEE
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)

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

        <div className="free-shipping-bar">
          <div className="free-shipping-text">
            {subtotal === 0 ? (
              <>
                Add <b>{formatPrice(FREE_SHIPPING_THRESHOLD)}</b> more for FREE Shipping
              </>
            ) : unlocked ? (
              <>
                <span>✓ FREE SHIPPING UNLOCKED</span> <b>₹0</b>
              </>
            ) : (
              <>
                Add <b>{formatPrice(remaining)}</b> more for FREE Shipping
              </>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="cart-items-list">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-badge">BAG STATUS // EMPTY</span>
              <h3 className="cart-empty-title">Nothing here yet</h3>
              <p>Your bag is empty. Find your fit and add your first pair of jeans.</p>
              <button type="button" className="button primary" onClick={closeOverlay}>
                Continue shopping <i>↗</i>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={`${item.id}-${item.size}`}>
                <Image src={item.img} alt={item.name} width={68} height={84} className="cart-item-img" />
                <div className="cart-item-details">
                  <div className="cart-item-top">
                    <div>
                      <h4 className="cart-item-title">{item.name}</h4>
                      <p className="cart-item-spec">
                        {item.fit} · Size {item.size} · {item.wash}
                      </p>
                    </div>
                    <button
                      className="cart-item-remove"
                      type="button"
                      title="Remove item"
                      onClick={() => removeItem(item.id, item.size)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="cart-stepper">
                      <button type="button" className="cart-dec" onClick={() => updateQty(item.id, item.size, -1)}>
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" className="cart-inc" onClick={() => updateQty(item.id, item.size, 1)}>
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
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="summary-line total-line">
                <span>Estimated Total</span>
                <span>{formatPrice(subtotal + shipping)}</span>
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
