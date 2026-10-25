'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  Trash2,
  Truck,
  ArrowRight,
  Plus,
  Minus,
  MapPin
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useAuthStore, type CartItem } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { PRODUCTS, type Product } from '@/lib/constants'

interface DeliveryQuote {
  subtotal: number
  shipping: number
  total: number
  weightGrams?: number
  deliveryEstimation?: {
    minDays: number
    maxDays: number
    exactDeliveryDate?: string
    zone: 'kerala' | 'restOfIndia'
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function BagClient() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)

  const addresses = useAuthStore((state) => state.addresses)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [catalog, setCatalog] = useState<Product[]>(PRODUCTS)
  const [pincode, setPincode] = useState('670301')
  const [deliveryState, setDeliveryState] = useState('Kerala')
  const [pincodeLocation, setPincodeLocation] = useState('Kannur, Kerala')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  // Rehydrate persisted stores
  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
  }, [])

  // Fetch live products for stock validation
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.products) && data.products.length > 0) {
          setCatalog(data.products)
        }
      })
      .catch(() => {})
  }, [])

  // Auto-fill delivery destination if saved address is available
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr?.pincode) {
        setPincode(defaultAddr.pincode)
      }
      if (defaultAddr?.state) {
        setDeliveryState(defaultAddr.state)
      }
      if (defaultAddr?.city && defaultAddr?.state) {
        setPincodeLocation(`${defaultAddr.city}, ${defaultAddr.state}`)
      }
    }
  }, [addresses])

  // Check PIN code via Postal API
  const handleVerifyPincode = async (codeToCheck?: string) => {
    const targetCode = (codeToCheck !== undefined ? codeToCheck : pincode).replace(/\D/g, '').slice(0, 6)
    if (targetCode.length !== 6) {
      setPincodeError('Please enter a valid 6-digit PIN code')
      return
    }

    setPincodeLoading(true)
    setPincodeError('')

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${targetCode}`)
      const data = await res.json()
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0]
        const district = po.District || po.Name || ''
        const state = po.State || ''
        setPincodeLocation(district ? `${district}, ${state}` : state)
        setDeliveryState(state)
        setPincodeError('')
      } else {
        // Fallback for known regional zones if postal API fails or doesn't have it
        if (targetCode.startsWith('67') || targetCode.startsWith('68') || targetCode.startsWith('69')) {
          setPincodeLocation('Kannur, Kerala')
          setDeliveryState('Kerala')
          setPincodeError('')
        } else {
          setPincodeError('Invalid PIN code or location not found')
        }
      }
    } catch {
      // Offline fallback: infer state from leading digits
      if (targetCode.startsWith('67') || targetCode.startsWith('68') || targetCode.startsWith('69')) {
        setPincodeLocation('Kannur, Kerala')
        setDeliveryState('Kerala')
      } else {
        setPincodeLocation('India')
        setDeliveryState('India')
      }
      setPincodeError('')
    } finally {
      setPincodeLoading(false)
    }
  }

  // Calculate delivery quote whenever delivery destination or items change
  useEffect(() => {
    if (items.length === 0) {
      setQuote(null)
      setQuoteLoading(false)
      return
    }

    const controller = new AbortController()
    setQuoteLoading(true)

    // Call API /api/orders/quote
    fetch(`${API_URL}/api/orders/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: deliveryState || 'Kerala',
        pincode: pincode.length === 6 ? pincode : undefined,
        items: items.map((item) => ({
          id: String(item.id),
          variantId: typeof item.variantId === 'number' && item.variantId > 0 ? item.variantId : undefined,
          size: String(item.size),
          quantity: item.qty
        }))
      }),
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Delivery calculation unavailable')
        setQuote(payload as DeliveryQuote)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        // Fallback calculation:
        const sub = cartSubtotal(items)
        const isKerala =
          deliveryState.toLowerCase().includes('kerala') ||
          pincode.startsWith('67') ||
          pincode.startsWith('68') ||
          pincode.startsWith('69')
        const shippingFee = sub >= 1999 ? 0 : isKerala ? 60 : 100
        setQuote({
          subtotal: sub,
          shipping: shippingFee,
          total: sub + shippingFee,
          deliveryEstimation: {
            minDays: isKerala ? 2 : 4,
            maxDays: isKerala ? 5 : 7,
            zone: isKerala ? 'kerala' : 'restOfIndia'
          }
        })
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false)
      })

    return () => controller.abort()
  }, [deliveryState, pincode, items])

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const shipping = quote?.shipping ?? (pincode ? 60 : 0)
  const total = quote ? quote.total : subtotal + shipping

  // Check out-of-stock logic
  const isItemOutOfStock = (item: CartItem): boolean => {
    if ((item as any).inStock === false) return true
    const product = catalog.find((p) => String(p.id) === String(item.id))
    if (!product) return false
    if (product.inStock === false) return true
    if (product.sizes && product.sizes.length > 0 && item.size) {
      if (!product.sizes.includes(item.size)) return true
    }
    return false
  }

  const hasOutOfStockItems = useMemo(() => {
    return items.some((item) => isItemOutOfStock(item))
  }, [items, catalog])

  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems || items.length === 0) return
    router.push('/checkout')
  }

  // Empty Bag View
  if (count === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-200px)] bg-[#FAF9F6] px-4 py-12 md:py-20">
        <div className="mx-auto w-full max-w-[600px] text-center bg-white rounded-[16px] border border-black/[0.08] p-8 sm:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f4f5] text-[#71717a]">
            <ShoppingBag className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h1 className="mb-2 font-brand text-[24px] sm:text-[28px] font-bold text-[#111111]">
            Your Shopping Bag is Empty
          </h1>
          <p className="mx-auto mb-8 max-w-[360px] font-ui text-[14px] text-[#666666]">
            Explore our heavyweight stripes, vintage-wash t-shirts, and structured relaxed silhouettes to build your wardrobe.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#111111] px-8 font-brand text-[13px] font-semibold text-white hover:bg-black transition-colors"
          >
            Explore Garments &rarr;
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-[calc(100vh-200px)] bg-[#FAF9F6] px-4 sm:px-6 lg:px-8 pb-24 pt-6 sm:pt-9">
      <div className="mx-auto w-full max-w-[1240px]">
        {/* ── Breadcrumb Navigation ── */}
        <nav className="mb-4 sm:mb-6 flex items-center gap-2 font-ui text-[12px] text-[#71717a]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#111111] transition-colors">Home</Link>
          <span className="text-[#a1a1aa]" aria-hidden="true">/</span>
          <Link href="/shop" className="hover:text-[#111111] transition-colors">Shop</Link>
          <span className="text-[#a1a1aa]" aria-hidden="true">/</span>
          <span className="font-semibold text-[#111111]">Shopping Bag</span>
        </nav>

        {/* ── Page Header: Title & Continue Shopping ── */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-black/8 pb-4">
          <h1 className="font-brand text-[26px] sm:text-[32px] font-bold text-[#111111] leading-tight">
            Shopping Bag <span className="font-normal font-sans text-[#71717a] text-[20px] sm:text-[24px]">({count})</span>
          </h1>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 font-ui text-[12.5px] sm:text-[13px] text-[#555555] hover:text-[#111111] underline underline-offset-4 transition-colors"
          >
            &larr; Continue Shopping
          </Link>
        </div>

        {/* ── Main Layout: Items (Left) vs Summary (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,400px)] items-start gap-8 lg:gap-10">
          {/* ── Left Column: Items List ── */}
          <section className="flex flex-col gap-4" aria-label="Garments in your bag">
            {items.map((item) => {
              const outOfStock = isItemOutOfStock(item)
              return (
                <article
                  key={`${item.id}-${item.variantId ?? item.size}`}
                  className="flex gap-4 sm:gap-5 rounded-[14px] sm:rounded-[16px] border border-black/[0.08] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                >
                  {/* Thumbnail */}
                  <Link
                    href={getProductUrl(item)}
                    className="relative w-[90px] sm:w-[105px] h-[105px] sm:h-[120px] shrink-0 overflow-hidden rounded-[10px] bg-[#f4f4f5]"
                    tabIndex={-1}
                  >
                    <Image
                      src={item.img}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 90px, 110px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Name & Trash Row */}
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={getProductUrl(item)}
                          className="font-brand text-[15px] sm:text-[16px] font-bold text-[#111827] leading-snug truncate hover:underline"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.size, item.variantId)}
                          className="p-1 text-[#71717a] hover:text-[#dc2626] transition-colors cursor-pointer shrink-0"
                          aria-label={`Remove ${item.name} from bag`}
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.8]" />
                        </button>
                      </div>

                      {/* Variant Tags */}
                      <div className="mt-1.5 mb-2 flex flex-wrap items-center gap-1.5">
                        {item.color && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] bg-[#f4f4f5] font-ui text-[11.5px] font-medium text-[#555555]">
                            {item.color}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] bg-[#f4f4f5] font-ui text-[11.5px] font-medium text-[#555555]">
                          Size {item.size}
                        </span>
                      </div>

                      {/* Stock Status Tag */}
                      {outOfStock ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#dc2626] mb-2.5">
                          <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
                          <span>Out of stock</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#059669] mb-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                          <span>In stock</span>
                        </div>
                      )}
                    </div>

                    {/* Stepper on left, Price on right */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Stepper pill */}
                      <div
                        className="inline-flex items-center rounded-[6px] border border-[#e5e7eb] bg-white h-8"
                        role="group"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.size, -1, item.variantId)}
                          className="w-8 h-8 flex items-center justify-center text-[#71717a] hover:text-[#111111] hover:bg-black/5 rounded-l-[5px] transition-colors cursor-pointer"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="min-w-7 px-1 text-center font-ui text-[12.5px] font-bold text-[#111111] tabular-nums select-none">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.size, 1, item.variantId)}
                          className="w-8 h-8 flex items-center justify-center text-[#71717a] hover:text-[#111111] hover:bg-black/5 rounded-r-[5px] transition-colors cursor-pointer"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <span className="font-brand text-[17px] sm:text-[18px] font-bold text-[#111827] tabular-nums">
                        {formatPrice(item.priceNum * item.qty)}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}

            {/* Clear Entire Bag & Duty Note */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={clearCart}
                className="mx-auto inline-flex items-center gap-1.5 font-ui text-[12.5px] font-medium text-[#555555] hover:text-[#dc2626] underline underline-offset-4 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear entire bag</span>
              </button>
              <p className="mt-2 font-ui text-[11.5px] text-[#888888]">
                All prices are inclusive of 5% GST &amp; applicable apparel duties.
              </p>
            </div>
          </section>

          {/* ── Right Column: Order Summary ── */}
          <aside className="sticky top-24" aria-label="Order summary">
            <div className="rounded-[16px] border border-black/[0.08] bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <h2 className="mb-4 font-brand text-[19px] sm:text-[20px] font-bold text-[#111827]">
                Order summary
              </h2>

              {/* Delivery destination */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <label htmlFor="bag-pincode" className="font-ui font-medium text-[#111827]">
                    Delivery destination
                  </label>
                  {isAuthenticated && addresses && addresses.length > 0 ? (
                    <Link
                      href="/profile?tab=addresses"
                      className="font-ui text-[12px] text-[#555555] hover:text-[#111827] underline"
                    >
                      Saved addresses
                    </Link>
                  ) : (
                    <span className="font-ui text-[11px] text-[#888888]">
                      Saved addresses
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id="bag-pincode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setPincode(cleaned)
                      setPincodeError('')
                      if (cleaned.length === 6) {
                        void handleVerifyPincode(cleaned)
                      }
                    }}
                    placeholder="Enter PIN code"
                    className="h-10 flex-1 rounded-[8px] border border-[#e5e7eb] px-3.5 font-mono text-[13.5px] text-[#111827] outline-none transition-[border-color] focus:border-[#111827]"
                    aria-label="Delivery destination PIN code"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyPincode()}
                    disabled={pincodeLoading}
                    className="h-10 px-4 rounded-[8px] bg-[#111111] hover:bg-black font-brand text-[12.5px] font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {pincodeLoading ? 'Checking…' : 'Check'}
                  </button>
                </div>

                {pincodeError && (
                  <p role="alert" className="mt-1.5 text-[11.5px] text-[#dc2626]">
                    {pincodeError}
                  </p>
                )}

                {/* Pill 1: Delivering to location */}
                {pincodeLocation && !pincodeError && (
                  <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-2.5 text-[12px] font-medium text-[#166534]">
                    <MapPin className="h-3.5 w-3.5 text-[#166534] shrink-0" />
                    <span>Delivering to <strong>{pincodeLocation}</strong></span>
                  </div>
                )}

                {/* Pill 2: Estimated delivery */}
                {pincodeLocation && !pincodeError && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#166534]">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-[#555555]">Estimated delivery</span>
                      <strong className="text-[13px] font-bold text-[#111827]">2 to 5 business days</strong>
                      <span className="text-[11px] text-[#71717a]">Dispatch from Kannur</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-[#f4f4f5] pt-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between font-ui text-[13px] text-[#555555]">
                  <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium text-[#111827] tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between font-ui text-[13px] text-[#555555]">
                  <span>Delivery charge</span>
                  <span>
                    {quoteLoading ? (
                      <span className="text-[11.5px] text-[#71717a]">Calculating…</span>
                    ) : shipping === 0 ? (
                      <strong className="font-bold text-[#059669]">FREE</strong>
                    ) : (
                      <span className="font-medium text-[#111827] tabular-nums">{formatPrice(shipping)}</span>
                    )}
                  </span>
                </div>

                <div className="border-t border-[#f4f4f5] my-1" />

                <div className="flex items-center justify-between">
                  <span className="font-brand text-[15.5px] sm:text-[16px] font-bold text-[#111827]">
                    Estimated total
                  </span>
                  <span className="font-brand text-[18px] sm:text-[20px] font-bold text-[#111827] tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-ui text-[11px] text-[#888888]">
                    Inclusive of all taxes
                  </span>
                </div>
              </div>

              {/* Proceed to checkout CTA */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={hasOutOfStockItems || count === 0}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-[10px] font-brand text-[14px] font-semibold text-white transition-all duration-150 ${
                    hasOutOfStockItems || count === 0
                      ? 'bg-[#9ca3af] cursor-not-allowed opacity-60'
                      : 'bg-[#111111] hover:bg-black cursor-pointer shadow-xs active:scale-[0.99]'
                  }`}
                  aria-disabled={hasOutOfStockItems || count === 0}
                >
                  <span>Proceed to checkout</span>
                  <ArrowRight className="h-4 w-4 stroke-[2]" />
                </button>

                {hasOutOfStockItems && (
                  <p className="mt-2 text-center font-ui text-[11.5px] font-medium text-[#dc2626]">
                    Please remove out of stock items to proceed to checkout.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
