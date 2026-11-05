'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  Loader2,
  MapPin,
  Clock
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import {
  fetchOrderTracking,
  getStatusBadgeConfig,
  type CustomerOrder
} from '@/lib/customerOrders'
import OrderTrackingTimeline from '@/components/orders/OrderTrackingTimeline'

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const initialOrderNumber =
    searchParams.get('orderNumber')?.trim() ||
    searchParams.get('order')?.trim() ||
    ''

  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber)
  const [contactInput, setContactInput] = useState('')
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleTrack = useCallback(
    async (orderNum: string, contact?: string) => {
      const targetOrder = orderNum.trim()
      if (!targetOrder) {
        setError('Please enter your order number.')
        return
      }

      setLoading(true)
      setError(null)
      setSearched(true)

      const cleanContact = (contact || contactInput).trim()
      const isEmail = cleanContact.includes('@')
      const options: {
        phone?: string
        email?: string
        authToken?: string
      } = {}

      if (cleanContact) {
        if (isEmail) options.email = cleanContact.toLowerCase()
        else options.phone = cleanContact
      }
      if (token) {
        options.authToken = token
      }

      try {
        const fetchedOrder = await fetchOrderTracking(targetOrder, options)
        setOrder(fetchedOrder)
        setError(null)
      } catch (err: any) {
        setOrder(null)
        setError(
          err.message ||
            'Could not find tracking for this order. Please verify your order number and phone/email.'
        )
      } finally {
        setLoading(false)
      }
    },
    [contactInput, token]
  )

  useEffect(() => {
    if (initialOrderNumber) {
      void handleTrack(initialOrderNumber)
    }
  }, [initialOrderNumber, handleTrack])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void handleTrack(orderNumberInput, contactInput)
  }

  const badge = order ? getStatusBadgeConfig(order.status) : null
  const whatsappNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'

  return (
    <div className="min-h-[80vh] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#777777] block mb-2">
          REAL-TIME SHIPMENT STATUS
        </span>
        <h1 className="text-[32px] sm:text-[40px] font-extrabold text-[#111111] tracking-tight leading-tight">
          Track Your Order
        </h1>
        <p className="mt-2 text-[15px] text-[#666666] max-w-md mx-auto">
          Enter your order number to track dispatch, courier assignment, and delivery progress in real time.
        </p>
      </div>

      {/* Lookup Card Form */}
      <div className="bg-white rounded-[24px] border border-black/8 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-3">
            <div>
              <label
                htmlFor="orderNumber"
                className="block text-[12.5px] font-bold text-[#333333] mb-1.5"
              >
                Order Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="orderNumber"
                type="text"
                placeholder="e.g. TG-202611-ABCD or ORD-..."
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-[12px] bg-[#FAF9F6] border border-black/15 text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="contact"
                className="block text-[12.5px] font-bold text-[#333333] mb-1.5"
              >
                Phone or Email <span className="text-[#888888] font-normal">(for guest orders)</span>
              </label>
              <input
                id="contact"
                type="text"
                placeholder="e.g. 9876543210 or you@email.com"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[12px] bg-[#FAF9F6] border border-black/15 text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-[12px] text-[#777777]">
              Tip: You can find your order number in your confirmation email or SMS.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[12px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-98 shrink-0 min-w-[130px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 p-4 rounded-[14px] bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="text-[13px] leading-relaxed">
              <strong className="font-bold block text-rose-900">Tracking not found</strong>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Order Tracking Result View */}
      {order && (
        <div className="bg-white rounded-[24px] border border-black/8 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6 animate-in fade-in duration-300">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-black/8">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#111111] tracking-tight">
                  Order #{order.orderId}
                </h2>
                {badge && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${badge.bg} ${badge.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#666666] mt-1">
                Placed on {order.date} • Expected Delivery: {order.expectedDelivery}
              </p>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[12px] text-[#777777] block">Total Amount</span>
              <strong className="text-[18px] font-extrabold text-[#111111]">
                {formatPrice(order.total)}
              </strong>
            </div>
          </div>

          {/* Stepper & Courier Pill & Activity Log */}
          <OrderTrackingTimeline order={order} compact={false} showEventsList={true} />

          {/* Delivery Address & Contents Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-black/8">
            {/* Left: Destination */}
            <div className="p-4 rounded-[16px] bg-[#FAF9F6] border border-black/6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#111111]" />
                <h4 className="text-[13px] font-bold text-[#111111] uppercase tracking-wider">
                  Delivery Destination
                </h4>
              </div>
              <p className="text-[13.5px] font-medium text-[#333333] leading-relaxed">
                {order.shippingAddress}
              </p>
            </div>

            {/* Right: Items */}
            <div className="p-4 rounded-[16px] bg-[#FAF9F6] border border-black/6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#111111]" />
                  <h4 className="text-[13px] font-bold text-[#111111] uppercase tracking-wider">
                    Package Items ({order.items.length})
                  </h4>
                </div>
              </div>
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center gap-2.5">
                    <div className="relative w-9 h-11 rounded-md overflow-hidden bg-neutral-200 shrink-0">
                      <Image
                        src={item.img}
                        alt={item.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-bold text-[#111111] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#666666]">
                        Size {item.size} • Qty {item.qty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help Support Footer */}
          <div className="pt-4 border-t border-black/8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[12.5px] text-[#666666]">
              Have questions about your delivery?
            </span>
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(
                `Hi TEESGARAGE, I am tracking order #${order.orderId} and need help.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#f0fdf4] hover:bg-[#dcfce7] border border-emerald-200 text-emerald-800 text-[12.5px] font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Contact Concierge on WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Back Links */}
      <div className="mt-8 text-center flex items-center justify-center gap-5 text-[13px] font-semibold text-[#666666]">
        <Link href="/orders" className="hover:text-[#111111] transition-colors">
          View My Orders
        </Link>
        <span>•</span>
        <Link href="/shop" className="hover:text-[#111111] transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  )
}
