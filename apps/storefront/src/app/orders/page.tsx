'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  Truck,
  User,
  XCircle,
  X
} from 'lucide-react'
import { useCartStore, useUIStore, useAuthStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { fetchCustomerOrders, type CustomerOrder } from '@/lib/customerOrders'

// ─── Sidebar Navigation Links ────────────────────────────────────────────────

const ACCOUNT_NAV_LINKS = [
  { label: 'My Account', href: '/profile', Icon: User, id: 'account' },
  { label: 'Orders', href: '/orders', Icon: Package, id: 'orders' },
  { label: 'Wishlist', href: '/wishlist', Icon: Heart, id: 'wishlist' },
  { label: 'Addresses', href: '/profile?tab=addresses', Icon: MapPin, id: 'addresses' },
  { label: 'Payment Methods', href: '/profile?tab=payment', Icon: CreditCard, id: 'payment' },
  { label: 'Account Settings', href: '/profile?tab=settings', Icon: Settings, id: 'settings' },
]

// ─── Mock Orders Data Matching Design 1:1 ───────────────────────────────────

interface MockOrderItem {
  orderId: string
  date: string
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled'
  itemsCount?: number
  thumbnails: string[]
  productName?: string
  variant?: string
  price: string
  deliveryStatus: string
  deliverySubtext: string
  deliveryIcon: 'package' | 'truck' | 'settings' | 'x-circle'
  actions: {
    label: string
    variant: 'solid' | 'outline'
    actionType: 'buy-again' | 'view-details' | 'track' | 'return' | 'cancel'
  }[]
}

const MOCK_ORDERS: MockOrderItem[] = [
  {
    orderId: 'TG128450',
    date: '12 Oct 2026',
    status: 'Delivered',
    productName: 'Vintage Skate Micro-Stripe Tee',
    variant: 'Washed Black / Ash  •  L  •  1 x ₹1,249',
    price: '₹1,249',
    deliveryStatus: 'Delivered on 15 Oct 2026',
    deliverySubtext: 'Your order has been delivered',
    deliveryIcon: 'package',
    thumbnails: ['/mock-assets/product-vintage-skate-clean.jpg'],
    actions: [
      { label: 'Buy Again', variant: 'solid', actionType: 'buy-again' },
      { label: 'View Details', variant: 'outline', actionType: 'view-details' },
      { label: 'Return / Exchange', variant: 'outline', actionType: 'return' }
    ]
  },
  {
    orderId: 'TG128312',
    date: '05 Oct 2026',
    status: 'Shipped',
    productName: 'Doodle Archive Oversized Tee',
    variant: 'Off White  •  XL  •  1 x ₹1,099',
    price: '₹1,099',
    deliveryStatus: 'Shipped on 07 Oct 2026',
    deliverySubtext: 'Arriving by 10 Oct 2026',
    deliveryIcon: 'truck',
    thumbnails: ['/mock-assets/product-doodle-archive-clean.jpg'],
    actions: [
      { label: 'Track Order', variant: 'solid', actionType: 'track' },
      { label: 'View Details', variant: 'outline', actionType: 'view-details' },
      { label: 'Return / Exchange', variant: 'outline', actionType: 'return' }
    ]
  },
  {
    orderId: 'TG128001',
    date: '01 Oct 2026',
    status: 'Processing',
    productName: 'Good Days Ahead Tee',
    variant: 'Forest Green  •  M  •  1 x ₹1,249',
    price: '₹1,249',
    deliveryStatus: 'Processing your order',
    deliverySubtext: "We'll ship it soon",
    deliveryIcon: 'settings',
    thumbnails: ['/mock-assets/product-good-days-ahead-clean.jpg'],
    actions: [
      { label: 'View Details', variant: 'outline', actionType: 'view-details' },
      { label: 'Cancel Order', variant: 'outline', actionType: 'cancel' }
    ]
  },
  {
    orderId: 'TG127884',
    date: '22 Sep 2026',
    status: 'Delivered',
    itemsCount: 4,
    thumbnails: [
      '/mock-assets/product-vintage-skate-clean.jpg',
      '/mock-assets/brown-tee-order.jpg',
      '/mock-assets/tan-cap-clean.jpg'
    ],
    price: '₹3,896',
    deliveryStatus: 'Delivered on 26 Sep 2026',
    deliverySubtext: 'Your order has been delivered',
    deliveryIcon: 'package',
    actions: [
      { label: 'View Details', variant: 'outline', actionType: 'view-details' },
      { label: 'Buy Again', variant: 'outline', actionType: 'buy-again' }
    ]
  },
  {
    orderId: 'TG127650',
    date: '14 Sep 2026',
    status: 'Cancelled',
    productName: 'Daisy Minimal Tee',
    variant: 'Black  •  L  •  1 x ₹1,099',
    price: '₹1,099',
    deliveryStatus: 'Cancelled on 15 Sep 2026',
    deliverySubtext: 'Payment was not completed',
    deliveryIcon: 'x-circle',
    thumbnails: ['/mock-assets/product-daisy-minimal-clean.jpg'],
    actions: [
      { label: 'View Details', variant: 'outline', actionType: 'view-details' }
    ]
  }
]

export default function OrdersPage() {
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<MockOrderItem | null>(null)

  const addItem = useCartStore((s) => s.addItem)
  const openOverlay = useUIStore((s) => s.openOverlay)
  const showToast = useUIStore((s) => s.showToast)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  const handleBuyAgain = (productName?: string) => {
    // Add default item to cart
    addItem(101, 'L')
    showToast(`Added ${productName || 'item'} to bag`)
    openOverlay('cart')
  }

  const handleTrackOrder = (orderId: string) => {
    const whatsappNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'
    window.open(
      `https://wa.me/${whatsappNum}?text=${encodeURIComponent(`Hi TEESGARAGE, please share tracking status for order #${orderId}.`)}`,
      '_blank'
    )
  }

  const handleReturnExchange = (orderId: string) => {
    window.location.href = `mailto:concierge@teesgarage.in?subject=${encodeURIComponent(`Return/Exchange Request - Order #${orderId}`)}`
  }

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
      showToast(`Cancellation request received for order #${orderId}.`)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-black selection:text-white">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8 py-10 max-[768px]:py-6">
        <div className="flex gap-10 lg:gap-14 max-[860px]:flex-col">
          {/* ── Left Sidebar Navigation ─────────────────────────────── */}
          <aside className="w-[220px] shrink-0 max-[860px]:w-full" aria-label="Account Navigation">
            <nav className="flex flex-col gap-1 sticky top-[96px] max-[860px]:static max-[860px]:flex-row max-[860px]:overflow-x-auto max-[860px]:pb-3 max-[860px]:border-b max-[860px]:border-black/8 scrollbar-none">
              {ACCOUNT_NAV_LINKS.map(({ label, href, Icon, id }) => {
                const isActive = id === 'orders'
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-[12px] text-[13.5px] transition-colors whitespace-nowrap ${
                      isActive
                        ? 'font-bold text-[#111111] bg-[#e8e6e1]'
                        : 'font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0 stroke-[1.8]" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                )
              })}

              <div className="my-3.5 h-px bg-black/8 mx-2 max-[860px]:hidden" />

              <button
                type="button"
                className="flex items-center gap-3.5 px-4 py-3 rounded-[12px] text-[13.5px] font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4 transition-colors text-left max-[860px]:whitespace-nowrap"
                onClick={logout}
              >
                <LogOut className="w-[18px] h-[18px] shrink-0 stroke-[1.8]" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            </nav>
          </aside>

          {/* ── Right Content Area ─────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            <header className="mb-7">
              <h1 className="text-[32px] md:text-[36px] font-extrabold tracking-[-0.03em] text-[#111111] leading-tight">
                My Orders
              </h1>
              <p className="mt-1 text-[15px] text-[#666666]">
                Track, return or buy again.
              </p>
            </header>

            {/* Orders Stack */}
            <div className="space-y-5">
              {MOCK_ORDERS.map((order) => {
                const isDelivered = order.status === 'Delivered'
                const isShipped = order.status === 'Shipped'
                const isProcessing = order.status === 'Processing'
                const isCancelled = order.status === 'Cancelled'

                return (
                  <article
                    key={order.orderId}
                    className="rounded-[20px] bg-white border border-black/8 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]"
                  >
                    {/* Header Row: Order ID, Date & Status Badge */}
                    <div className="flex items-center justify-between pb-4">
                      <div className="flex items-baseline gap-3">
                        <strong className="text-[15.5px] font-bold text-[#111111] tracking-tight">
                          #{order.orderId}
                        </strong>
                        <span className="text-[13.5px] text-[#777777] font-normal">
                          {order.date}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#eaf5ed] text-[#1e833a]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1e833a]" />
                          Delivered
                        </span>
                      )}
                      {isShipped && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#ebf3fc] text-[#1d6ee5]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1d6ee5]" />
                          Shipped
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#fef5e7] text-[#c05621]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c05621]" />
                          Processing
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#fdeeed] text-[#d93838]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d93838]" />
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* Main Row: Product Image + Details + Actions */}
                    <div className="mt-2 flex items-center justify-between gap-6 max-[768px]:flex-col max-[768px]:items-start">
                      {/* Left: Product Media & Information */}
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        {/* Multi-item Thumbnails or Single Image */}
                        {order.itemsCount ? (
                          <div className="flex items-center gap-2.5 shrink-0">
                            {order.thumbnails.map((thumb, idx) => (
                              <div
                                key={idx}
                                className="relative w-[78px] h-[98px] rounded-[13px] overflow-hidden bg-[#eeece6] border border-black/6"
                              >
                                <Image
                                  src={thumb}
                                  alt={`Item ${idx + 1}`}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                                {idx === 2 && (
                                  <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10.5px] font-bold text-white backdrop-blur-xs">
                                    +1
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="relative w-[124px] h-[124px] rounded-[16px] overflow-hidden bg-[#eeece6] shrink-0 border border-black/6">
                            <Image
                              src={order.thumbnails[0]}
                              alt={order.productName || 'Ordered Item'}
                              fill
                              sizes="124px"
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex flex-col min-w-0">
                          {order.productName && (
                            <h2 className="text-[15.5px] font-bold text-[#111111] truncate leading-snug">
                              {order.productName}
                            </h2>
                          )}
                          {order.itemsCount && (
                            <h2 className="text-[15px] font-bold text-[#111111] leading-snug">
                              {order.itemsCount} items
                            </h2>
                          )}
                          {order.variant && (
                            <p className="text-[12.5px] text-[#666666] mt-0.5 truncate">
                              {order.variant}
                            </p>
                          )}
                          <strong className="text-[17.5px] font-extrabold text-[#111111] mt-1.5 mb-3 tracking-tight">
                            {order.price}
                          </strong>

                          {/* Delivery / Status Info Row */}
                          <div className="flex items-start gap-3">
                            {order.deliveryIcon === 'package' && (
                              <Package className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                            )}
                            {order.deliveryIcon === 'truck' && (
                              <Truck className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                            )}
                            {order.deliveryIcon === 'settings' && (
                              <Settings className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                            )}
                            {order.deliveryIcon === 'x-circle' && (
                              <XCircle className="w-5 h-5 text-[#222222] shrink-0 mt-0.5 stroke-[1.6]" />
                            )}
                            <div className="flex flex-col">
                              <span className="text-[13.5px] font-bold text-[#111111] leading-tight">
                                {order.deliveryStatus}
                              </span>
                              <span className="text-[12.5px] text-[#777777] leading-tight mt-0.5">
                                {order.deliverySubtext}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions Column */}
                      <div className="w-[185px] shrink-0 flex flex-col gap-2.5 max-[768px]:w-full max-[768px]:flex-row max-[768px]:flex-wrap">
                        {order.actions.map((act, idx) => {
                          const isSolid = act.variant === 'solid'
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`w-full py-2.5 px-4 rounded-[10px] text-[13.5px] font-semibold text-center transition-all duration-150 active:scale-[0.98] cursor-pointer max-[768px]:flex-1 ${
                                isSolid
                                  ? 'bg-[#141414] hover:bg-[#262626] text-white shadow-xs'
                                  : 'bg-white hover:bg-black/3 border border-black/15 text-[#111111]'
                              }`}
                              onClick={() => {
                                if (act.actionType === 'buy-again') {
                                  handleBuyAgain(order.productName)
                                } else if (act.actionType === 'track') {
                                  handleTrackOrder(order.orderId)
                                } else if (act.actionType === 'return') {
                                  handleReturnExchange(order.orderId)
                                } else if (act.actionType === 'cancel') {
                                  handleCancelOrder(order.orderId)
                                } else if (act.actionType === 'view-details') {
                                  setSelectedOrderDetails(order)
                                }
                              }}
                            >
                              {act.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </main>
        </div>
      </div>

      {/* ── Order Details Dialog Modal ─────────────────────────────── */}
      {selectedOrderDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-[500px] rounded-[24px] bg-white p-6 shadow-2xl border border-black/8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#111111]">
                  Order #{'orderId' in selectedOrderDetails ? selectedOrderDetails.orderId : ''}
                </h3>
                <p className="text-[13px] text-[#666666] mt-0.5">
                  Placed on {'date' in selectedOrderDetails ? selectedOrderDetails.date : ''}
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#444] hover:bg-black/5"
                onClick={() => setSelectedOrderDetails(null)}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-[14px]">
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Status</span>
                <span className="font-semibold text-[#111]">{selectedOrderDetails.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Total Amount</span>
                <span className="font-extrabold text-[#111]">{selectedOrderDetails.price}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Delivery Address</span>
                <span className="font-medium text-[#111] text-right max-w-[240px]">
                  B-402 Greenfield Heights, Indiranagar, Bengaluru, 560038
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#666]">Payment Method</span>
                <span className="font-medium text-[#111]">UPI / Razorpay</span>
              </div>
            </div>

            <div className="pt-4 border-t border-black/8 flex justify-end">
              <button
                type="button"
                className="py-2.5 px-5 rounded-[10px] bg-[#141414] hover:bg-[#262626] text-white text-[13.5px] font-semibold"
                onClick={() => setSelectedOrderDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
