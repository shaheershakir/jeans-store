'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  ShoppingBag
} from 'lucide-react'
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
}

const DEFAULT_SAMPLE_ORDER: StoredOrder = {
  orderId: 'INF-782910',
  date: 'Yesterday, 4:15 PM',
  status: 'Dispatched',
  expectedDelivery: 'Tomorrow, by 8:00 PM',
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
  shippingAddress: 'Bandra West, Mumbai, Maharashtra · 400050'
}

interface UserOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export default function UserOrdersModal({ isOpen, onClose, userEmail }: UserOrdersModalProps) {
  const [orders, setOrders] = useState<StoredOrder[]>([DEFAULT_SAMPLE_ORDER])
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('infit-orders')
      if (stored) {
        const parsed = JSON.parse(stored) as StoredOrder[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge user placed orders with sample order
          setOrders([...parsed, DEFAULT_SAMPLE_ORDER])
          return
        }
      }
    } catch {
      // Fallback to sample
    }
    setOrders([DEFAULT_SAMPLE_ORDER])
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return o.status === 'Confirmed' || o.status === 'Dispatched'
    if (filter === 'delivered') return o.status === 'Delivered'
    return true
  })

  return (
    <div
      className="apple-modal-scrim"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="apple-orders-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-modal-title"
      >
        {/* Header */}
        <div className="apple-modal-header">
          <div className="apple-modal-header-text">
            <span className="apple-modal-eyebrow">ORDER MANIFEST // TRACKING</span>
            <h2 id="orders-modal-title" className="apple-modal-title">
              My Orders &amp; Delivery Status
            </h2>
          </div>
          <button
            type="button"
            className="apple-modal-close-btn"
            onClick={onClose}
            aria-label="Close orders modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="apple-modal-toolbar">
          <div className="apple-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`apple-segment-item ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span>All Orders ({orders.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'active'}
              className={`apple-segment-item ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              <span>Active / In Transit</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'delivered'}
              className={`apple-segment-item ${filter === 'delivered' ? 'active' : ''}`}
              onClick={() => setFilter('delivered')}
            >
              <span>Delivered</span>
            </button>
          </div>
        </div>

        {/* Orders List Content */}
        <div className="apple-orders-modal-body">
          {filteredOrders.length === 0 ? (
            <div className="apple-orders-empty">
              <Package className="w-12 h-12 text-zinc-300 mb-3" />
              <h3>No orders found in this view</h3>
              <p>Explore our catalog to find heavyweight denim tailored to you.</p>
              <Link href="/shop" className="apple-btn-primary mt-4" onClick={onClose}>
                Explore Garments
              </Link>
            </div>
          ) : (
            <div className="apple-orders-list">
              {filteredOrders.map((order) => (
                <article key={order.orderId} className="apple-order-card">
                  {/* Order Card Top Bar */}
                  <div className="apple-order-card-header">
                    <div>
                      <div className="apple-order-id-row">
                        <strong className="apple-order-id">{order.orderId}</strong>
                        <span className="apple-order-date">Placed {order.date}</span>
                      </div>
                      <span className="apple-order-address-preview">{order.shippingAddress}</span>
                    </div>

                    <div className="apple-order-status-pill-wrap">
                      {order.status === 'Dispatched' && (
                        <span className="apple-status-pill dispatched">
                          <Truck className="w-3.5 h-3.5 mr-1" />
                          <span>On the Way</span>
                        </span>
                      )}
                      {order.status === 'Confirmed' && (
                        <span className="apple-status-pill confirmed">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>Confirmed · Packing</span>
                        </span>
                      )}
                      {order.status === 'Delivered' && (
                        <span className="apple-status-pill delivered">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery ETA banner */}
                  <div className="apple-order-eta-banner">
                    <span className="eta-label">Estimated Delivery:</span>
                    <strong className="eta-val">{order.expectedDelivery}</strong>
                  </div>

                  {/* Order Items */}
                  <div className="apple-order-items-list">
                    {order.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="apple-order-item-row">
                        <div className="apple-order-item-thumb">
                          <Image
                            src={item.img}
                            alt={item.name}
                            width={54}
                            height={68}
                            className="apple-order-item-img"
                          />
                        </div>
                        <div className="apple-order-item-details">
                          <h4 className="apple-order-item-name">{item.name}</h4>
                          <p className="apple-order-item-spec">
                            {[item.fit ? `${item.fit} Fit` : null, `Size ${item.size}`, item.wash]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <span className="apple-order-item-qty">Qty: {item.qty}</span>
                        </div>
                        <div className="apple-order-item-price">
                          {formatPrice(item.priceNum * item.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="apple-order-card-footer">
                    <div className="apple-order-total-block">
                      <span>Total:</span>
                      <strong>{formatPrice(order.total)}</strong>
                      <span className="apple-order-pay-method">(COD / Express Delivery)</span>
                    </div>

                    <div className="apple-order-card-actions">
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'}?text=${encodeURIComponent(
                          `Hi INFIT, I need help tracking my order ${order.orderId}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apple-order-action-btn whatsapp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        <span>WhatsApp Help</span>
                      </a>
                      <button
                        type="button"
                        className="apple-order-action-btn"
                        onClick={() => alert(`Tracking updates for order ${order.orderId} have been sent via SMS & WhatsApp.`)}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        <span>Track Parcel</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="apple-modal-footer">
          <span className="apple-modal-footer-note">Free 7-day doorstep size exchanges on all orders</span>
          <button type="button" className="apple-modal-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
