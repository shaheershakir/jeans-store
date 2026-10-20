'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  Truck,
  User,
  XCircle
} from 'lucide-react'
import { useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { fetchCustomerOrders, isActiveCustomerOrder, type CustomerOrder } from '@/lib/customerOrders'

const accountLinks = [
  { label: 'My Account', href: '/profile', Icon: User },
  { label: 'Orders', href: '/orders', Icon: Package },
  { label: 'Wishlist', href: '/profile?tab=favorites', Icon: Heart },
  { label: 'Addresses', href: '/profile?tab=addresses', Icon: MapPin },
  { label: 'Payment Methods', href: '/profile', Icon: CreditCard },
  { label: 'Account Settings', href: '/profile?tab=security', Icon: Settings }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (!token) {
      setOrders([])
      setLoading(false)
      setLoadError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    void fetchCustomerOrders(token, controller.signal)
      .then(setOrders)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Could not load your order history.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [token])

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') return isActiveCustomerOrder(order.status)
    if (filter === 'delivered') return order.status === 'Delivered'
    return true
  })

  const handleBuyAgain = (order: CustomerOrder) => {
    order.items.forEach((item) => addItem(item.id, item.size || '32'))
    showToast(`Added ${order.items.length} item${order.items.length === 1 ? '' : 's'} to bag`)
    openOverlay('cart')
  }

  const handleLogout = () => useAuthStore.getState().logout()

  return (
    <div className="tg-account-shell">
      <main className="tg-account-layout">
        <aside className="tg-account-sidebar" aria-label="Account navigation">
          <nav>
            {accountLinks.map(({ label, href, Icon }) => (
              <Link key={label} href={href} className={label === 'Orders' ? 'tg-account-link is-current' : 'tg-account-link'} aria-current={label === 'Orders' ? 'page' : undefined}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
            <div className="tg-account-divider" />
            <button type="button" className="tg-account-link tg-account-logout" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </nav>
        </aside>

        <section className="tg-orders-content" aria-labelledby="orders-title">
          <header className="tg-orders-heading">
            <div>
              <h1 id="orders-title">My Orders</h1>
              <p>Track, return or buy again.</p>
            </div>
            <div className="tg-order-filters" aria-label="Filter orders">
              {([
                ['all', `All (${orders.length})`],
                ['active', 'In progress'],
                ['delivered', 'Delivered']
              ] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setFilter(value)} className={filter === value ? 'is-active' : ''} aria-pressed={filter === value}>{label}</button>
              ))}
            </div>
          </header>

          {!token ? (
            <div className="tg-orders-empty">
              <Package aria-hidden="true" />
              <h2>Sign in to view your orders</h2>
              <p>Order history is tied to the email address on your customer account.</p>
              <Link href="/login?redirect=/orders" className="tg-order-primary">Sign in to your account</Link>
            </div>
          ) : loading ? (
            <div className="tg-orders-state" role="status">Loading your order history…</div>
          ) : loadError ? (
            <div className="tg-orders-empty" role="alert">
              <Package aria-hidden="true" />
              <h2>Could not load your orders</h2>
              <p>{loadError}</p>
              <Link href="/login?redirect=/orders" className="tg-order-primary">Sign in again</Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="tg-orders-empty">
              <Package aria-hidden="true" />
              <h2>No orders found</h2>
              <p>{filter === 'all' ? 'Your order history will appear here once you place your first order.' : 'There are no orders in this filter yet.'}</p>
              <Link href="/shop" className="tg-order-primary">Explore products</Link>
            </div>
          ) : (
            <div className="tg-order-list">
              {filteredOrders.map((order) => {
                const status = order.status.toLowerCase()
                const isDelivered = status === 'delivered'
                const isDispatched = status === 'dispatched' || status === 'shipped'
                const isCancelled = status === 'cancelled'
                const isReturned = status === 'returned'
                const firstItem = order.items[0]
                const statusClass = isDelivered ? 'delivered' : isDispatched ? 'shipped' : isCancelled || isReturned ? 'cancelled' : 'processing'

                return (
                  <article key={order.orderId} className="tg-order-card">
                    <div className="tg-order-card-top">
                      <div className="tg-order-meta">
                        <strong>#{order.orderId}</strong>
                        <span>{order.date}</span>
                      </div>
                      <span className={`tg-order-status ${statusClass}`}>
                        <span className="tg-status-dot" />
                        {order.status}
                      </span>
                    </div>

                    <div className="tg-order-card-body">
                      <div className="tg-order-product">
                        {firstItem ? (
                          <Link href={getProductUrl(firstItem)} className="tg-order-image" aria-label={`View ${firstItem.name}`}>
                            <Image src={firstItem.img} alt={firstItem.name} fill sizes="(max-width: 680px) 112px, 136px" className="object-cover" />
                          </Link>
                        ) : (
                          <div className="tg-order-image tg-order-image-empty"><Package aria-hidden="true" /></div>
                        )}
                        <div className="tg-order-product-copy">
                          <span className="tg-order-item-count">{order.items.length === 1 ? '1 item' : `${order.items.length} items`}</span>
                          {firstItem && <Link href={getProductUrl(firstItem)} className="tg-order-product-name">{firstItem.name}</Link>}
                          {firstItem && <p className="tg-order-product-meta">{firstItem.wash ? `${firstItem.wash} · ` : ''}{firstItem.size ? `${firstItem.size} · ` : ''}{firstItem.qty} × {firstItem.price}</p>}
                          <strong className="tg-order-total">{formatPrice(order.total)}</strong>
                          <div className="tg-order-delivery">
                            {isDelivered ? <Package aria-hidden="true" /> : isCancelled ? <XCircle aria-hidden="true" /> : isDispatched ? <Truck aria-hidden="true" /> : <Clock aria-hidden="true" />}
                            <span>
                              <strong>{isDelivered || isDispatched ? order.expectedDelivery : isCancelled ? 'Order cancelled' : isReturned ? 'Order returned' : 'Processing your order'}</strong>
                              <small>{isDelivered ? 'Your order has been delivered' : isCancelled || isReturned ? 'Contact us if you need help' : isDispatched ? 'Your order is on its way' : 'We’ll ship it soon'}</small>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="tg-order-actions">
                        {firstItem && !isCancelled && (
                          <button type="button" className="tg-order-primary" onClick={() => handleBuyAgain(order)}>Buy Again</button>
                        )}
                        {isDispatched && process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                          <a className="tg-order-secondary" href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi TEESGARAGE, please share a status update for order ${order.orderId}.`)}`} target="_blank" rel="noopener noreferrer">Track Order</a>
                        )}
                        <details className="tg-order-details">
                          <summary className="tg-order-secondary">View Details</summary>
                          <div className="tg-order-detail-panel">
                            <p><strong>Ship to</strong><span>{order.shippingAddress}</span></p>
                            {order.trackingCourier && <p><strong>Courier</strong><span>{order.trackingCourier}{order.trackingNumber ? ` · ${order.trackingNumber}` : ''}</span></p>}
                            {order.items.map((item, index) => <p key={`${item.id}-${index}`}><strong>{item.name}</strong><span>{item.size ? `Size ${item.size} · ` : ''}Qty {item.qty}</span></p>)}
                          </div>
                        </details>
                        {isDelivered && (
                          <a className="tg-order-secondary" href={`mailto:concierge@teesgarage.in?subject=${encodeURIComponent(`Return or exchange for order ${order.orderId}`)}`}>Return / Exchange</a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        .tg-account-shell { min-height: calc(100vh - 72px); background: #faf9f6; color: #121212; }
        .tg-account-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 25px; max-width: 1480px; margin: 0 auto; padding: 34px 20px 70px; }
        .tg-account-sidebar { position: sticky; top: 100px; align-self: start; padding-top: 1px; }
        .tg-account-sidebar nav { display: flex; flex-direction: column; gap: 4px; }
        .tg-account-link { display: flex; width: 100%; min-height: 48px; align-items: center; gap: 14px; padding: 0 15px; border: 0; border-radius: 12px; background: transparent; color: #64666a; font: inherit; font-size: 14px; text-align: left; text-decoration: none; cursor: pointer; transition: background .18s ease, color .18s ease; }
        .tg-account-link svg { width: 21px; height: 21px; stroke-width: 1.7; }
        .tg-account-link:hover, .tg-account-link.is-current { background: #efeeeb; color: #111; }
        .tg-account-link.is-current { font-weight: 600; }
        .tg-account-divider { height: 1px; margin: 18px 6px 14px; background: #e9e7e2; }
        .tg-orders-content { min-width: 0; }
        .tg-orders-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin: 0 0 28px; }
        .tg-orders-heading h1 { margin: 0; font-size: clamp(32px, 4vw, 38px); line-height: 1.12; letter-spacing: -.04em; font-weight: 650; }
        .tg-orders-heading p { margin: 7px 0 0; color: #72747a; font-size: 17px; }
        .tg-order-filters { display: flex; gap: 5px; padding: 4px; border: 1px solid #e9e7e2; border-radius: 999px; background: rgba(255,255,255,.58); }
        .tg-order-filters button { border: 0; border-radius: 999px; padding: 8px 12px; background: transparent; color: #62646a; font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; }
        .tg-order-filters button.is-active { background: #171717; color: #fff; }
        .tg-order-list { display: grid; gap: 14px; }
        .tg-order-card { overflow: visible; border: 1px solid #ebe9e4; border-radius: 18px; background: rgba(255,255,255,.42); box-shadow: 0 7px 20px rgba(32,28,20,.025); }
        .tg-order-card-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px 0; }
        .tg-order-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 22px; }
        .tg-order-meta strong { font-size: 17px; letter-spacing: -.015em; }
        .tg-order-meta span { color: #73757b; font-size: 14px; }
        .tg-order-status { display: inline-flex; align-items: center; gap: 9px; border-radius: 999px; padding: 7px 12px; font-size: 13px; font-weight: 550; white-space: nowrap; }
        .tg-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
        .tg-order-status.delivered { background: #dff1e5; color: #17653a; }
        .tg-order-status.shipped { background: #e5eefb; color: #1d4e91; }
        .tg-order-status.processing { background: #fff2d8; color: #915100; }
        .tg-order-status.cancelled { background: #fde5e3; color: #a32420; }
        .tg-order-card-body { display: grid; grid-template-columns: minmax(0,1fr) 202px; align-items: center; gap: 28px; padding: 15px 20px 20px; }
        .tg-order-product { display: grid; grid-template-columns: 136px minmax(0,1fr); align-items: center; gap: 22px; min-width: 0; }
        .tg-order-image { position: relative; display: block; width: 136px; aspect-ratio: 1 / 1.18; overflow: hidden; border-radius: 12px; background: #eeece6; }
        .tg-order-image img { object-position: center; }
        .tg-order-image-empty { display: grid; place-items: center; color: #858585; }
        .tg-order-product-copy { min-width: 0; }
        .tg-order-item-count { display: block; margin-bottom: 3px; color: #74767b; font-size: 12px; }
        .tg-order-product-name { display: block; overflow: hidden; color: #181818; font-size: 17px; font-weight: 550; text-overflow: ellipsis; text-decoration: none; white-space: nowrap; }
        .tg-order-product-name:hover { text-decoration: underline; text-underline-offset: 3px; }
        .tg-order-product-meta { margin: 4px 0 12px; color: #777981; font-size: 13px; }
        .tg-order-total { display: block; margin-bottom: 18px; font-size: 19px; letter-spacing: -.02em; }
        .tg-order-delivery { display: flex; align-items: center; gap: 12px; }
        .tg-order-delivery > svg { width: 23px; height: 23px; flex: 0 0 auto; stroke-width: 1.8; }
        .tg-order-delivery span { display: grid; gap: 3px; font-size: 14px; }
        .tg-order-delivery small { color: #797b81; font-size: 12px; }
        .tg-order-actions { display: flex; flex-direction: column; gap: 9px; }
        .tg-order-primary, .tg-order-secondary { display: flex; width: 100%; min-height: 42px; align-items: center; justify-content: center; border: 1px solid #b9b8b4; border-radius: 9px; padding: 8px 12px; background: transparent; color: #171717; font: inherit; font-size: 13px; text-align: center; text-decoration: none; cursor: pointer; transition: background .15s ease, color .15s ease, border-color .15s ease; }
        .tg-order-primary { border-color: #171717; background: #171717; color: #fff; }
        .tg-order-primary:hover { border-color: #383838; background: #383838; }
        .tg-order-secondary:hover { border-color: #171717; background: #f3f2ef; }
        .tg-order-details { position: relative; }
        .tg-order-details summary { list-style: none; }
        .tg-order-details summary::-webkit-details-marker { display: none; }
        .tg-order-details[open] summary { background: #f3f2ef; }
        .tg-order-detail-panel { position: absolute; z-index: 8; top: calc(100% + 8px); right: 0; width: min(360px, 85vw); padding: 14px; border: 1px solid #e5e3de; border-radius: 12px; background: #fffefa; box-shadow: 0 16px 36px rgba(20,18,14,.12); }
        .tg-order-detail-panel p { display: grid; gap: 4px; margin: 0; padding: 9px 0; border-bottom: 1px solid #eeece7; font-size: 12px; }
        .tg-order-detail-panel p:last-child { border: 0; }
        .tg-order-detail-panel span { color: #707278; line-height: 1.5; }
        .tg-orders-empty, .tg-orders-state { display: grid; justify-items: center; gap: 12px; padding: 64px 24px; border: 1px solid #ebe9e4; border-radius: 18px; background: rgba(255,255,255,.55); text-align: center; }
        .tg-orders-empty > svg { width: 36px; height: 36px; color: #858585; stroke-width: 1.5; }
        .tg-orders-empty h2 { margin: 0; font-size: 20px; }
        .tg-orders-empty p { max-width: 420px; margin: 0 0 8px; color: #72747a; font-size: 14px; line-height: 1.6; }
        .tg-orders-empty .tg-order-primary { width: auto; min-width: 210px; }
        .tg-orders-state { color: #6d6f74; }
        @media (max-width: 980px) {
          .tg-account-layout { grid-template-columns: 190px minmax(0,1fr); gap: 26px; padding: 28px 20px 54px; }
          .tg-order-card-body { grid-template-columns: minmax(0,1fr) 168px; gap: 18px; }
          .tg-order-product { grid-template-columns: 112px minmax(0,1fr); gap: 16px; }
          .tg-order-image { width: 112px; }
        }
        @media (max-width: 720px) {
          .tg-account-layout { display: block; padding: 24px 16px 44px; }
          .tg-account-sidebar { position: static; margin: 0 -16px 24px; padding: 0 16px 12px; overflow-x: auto; border-bottom: 1px solid #e9e7e2; }
          .tg-account-sidebar nav { width: max-content; flex-direction: row; gap: 5px; }
          .tg-account-link { width: auto; min-height: 42px; gap: 8px; padding: 0 12px; font-size: 12px; white-space: nowrap; }
          .tg-account-link svg { width: 17px; height: 17px; }
          .tg-account-divider { width: 1px; height: 28px; margin: 7px 4px; }
          .tg-orders-heading { display: block; margin-bottom: 18px; }
          .tg-orders-heading h1 { font-size: 32px; }
          .tg-orders-heading p { font-size: 15px; }
          .tg-order-filters { width: max-content; max-width: 100%; margin-top: 16px; }
          .tg-order-filters button { padding: 7px 10px; font-size: 11px; }
          .tg-order-card { border-radius: 15px; }
          .tg-order-card-top { padding: 15px 14px 0; }
          .tg-order-meta { gap: 12px; }
          .tg-order-meta strong { font-size: 15px; }
          .tg-order-meta span { font-size: 12px; }
          .tg-order-status { gap: 6px; padding: 6px 9px; font-size: 11px; }
          .tg-status-dot { width: 7px; height: 7px; }
          .tg-order-card-body { display: block; padding: 14px; }
          .tg-order-product { grid-template-columns: 92px minmax(0,1fr); gap: 13px; align-items: start; }
          .tg-order-image { width: 92px; border-radius: 9px; }
          .tg-order-product-name { font-size: 14px; white-space: normal; }
          .tg-order-product-meta { margin: 4px 0 8px; font-size: 11px; }
          .tg-order-total { margin-bottom: 12px; font-size: 17px; }
          .tg-order-delivery { gap: 8px; }
          .tg-order-delivery > svg { width: 19px; height: 19px; }
          .tg-order-delivery span { font-size: 12px; }
          .tg-order-delivery small { font-size: 11px; }
          .tg-order-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; margin-top: 15px; }
          .tg-order-primary, .tg-order-secondary { min-height: 39px; padding: 7px 8px; font-size: 12px; }
          .tg-order-details { min-width: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tg-account-link, .tg-order-primary, .tg-order-secondary { transition: none; }
        }
      `}</style>
    </div>
  )
}
