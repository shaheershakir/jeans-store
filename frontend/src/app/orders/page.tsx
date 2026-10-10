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
  MapPin,
  FileText
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

export interface OrderItem {
  id: number
  name: string
  size: string
  fit?: string
  wash?: string
  price: string
  priceNum: number
  img: string
  qty: number
}

export interface StoredOrder {
  orderId: string
  date: string
  status: 'Confirmed' | 'Dispatched' | 'Delivered'
  expectedDelivery: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  shippingAddress: string
  trackingCourier?: string
  trackingNumber?: string
}

const DEFAULT_SAMPLE_ORDERS: StoredOrder[] = [
  {
    orderId: 'TG-782910',
    date: 'Yesterday, 4:15 PM',
    status: 'Dispatched',
    expectedDelivery: 'Tomorrow, by 8:00 PM',
    trackingCourier: 'BlueDart Air Express',
    trackingNumber: 'BD-88291024IN',
    items: [
      {
        id: 0,
        name: 'Classic Straight Indigo',
        size: '32',
        fit: 'Straight',
        wash: 'Classic Indigo',
        price: '₹1,699',
        priceNum: 1699,
        img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
        qty: 1
      },
      {
        id: 8,
        name: 'Boxy Heavyweight Tee - Vintage Black',
        size: 'L',
        wash: 'Vintage Black',
        price: '₹999',
        priceNum: 999,
        img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        qty: 1
      }
    ],
    subtotal: 2698,
    shipping: 0,
    total: 2698,
    shippingAddress: 'Devon Vance · Flat 402, Sea Green Apts, Perry Cross Road, Bandra West, Mumbai 400050'
  },
  {
    orderId: 'TG-671822',
    date: 'October 2, 2026',
    status: 'Delivered',
    expectedDelivery: 'Delivered on Oct 5, 2026',
    trackingCourier: 'Delhivery Surface',
    trackingNumber: 'DL-99120485IN',
    items: [
      {
        id: 4,
        name: 'Raw Selvedge 14.5oz Relaxed',
        size: '34',
        fit: 'Relaxed',
        wash: 'Raw Japanese Selvedge',
        price: '₹2,499',
        priceNum: 2499,
        img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        qty: 1
      }
    ],
    subtotal: 2499,
    shipping: 0,
    total: 2499,
    shippingAddress: 'Devon Vance · Flat 402, Sea Green Apts, Perry Cross Road, Bandra West, Mumbai 400050'
  }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>(DEFAULT_SAMPLE_ORDERS)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('teesgarage-orders') || localStorage.getItem('infit-orders')
        if (stored) {
          const parsed = JSON.parse(stored) as StoredOrder[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders([...parsed, ...DEFAULT_SAMPLE_ORDERS])
            return
          }
        }
      } catch {
        // Fallback
      }
    }
  }, [])

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return o.status === 'Confirmed' || o.status === 'Dispatched'
    if (filter === 'delivered') return o.status === 'Delivered'
    return true
  })

  const handleBuyAgain = (item: OrderItem) => {
    addItem(item.id, item.size || '32')
    showToast(`Added ${item.name} (${item.size}) to bag`)
    openOverlay('cart')
  }

  return (
    <div className="infit-account-page">

      <main className="infit-account-container">
        {/* Breadcrumb Navigation */}
        <nav className="infit-breadcrumb-nav" aria-label="Breadcrumbs">
          <Link href="/" className="infit-breadcrumb-link">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="infit-breadcrumb-current">My Orders &amp; Tracking</span>
        </nav>

        {/* Top Header Card */}
        <div className="infit-account-hero">
          <div className="infit-hero-user-cluster">
            <div className="infit-hero-avatar">
              {(user?.name || 'Devon Vance').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="infit-hero-name">
                {user?.name || 'Devon Vance'}
              </h1>
              <p className="infit-hero-meta">
                Active shipments &amp; order history
              </p>
            </div>
          </div>

          <div className="infit-hero-actions">
            <Link href="/profile" className="infit-btn-pill-secondary">
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
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#e7e7e4] my-8 shadow-sm">
            <Package className="w-12 h-12 mx-auto text-zinc-300 stroke-[1.5] mb-4" />
            <h3 className="font-brand text-lg font-bold text-zinc-900">No orders found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
              You do not have any orders in this filter yet. Explore our handcrafted raw and washed denim collection.
            </p>
            <Link
              href="/shop"
              className="infit-btn-primary"
            >
              Explore Denim Catalog
            </Link>
          </div>
        ) : (
          <div>
            {filteredOrders.map((order) => {
              const isDelivered = order.status === 'Delivered'
              const isDispatched = order.status === 'Dispatched'

              return (
                <div key={order.orderId} className="infit-order-card">
                  {/* Order Top Bar */}
                  <div className="infit-order-header">
                    <div className="infit-order-meta-grid">
                      <div>
                        <span className="infit-order-meta-label">Order ID</span>
                        <span className="infit-order-meta-val">{order.orderId}</span>
                      </div>
                      <div>
                        <span className="infit-order-meta-label">Date Placed</span>
                        <span className="text-zinc-800 text-xs font-semibold">{order.date}</span>
                      </div>
                      <div>
                        <span className="infit-order-meta-label">Total Amount</span>
                        <span className="infit-order-meta-val">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    <span
                      className={`infit-order-status-badge ${
                        isDelivered ? 'delivered' : isDispatched ? 'dispatched' : 'confirmed'
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
                  <div className="infit-order-timeline-bar">
                    <div className="infit-order-delivery-eta">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Estimated Delivery:</strong> {order.expectedDelivery}
                      </span>
                      {order.trackingCourier && (
                        <span className="text-zinc-400 hidden md:inline">
                          · {order.trackingCourier} ({order.trackingNumber})
                        </span>
                      )}
                    </div>

                    <a
                      href={`https://wa.me/919876543210?text=Hi%20TEESGARAGE%20Studio%2C%20please%20give%20me%20a%20live%20status%20update%20for%20order%20%23${order.orderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="infit-order-wa-track"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Live WhatsApp Tracking</span>
                    </a>
                  </div>

                  {/* Line Items */}
                  <div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="infit-order-item-row">
                        <div className="infit-order-item-info">
                          <div className="infit-order-item-thumb">
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
                              className="infit-order-item-title"
                            >
                              <span>{item.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            </Link>
                            <p className="infit-order-item-meta">
                              {item.wash ? `${item.wash} · ` : ''}
                              Size: <strong>{item.size}</strong> · Qty: {item.qty}
                            </p>
                            <span className="infit-order-item-price">
                              {item.price}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleBuyAgain(item)}
                            className="infit-btn-pill-secondary"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Buy Again</span>
                          </button>

                          <Link
                            href={`/product/${item.id}`}
                            className="infit-btn-primary !py-2 !px-4 !text-xs"
                          >
                            <span>View Product</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer with Address & Total */}
                  <div className="infit-order-footer">
                    <div className="flex items-start gap-2 max-w-lg">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Ship To:</strong> {order.shippingAddress}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert(`Digital Receipt for Order #${order.orderId} prepared for download.`)}
                      className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-black font-semibold transition-colors bg-none border-none p-0 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </button>
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
