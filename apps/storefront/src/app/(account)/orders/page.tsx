'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Settings,
  Truck,
  XCircle,
  X,
  Loader2
} from 'lucide-react'
import { useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { fetchCustomerOrders, cancelCustomerOrder, type CustomerOrder } from '@/lib/customerOrders'

function getStatusBadge(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'delivered') {
    return {
      bg: 'bg-[#eaf5ed]',
      text: 'text-[#1e833a]',
      dot: 'bg-[#1e833a]',
      label: 'Delivered'
    }
  }
  if (s === 'shipped' || s === 'dispatched' || s === 'out for delivery') {
    return {
      bg: 'bg-[#ebf3fc]',
      text: 'text-[#1d6ee5]',
      dot: 'bg-[#1d6ee5]',
      label: s === 'dispatched' ? 'Dispatched' : 'Shipped'
    }
  }
  if (s === 'cancelled' || s === 'returned' || s === 'refunded') {
    return {
      bg: 'bg-[#fdeeed]',
      text: 'text-[#d93838]',
      dot: 'bg-[#d93838]',
      label: s === 'cancelled' ? 'Cancelled' : (s === 'returned' ? 'Returned' : 'Refunded')
    }
  }
  return {
    bg: 'bg-[#fef5e7]',
    text: 'text-[#c05621]',
    dot: 'bg-[#c05621]',
    label: s === 'confirmed' ? 'Confirmed' : (s === 'processing' ? 'Processing' : 'Pending')
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<CustomerOrder | null>(null)

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login?redirect=/orders')
    }
  }, [mounted, isAuthenticated, router])

  const loadOrders = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchCustomerOrders(token)
      setOrders(data)
    } catch (err: any) {
      showToast(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [token, showToast])

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      void loadOrders()
    }
  }, [mounted, isAuthenticated, token, loadOrders])

  const handleBuyAgain = async (productName?: string) => {
    if (!productName) {
      router.push('/shop')
      return
    }
    try {
      const res = await fetch('/api/products')
      const data = res.ok ? await res.json() : null
      const product = Array.isArray(data?.products)
        ? data.products.find((p: any) => p.name === productName)
        : null
      if (product) {
        addItem(product.id, 'L', product)
        showToast(`Added ${product.name} to bag`)
        openOverlay('cart')
      } else {
        router.push('/shop')
      }
    } catch {
      router.push('/shop')
    }
  }

  const handleTrackOrder = (orderId: string) => {
    const whatsappNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'
    window.open(
      `https://wa.me/${whatsappNum}?text=${encodeURIComponent(`Hi TEESGARAGE, please share tracking status for order #${orderId}.`)}`,
      '_blank'
    )
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to cancel order #${orderId}?`)) return
    if (!token) return

    setCancellingId(orderId)
    try {
      await cancelCustomerOrder(token, orderId)
      showToast(`Order #${orderId} has been cancelled.`)
      await loadOrders()
    } catch (err: any) {
      showToast(err.message || 'Could not cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <>
      <header className="mb-6 sm:mb-7">
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-extrabold tracking-[-0.03em] text-[#111111] leading-tight">
          My Orders
        </h1>
        <p className="mt-1 text-[14px] sm:text-[15px] text-[#666666]">
          Track and manage your orders.
        </p>
      </header>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4 sm:space-y-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[20px] bg-white border border-black/8 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-black/6">
                <div className="h-4 w-32 bg-neutral-200 rounded-md" />
                <div className="h-5 w-20 bg-neutral-200 rounded-full" />
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-24 bg-neutral-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 bg-neutral-200 rounded-md" />
                  <div className="h-3 w-1/2 bg-neutral-100 rounded-md" />
                  <div className="h-5 w-24 bg-neutral-200 rounded-md mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="rounded-[20px] bg-white border border-black/8 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-black/6 flex items-center justify-center mb-4 text-[#666]">
            <Package className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#111111]">No orders yet</h3>
          <p className="mt-1.5 text-[14px] text-[#666666] max-w-sm">
            You haven&apos;t placed any orders yet. Discover our latest heavyweight drop.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-[11px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold transition-all duration-150 active:scale-[0.98] shadow-xs cursor-pointer"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {/* Orders Stack */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4 sm:space-y-5">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status)
            const sLower = (order.status || '').toLowerCase()
            const isDelivered = sLower === 'delivered'
            const isShipped = ['shipped', 'dispatched', 'out for delivery'].includes(sLower)
            const canCancel = ['pending', 'confirmed'].includes(sLower)
            const isMultiItem = order.items.length > 1
            const firstItem = order.items[0]

            return (
              <article
                key={order.orderId}
                className="rounded-[20px] bg-white border border-black/8 p-4 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
              >
                {/* Header Row: Order ID, Date & Status Badge */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-black/6">
                  <div className="flex items-baseline gap-2.5 sm:gap-3">
                    <strong className="text-[14.5px] sm:text-[15.5px] font-bold text-[#111111] tracking-tight">
                      #{order.orderId}
                    </strong>
                    <span className="text-[12.5px] sm:text-[13.5px] text-[#777777] font-normal">
                      {order.date}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] font-semibold ${badge.bg} ${badge.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>

                {/* Main Content Area */}
                <div className="mt-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  {/* Left: Multi-item vs Single-item */}
                  {isMultiItem ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5 flex-1 min-w-0">
                      {/* Multi-item Thumbnails Row */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0 max-w-full">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className="relative w-[68px] h-[86px] sm:w-[78px] sm:h-[98px] rounded-[12px] overflow-hidden bg-[#eeece6] border border-black/6 shrink-0"
                          >
                            <Image
                              src={item.img || '/featured-collection.jpg'}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                            {idx === 2 && order.items.length > 3 && (
                              <span className="absolute bottom-1 right-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                                +{order.items.length - 2}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Details Column */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-baseline justify-between sm:block">
                          <h2 className="text-[14.5px] sm:text-[15px] font-bold text-[#111111] leading-snug">
                            {order.items.length} items
                          </h2>
                          <strong className="text-[16px] sm:text-[17.5px] font-extrabold text-[#111111] mt-0.5 sm:mb-2 tracking-tight">
                            {formatPrice(order.total)}
                          </strong>
                        </div>

                        {/* Delivery Status Row */}
                        <div className="flex items-start gap-2.5 mt-1 sm:mt-0">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12.5px] sm:text-[13.5px] font-bold text-[#111111] leading-tight">
                              {badge.label}
                            </span>
                            <span className="text-[11.5px] sm:text-[12.5px] text-[#777777] leading-tight mt-0.5 truncate">
                              {order.expectedDelivery}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Single-item Order */
                    <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 flex-1 min-w-0">
                      <div className="relative w-[84px] h-[84px] sm:w-[105px] sm:h-[105px] md:w-[115px] md:h-[115px] rounded-[14px] overflow-hidden bg-[#eeece6] shrink-0 border border-black/6">
                        <Image
                          src={firstItem?.img || '/featured-collection.jpg'}
                          alt={firstItem?.name || 'Ordered Item'}
                          fill
                          sizes="115px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <h2 className="text-[14px] sm:text-[15.5px] font-bold text-[#111111] leading-snug line-clamp-1 sm:line-clamp-2">
                          {firstItem?.name || 'TEESGARAGE product'}
                        </h2>
                        <p className="text-[11.5px] sm:text-[12.5px] text-[#666666] mt-0.5 truncate">
                          {firstItem?.size ? `Size ${firstItem.size}  •  ${firstItem.qty} × ${firstItem.price}` : 'Standard size'}
                        </p>
                        <strong className="text-[15.5px] sm:text-[17.5px] font-extrabold text-[#111111] mt-1 mb-1.5 sm:mb-2 tracking-tight">
                          {formatPrice(order.total)}
                        </strong>

                        {/* Delivery / Status Info Row */}
                        <div className="flex items-start gap-2">
                          {isShipped ? (
                            <Truck className="w-4 h-4 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                          ) : sLower === 'cancelled' ? (
                            <XCircle className="w-4 h-4 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                          ) : sLower === 'processing' ? (
                            <Settings className="w-4 h-4 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                          ) : (
                            <Package className="w-4 h-4 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] sm:text-[13.5px] font-bold text-[#111111] leading-tight">
                              {badge.label}
                            </span>
                            <span className="text-[11px] sm:text-[12.5px] text-[#777777] leading-tight mt-0.5 truncate">
                              {order.expectedDelivery}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right: Actions Column */}
                  <div className="w-full md:w-[165px] shrink-0 flex flex-row md:flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-black/6">
                    {isDelivered && (
                      <button
                        type="button"
                        onClick={() => handleBuyAgain(firstItem?.name)}
                        className="flex-1 md:w-full py-2.5 px-3 rounded-[10px] text-[13px] font-semibold text-center bg-[#141414] hover:bg-[#262626] text-white shadow-2xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
                      >
                        Buy Again
                      </button>
                    )}

                    {isShipped && (
                      <button
                        type="button"
                        onClick={() => handleTrackOrder(order.orderId)}
                        className="flex-1 md:w-full py-2.5 px-3 rounded-[10px] text-[13px] font-semibold text-center bg-[#141414] hover:bg-[#262626] text-white shadow-2xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
                      >
                        Track Order
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        disabled={cancellingId === order.orderId}
                        onClick={() => handleCancelOrder(order.orderId)}
                        className="flex-1 md:w-full py-2.5 px-3 rounded-[10px] text-[13px] font-semibold text-center bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                      >
                        {cancellingId === order.orderId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Cancel Order</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(order)}
                      className="flex-1 md:w-full py-2.5 px-3 rounded-[10px] text-[13px] font-semibold text-center bg-white hover:bg-black/3 border border-black/15 text-[#111111] transition-all duration-150 active:scale-[0.98] cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Order Details Dialog Modal ─────────────────────────────── */}
      {selectedOrderDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[540px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#111111]">
                  Order #{selectedOrderDetails.orderId}
                </h3>
                <p className="text-[13px] text-[#666666] mt-0.5">
                  Placed on {selectedOrderDetails.date}
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5 cursor-pointer"
                onClick={() => setSelectedOrderDetails(null)}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items List */}
            <div className="py-4 border-b border-black/8 space-y-3">
              <h4 className="text-[13px] font-bold text-[#666666] uppercase tracking-wider">Items in Order</h4>
              {selectedOrderDetails.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-black/6">
                    <Image
                      src={item.img || '/featured-collection.jpg'}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-[#111111] truncate">{item.name}</p>
                    <p className="text-[12px] text-[#666666]">Size {item.size} • Qty {item.qty}</p>
                  </div>
                  <span className="text-[13.5px] font-bold text-[#111111]">{item.price}</span>
                </div>
              ))}
            </div>

            <div className="py-4 space-y-2.5 text-[14px]">
              <div className="flex justify-between py-0.5">
                <span className="text-[#666]">Status</span>
                <span className="font-semibold text-[#111]">{selectedOrderDetails.status}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#666]">Subtotal</span>
                <span className="font-medium text-[#111]">{formatPrice(selectedOrderDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#666]">Shipping</span>
                <span className="font-medium text-[#111]">
                  {selectedOrderDetails.shipping === 0 ? 'Free' : formatPrice(selectedOrderDetails.shipping)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-black/6 font-extrabold text-[15px]">
                <span className="text-[#111]">Total Amount</span>
                <span className="text-[#111]">{formatPrice(selectedOrderDetails.total)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-black/6">
                <span className="text-[#666]">Delivery Address</span>
                <span className="font-medium text-[#111] text-right max-w-[260px] text-[13px] leading-snug">
                  {selectedOrderDetails.shippingAddress || 'Address on file'}
                </span>
              </div>
              {selectedOrderDetails.trackingNumber && (
                <div className="flex justify-between py-0.5">
                  <span className="text-[#666]">Tracking</span>
                  <span className="font-medium text-[#111] text-[13px]">
                    {selectedOrderDetails.trackingCourier ? `${selectedOrderDetails.trackingCourier}: ` : ''}
                    {selectedOrderDetails.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-black/8 flex justify-end">
              <button
                type="button"
                className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold cursor-pointer"
                onClick={() => setSelectedOrderDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
