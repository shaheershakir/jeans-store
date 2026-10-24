'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { addDays, format, isValid } from 'date-fns'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  Heart,
  Loader2,
  MapPin,
  Truck
} from 'lucide-react'
import { PRODUCTS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { useAuthStore, useFavoriteStore, useUIStore } from '@/lib/store'

interface ConfirmationItem {
  id: string
  name: string
  size: string
  quantity: number
  price?: string
  priceNum?: number
  img?: string
  color?: string
}

interface OrderConfirmation {
  orderNumber: string
  paymentId: string
  paymentMethod?: 'cod' | 'online'
  total: number
  subtotal: number
  shipping: number
  createdAt: string
  customerName: string
  email?: string
  phone?: string
  address: string
  apartment?: string
  city: string
  state: string
  pincode: string
  items: ConfirmationItem[]
}

const STORAGE_KEY = 'teesgarage-order-confirmation'

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

const RECOMMENDATIONS = [
  {
    productId: '00000000-0000-4000-8000-000000000005',
    name: 'Heavy Combed Cotton Tee',
    priceNum: 1299,
    img: '/mock-assets/pdp/like_high_1.png',
    swatches: [
      { name: 'Cream', hex: '#f3ecdf' },
      { name: 'Black', hex: '#171717' },
      { name: 'Grey', hex: '#8b8d90' },
      { name: 'Green', hex: '#3e7558' }
    ]
  },
  {
    productId: '00000000-0000-4000-8000-000000000010',
    name: 'Good Days Ahead Tee',
    priceNum: 1249,
    img: '/mock-assets/pdp/like_high_2.png',
    swatches: [
      { name: 'Forest Green', hex: '#1d4a35' },
      { name: 'Black', hex: '#171717' },
      { name: 'White', hex: '#f5f3ed' },
      { name: 'Beige', hex: '#d8c7a7' }
    ]
  },
  {
    productId: '00000000-0000-4000-8000-000000000001',
    name: 'Classic Stripe Tee',
    priceNum: 1199,
    img: '/mock-assets/pdp/like_high_3.png',
    swatches: [
      { name: 'White', hex: '#f5f3ed' },
      { name: 'Navy', hex: '#1e3157' },
      { name: 'Green', hex: '#3e7558' }
    ]
  },
  {
    productId: '00000000-0000-4000-8000-000000000023',
    name: 'Essential Sweatpants',
    priceNum: 1699,
    img: '/mock-assets/pdp/like_high_4.png',
    swatches: [
      { name: 'Grey', hex: '#d5d5d3' },
      { name: 'Black', hex: '#171717' },
      { name: 'Navy', hex: '#1e3157' }
    ]
  }
]

const STEPS = ['Order placed', 'Shipped', 'Out for delivery', 'Delivered']

function RecommendationCard({
  item
}: {
  item: (typeof RECOMMENDATIONS)[number]
}) {
  const [mounted, setMounted] = useState(false)
  const [activeSwatch, setActiveSwatch] = useState(0)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const showToast = useUIStore((state) => state.showToast)

  useEffect(() => setMounted(true), [])

  const product = useMemo(
    () => PRODUCTS.find((entry) => String(entry.id) === String(item.productId) || entry.name === item.name),
    [item.productId, item.name]
  )
  const favoriteId = product?.id
  const isFavorite = useFavoriteStore((state) => (favoriteId ? state.isFavorite(favoriteId) : false))
  const href = product ? getProductUrl(product) : '/shop'
  const saved = mounted && isFavorite
  const imageSrc = product?.img || item.img
  const displayPrice = product?.priceNum ?? item.priceNum
  const displayName = product?.name ?? item.name

  return (
    <article className="flex min-w-0 flex-col gap-3.5 md:flex-row md:gap-5">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[6px] bg-[#f2eee6] md:w-1/2">
        <Link href={href} className="absolute inset-0 block" aria-label={displayName}>
          <Image
            src={imageSrc}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1280px) 23vw, 156px"
            className="origin-bottom object-cover object-bottom scale-[1.06]"
          />
        </Link>
        <button
          type="button"
          className="absolute right-1.5 top-2.5 z-10 grid h-[30px] w-[30px] place-items-center rounded-full border-0 bg-white p-0 text-[#111] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-transform duration-150 hover:scale-105 active:scale-95"
          onClick={() => {
            if (!favoriteId) return
            toggleFavorite(favoriteId)
            showToast(saved ? 'Removed from favorites' : `Saved ${item.name} to favorites`)
          }}
          aria-label={saved ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
        >
          <Heart
            className="h-[17px] w-[17px]"
            strokeWidth={1.7}
            fill={saved ? '#ef4444' : 'none'}
            stroke={saved ? '#ef4444' : '#111'}
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-start pt-0 md:pt-3">
        <Link href={href} className="text-[#111] no-underline">
          <h3 className="text-[15.5px] font-medium leading-[1.6] tracking-[-0.005em]">
            {displayName}
          </h3>
        </Link>
        <p className="mt-1.5 text-[18px] font-bold leading-none text-[#111] tabular-nums min-[1360px]:mt-auto">
          {formatPrice(displayPrice)}
        </p>
        <div
          className="mt-[18px] flex items-center gap-[17px] min-[1360px]:mb-[28px] min-[1360px]:mt-[26px]"
          role="group"
          aria-label="Colour choices"
        >
          {item.swatches.map((swatch, index) => (
            <button
              key={swatch.name}
              type="button"
              className={`h-3.5 w-3.5 shrink-0 cursor-pointer rounded-full border border-black/10 p-0 transition-shadow duration-150 ${
                activeSwatch === index ? 'ring-1 ring-[#111] ring-offset-2' : ''
              }`}
              style={{ backgroundColor: swatch.hex }}
              onClick={() => setActiveSwatch(index)}
              aria-label={swatch.name}
              aria-pressed={activeSwatch === index}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

function OrderUnavailableState({
  orderNumber,
  message
}: {
  orderNumber?: string | null
  message?: string
}) {
  return (
    <section className="mx-auto my-12 max-w-[620px] rounded-[12px] border border-[#e7e5df] bg-white px-6 py-14 text-center sm:px-12">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f4f2ed] text-[#4b5563]">
        <AlertCircle className="h-8 w-8" strokeWidth={1.8} />
      </div>

      <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-[#111] sm:text-[28px]">
        Order details unavailable
      </h1>

      <p className="mt-3 text-[15px] leading-[1.6] text-[#6b7280]">
        {message ||
          "We couldn't verify or locate the details for this order. It may have been placed under another account or the order link may be invalid."}
      </p>

      {orderNumber && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-[#e7e5df] bg-[#faf9f6] px-3.5 py-1.5 text-[13.5px] font-medium text-[#4b5563]">
          <span>Order reference:</span>
          <span className="font-semibold text-[#111] tabular-nums">{orderNumber}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/orders"
          className="inline-flex h-[46px] w-full items-center justify-center rounded-[7px] bg-[#161616] px-7 text-[15px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-black sm:w-auto"
        >
          View your orders
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-[46px] w-full items-center justify-center rounded-[7px] border border-[#cfcdc6] bg-white px-7 text-[15px] font-semibold text-[#111] no-underline transition-colors duration-150 hover:border-[#a8a69f] sm:w-auto"
        >
          Continue shopping
        </Link>
      </div>
    </section>
  )
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumberParam = searchParams.get('orderNumber')?.trim() || null
  const tokenParam = searchParams.get('token')?.trim() || null

  const [order, setOrder] = useState<OrderConfirmation | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function resolveOrder() {
      // 1. Check optional temporary cache from sessionStorage
      let cached: (OrderConfirmation & { guestToken?: string }) | null = null
      try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed.orderNumber === 'string') {
            if (!orderNumberParam || parsed.orderNumber === orderNumberParam) {
              cached = parsed
            }
          }
        }
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY)
      }

      const effectiveOrderNumber = orderNumberParam || cached?.orderNumber || null
      const effectiveToken = tokenParam || cached?.guestToken || null

      if (!effectiveOrderNumber) {
        if (!isCancelled) {
          setOrder(null)
          setLoading(false)
          setErrorMessage('No order number was provided.')
        }
        return
      }

      // If we have an optional temporary cache from the immediate checkout session,
      // display it optimistically while we fetch authoritative data from the backend.
      if (cached && !isCancelled) {
        setOrder(cached)
      }

      // 2. Fetch authoritative order data from Express backend
      try {
        const endpoint = `${backendUrl || ''}/api/orders/confirmation/${encodeURIComponent(effectiveOrderNumber)}`
        const fetchUrl = new URL(endpoint, window.location.origin)
        if (effectiveToken) {
          fetchUrl.searchParams.set('token', effectiveToken)
        }
        if (cached?.email) {
          fetchUrl.searchParams.set('email', cached.email)
        }

        const authToken = useAuthStore.getState().token
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`
        }

        const res = await fetch(fetchUrl.toString(), { headers })

        if (isCancelled) return

        if (res.ok) {
          const data = await res.json()
          if (data.order && data.order.orderNumber) {
            setOrder(data.order)
            setLoading(false)
            setErrorMessage(null)
            // Refresh optional temporary cache with authoritative details
            try {
              window.sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  ...data.order,
                  guestToken: effectiveToken
                })
              )
            } catch {
              // Ignore sessionStorage errors
            }
            return
          }
        }

        // If backend returned 401/403/404 or any non-ok status:
        // Do NOT show fabricated data or fake sample orders!
        window.sessionStorage.removeItem(STORAGE_KEY)
        setOrder(null)
        setLoading(false)
        if (res.status === 401 || res.status === 403) {
          setErrorMessage('You are not authorized to view this order confirmation.')
        } else if (res.status === 404) {
          setErrorMessage(`Order "${effectiveOrderNumber}" was not found.`)
        } else {
          setErrorMessage('We could not retrieve your order details at this time.')
        }
      } catch {
        if (isCancelled) return
        if (!cached) {
          setOrder(null)
          setLoading(false)
          setErrorMessage('Unable to reach the server to verify your order.')
        } else {
          // If we had valid temporary checkout cache, retain it for offline view
          setLoading(false)
        }
      }
    }

    resolveOrder()

    return () => {
      isCancelled = true
    }
  }, [orderNumberParam, tokenParam])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  const created = useMemo(() => {
    if (!order?.createdAt) return new Date()
    const parsed = new Date(order.createdAt)
    return isValid(parsed) ? parsed : new Date()
  }, [order?.createdAt])

  const orderDate = format(created, 'MMM d, yyyy')
  const arrival = `${format(addDays(created, 3), 'MMM d')} - ${format(addDays(created, 9), 'MMM d')}`

  const pricedItems = useMemo(
    () =>
      (order?.items ?? []).map((item) => {
        const price = Number(item.priceNum ?? 0)
        const originalPrice = Math.round((price * 1.285) / 10) * 10 - 1
        const discountPercent = Math.max(
          5,
          Math.round(((originalPrice - price) / originalPrice) * 100)
        )
        return { ...item, price, originalPrice, discountPercent }
      }),
    [order?.items]
  )

  const addressLine = order
    ? [
        order.address,
        order.apartment,
        order.city,
        order.pincode
      ]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(', ')
    : ''

  async function copyOrderNumber() {
    if (!order?.orderNumber) return
    try {
      await navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
    } catch {
      // Clipboard access can be blocked; the number remains visible to copy manually.
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-16 pt-7 font-ui text-[#111] lg:pb-20">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {loading && !order ? (
          <div className="mx-auto flex min-h-[45vh] max-w-[600px] flex-col items-center justify-center gap-4 px-4 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-[#111]" />
            <p className="text-[15px] font-medium text-[#6b7280]">Loading order details...</p>
          </div>
        ) : !order ? (
          <OrderUnavailableState
            orderNumber={orderNumberParam}
            message={errorMessage || undefined}
          />
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_532px]">
            {/* ── Left column ─────────────────────────────────────────────── */}
            <div className="flex min-w-0 flex-col">
              {/* Confirmation header */}
              <section className="flex flex-col gap-5 pl-0 sm:flex-row sm:items-start sm:gap-[30px] lg:pl-[38px] lg:pt-[25px]">
                <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full bg-[#2f7d4f] text-white sm:mt-[5px] sm:h-[84px] sm:w-[84px]">
                  <Check className="h-8 w-8 sm:h-[34px] sm:w-[34px]" strokeWidth={3} />
                </div>

                <div className="min-w-0 pt-0.5">
                  <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.025em] text-[#111] sm:text-[34px]">
                    Order placed successfully!
                  </h1>
                  <p className="mt-5 max-w-[560px] text-[15px] leading-[1.55] text-[#6b7280] sm:text-[16px]">
                    Thank you for shopping with TEESGARAGE. We&apos;ve received your order and
                    will notify you once it&apos;s shipped.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-[19px]">
                    <Link
                      href="/orders"
                      className="inline-flex h-[46px] min-w-[191px] items-center justify-center rounded-[7px] bg-[#161616] px-7 text-[15px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-black"
                    >
                      View orders
                    </Link>
                    <Link
                      href="/shop"
                      className="inline-flex h-[46px] min-w-[220px] items-center justify-center rounded-[7px] border border-[#cfcdc6] bg-white px-7 text-[15px] font-semibold text-[#111] no-underline transition-colors duration-150 hover:border-[#a8a69f]"
                    >
                      Continue shopping
                    </Link>
                  </div>
                </div>
              </section>

              {/* Estimated arrival */}
              <section className="mt-8 rounded-[10px] border border-[#e7e5df] bg-white px-6 pb-6 pt-7 sm:px-7">
                <div className="flex items-start gap-5">
                  <Truck
                    className="mt-3 h-[38px] w-[38px] shrink-0 text-[#111]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium leading-tight text-[#111]">
                      Estimated arrival
                    </p>
                    <p className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.015em] text-[#111] sm:text-[23px]">
                      {arrival}
                    </p>
                    <p className="mt-2.5 text-[15px] leading-snug text-[#6b7280]">
                      We&apos;ll send you a tracking link once your order is shipped.
                    </p>
                  </div>
                </div>

                {/* Delivery timeline */}
                <div className="mt-9">
                  <div className="relative">
                    <div className="absolute left-[34px] right-[34px] top-[6px] h-[2px] rounded-full bg-[#e9e7e2] sm:left-[48px] sm:right-[34px]" />
                    <ol className="relative flex items-center justify-between pl-[27px] pr-[27px] sm:pl-[41px] sm:pr-[27px]">
                      {STEPS.map((step, index) => (
                        <li key={step} className="flex items-center justify-center">
                          {index === 0 ? (
                            <span
                              className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#111] text-white"
                              aria-current="step"
                            >
                              <Check className="h-2 w-2" strokeWidth={4} />
                            </span>
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full bg-[#e4e2dd]" />
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-3.5 grid grid-cols-4">
                    {STEPS.map((step, index) => (
                      <div
                        key={step}
                        className={
                          index === 0
                            ? 'text-left'
                            : index === STEPS.length - 1
                              ? 'text-right'
                              : 'text-center'
                        }
                      >
                        <p
                          className={`text-[11.5px] leading-tight sm:text-[14px] ${
                            index === 0 ? 'font-semibold text-[#111]' : 'text-[#6b7280]'
                          }`}
                        >
                          {step}
                        </p>
                        {index === 0 && (
                          <p className="mt-1.5 text-[12px] leading-tight text-[#6b7280] sm:text-[13px]">
                            {orderDate}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Order details */}
              <section className="mt-5 rounded-[10px] border border-[#e7e5df] bg-white">
                <div className="flex flex-col gap-6 px-6 py-[22px] sm:px-7 xl:flex-row xl:gap-0">
                  <div className="min-w-0 px-0 xl:flex-1 xl:pr-8">
                    <h2 className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-[#111]">
                      Order details
                    </h2>
                    <p className="mt-2 max-w-[350px] text-[14.5px] leading-[1.6] text-[#6b7280]">
                      A confirmation email has been sent to{' '}
                      <span className="block break-all">{order.email ?? 'your email address'}</span>
                    </p>
                  </div>

                  <div className="h-px w-full shrink-0 bg-[#e7e5df] xl:h-auto xl:w-px" />

                  <div className="flex flex-col gap-[18px] px-0 xl:w-[334px] xl:shrink-0 xl:pl-8">
                    <div className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-3">
                      <span className="text-[13.5px] text-[#6b7280]">Order number</span>
                      <span className="truncate text-[15px] font-semibold tracking-[0.01em] text-[#111] tabular-nums">
                        {order.orderNumber}
                      </span>
                      <button
                        type="button"
                        className="grid h-6 w-6 place-items-center rounded border-0 bg-transparent p-0 text-[#111] transition-colors duration-150 hover:text-[#6b7280]"
                        onClick={copyOrderNumber}
                        aria-label={copied ? 'Order number copied' : 'Copy order number'}
                        title={copied ? 'Copied' : 'Copy order number'}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <Copy className="h-[17px] w-[17px]" strokeWidth={1.7} />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3">
                      <span className="text-[13.5px] text-[#6b7280]">Order date</span>
                      <span className="text-[15px] font-medium text-[#111]">{orderDate}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Right column ────────────────────────────────────────────── */}
            <aside className="flex min-w-0 flex-col gap-5">
              {/* Order summary */}
              <section className="rounded-[10px] border border-[#e7e5df] bg-white px-6 pb-6 pt-6 sm:px-7">
                <h2 className="text-[18px] font-bold leading-tight tracking-[-0.01em] text-[#111]">
                  Order summary
                </h2>

                <div className="mt-7 flex flex-col gap-5">
                  {pricedItems.map((item, index) => {
                    const variant = [item.color, item.size]
                      .filter(Boolean)
                      .join(' / ')

                    return (
                      <article key={`${item.id}-${item.size}-${index}`} className="flex gap-[22px]">
                        <div className="relative h-[120px] w-[102px] shrink-0 overflow-hidden rounded-[6px] bg-[#f2eee6]">
                          {item.img ? (
                            <Image
                              src={item.img}
                              alt={item.name}
                              fill
                              sizes="102px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-[9px] font-semibold tracking-[0.08em] text-[#9ca3af]">
                              TEESGARAGE
                            </span>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 justify-between gap-3 pt-2">
                          <div className="flex min-w-0 flex-col">
                            <h3 className="text-[15.5px] font-semibold leading-[1.35] tracking-[-0.005em] text-[#111]">
                              {item.name}
                            </h3>
                            {variant && (
                              <p className="mt-1.5 truncate text-[14.5px] leading-tight text-[#6b7280]">
                                {variant}
                              </p>
                            )}
                            <p className="mt-auto pt-4 text-[14.5px] leading-tight text-[#4b5563]">
                              Qty: {item.quantity}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end">
                            <span className="text-[17px] font-bold leading-none text-[#111] tabular-nums">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            {item.price > 0 && (
                              <>
                                <span className="mt-2.5 text-[14px] leading-none text-[#9ca3af] line-through tabular-nums">
                                  {formatPrice(item.originalPrice * item.quantity)}
                                </span>
                                <span className="mt-2 rounded-full bg-[#e2f2e4] px-2.5 py-[3px] text-[11.5px] font-semibold leading-normal text-[#2f7d4f]">
                                  {item.discountPercent}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-6 h-px w-full bg-[#ecebe6]" />

                <div className="mt-5 flex flex-col gap-2 text-[15px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#374151]">Subtotal</span>
                    <span className="font-medium text-[#111] tabular-nums">
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#374151]">Shipping charges</span>
                    <span className="font-medium text-[#111] tabular-nums">
                      {order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-px w-full bg-[#ecebe6]" />

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[25px] font-bold leading-none tracking-[-0.02em] text-[#111]">
                      Total
                    </span>
                    <span className="text-[26px] font-bold leading-none tracking-[-0.02em] text-[#111] tabular-nums">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  <p className="mt-3 text-right text-[14px] leading-tight text-[#6b7280]">
                    Inclusive of all taxes
                  </p>
                </div>
              </section>

              {/* Shipping address */}
              <section className="rounded-[10px] border border-[#e7e5df] bg-white px-6 pb-5 pt-6 sm:px-7">
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 shrink-0 text-[#111]" strokeWidth={1.7} aria-hidden="true" />
                  <h2 className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-[#111]">
                    Shipping to
                  </h2>
                </div>

                <address className="mt-3 pl-0 text-[15px] not-italic leading-[1.6] text-[#4b5563] sm:pl-9">
                  <span className="block text-[#111]">{order.customerName}</span>
                  <span className="block break-words">{addressLine}</span>
                  <span className="block">{[order.state, 'India'].filter(Boolean).join(', ')}</span>
                  {order.phone && <span className="mt-0.5 block tabular-nums">{order.phone}</span>}
                </address>
              </section>
            </aside>
          </div>
        )}

        {/* ── Recommendations ───────────────────────────────────────────── */}
        <section className="mt-11" aria-labelledby="recommendations-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2
              id="recommendations-heading"
              className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#111] sm:text-[23px]"
            >
              You may also like
            </h2>
            <Link
              href="/shop"
              className="inline-flex shrink-0 items-center gap-1.5 text-[14.5px] font-medium text-[#111] no-underline transition-opacity duration-150 hover:opacity-70"
            >
              View all
              <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-8 xl:grid-cols-4 xl:gap-x-7">
            {RECOMMENDATIONS.map((item) => (
              <RecommendationCard key={item.productId} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#faf9f6] pb-16 pt-7 font-ui text-[#111] lg:pb-20">
          <div className="mx-auto flex min-h-[45vh] max-w-[600px] flex-col items-center justify-center gap-4 px-4 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-[#111]" />
            <p className="text-[15px] font-medium text-[#6b7280]">Loading order details...</p>
          </div>
        </main>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  )
}
