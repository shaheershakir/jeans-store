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
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import {
  fetchCustomerOrders,
  isActiveCustomerOrder,
  getStatusBadgeConfig,
  type CustomerOrder
} from '@/lib/customerOrders'
import { useAuthStore } from '@/lib/store'
import OrderTrackingTimeline from '@/components/orders/OrderTrackingTimeline'
import OrderTrackingModal from '@/components/orders/OrderTrackingModal'

interface UserOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export default function UserOrdersModal({ isOpen, onClose, userEmail }: UserOrdersModalProps) {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered'>('all')
  const [trackingOrder, setTrackingOrder] = useState<CustomerOrder | null>(null)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!isOpen) return
    if (!token) {
      setOrders([])
      setLoadError('Sign in to view the order history for your account.')
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
  }, [isOpen, token])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !trackingOrder) onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, trackingOrder])

  if (!isOpen) return null

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return isActiveCustomerOrder(o.status)
    if (filter === 'delivered') return o.status === 'Delivered'
    return true
  })

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className="relative w-full max-w-[680px] max-h-[92vh] overflow-hidden flex flex-col rounded-[24px] bg-white shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="orders-modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 bg-white shrink-0">
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#777777] block">
                ORDER MANIFEST // TRACKING
              </span>
              <h2 id="orders-modal-title" className="text-[18px] sm:text-[20px] font-extrabold text-[#111111] tracking-tight">
                My Orders &amp; Delivery Status
              </h2>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
              onClick={onClose}
              aria-label="Close orders modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Filters */}
          <div className="px-6 py-3 border-b border-black/6 bg-[#FAF9F6] shrink-0">
            <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-black/5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                className={`flex-1 py-1.5 px-3 rounded-[9px] text-[12.5px] font-semibold text-center transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
                onClick={() => setFilter('all')}
              >
                <span>All Orders ({orders.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'active'}
                className={`flex-1 py-1.5 px-3 rounded-[9px] text-[12.5px] font-semibold text-center transition-all cursor-pointer ${
                  filter === 'active'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
                onClick={() => setFilter('active')}
              >
                <span>Active / In Transit</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'delivered'}
                className={`flex-1 py-1.5 px-3 rounded-[9px] text-[12.5px] font-semibold text-center transition-all cursor-pointer ${
                  filter === 'delivered'
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
                onClick={() => setFilter('delivered')}
              >
                <span>Delivered</span>
              </button>
            </div>
          </div>

          {/* Orders List Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-[14px] text-[#777777]" role="status">
                Loading order history…
              </div>
            ) : loadError ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-zinc-300 mb-3" />
                <h3 className="text-[16px] font-bold text-[#111111]">Order history unavailable</h3>
                <p className="text-[13px] text-[#666666] mt-1">{loadError}</p>
                {userEmail && <p className="text-[12px] text-[#888888] mt-1">{userEmail}</p>}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-zinc-300 mb-3" />
                <h3 className="text-[16px] font-bold text-[#111111]">No orders found in this view</h3>
                <p className="text-[13px] text-[#666666] mt-1 max-w-xs">
                  Explore our heavyweight tees, henleys, trackpants, and sweatpants.
                </p>
                <Link
                  href="/shop"
                  className="mt-4 px-5 py-2 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer"
                  onClick={onClose}
                >
                  Explore Garments
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadgeConfig(order.status)
                  return (
                    <article
                      key={order.orderId}
                      className="rounded-[18px] bg-white border border-black/8 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md"
                    >
                      {/* Order Card Top Bar */}
                      <div className="flex items-start justify-between pb-3 border-b border-black/6">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <strong className="text-[15px] font-bold text-[#111111]">
                              #{order.orderId}
                            </strong>
                            <span className="text-[12px] text-[#777777]">Placed {order.date}</span>
                          </div>
                          <span className="text-[11.5px] text-[#666666] block mt-0.5 truncate max-w-[280px] sm:max-w-[360px]">
                            {order.shippingAddress}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      {/* Order Items */}
                      <div className="py-3 border-b border-black/6 space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div key={`${item.id}-${idx}`} className="flex items-center gap-3">
                            <div className="relative w-11 h-13 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-black/6">
                              <Image
                                src={item.img}
                                alt={item.name}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-bold text-[#111111] truncate">
                                {item.name}
                              </h4>
                              <p className="text-[11.5px] text-[#666666]">
                                Size {item.size} • Qty {item.qty}
                              </p>
                            </div>
                            <div className="text-[13px] font-bold text-[#111111]">
                              {formatPrice(item.priceNum * item.qty)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Inline Stepper */}
                      <div className="pt-3">
                        <OrderTrackingTimeline order={order} compact={true} showEventsList={false} />
                      </div>

                      {/* Order Footer & Actions */}
                      <div className="mt-3 pt-3 border-t border-black/6 flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[13px]">
                          <span className="text-[#666666]">Total: </span>
                          <strong className="text-[#111111] font-extrabold">
                            {formatPrice(order.total)}
                          </strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(order)}
                            className="py-1.5 px-3 rounded-[9px] bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                          >
                            Live Tracking
                          </button>

                          {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                            <a
                              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                                `Hi TEESGARAGE, I need help with order ${order.orderId}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-[9px] bg-[#f0fdf4] hover:bg-[#dcfce7] border border-emerald-200 text-emerald-800 text-[12px] font-semibold transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>Help</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-black/8 bg-[#FAF9F6] shrink-0">
            <span className="text-[12px] text-[#777777]">
              Order updates reflect real-time courier statuses.
            </span>
            <button
              type="button"
              className="py-2 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold cursor-pointer"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Live Tracking Modal */}
      <OrderTrackingModal
        order={trackingOrder}
        isOpen={Boolean(trackingOrder)}
        onClose={() => setTrackingOrder(null)}
      />
    </>
  )
}
