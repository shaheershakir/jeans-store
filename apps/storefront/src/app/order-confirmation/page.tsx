'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, MapPin, PackageCheck } from 'lucide-react'
import { format } from 'date-fns'
import { formatPrice } from '@/lib/utils'

interface ConfirmationItem {
  id: number
  name: string
  fit?: string
  size: string
  quantity: number
  price?: string
  priceNum?: number
  img?: string
  color?: string
  wash?: string
}

interface OrderConfirmation {
  orderNumber: string
  paymentId: string
  paymentMethod?: 'cod' | 'online'
  total: number
  subtotal: number
  shipping: number
  createdAt: string
  customerName: string
  address: string
  apartment: string
  city: string
  state: string
  pincode: string
  items: ConfirmationItem[]
}

const STORAGE_KEY = 'teesgarage-order-confirmation'

function ConfirmationItemRow({ item }: { item: ConfirmationItem }) {
  const detail = [item.fit, `Size ${item.size}`, item.color || item.wash]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="order-confirmation-item">
      <div className="order-confirmation-image">
        {item.img ? (
          <Image src={item.img} alt={item.name} width={112} height={140} unoptimized />
        ) : (
          <span>TEESGARAGE</span>
        )}
      </div>
      <div className="order-confirmation-item-info">
        <span className="order-confirmation-overline">{item.fit || 'TEESGARAGE'}</span>
        <h2>{item.name}</h2>
        <p>{detail}</p>
        <span className="order-confirmation-quantity">Qty {item.quantity}</span>
      </div>
      <strong className="order-confirmation-item-price">
        {formatPrice(Number(item.priceNum ?? 0) * item.quantity)}
      </strong>
    </article>
  )
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderConfirmation | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY)
      if (saved) setOrder(JSON.parse(saved) as OrderConfirmation)
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } finally {
      setReady(true)
    }
  }, [])

  if (!ready) {
    return (
      <main className="order-confirmation-page" aria-busy="true">
        <div className="order-confirmation-loading">Loading your receipt…</div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="order-confirmation-page">
        <section className="order-confirmation-missing">
          <span className="order-confirmation-overline">TEESGARAGE ORDER DESK</span>
          <h1>We couldn’t find this receipt.</h1>
          <p>If your payment was captured, your order will appear in your order history. Sign in with the email used at checkout to view it.</p>
          <Link href="/orders" className="order-confirmation-primary-link">
            Check my orders <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    )
  }

  const dateLabel = Number.isNaN(Date.parse(order.createdAt))
    ? ''
    : format(new Date(order.createdAt), 'dd MMM yyyy')

  const isCod = order.paymentMethod === 'cod'

  return (
    <main className="order-confirmation-page">
      <div className="order-confirmation-wrap">
        <header className="order-confirmation-heading">
          <span className="order-confirmation-overline">ORDER RECEIPT / {dateLabel}</span>
          <div className="order-confirmation-title-row">
            <div>
              <div className="order-confirmation-paid"><Check size={14} strokeWidth={3} /> {isCod ? 'ORDER PLACED' : 'PAYMENT CAPTURED'}</div>
              <h1>It’s yours, {order.customerName.split(' ')[0]}.</h1>
              <p>
                {isCod
                  ? 'We’ve received your order. Pay in cash when it arrives.'
                  : 'We’ve received your order and payment. A dispatch update will follow by SMS.'}
              </p>
            </div>
            <PackageCheck className="order-confirmation-mark" size={50} strokeWidth={1.2} aria-hidden="true" />
          </div>
        </header>

        <div className="order-confirmation-grid">
          <section className="order-confirmation-card order-confirmation-lines" aria-labelledby="confirmation-items-title">
            <div className="order-confirmation-card-heading">
              <div>
                <span className="order-confirmation-overline">THE ORDER</span>
                <h2 id="confirmation-items-title">Your pieces</h2>
              </div>
              <span className="order-confirmation-order-tag">{order.orderNumber}</span>
            </div>

            <div className="order-confirmation-items">
              {order.items.map((item, index) => (
                <ConfirmationItemRow key={`${item.id}-${item.size}-${index}`} item={item} />
              ))}
            </div>

            <div className="order-confirmation-totals">
              <div><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div><span>Delivery</span><span>{order.shipping ? formatPrice(order.shipping) : 'Free'}</span></div>
              <div className="order-confirmation-total"><strong>{isCod ? 'Pay on delivery' : 'Paid via Razorpay'}</strong><strong>{formatPrice(order.total)}</strong></div>
            </div>
          </section>

          <aside className="order-confirmation-side">
            <section className="order-confirmation-card order-confirmation-delivery">
              <span className="order-confirmation-overline">NEXT STOP</span>
              <h2>Delivery address</h2>
              <div className="order-confirmation-address-icon"><MapPin size={17} /></div>
              <address>
                <strong>{order.customerName}</strong>
                <span>{order.address}</span>
                {order.apartment && <span>{order.apartment}</span>}
                <span>{order.city}, {order.state} {order.pincode}</span>
              </address>
              <p className="order-confirmation-dispatch-note">We’ll send tracking details once your order leaves the studio.</p>
            </section>

            <section className="order-confirmation-payment">
              <span className="order-confirmation-overline">PAYMENT REFERENCE</span>
              <strong>{order.paymentId}</strong>
              <span>{isCod ? 'Payment due on delivery' : 'Verified and captured'}</span>
            </section>
          </aside>
        </div>

        <footer className="order-confirmation-footer">
          <span>Keep this order number for support: <strong>{order.orderNumber}</strong></span>
          <div>
            <Link href="/orders" className="order-confirmation-secondary-link">My orders</Link>
            <Link href="/" className="order-confirmation-primary-link">Back to the shop <ArrowRight size={16} /></Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
