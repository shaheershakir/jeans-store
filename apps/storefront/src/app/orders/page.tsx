'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MessageCircle,
  ChevronRight,
  RotateCcw,
  MapPin
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { fetchCustomerOrders, isActiveCustomerOrder, type CustomerOrder, type CustomerOrderItem } from '@/lib/customerOrders'

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)
  const user = useAuthStore((s) => s.user)
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

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return isActiveCustomerOrder(o.status)
    if (filter === 'delivered') return o.status === 'Delivered'
    return true
  })

  const handleBuyAgain = (item: CustomerOrderItem) => {
    addItem(item.id, item.size || '32')
    showToast(`Added ${item.name} (${item.size}) to bag`)
    openOverlay('cart')
  }

  return (
    <div className="teesgarage-account-page">

      <main className="teesgarage-account-container">
        {/* Breadcrumb Navigation */}
        <nav className="teesgarage-breadcrumb-nav" aria-label="Breadcrumbs">
          <Link href="/" className="teesgarage-breadcrumb-link">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="teesgarage-breadcrumb-current">My Orders &amp; Tracking</span>
        </nav>

        {/* Top Header Card */}
        <div className="teesgarage-account-hero">
          <div className="teesgarage-hero-user-cluster">
            <div className="teesgarage-hero-avatar">
              {(user?.name || 'Account').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="teesgarage-hero-name">
                {user?.name || 'Your account'}
              </h1>
              <p className="teesgarage-hero-meta">
                Active shipments &amp; order history
              </p>
            </div>
          </div>

          <div className="teesgarage-hero-actions">
            <Link href="/profile" className="teesgarage-btn-pill-secondary">
              Profile &amp; Addresses
            </Link>
          </div>
        </div>

        {/* Filter Pills Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#e7e7e4]">
          <h2 className="font-brand text-lg font-bold text-zinc-900 tracking-tight m-0">
            Order Manifests ({filteredOrders.length})
          </h2>

          <div className="apple-segmented-control max-w-fit self-start sm:self-auto">
            <button
              type="button"
              className={`apple-segment-item ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              className={`apple-segment-item ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active Shipments
            </button>
            <button
              type="button"
              className={`apple-segment-item ${filter === 'delivered' ? 'active' : ''}`}
              onClick={() => setFilter('delivered')}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Orders Listing */}
        {!token ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#e7e7e4] my-8 shadow-sm">
            <Package className="w-12 h-12 mx-auto text-zinc-300 stroke-[1.5] mb-4" />
            <h3 className="font-brand text-lg font-bold text-zinc-900">Sign in to view your orders</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
              Order history is tied to the email address on your customer account.
            </p>
            <Link href="/login" className="teesgarage-btn-primary">Sign in to your account</Link>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-sm text-zinc-500" role="status">Loading your order history…</div>
        ) : loadError ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#e7e7e4] my-8 shadow-sm" role="alert">
            <h3 className="font-brand text-lg font-bold text-zinc-900">Could not load your orders</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">{loadError}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#e7e7e4] my-8 shadow-sm">
            <Package className="w-12 h-12 mx-auto text-zinc-300 stroke-[1.5] mb-4" />
            <h3 className="font-brand text-lg font-bold text-zinc-900">No orders found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
              You do not have any orders in this filter yet. Explore the TEESGARAGE apparel collection.
            </p>
            <Link
              href="/shop"
              className="teesgarage-btn-primary"
            >
              Explore products
            </Link>
          </div>
        ) : (
          <div>
            {filteredOrders.map((order) => {
              const isDelivered = order.status === 'Delivered'
              const isDispatched = order.status === 'Dispatched'
              const statusClass = isDelivered ? 'delivered' : isDispatched ? 'dispatched' : 'confirmed'

              return (
                <div key={order.orderId} className="teesgarage-order-card">
                  {/* Order Top Bar */}
                  <div className="teesgarage-order-header">
                    <div className="teesgarage-order-meta-grid">
                      <div>
                        <span className="teesgarage-order-meta-label">Order ID</span>
                        <span className="teesgarage-order-meta-val">{order.orderId}</span>
                      </div>
                      <div>
                        <span className="teesgarage-order-meta-label">Date Placed</span>
                        <span className="text-zinc-800 text-xs font-semibold">{order.date}</span>
                      </div>
                      <div>
                        <span className="teesgarage-order-meta-label">Total Amount</span>
                        <span className="teesgarage-order-meta-val">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    <span
                      className={`teesgarage-order-status-badge ${
                        statusClass
                      }`}
                    >
                      {isDelivered ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                      <span>{order.status}</span>
                    </span>
                  </div>

                  {/* Delivery & Tracking Meta Banner */}
                  <div className="teesgarage-order-timeline-bar">
                    <div className="teesgarage-order-delivery-eta">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Delivery status:</strong> {order.expectedDelivery}
                      </span>
                      {order.trackingCourier && (
                        <span className="text-zinc-400 hidden md:inline">
                          · {order.trackingCourier} ({order.trackingNumber})
                        </span>
                      )}
                    </div>

                    {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi TEESGARAGE, please share a status update for order ${order.orderId}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="teesgarage-order-wa-track"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Help</span>
                      </a>
                    )}
                  </div>

                  {/* Line Items */}
                  <div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="teesgarage-order-item-row">
                        <div className="teesgarage-order-item-info">
                          <div className="teesgarage-order-item-thumb">
                            <Image
                              src={item.img}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/product/${item.id}`}
                              className="teesgarage-order-item-title"
                            >
                              <span>{item.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            </Link>
                            <p className="teesgarage-order-item-meta">
                              {item.wash ? `${item.wash} · ` : ''}
                              Size: <strong>{item.size}</strong> · Qty: {item.qty}
                            </p>
                            <span className="teesgarage-order-item-price">
                              {item.price}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleBuyAgain(item)}
                            className="teesgarage-btn-pill-secondary"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Buy Again</span>
                          </button>

                          <Link
                            href={`/product/${item.id}`}
                            className="teesgarage-btn-primary !py-2 !px-4 !text-xs"
                          >
                            <span>View Product</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer with Address & Total */}
                  <div className="teesgarage-order-footer">
                    <div className="flex items-start gap-2 max-w-lg">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Ship To:</strong> {order.shippingAddress}
                      </span>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
