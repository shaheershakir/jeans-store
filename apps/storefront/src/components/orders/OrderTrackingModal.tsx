'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, MessageCircle, MapPin, PackageCheck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getStatusBadgeConfig, type CustomerOrder } from '@/lib/customerOrders'
import OrderTrackingTimeline from './OrderTrackingTimeline'

interface OrderTrackingModalProps {
  order: CustomerOrder | null
  isOpen: boolean
  onClose: () => void
}

export default function OrderTrackingModal({
  order,
  isOpen,
  onClose
}: OrderTrackingModalProps) {
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

  if (!isOpen || !order) return null

  const badge = getStatusBadgeConfig(order.status)
  const whatsappNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'
  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(
    `Hi TEESGARAGE, I have a question about order #${order.orderId}.`
  )}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-tracking-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-[620px] max-h-[92vh] overflow-y-auto rounded-[24px] bg-white p-5 sm:p-7 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200 scrollbar-thin">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 sm:pb-5 border-b border-black/8">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3
                id="order-tracking-title"
                className="text-[19px] sm:text-[21px] font-extrabold text-[#111111] tracking-tight"
              >
                Tracking Order #{order.orderId}
              </h3>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${badge.bg} ${badge.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <p className="text-[13px] text-[#666666] mt-1">
              Placed on {order.date} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer shrink-0 ml-3"
            onClick={onClose}
            aria-label="Close tracking dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Stepper & Courier details */}
        <div className="py-4 sm:py-5 border-b border-black/8">
          <OrderTrackingTimeline order={order} compact={false} showEventsList={true} />
        </div>

        {/* Shipping Address Preview */}
        <div className="py-4 border-b border-black/8 flex items-start gap-3">
          <MapPin className="w-4 h-4 text-[#555] shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#777777]">
              Destination Address
            </span>
            <p className="text-[13.5px] font-medium text-[#111111] mt-0.5 leading-snug">
              {order.shippingAddress}
            </p>
          </div>
        </div>

        {/* Items in this order */}
        <div className="py-4 border-b border-black/8">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#777777] block mb-3">
            Package Contents ({order.items.length})
          </span>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-3.5">
                <div className="relative w-12 h-14 rounded-[10px] overflow-hidden bg-[#eeece6] shrink-0 border border-black/6">
                  <Image
                    src={item.img || '/featured-collection.jpg'}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-[13.5px] font-bold text-[#111111] truncate">{item.name}</h5>
                  <p className="text-[12px] text-[#666666]">
                    Size {item.size} • Qty {item.qty}
                  </p>
                </div>
                <span className="text-[13.5px] font-extrabold text-[#111111] shrink-0">
                  {item.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[11px] bg-[#f0fdf4] hover:bg-[#dcfce7] border border-emerald-200 text-emerald-800 text-[13px] font-semibold transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Need Help? Chat on WhatsApp</span>
          </a>

          <button
            type="button"
            className="py-2.5 px-6 rounded-[11px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold transition-all cursor-pointer shadow-xs active:scale-98"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
