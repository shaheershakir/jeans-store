'use client'

import { useState } from 'react'
import {
  Check,
  Truck,
  Package,
  Clock,
  ExternalLink,
  Copy,
  AlertCircle,
  XCircle,
  RotateCcw
} from 'lucide-react'
import {
  TRACKING_STAGES,
  getOrderStageIndex,
  getCarrierTrackingUrl,
  getStatusBadgeConfig,
  formatDateTime,
  type CustomerOrder,
  type OrderTrackingEvent
} from '@/lib/customerOrders'

interface OrderTrackingTimelineProps {
  order: CustomerOrder
  compact?: boolean
  showEventsList?: boolean
}

export default function OrderTrackingTimeline({
  order,
  compact = false,
  showEventsList = true
}: OrderTrackingTimelineProps) {
  const [copied, setCopied] = useState(false)
  const currentStep = getOrderStageIndex(order.status)
  const badge = getStatusBadgeConfig(order.status)
  const sLower = (order.status || '').toLowerCase()
  const isCancelled = sLower === 'cancelled'
  const isReturned = sLower === 'returned'
  const carrierUrl = getCarrierTrackingUrl(order.trackingCourier || order.carrier, order.trackingNumber)

  const handleCopyAwb = async () => {
    if (!order.trackingNumber) return
    try {
      await navigator.clipboard.writeText(order.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  // Find timestamps for milestones from events if available
  const getEventTimeForStatus = (statusKeyword: string): string | null => {
    if (!order.events || order.events.length === 0) return null
    const ev = order.events.find((e) =>
      e.status.toLowerCase().includes(statusKeyword.toLowerCase())
    )
    return ev ? formatDateTime(ev.at) : null
  }

  return (
    <div className="w-full">
      {/* ── Cancelled / Returned Banner ── */}
      {(isCancelled || isReturned) ? (
        <div className={`p-4 rounded-[14px] flex items-start gap-3 border ${badge.bg} ${badge.border}`}>
          {isCancelled ? (
            <XCircle className={`w-5 h-5 shrink-0 mt-0.5 ${badge.text}`} />
          ) : (
            <RotateCcw className={`w-5 h-5 shrink-0 mt-0.5 ${badge.text}`} />
          )}
          <div className="min-w-0">
            <h4 className={`text-[14px] font-bold ${badge.text}`}>
              {isCancelled ? 'Order Cancelled' : 'Order Returned'}
            </h4>
            <p className="text-[12.5px] text-[#666666] mt-0.5">
              {isCancelled
                ? 'This order has been cancelled and will not be delivered.'
                : 'This order was returned to our fulfillment warehouse.'}
            </p>
          </div>
        </div>
      ) : (
        /* ── 4-Stage Visual Stepper ── */
        <div className={compact ? 'py-1' : 'py-3'}>
          {/* Progress Track Line */}
          <div className="relative mb-3">
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[3px] bg-black/8 rounded-full" />
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-[3px] bg-[#111111] rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, (currentStep / (TRACKING_STAGES.length - 1)) * 100)}%`
              }}
            />

            {/* Stepper Nodes */}
            <div className="relative flex justify-between items-center z-10 px-1">
              {TRACKING_STAGES.map((stage, idx) => {
                const isPassed = idx < currentStep
                const isCurrent = idx === currentStep
                const isPending = idx > currentStep

                return (
                  <div key={stage} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isPassed
                          ? 'bg-[#111111] text-white shadow-xs'
                          : isCurrent
                            ? 'bg-[#111111] text-white ring-4 ring-black/15 shadow-sm scale-110'
                            : 'bg-white border-2 border-black/20 text-transparent'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stepper Labels */}
          <div className="grid grid-cols-4 text-center">
            {TRACKING_STAGES.map((stage, idx) => {
              const isPassed = idx < currentStep
              const isCurrent = idx === currentStep
              const milestoneTime =
                idx === 0
                  ? getEventTimeForStatus('placed') || order.date
                  : idx === 1
                    ? getEventTimeForStatus('confirmed')
                    : idx === 2
                      ? (order.shippedAt ? formatDateTime(order.shippedAt) : getEventTimeForStatus('shipped'))
                      : (order.deliveredAt ? formatDateTime(order.deliveredAt) : getEventTimeForStatus('delivered'))

              return (
                <div key={stage} className="flex flex-col items-center px-1">
                  <span
                    className={`text-[11.5px] sm:text-[13px] font-bold leading-tight ${
                      isCurrent
                        ? 'text-[#111111]'
                        : isPassed
                          ? 'text-[#333333]'
                          : 'text-[#888888]'
                    }`}
                  >
                    {stage}
                  </span>
                  {!compact && milestoneTime && (
                    <span className="text-[10px] sm:text-[11px] text-[#777777] mt-0.5 leading-tight">
                      {milestoneTime}
                    </span>
                  )}
                  {isCurrent && !compact && !milestoneTime && (
                    <span className="text-[10px] sm:text-[11px] text-[#111111] font-medium mt-0.5">
                      In progress
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Courier & Tracking Pill (If Shipped / Carrier Assigned) ── */}
      {order.trackingNumber && (
        <div className="mt-4 p-3.5 sm:p-4 rounded-[14px] bg-[#f8f7f3] border border-black/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center shrink-0 text-[#111111]">
              <Truck className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                  {order.trackingCourier || order.carrier || 'Courier Partner'}
                </span>
                <span className="text-[12px] text-black/40">•</span>
                <span className="text-[13px] font-mono font-semibold text-[#111111] tracking-tight truncate">
                  AWB: {order.trackingNumber}
                </span>
              </div>
              <p className="text-[11.5px] text-[#666666] mt-0.5">
                {order.status === 'Delivered'
                  ? 'Package delivered to recipient.'
                  : 'Shipment handed over to courier partner.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyAwb}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-white border border-black/15 hover:bg-black/4 text-[#111111] text-[12px] font-semibold transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Copy AWB number"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#555]" />
                  <span>Copy AWB</span>
                </>
              )}
            </button>

            {carrierUrl && (
              <a
                href={carrierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <span>Live Courier Tracking</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Order Activity Event History List (Optional/Full view) ── */}
      {showEventsList && order.events && order.events.length > 0 && (
        <div className="mt-5 pt-4 border-t border-black/8">
          <h5 className="text-[12.5px] font-bold text-[#111111] uppercase tracking-wider mb-3">
            Activity History
          </h5>
          <ol className="relative border-l border-black/10 ml-2.5 space-y-4">
            {order.events.map((ev, index) => {
              const isLast = index === order.events!.length - 1
              return (
                <li key={ev.id || index} className="ml-4 relative">
                  <span
                    className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                      isLast ? 'bg-[#111111] ring-4 ring-black/10' : 'bg-black/30'
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <p className="text-[13px] font-bold text-[#111111] leading-snug">
                      {ev.note || ev.status}
                    </p>
                    <time className="text-[11px] text-[#777777] shrink-0 font-medium">
                      {formatDateTime(ev.at)}
                    </time>
                  </div>
                  <span className="text-[11px] text-[#888888] capitalize">
                    Status: {ev.status} • Logged by {ev.by}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
