'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Truck,
  MapPin,
  ArrowRight,
  Plus,
  Heart,
  Trash2,
  RefreshCw,
  Lock,
  Shield,
  Check
} from 'lucide-react'
import {
  cartCount,
  cartSubtotal,
  useCartStore,
  useUIStore,
  useAuthStore,
  useFavoriteStore,
  type CartItem
} from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'
import { PRODUCTS, type Product } from '@/lib/constants'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const FREE_SHIPPING_THRESHOLD = 3000

interface DeliveryQuote {
  subtotal: number
  shipping: number
  total: number
  weightGrams: number
}

export default function CartDrawer() {
  const items = useCartStore((state) => state.items)
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const addItem = useCartStore((state) => state.addItem)

  const addresses = useAuthStore((state) => state.addresses)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [deliveryState, setDeliveryState] = useState('')
  const [pincode, setPincode] = useState('')
  const [pincodeLocation, setPincodeLocation] = useState('')
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  // Auto-fill from user's default saved address
  useEffect(() => {
    if (!deliveryState && addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      if (defaultAddr?.state) {
        setDeliveryState(defaultAddr.state)
        if (defaultAddr.pincode) {
          setPincode(defaultAddr.pincode)
        }
        if (defaultAddr.city && defaultAddr.state) {
          setPincodeLocation(`${defaultAddr.city}, ${defaultAddr.state}`)
        }
      }
    }
  }, [addresses, deliveryState])

  const verifyPincode = async (code: string) => {
    const cleaned = code.replace(/\D/g, '').slice(0, 6)
    if (cleaned.length !== 6) {
      setPincodeError('Please enter a valid 6-digit PIN code')
      return
    }

    setPincodeLoading(true)
    setPincodeError('')

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`)
      const data = await res.json()
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0]
        const district = po.District || po.Name || ''
        const state = po.State || ''
        setPincodeLocation(district ? `${district}, ${state}` : state)
        setDeliveryState(state)
        setPincodeError('')
      } else {
        setPincodeError('Invalid PIN code or location not found')
        setPincodeLocation('')
        setDeliveryState('')
      }
    } catch {
      setPincodeError('Unable to verify PIN code')
    } finally {
      setPincodeLoading(false)
    }
  }

  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setPincode(cleaned)
    setPincodeError('')
    if (cleaned.length === 6) {
      void verifyPincode(cleaned)
    } else {
      setPincodeLocation('')
      setDeliveryState('')
      setQuote(null)
    }
  }

  // Delivery quote calculation
  useEffect(() => {
    if (!deliveryState || items.length === 0) {
      setQuote(null)
      setQuoteError('')
      setQuoteLoading(false)
      return
    }
    const controller = new AbortController()
    setQuote(null)
    setQuoteError('')
    setQuoteLoading(true)
    void fetch(`${API_URL}/api/orders/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: deliveryState,
        items: items.map((item) => ({
          id: item.id,
          variantId: item.variantId,
          size: String(item.size),
          quantity: item.qty
        }))
      }),
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Could not calculate delivery for this cart.')
        setQuote(payload as DeliveryQuote)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setQuoteError(error instanceof Error ? error.message : 'Could not calculate delivery for this cart.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false)
      })
    return () => controller.abort()
  }, [deliveryState, items])

  const open = overlay === 'cart'
  const subtotal = cartSubtotal(items)
  const count = cartCount(items)

  // Free shipping calculation
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

  // Move item to wishlist
  const handleMoveToWishlist = (item: CartItem) => {
    toggleFavorite(item.id)
    removeItem(item.id, item.size, item.variantId)
    showToast(`Moved ${item.name} to wishlist`)
  }

  // Clear bag
  const handleClearBag = () => {
    clearCart()
    showToast('Shopping bag cleared')
  }

  // Curated cross-sell recommendations
  const crossSellProducts = useMemo(() => {
    const inCartIds = new Set(items.map((i) => i.id))
    return PRODUCTS.filter((p) => !inCartIds.has(p.id)).slice(0, 3)
  }, [items])

  const handleQuickAdd = (product: Product) => {
    const defaultSize = product.sizes?.[0] || 'M'
    addItem(product.id, defaultSize, product)
    showToast(`Added ${product.name} (${defaultSize}) to bag`)
  }

  return (
    <div
      className={`fixed inset-0 z-[99999] flex justify-end bg-[rgba(0,0,0,0.45)] backdrop-blur-[4px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] max-[640px]:items-end ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div
        className={`relative flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-white text-[#111827] shadow-[-12px_0_36px_rgba(0,0,0,0.12)] transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] max-[640px]:max-h-[92dvh] max-[640px]:max-w-full max-[640px]:rounded-t-[20px] ${
          open
            ? 'translate-x-0 max-[640px]:translate-y-0'
            : 'translate-x-full max-[640px]:translate-x-0 max-[640px]:translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        {/* Mobile Pull Handle */}
        <div
          className="hidden max-[640px]:mx-auto max-[640px]:mb-0.5 max-[640px]:mt-2.5 max-[640px]:block max-[640px]:h-1 max-[640px]:w-9 max-[640px]:shrink-0 max-[640px]:rounded-full max-[640px]:bg-[#e5e7eb]"
          aria-hidden="true"
        />

        {/* 1. Header */}
        <div className="mb-8 flex shrink-0 flex-wrap items-end justify-between gap-5 border-b border-b-line px-6 pb-5 pt-5 max-[640px]:px-5 max-[640px]:pt-3">
          <div>
            <span className="mb-0.5 block font-brand text-[11px] font-bold uppercase tracking-[0.14em] text-[#71717a]">
              TEESGARAGE
            </span>
            <h2 className="m-0 flex items-baseline font-brand text-[clamp(28px,3.5vw,38px)] font-bold leading-[1.15] tracking-[-0.03em] text-ink">
              Your Bag <span className="ml-1.5 font-sans text-xl font-medium leading-[1.15] text-[#6b7280]">({count})</span>
            </h2>
            <p className="mb-0 mt-[3px] font-ui text-[13.5px] text-[#6b7280]">Looks good on you.</p>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#f4f4f5] p-0 text-[#374151] transition-[background,transform] duration-150 ease-[ease] hover:bg-[#e4e4e7]"
            type="button"
            aria-label="Close shopping bag"
            onClick={closeOverlay}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto [-webkit-overflow-scrolling:touch] [scrollbar-color:#e4e4e7_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-[#d4d4d8] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#e4e4e7] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-[5px]">
          {/* 2. Free Shipping Progress Bar */}
          <div className="mx-6 mb-3.5 shrink-0 rounded-[12px] border border-[#f3f4f6] bg-[#f9fafb] px-4 py-3 max-[640px]:mx-5 max-[640px]:mb-3">
          <div className="flex items-center justify-between font-ui text-[12.5px] text-[#374151]">
            <div className="flex min-w-0 items-center gap-2">
              <Truck className="h-4 w-4 text-zinc-800 shrink-0" />
              <span>
                {amountToFreeShipping > 0 ? (
                  <>
                    Add <strong className="font-bold text-[#111827]">{formatPrice(amountToFreeShipping)}</strong> more for free shipping
                  </>
                ) : (
                  <strong className="font-bold text-[#111827]">You&apos;ve unlocked free shipping!</strong>
                )}
              </span>
            </div>
            <span className="ml-2 shrink-0 font-mono text-[12px] font-semibold text-[#6b7280]">{formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
          </div>
          <div className="mt-[9px] h-[5px] w-full overflow-hidden rounded-full bg-[#e5e7eb]">
            <div
              className="h-full rounded-full bg-[#111827] transition-[width] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${freeShippingPct}%` }}
            />
          </div>
        </div>

        {/* 3. Delivery Section */}
        <div className="shrink-0 border-b border-[#f3f4f6] px-6 pb-3.5 max-[640px]:px-5 max-[640px]:pb-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-brand text-[11px] font-bold uppercase leading-[normal] tracking-[0.05em] text-[#166534]">
              <MapPin className="h-4 w-4 text-zinc-700" />
              <span>Delivery to</span>
            </div>
            {addresses && addresses.length > 0 ? (
              <Link
                href="/profile?tab=addresses"
                onClick={closeOverlay}
                className="cursor-pointer font-ui text-[12px] font-medium text-[#6b7280] no-underline transition-colors duration-150 hover:text-[#111827]"
              >
                Saved addresses
              </Link>
            ) : (
              <Link
                href={isAuthenticated ? '/profile?tab=addresses' : '/login?redirect=/profile'}
                onClick={closeOverlay}
                className="cursor-pointer font-ui text-[12px] font-medium text-[#6b7280] no-underline transition-colors duration-150 hover:text-[#111827]"
              >
                + Add new
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="bag-delivery-pincode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder="Enter 6-digit PIN code (e.g. 682001)"
              aria-label="Delivery PIN code"
              className="h-10 flex-1 rounded-[8px] border border-[#e5e7eb] bg-white px-3 font-ui text-[13px] text-[#111827] outline-none transition-[border-color] duration-150 ease-[ease] focus:border-[#111827]"
            />
            <button
              type="button"
              className="h-10 cursor-pointer whitespace-nowrap rounded-[8px] border-0 bg-[#111827] px-[18px] font-brand text-[13px] font-semibold text-white transition-colors duration-150 ease-[ease] enabled:hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => verifyPincode(pincode)}
              disabled={pincodeLoading}
            >
              {pincodeLoading ? 'Checking…' : 'Check'}
            </button>
          </div>

          {pincodeLocation && !pincodeError && (
            <p className="mt-1.5 flex items-center gap-1 font-ui text-[11.5px] font-medium text-[#15803d]">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>
                Delivering to <strong>{pincodeLocation}</strong>
                {quote ? ` · Delivery: ${quote.shipping === 0 ? 'Free' : formatPrice(quote.shipping)}` : ''}
              </span>
            </p>
          )}

          {!pincodeLocation && !pincodeError && (
            <p className="mt-1.5 font-ui text-[11.5px] text-[#9ca3af]">
              Enter your pincode to see delivery options and charges.
            </p>
          )}

          {pincodeError && (
            <p role="alert" className="mt-1.5 font-ui text-[11.5px] text-[#dc2626]">
              {pincodeError}
            </p>
          )}
          {quoteError && !pincodeError && (
            <p role="alert" className="mt-1.5 font-ui text-[11.5px] text-[#dc2626]">
              {quoteError}
            </p>
          )}
        </div>

        {/* 4. Items List */}
        <div className="px-6 max-[640px]:px-5">
          <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-2 pt-3">
            <span className="font-brand text-[13.5px] font-semibold text-[#111827]">Items ({count})</span>
            {count > 0 && (
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 font-ui text-[12.5px] font-medium leading-[normal] text-ink-secondary underline underline-offset-[3px] transition-colors duration-150 hover:text-[#dc2626]"
                onClick={handleClearBag}
              >
                Clear bag
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="mb-3 font-brand text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-ink">Your bag is empty</p>
              <p className="mx-auto mb-7 max-w-[440px] font-ui text-[15px] leading-[1.6] text-ink-secondary">
                Find your fit from our heavyweight combed cotton collections.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center rounded-[6px] bg-[#111827] px-[18px] py-2.5 font-brand text-[12.5px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-black"
                onClick={closeOverlay}
              >
                Explore shop ↗
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div className="flex gap-3.5 border-b border-[#f3f4f6] py-4" key={`${item.id}-${item.variantId ?? item.size}`}>
                  <Link href={getProductUrl(item)} onClick={closeOverlay}>
                    <Image
                      src={item.img}
                      alt={item.name}
                      width={76}
                      height={92}
                      className="h-full w-full shrink-0 rounded-[8px] bg-[#f4f4f5] object-cover [transition:transform_0.3s_ease]"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="w-full">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={getProductUrl(item)} onClick={closeOverlay}>
                            <h4 className="m-0 font-brand text-[16px] font-semibold leading-[1.35] text-ink [overflow-wrap:anywhere]">{item.name}</h4>
                          </Link>
                          <button
                            className="shrink-0 cursor-pointer border-0 bg-transparent p-0.5 text-[#9ca3af] transition-colors duration-150 hover:text-[#111827]"
                            type="button"
                            title="Remove item"
                            onClick={() => removeItem(item.id, item.size, item.variantId)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-[3px] flex items-center justify-between gap-2">
                          <p className="m-0 font-ui text-[12px] text-[#71717a]">
                            {[
                              item.color,
                              item.fit ? `${item.fit} Fit` : null,
                              `Size ${item.size}`
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <strong className="block shrink-0 font-mono text-[13.5px] font-bold text-[#111827] max-[640px]:hidden">
                            {formatPrice(item.priceNum * item.qty)}
                          </strong>
                        </div>

                        <strong className="mt-1 hidden font-mono text-[13.5px] font-bold text-[#111827] max-[640px]:block">
                          {formatPrice(item.priceNum * item.qty)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2.5 max-[640px]:w-full max-[640px]:justify-between">
                      <div className="inline-flex h-9 select-none items-center overflow-hidden rounded-[3px] border border-line-strong bg-white">
                        <button
                          type="button"
                          className="flex h-9 w-9 min-h-9 min-w-9 cursor-pointer touch-manipulation items-center justify-center border-0 bg-transparent text-[14px] font-medium text-ink transition-[background,transform] duration-150 ease-[ease] active:bg-bone hover:bg-bone"
                          onClick={() => updateQty(item.id, item.size, -1, item.variantId)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-8 px-1 text-center font-ui text-[13px] font-semibold leading-[normal] text-ink [font-feature-settings:'tnum']">{item.qty}</span>
                        <button
                          type="button"
                          className="flex h-9 w-9 min-h-9 min-w-9 cursor-pointer touch-manipulation items-center justify-center border-0 bg-transparent text-[14px] font-medium text-ink transition-[background,transform] duration-150 ease-[ease] active:bg-bone hover:bg-bone"
                          onClick={() => updateQty(item.id, item.size, 1, item.variantId)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="inline-flex h-7 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-[#e4e4e7] bg-white px-2.5 font-ui text-[11.5px] font-medium text-[#3f3f46] transition-all duration-150 ease-[ease] hover:border-[#111827] hover:text-[#111827] max-[640px]:hidden"
                        onClick={() => handleMoveToWishlist(item)}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        <span>Move to wishlist</span>
                      </button>

                      <button
                        type="button"
                        className="hidden h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] border border-[#e4e4e7] bg-white text-[#71717a] transition-all duration-150 ease-[ease] hover:border-[#dc2626] hover:text-[#dc2626] max-[640px]:flex"
                        onClick={() => removeItem(item.id, item.size, item.variantId)}
                        title="Delete item"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. You might also like (Cross-sell grid) */}
          {crossSellProducts.length > 0 && (
            <div className="border-b border-[#f3f4f6] py-[18px] max-[640px]:py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-brand text-[13.5px] font-semibold text-[#111827]">You might also like</span>
                <Link
                  href="/shop"
                  onClick={closeOverlay}
                  className="cursor-pointer font-ui text-[12px] font-medium text-[#6b7280] no-underline transition-colors duration-150 hover:text-[#111827]"
                >
                  See all →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-[640px]:flex max-[640px]:flex-col max-[640px]:gap-2">
                {crossSellProducts.map((p) => (
                  <div key={`cross-${p.id}`} className="group flex min-w-0 flex-col [-webkit-tap-highlight-color:transparent] max-[640px]:flex-row max-[640px]:items-center max-[640px]:gap-3 max-[640px]:rounded-[12px] max-[640px]:border max-[640px]:border-[#f3f4f6] max-[640px]:bg-[#fafafa] max-[640px]:px-3 max-[640px]:py-2 max-[640px]:transition-colors max-[640px]:duration-150 max-[640px]:active:bg-[#f4f4f5]">
                    <Link
                      href={getProductUrl(p)}
                      onClick={closeOverlay}
                      className="relative block aspect-square w-full overflow-hidden rounded-[8px] bg-[#f4f4f5] max-[640px]:h-[54px] max-[640px]:w-[54px] max-[640px]:shrink-0"
                      aria-label={`View ${p.name}`}
                    >
                      <Image
                        src={p.img}
                        alt={p.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-cover [transition:transform_0.2s_ease] group-hover:scale-[1.04]"
                      />
                    </Link>
                    <div className="mt-1.5 flex items-start justify-between gap-1 max-[640px]:mt-0 max-[640px]:min-w-0 max-[640px]:flex-1 max-[640px]:items-center max-[640px]:gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={getProductUrl(p)}
                          onClick={closeOverlay}
                          className="block text-inherit no-underline"
                        >
                          <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-brand text-[11px] font-semibold leading-[1.25] text-[#111827] max-[640px]:text-[13px] max-[640px]:leading-[1.3]" title={p.name}>
                            {p.name}
                          </p>
                        </Link>
                        <p className="mb-0 mt-0.5 font-mono text-[11.5px] font-bold text-[#111827] max-[640px]:text-[12.5px]">{formatPrice(p.priceNum)}</p>
                      </div>
                      <button
                        type="button"
                        className="flex h-6 w-6 shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center rounded-full border-0 bg-[#111827] text-white [-webkit-touch-callout:none] [transition:transform_0.12s_ease,background_0.15s_ease] hover:scale-[1.08] hover:bg-black max-[640px]:h-8 max-[640px]:w-auto max-[640px]:gap-1 max-[640px]:px-3.5 max-[640px]:font-brand max-[640px]:text-[12px] max-[640px]:font-semibold"
                        title={`Add ${p.name} to bag`}
                        aria-label={`Add ${p.name} to bag`}
                        onClick={() => handleQuickAdd(p)}
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden max-[640px]:inline">Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        {/* 6. Footer & Totals */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#f3f4f6] bg-white px-6 pt-4 pb-[calc(16px_+_env(safe-area-inset-bottom,0px))] max-[640px]:px-5 max-[640px]:pt-3.5 max-[640px]:pb-[calc(14px_+_env(safe-area-inset-bottom,0px))]">
            <div className="mb-3 flex flex-col gap-[7px]">
              <div className="flex justify-between font-ui text-[13px] text-[#6b7280]">
                <span>Subtotal</span>
                <span>{formatPrice(quote?.subtotal ?? subtotal)}</span>
              </div>
              <div className="flex justify-between font-ui text-[13px] text-[#6b7280]">
                <span>Delivery charge</span>
                <span>
                  {quote
                    ? quote.shipping === 0
                      ? 'Free'
                      : formatPrice(quote.shipping)
                    : deliveryState
                      ? 'Calculating…'
                      : 'Enter PIN code'}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#f3f4f6] pt-2 font-brand text-[14px] font-bold text-[#111827]">
                <span>Total before delivery</span>
                <span className="font-mono text-[16.5px] font-extrabold text-[#111827]">{formatPrice(quote?.total ?? subtotal)}</span>
              </div>
            </div>

            <div className="flex flex-col flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3.5">
              <Link
                href="/bag/checkout"
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[8px] border-0 bg-[#111827] font-brand text-[14px] font-semibold text-white no-underline shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-[background,transform] duration-150 ease-[ease] hover:bg-black"
                onClick={closeOverlay}
              >
                <span>Proceed to checkout</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
              <Link
                href="/bag"
                className="flex h-[42px] w-full cursor-pointer items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white font-brand text-[13.5px] font-semibold text-[#111827] no-underline transition-[background,border-color] duration-150 ease-[ease] hover:border-[#d1d5db] hover:bg-[#f9fafb]"
                onClick={closeOverlay}
              >
                <span>View full bag ({count})</span>
              </Link>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#f3f4f6] pt-2.5">
              <div className="flex items-center gap-1 font-ui text-[10px] text-[#71717a]">
                <RefreshCw className="h-3 w-3 shrink-0" />
                <span>Free 7-day exchanges</span>
              </div>
              <div className="flex items-center gap-1 font-ui text-[10px] text-[#71717a]">
                <Lock className="h-3 w-3 shrink-0" />
                <span>Secure Razorpay payment</span>
              </div>
              <div className="flex items-center gap-1 font-ui text-[10px] text-[#71717a]">
                <Shield className="h-3 w-3 shrink-0" />
                <span>Easy returns</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
