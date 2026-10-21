'use client'

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type InputHTMLAttributes
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Minus,
  Plus,
  Tag,
  Trash2
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useAuthStore, type UserAddress } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/constants'
import { getProductUrl, getAvailableProductSizes } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

export type CheckoutMode =
  | { type: 'bag' }
  | {
      type: 'product'
      product: Product
      initialSize?: string
      initialColor?: string
      initialQty?: number
    }

export interface CheckoutClientProps {
  mode?: CheckoutMode
  checkoutUrl?: string
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

interface CheckoutForm {
  name: string
  phone: string
  address: string
  place: string
  landmark: string
  district: string
  state: string
  pincode: string
}

type CheckoutErrors = Partial<Record<keyof CheckoutForm | 'email', string>>

interface DeliveryEstimation {
  minDays: number
  maxDays: number
  exactDeliveryDate?: string
  zone: 'kerala' | 'restOfIndia'
}

interface DeliveryQuote {
  subtotal: number
  shipping: number
  total: number
  weightGrams: number
  deliveryEstimation?: DeliveryEstimation
}

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:4000'

const INITIAL_FORM: CheckoutForm = {
  name: '',
  phone: '',
  address: '',
  place: '',
  landmark: '',
  district: '',
  state: '',
  pincode: ''
}

const GUEST_CHECKOUT_KEY = 'teesgarage-guest-checkout'

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
]

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)

    const existing = document.getElementById('razorpay-checkout-script')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }

    const script = document.createElement('script')
    script.id = 'razorpay-checkout-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function GooglePayIcon() {
  return (
    <svg
      className="inline-block shrink-0"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.5 12.3c0-.8-.07-1.6-.2-2.3H12v4.5h5.9c-.25 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.4z"
        fill="#4285F4"
      />
      <path
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.3-1.9-6.1-4.5H2.2v2.9C4 20.6 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7H2.2C1.5 8.5 1.1 10.2 1.1 12s.4 3.5 1.1 5l3.7-2.9z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2 15 1 12 1 7.7 1 4 3.4 2.2 7l3.7 2.9c.8-2.6 3.3-4.5 6.1-4.5z"
        fill="#EA4335"
      />
    </svg>
  )
}

function PhonePeIcon() {
  return (
    <svg
      className="inline-block shrink-0"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="5" fill="#5F259F" />
      <path
        d="M16.5 6.5h-3.8c-.4 0-.8.3-.8.8v1.3h-2.1c-.3 0-.6.3-.6.6v1.2c0 .3.3.6.6.6h2.1v1.8c-1 .1-1.8.9-1.8 1.9 0 1.1.9 1.9 1.9 1.9h.6V19c0 .3.3.6.6.6h1.5c.3 0 .6-.3.6-.6v-7.8h1.8c.3 0 .6-.3.6-.6V7.3c0-.4-.4-.8-.8-.8zm-2.8 8c-.4 0-.8-.3-.8-.8 0-.4.4-.8.8-.8.4 0 .8.4.8.8 0 .5-.4.8-.8.8z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function PaytmIcon() {
  return (
    <svg
      className="inline-block shrink-0"
      viewBox="0 0 36 14"
      width="30"
      height="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="11"
        fill="#002970"
        fontSize="11.5"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5px"
      >
        pay
      </text>
      <text
        x="21"
        y="11"
        fill="#00BAF2"
        fontSize="11.5"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5px"
      >
        tm
      </text>
    </svg>
  )
}

function CardsIcon() {
  return (
    <svg
      className="inline-block shrink-0"
      viewBox="0 0 24 16"
      width="20"
      height="14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="16" rx="3" fill="#0F172A" />
      <circle cx="9" cy="8" r="4" fill="#EB001B" fillOpacity="0.95" />
      <circle cx="15" cy="8" r="4" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  )
}

function NetBankingIcon() {
  return (
    <svg
      className="inline-block shrink-0"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="#2563EB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="12 2 2 7 22 7 12 2" fill="#DBEAFE" />
      <rect x="4" y="10" width="2.5" height="7" fill="#2563EB" />
      <rect x="9.5" y="10" width="2.5" height="7" fill="#2563EB" />
      <rect x="15" y="10" width="2.5" height="7" fill="#2563EB" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  prefix?: string
  trailing?: ReactNode
}

function Field({ label, error, prefix, trailing, id, className, ...props }: FieldProps) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={`flex cursor-text flex-col rounded-lg border bg-white px-3.5 pb-2 pt-1.5 transition-[border-color,box-shadow] duration-150 focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.06)] ${
          error ? 'border-[#cf5b55]' : 'border-[#e4e3de] focus-within:border-black'
        }`}
      >
        <span className="text-[11px] font-normal leading-tight text-[#71717A] select-none">{label}</span>
        <div className="mt-0.5 flex items-center gap-1.5">
          {prefix ? (
            <span className="text-[13.5px] leading-normal text-[#18181B] font-normal">{prefix}</span>
          ) : null}
          <input
            id={id}
            {...props}
            className={`min-w-0 flex-1 border-0 bg-transparent p-0 text-[13.5px] leading-normal text-[#18181B] outline-none placeholder:text-[#A1A1AA] font-normal ${className ?? ''}`}
          />
          {trailing}
        </div>
      </label>
      {error ? <p className="mt-1 pl-1 text-[11px] font-medium text-[#cf5b55]">{error}</p> : null}
    </div>
  )
}

function CustomCheckbox({
  checked,
  onChange,
  label,
  id
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
}) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-2.5 select-none"
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border transition-colors ${
          checked
            ? 'border-black bg-black text-white'
            : 'border-[#D1D0C9] bg-white hover:border-[#888]'
        }`}
      >
        {checked && <Check className="h-3 w-3 stroke-[3]" />}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-[12.5px] leading-normal text-[#27272A] font-normal">
        {label}
      </span>
    </label>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? 'border-black' : 'border-[#D1D0C9]'
      }`}
    >
      {selected && <div className="h-2 w-2 rounded-full bg-black" />}
    </div>
  )
}

type StepState = 'upcoming' | 'active' | 'done'

function StepMarker({ index, label, state }: { index: number; label: string; state: StepState }) {
  const isCurrent = state === 'active'
  const isComplete = state === 'done'
  const isDone = isCurrent || isComplete

  return (
    <li className="relative flex w-7 flex-col items-center">
      <span
        aria-current={isCurrent ? 'step' : undefined}
        className={`grid h-7 w-7 place-items-center rounded-full text-[11.5px] font-semibold leading-none tabular-nums transition-colors duration-300 ${
          isDone ? 'bg-black text-white' : 'bg-[#EFEDE8] text-[#7C817F]'
        }`}
      >
        {isComplete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index}
      </span>
      <span
        className={`absolute left-1/2 top-[34px] -translate-x-1/2 whitespace-nowrap text-[12px] leading-none transition-colors duration-300 sm:text-[12.5px] ${
          isDone ? 'font-semibold text-[#111]' : 'font-normal text-[#8A8F8D]'
        }`}
      >
        {label}
      </span>
    </li>
  )
}

function CheckoutStepper({
  step,
  shippingProgress
}: {
  step: 0 | 1 | 2
  shippingProgress: number
}) {
  const steps: Array<{ label: string; state: StepState }> = [
    { label: 'Shipping', state: step > 0 ? 'done' : 'active' },
    { label: 'Payment', state: step > 1 ? 'done' : step === 1 ? 'active' : 'upcoming' },
    { label: 'Review', state: step === 2 ? 'active' : 'upcoming' }
  ]

  // Shipping fills the first half of the rail as its fields are completed.
  // The second half fills once the payment step is confirmed.
  const progress =
    step === 0 ? Math.min(Math.max(shippingProgress, 0), 1) * 0.5 : step === 1 ? 0.5 : 1

  return (
    <div className="w-full max-w-[520px]" role="group" aria-label="Checkout progress">
      <div className="relative">
        <div className="absolute left-3.5 right-3.5 top-[13px] h-0.5 overflow-hidden rounded-full bg-[#E4E2DC]">
          <div
            className="h-full rounded-full bg-black transition-[width] duration-500 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <ol className="relative flex items-start justify-between">
          {steps.map((item, i) => (
            <StepMarker key={item.label} index={i + 1} label={item.label} state={item.state} />
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function CheckoutClient({ mode = { type: 'bag' } }: CheckoutClientProps) {
  const router = useRouter()

  const isProductMode = mode.type === 'product'
  const product = isProductMode ? mode.product : null

  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)

  const [productSize, setProductSize] = useState<string>(() => {
    if (!product) return ''
    if (mode.type === 'product' && mode.initialSize) return mode.initialSize
    const available = getAvailableProductSizes(product)
    return available[0] || (product.sizes?.[0] ? String(product.sizes[0]) : '')
  })
  const [productColor, setProductColor] = useState<string>(() => {
    if (!product) return ''
    if (mode.type === 'product' && mode.initialColor) return mode.initialColor
    return product.color || ''
  })
  const [productQty, setProductQty] = useState<number>(() => {
    if (mode.type === 'product' && mode.initialQty && mode.initialQty > 0) return mode.initialQty
    return 1
  })

  const matchedVariant = useMemo(() => {
    if (!product?.variants) return undefined
    return product.variants.find(
      (v) =>
        v.status === 'Active' &&
        String(v.size) === String(productSize) &&
        (!productColor || v.color.toLowerCase() === productColor.toLowerCase())
    )
  }, [product, productSize, productColor])

  const singleProductItems = useMemo(() => {
    if (!product) return []
    return [
      {
        id: product.id,
        variantId: matchedVariant?.id,
        name: product.name,
        price: product.price,
        priceNum: product.priceNum,
        img: product.img,
        size: productSize,
        color: productColor,
        wash: product.wash,
        fit: product.fit,
        qty: productQty
      }
    ]
  }, [product, matchedVariant, productSize, productColor, productQty])

  const items = isProductMode ? singleProductItems : cartItems

  const user = useAuthStore((state) => state.user)
  const authToken = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const addresses = useAuthStore((state) => state.addresses)
  const addAddress = useAuthStore((state) => state.addAddress)

  const [form, setForm] = useState<CheckoutForm>(INITIAL_FORM)
  const [email, setEmail] = useState('')
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [saveAddress, setSaveAddress] = useState(true)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponMessage, setCouponMessage] = useState<string | null>(null)

  const backHref = isProductMode && product ? getProductUrl(product) : '/bag'

  // Prefill contact details for signed-in customers.
  useEffect(() => {
    if (user?.email) setEmail((prev) => prev || user.email)
  }, [user])

  // Restore a guest's previous shipping details on this device.
  useEffect(() => {
    try {
      if (useAuthStore.getState().isAuthenticated) return
      const raw = window.localStorage.getItem(GUEST_CHECKOUT_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { email?: string; form?: Partial<CheckoutForm> }
      if (saved.email) setEmail((prev) => prev || saved.email || '')
      if (saved.form) {
        setForm((prev) => ({ ...prev, ...saved.form }))
      }
    } catch {
      // Guest prefill is a convenience; ignore unavailable storage.
    }
  }, [])

  const completedSavedAddress = useMemo(() => {
    if (!isAuthenticated || !addresses || addresses.length === 0) return null
    return (
      addresses.find(
        (a) =>
          Boolean(a.addressLine?.trim()) &&
          Boolean(a.pincode?.trim()) &&
          Boolean(a.fullName?.trim() || user?.name?.trim()) &&
          Boolean(a.phone?.trim() || user?.phone?.trim())
      ) || null
    )
  }, [isAuthenticated, addresses, user])

  const applySavedAddress = useCallback(
    (addr: UserAddress) => {
      const recipientName = addr.fullName?.trim() || user?.name?.trim() || ''
      const recipientPhone = (addr.phone || user?.phone || '').replace(/\D/g, '').slice(-10)
      const placeVal = addr.place || addr.city || addr.district || ''
      const districtVal = addr.district || addr.city || ''
      setForm({
        name: recipientName,
        phone: recipientPhone,
        address: addr.addressLine || '',
        place: placeVal,
        landmark: '',
        district: districtVal,
        state: addr.state || '',
        pincode: (addr.pincode || '').replace(/\D/g, '').slice(0, 6)
      })
    },
    [user]
  )

  useEffect(() => {
    if (completedSavedAddress) applySavedAddress(completedSavedAddress)
  }, [completedSavedAddress, applySavedAddress])

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void loadRazorpayScript()
  }, [])

  useEffect(() => {
    if (items.length > 0) {
      trackEvent('checkout_started', {
        item_count: items.reduce((sum, item) => sum + item.qty, 0),
        subtotal: cartSubtotal(items),
        currency: 'INR',
        direct_buy: isProductMode,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          size: item.size,
          color: item.color,
          price: item.priceNum,
          quantity: item.qty
        }))
      })
    }
  }, [items.length, isProductMode])

  // Recalculate the delivery quote whenever the destination or basket changes.
  useEffect(() => {
    const cleanPin = form.pincode.replace(/\D/g, '').slice(0, 6)
    const hasPin = cleanPin.length === 6
    const hasState = Boolean(form.state.trim())

    if ((!hasPin && !hasState) || items.length === 0) {
      setDeliveryQuote(null)
      setQuoteError(null)
      setQuoteLoading(false)
      return
    }

    const controller = new AbortController()
    setDeliveryQuote(null)
    setQuoteError(null)
    setQuoteLoading(true)

    const timer = window.setTimeout(() => {
      void fetch(`${backendUrl}/api/orders/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: form.state.trim(),
          pincode: cleanPin,
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
          if (!response.ok)
            throw new Error(payload.error || 'Could not calculate delivery for this cart.')
          setDeliveryQuote(payload as DeliveryQuote)
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setQuoteError(
            error instanceof Error ? error.message : 'Could not calculate delivery for this cart.'
          )
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false)
        })
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [form.pincode, form.state, items])

  const deliveryEstimationInfo = useMemo(() => {
    const cleanPin = form.pincode.replace(/\D/g, '').slice(0, 6)
    const hasValidPin = cleanPin.length === 6
    const isKeralaPin = hasValidPin && /^(67|68|69)/.test(cleanPin)
    const isKeralaState = form.state.trim().toLowerCase() === 'kerala'
    const isKerala = isKeralaPin || isKeralaState

    const estimation = deliveryQuote?.deliveryEstimation

    if (estimation?.exactDeliveryDate?.trim()) {
      const raw = estimation.exactDeliveryDate.trim()
      return {
        formattedRange: raw,
        deliveryOptionDate: raw,
        arrivalDisplayDate: raw,
        hasPin: hasValidPin,
        isKerala
      }
    }

    if (!hasValidPin && !form.state.trim()) {
      return {
        formattedRange: 'Enter PIN code to view delivery date',
        deliveryOptionDate: 'Enter your PIN code for a delivery date',
        arrivalDisplayDate: 'Add a PIN code',
        hasPin: false,
        isKerala: false
      }
    }

    const minDays = estimation?.minDays ?? (isKerala ? 2 : 4)
    const maxDays = estimation?.maxDays ?? (isKerala ? 4 : 7)

    const now = new Date()
    const minDate = addDays(now, minDays)
    const maxDate = addDays(now, maxDays)

    return {
      formattedRange: `${format(minDate, 'd MMM yyyy')} – ${format(maxDate, 'd MMM yyyy')}`,
      deliveryOptionDate: format(minDate, 'EEE, d MMM'),
      arrivalDisplayDate: format(minDate, 'EEE, MMM d'),
      hasPin: true,
      isKerala
    }
  }, [form.pincode, form.state, deliveryQuote?.deliveryEstimation])

  const subtotal =
    deliveryQuote?.subtotal ??
    (isProductMode ? (product?.priceNum ?? 0) * productQty : cartSubtotal(cartItems))
  const shipping = deliveryQuote?.shipping ?? 40
  const total = deliveryQuote?.total ?? subtotal + shipping
  const count = isProductMode ? productQty : cartCount(cartItems)

  const itemsWithPricing = useMemo(() => {
    return items.map((item) => {
      const originalPrice = Math.round((item.priceNum * 1.285) / 10) * 10 - 1
      const discountPercent = Math.max(
        5,
        Math.round(((originalPrice - item.priceNum) / originalPrice) * 100)
      )
      return {
        ...item,
        originalPrice,
        discountPercent
      }
    })
  }, [items])

  const originalSubtotal = useMemo(() => {
    return itemsWithPricing.reduce((sum, item) => sum + item.originalPrice * item.qty, 0)
  }, [itemsWithPricing])

  const totalSavings = useMemo(() => {
    const rawSavings = originalSubtotal - subtotal
    return rawSavings > 0 ? rawSavings : 0
  }, [originalSubtotal, subtotal])

  const userAvatarInitial = useMemo(() => {
    if (user?.name?.trim()) {
      const parts = user.name.trim().split(/\s+/)
      return (parts[parts.length - 1]?.[0] || parts[0]?.[0] || 'S').toUpperCase()
    }
    if (user?.email?.trim()) {
      return user.email.trim()[0].toUpperCase()
    }
    return 'S'
  }, [user])

  const cleanPin = form.pincode.replace(/\D/g, '').slice(0, 6)
  const phoneDigits = form.phone.replace(/\D/g, '')
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const isShippingComplete = useMemo(() => {
    return Boolean(
      emailValid &&
      form.name.trim().length >= 2 &&
      phoneDigits.length === 10 &&
      form.address.trim().length >= 5 &&
      form.district.trim().length >= 2 &&
      form.state.trim().length >= 2 &&
      cleanPin.length === 6
    )
  }, [emailValid, form, phoneDigits, cleanPin])

  const shippingProgress = useMemo(() => {
    const checks = [
      emailValid,
      form.name.trim().length >= 2,
      phoneDigits.length === 10,
      cleanPin.length === 6,
      form.address.trim().length >= 5,
      form.district.trim().length >= 2,
      form.state.trim().length >= 2
    ]
    return checks.filter(Boolean).length / checks.length
  }, [emailValid, form.name, form.address, form.district, form.state, phoneDigits, cleanPin])

  const canContinue = Boolean(isShippingComplete && !quoteLoading)
  const canPay = Boolean(canContinue && !isProcessing && items.length > 0)
  const shippingDisplay = deliveryQuote
    ? shipping === 0
      ? 'Free'
      : formatPrice(shipping)
    : quoteLoading
      ? 'Calculating…'
      : formatPrice(40)
  const arrivalDisplay = deliveryEstimationInfo.hasPin
    ? deliveryEstimationInfo.arrivalDisplayDate
    : 'Add a PIN code'
  const deliveryOptionSubtitle = deliveryEstimationInfo.hasPin
    ? `Arrives by ${deliveryEstimationInfo.deliveryOptionDate}`
    : 'Enter your PIN code for a delivery date'

  function handleFieldChange(field: keyof CheckoutForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
  }

  async function handlePincodeLookup(pin: string) {
    const nextPin = pin.replace(/\D/g, '').slice(0, 6)
    handleFieldChange('pincode', nextPin)

    if (nextPin.length !== 6) return

    setPincodeLoading(true)
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${nextPin}`)
      const data = await res.json()
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0]
        const district = po.District || po.Name || ''
        const state = po.State || ''
        setForm((prev) => ({
          ...prev,
          pincode: nextPin,
          district: prev.district.trim() ? prev.district : district,
          state: state || prev.state
        }))
        setErrors((prev) => ({
          ...prev,
          pincode: undefined,
          state: undefined,
          district: undefined
        }))
      } else {
        setErrors((prev) => ({ ...prev, pincode: 'Invalid PIN code or location not found' }))
      }
    } catch {
      // The quote request still runs with the state the customer selects.
    } finally {
      setPincodeLoading(false)
    }
  }

  function validate(): boolean {
    const nextErrors: CheckoutErrors = {}

    if (!emailValid) nextErrors.email = 'Enter a valid email address'
    if (form.name.trim().length < 2) nextErrors.name = 'Full name is required'
    if (phoneDigits.length !== 10) nextErrors.phone = 'Enter a valid 10-digit mobile number'
    if (form.pincode.replace(/\D/g, '').length !== 6)
      nextErrors.pincode = 'Enter a valid 6-digit PIN code'
    if (form.address.trim().length < 5) nextErrors.address = 'Address line 1 is required'
    if (form.district.trim().length < 2) nextErrors.district = 'City is required'
    if (form.state.trim().length < 2) nextErrors.state = 'State is required'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goToStep(nextStep: 0 | 1 | 2) {
    setStep(nextStep)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) {
      setCouponMessage('Enter a discount code.')
      return
    }
    setCouponMessage('This code is not valid for your order.')
  }

  function handleIncrement(item: (typeof items)[number]) {
    if (isProductMode) {
      setProductQty((qty) => Math.min(qty + 1, 10))
      return
    }
    updateQty(item.id, item.size, 1, item.variantId)
  }

  function handleDecrement(item: (typeof items)[number]) {
    if (isProductMode) {
      setProductQty((qty) => Math.max(1, qty - 1))
      return
    }
    updateQty(item.id, item.size, -1, item.variantId)
  }

  function handleRemove(item: (typeof items)[number]) {
    if (isProductMode && product) {
      router.push(getProductUrl(product))
      return
    }
    removeItem(item.id, item.size, item.variantId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (step === 0) {
      if (!validate()) return
      if (!deliveryQuote) {
        setPaymentError(quoteError || 'Enter a valid PIN code and state to calculate delivery.')
        return
      }
      setPaymentError(null)
      goToStep(1)
      return
    }

    if (step === 1) {
      if (!validate()) {
        goToStep(0)
        return
      }
      setPaymentError(null)
      goToStep(2)
      return
    }

    await handlePayNow()
  }

  async function handlePayNow() {
    if (!validate()) {
      goToStep(0)
      return
    }

    if (!deliveryQuote) {
      setPaymentError(quoteError || 'Enter a valid PIN code and state to calculate delivery.')
      return
    }

    const orderId = `TGE-${Date.now().toString().slice(-6)}`

    const orderPayload = {
      orderNumber: orderId,
      store: 'teesgarage',
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      customerEmail: email.trim(),
      address: form.address.trim(),
      apartment: [form.place.trim(), form.landmark.trim()].filter(Boolean).join(', ') || undefined,
      city: form.district.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      notes: emailUpdates
        ? 'Customer opted in to order updates by email.'
        : 'Customer opted out of email updates.',
      items: items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        size: String(item.size),
        quantity: item.qty
      }))
    }

    setIsProcessing(true)
    setPaymentError(null)

    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
      setPaymentError('Unable to load Razorpay payment SDK. Please reload the page.')
      setIsProcessing(false)
      return
    }

    try {
      const createRes = await fetch(`${backendUrl}/api/orders/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'INR',
          orderNumber: orderId,
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          items: orderPayload.items,
          customerName: form.name.trim(),
          customerEmail: email.trim(),
          customerPhone: form.phone.trim()
        })
      })

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to create payment order')
      }

      const rzpData = await createRes.json()
      const activeKey = rzpData.keyId
      if (!activeKey) throw new Error('Online payment is not configured. Please contact support.')

      const options = {
        key: activeKey,
        amount: rzpData.amount,
        currency: rzpData.currency || 'INR',
        name: 'TEESGARAGE',
        description: `Order ${orderId}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: form.name.trim(),
          email: email.trim(),
          contact: form.phone.trim()
        },
        notes: {
          orderNumber: orderId,
          address: `${form.address.trim()}, ${form.place.trim()}, ${form.district.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
          estimatedDelivery: deliveryEstimationInfo.formattedRange
        },
        theme: {
          color: '#090a0c'
        },
        handler: async function (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) {
          try {
            const verifyHeaders: Record<string, string> = {
              'Content-Type': 'application/json'
            }
            if (authToken) verifyHeaders.Authorization = `Bearer ${authToken}`

            const verifyRes = await fetch(`${backendUrl}/api/orders/razorpay/verify`, {
              method: 'POST',
              headers: verifyHeaders,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order: {
                  ...orderPayload,
                  status: 'paid',
                  handoffType: 'razorpay'
                }
              })
            })

            const verifyData = await verifyRes.json().catch(() => ({}))
            if (!verifyRes.ok) {
              const verifyErr = verifyData as { error?: string }
              throw new Error(verifyErr.error || 'Payment signature verification failed')
            }

            if (saveAddress) {
              if (isAuthenticated) {
                addAddress({
                  fullName: form.name.trim(),
                  phone: form.phone.trim(),
                  addressLine: form.address.trim(),
                  place: form.place.trim(),
                  district: form.district.trim(),
                  city: form.district.trim(),
                  state: form.state.trim(),
                  pincode: form.pincode.trim(),
                  isDefault: false
                })
              } else {
                try {
                  window.localStorage.setItem(
                    GUEST_CHECKOUT_KEY,
                    JSON.stringify({ email: email.trim(), form })
                  )
                } catch {
                  // Saving details is optional; never block a paid order.
                }
              }
            }

            const confirmedOrder = verifyData.order || {}
            try {
              window.sessionStorage.setItem(
                'teesgarage-order-confirmation',
                JSON.stringify({
                  orderNumber: confirmedOrder.orderNumber || orderId,
                  paymentId: response.razorpay_payment_id,
                  total: Number(confirmedOrder.total ?? rzpData.total ?? total),
                  subtotal: Number(confirmedOrder.subtotal ?? rzpData.subtotal ?? subtotal),
                  shipping: Number(confirmedOrder.shipping ?? rzpData.shipping ?? shipping),
                  createdAt: confirmedOrder.createdAt || new Date().toISOString(),
                  customerName: confirmedOrder.customerName || form.name.trim(),
                  address: confirmedOrder.address || form.address.trim(),
                  apartment: confirmedOrder.apartment || form.place.trim(),
                  city: confirmedOrder.city || form.district.trim(),
                  state: confirmedOrder.state || form.state.trim(),
                  pincode: confirmedOrder.pincode || form.pincode.trim(),
                  items: Array.isArray(confirmedOrder.items)
                    ? confirmedOrder.items
                    : items.map((item) => ({
                        id: item.id,
                        name: item.name,
                        fit: item.fit,
                        size: item.size,
                        quantity: item.qty,
                        price: item.price,
                        priceNum: item.priceNum,
                        img: item.img,
                        color: item.color,
                        wash: item.wash
                      }))
                })
              )
            } catch {
              // The order is verified; the receipt page can recover via the order number.
            }

            trackEvent('order_completed', {
              order_id: orderId,
              order_number: orderId,
              total: Number(verifyData.order?.total ?? rzpData.total ?? total),
              subtotal,
              shipping,
              currency: 'INR',
              item_count: items.reduce((sum, item) => sum + item.qty, 0),
              customer_email: email.trim(),
              payment_method: 'razorpay',
              items: items.map((item) => ({
                product_id: item.id,
                product_name: item.name,
                size: item.size,
                color: item.color,
                price: item.priceNum,
                quantity: item.qty
              }))
            })

            if (!isProductMode) {
              clearCart()
            }
            router.replace('/order-confirmation')
          } catch (err: any) {
            setPaymentError(
              err.message || 'Payment verification encountered an issue. Please contact support.'
            )
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
            setPaymentError(
              'Payment window was closed. You can retry payment whenever you are ready.'
            )
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        setIsProcessing(false)
        setPaymentError(
          resp.error?.description || 'Payment was declined. Please try another card or UPI account.'
        )
      })
      rzp.open()
    } catch (err: any) {
      setIsProcessing(false)
      setPaymentError(err.message || 'Failed to initialize payment gateway')
    }
  }

  // Empty bag view
  if (!isProductMode && count === 0) {
    return (
      <main className="checkout-page min-h-screen bg-[#FBFBFA] pb-24 font-ui text-[#1C2022]">
        <header className="w-full">
          <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <Link href="/" className="inline-block transition-opacity hover:opacity-85" aria-label="TEESGARAGE Homepage">
              <Image
                src="/teesgarage-logo.svg"
                alt="TEESGARAGE"
                width={150}
                height={42}
                priority
                className="h-[30px] sm:h-[34px] w-auto object-contain"
              />
            </Link>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAE8E4] text-[13px] font-semibold text-[#1C2022] select-none"
              title={user?.name || user?.email || 'Account'}
            >
              {userAvatarInitial}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-8">
          <div className="mx-auto mt-8 max-w-[560px] rounded-xl border border-[#E5E5DF] bg-white px-8 py-12 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8f8e]">
              Bag empty
            </p>
            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-[#1c2022]">
              Your shopping bag is empty
            </h1>
            <p className="mt-2 text-[13px] leading-[1.6] text-[#6f7473]">
              Find a tee, Henley, or bottomwear style to start your order.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/bag"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e3e2dd] px-5 text-[12.5px] font-semibold text-[#1c2022] no-underline transition-colors hover:border-[#111315]"
              >
                View shopping bag
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#111315] px-5 text-[12.5px] font-semibold text-white no-underline transition-colors hover:bg-[#24272a]"
              >
                Explore products
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const paymentMethods = (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#ecebe6] bg-white px-2 py-1 text-[10.5px] font-medium text-[#4d5352]">
        <GooglePayIcon /> Google Pay
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#ecebe6] bg-white px-2 py-1 text-[10.5px] font-medium text-[#4d5352]">
        <PhonePeIcon /> PhonePe
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#ecebe6] bg-white px-2 py-1 text-[10.5px] font-medium text-[#4d5352]">
        <PaytmIcon />
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#ecebe6] bg-white px-2 py-1 text-[10.5px] font-medium text-[#4d5352]">
        <CardsIcon /> Card
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#ecebe6] bg-white px-2 py-1 text-[10.5px] font-medium text-[#4d5352]">
        <NetBankingIcon /> NetBanking
      </span>
    </div>
  )

  return (
    <main className="checkout-page min-h-screen bg-[#FBFBFA] pb-24 font-ui text-[#1C2022]">
      {/* Top Header Bar */}
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <Link href="/" className="inline-block transition-opacity hover:opacity-85" aria-label="TEESGARAGE Homepage">
            <Image
              src="/teesgarage-logo.svg"
              alt="TEESGARAGE"
              width={150}
              height={42}
              priority
              className="h-[30px] sm:h-[34px] w-auto object-contain"
            />
          </Link>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAE8E4] text-[13px] font-semibold text-[#1C2022] select-none"
            title={user?.name || user?.email || 'Account'}
          >
            {userAvatarInitial}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        {/* Progress stepper */}
        <div className="flex items-start justify-between gap-6 pb-7 sm:pb-8">
          <CheckoutStepper step={step} shippingProgress={shippingProgress} />
          <div className="hidden h-7 shrink-0 items-center gap-1.5 text-[12px] font-normal text-[#555] select-none sm:flex">
            <span>Secure checkout</span>
            <Lock className="h-3.5 w-3.5 text-[#555]" strokeWidth={1.8} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_430px] items-start">
          {/* Left column */}
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit}
            noValidate
          >
            {step === 0 ? (
              <>
                {/* Contact information */}
                <section className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
                  <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                    Contact information
                  </h2>
                  <div className="mt-4 flex flex-col gap-3.5">
                    <Field
                      id="email"
                      label="Email address"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      error={errors.email}
                    />
                    <CustomCheckbox
                      id="email-updates"
                      checked={emailUpdates}
                      onChange={setEmailUpdates}
                      label="Email me with updates about my order"
                    />
                  </div>
                </section>

                {/* Shipping address */}
                <section className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
                  <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                    Shipping address
                  </h2>
                  <p className="mt-1 text-[12px] text-[#71717A]">
                    Enter the address where you want your order to be delivered.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field
                      id="name"
                      label="Full name"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      error={errors.name}
                    />
                    <Field
                      id="phone"
                      label="Phone number"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      error={errors.phone}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                    <Field
                      id="pincode"
                      label="Pincode"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="postal-code"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={form.pincode}
                      onChange={(e) => handlePincodeLookup(e.target.value)}
                      error={errors.pincode}
                      trailing={
                        pincodeLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8b8f8e]" />
                        ) : cleanPin.length === 6 && !errors.pincode ? (
                          <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                        ) : null
                      }
                    />
                    <Field
                      id="address"
                      label="Address line 1"
                      autoComplete="address-line1"
                      placeholder="House no., street, area"
                      value={form.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      error={errors.address}
                    />
                  </div>

                  <div className="mt-3">
                    <Field
                      id="place"
                      label="Address line 2 (Optional)"
                      autoComplete="address-line2"
                      placeholder="Apartment, suite, unit, etc."
                      value={form.place}
                      onChange={(e) => handleFieldChange('place', e.target.value)}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field
                      id="district"
                      label="City"
                      autoComplete="address-level2"
                      placeholder="City"
                      value={form.district}
                      onChange={(e) => handleFieldChange('district', e.target.value)}
                      error={errors.district}
                    />
                    <div className="min-w-0">
                      <label
                        htmlFor="state"
                        className={`flex cursor-pointer flex-col rounded-lg border bg-white px-3.5 pb-2 pt-1.5 transition-[border-color,box-shadow] duration-150 focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.06)] ${
                          errors.state
                            ? 'border-[#cf5b55]'
                            : 'border-[#e4e3de] focus-within:border-black'
                        }`}
                      >
                        <span className="text-[11px] font-normal leading-tight text-[#71717A] select-none">
                          State
                        </span>
                        <div className="relative mt-0.5">
                          <select
                            id="state"
                            value={form.state}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                            className={`w-full appearance-none border-0 bg-transparent pr-6 text-[13.5px] leading-normal outline-none cursor-pointer ${
                              form.state ? 'text-[#18181B]' : 'text-[#A1A1AA]'
                            }`}
                          >
                            <option value="">Select state</option>
                            {form.state && !INDIAN_STATES.includes(form.state) ? (
                              <option value={form.state}>{form.state}</option>
                            ) : null}
                            {INDIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
                        </div>
                      </label>
                      {errors.state ? (
                        <p className="mt-1 pl-1 text-[11px] font-medium text-[#cf5b55]">
                          {errors.state}
                        </p>
                      ) : null}
                    </div>
                    <Field
                      id="landmark"
                      label="Landmark (Optional)"
                      placeholder="Near MG Road"
                      value={form.landmark}
                      onChange={(e) => handleFieldChange('landmark', e.target.value)}
                    />
                  </div>

                  <div className="mt-4">
                    <CustomCheckbox
                      id="save-address"
                      checked={saveAddress}
                      onChange={setSaveAddress}
                      label="Save this address for next time"
                    />
                  </div>
                </section>

                {/* Delivery options */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#111] mb-2.5">
                    Delivery options
                  </h3>
                  <div className="rounded-lg border border-[#E2E0D8] bg-[#FAF9F6]/50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <RadioDot selected={true} />
                      <div>
                        <span className="block text-[13.5px] font-medium leading-tight text-[#111]">
                          Standard delivery
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-tight text-[#71717A]">
                          {deliveryOptionSubtitle}
                        </span>
                      </div>
                    </div>
                    <span className="text-[13.5px] font-medium text-[#111]">
                      {shippingDisplay}
                    </span>
                  </div>
                </div>

                {quoteError && !paymentError ? (
                  <div
                    className="flex items-start gap-2.5 rounded-lg border border-[#f2d3d0] bg-[#fdf4f3] px-3.5 py-3 text-[12px] leading-[1.5] text-[#9a3f3a]"
                    role="alert"
                  >
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    <span>{quoteError}</span>
                  </div>
                ) : null}

                {paymentError ? (
                  <div
                    className="flex items-start gap-2.5 rounded-lg border border-[#f2d3d0] bg-[#fdf4f3] px-3.5 py-3 text-[12px] leading-[1.5] text-[#9a3f3a]"
                    role="alert"
                  >
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canContinue}
                  className="mt-1 flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#141414] hover:bg-black px-5 text-[13.5px] font-medium text-white transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:bg-[#DCDAD4] disabled:text-[#8B8F8E]"
                >
                  <span>{quoteLoading ? 'Calculating delivery…' : 'Continue to payment'}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <section className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                      Payment
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A]">
                      <Lock className="h-3 w-3" /> Secure
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#71717A]">
                    All transactions are secure and encrypted.
                  </p>

                  <div className="mt-4 rounded-lg border border-black p-4 bg-[#FAF9F6]/40">
                    <label className="flex cursor-pointer items-start gap-3">
                      <RadioDot selected={true} />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium leading-tight text-[#111]">
                          Pay online via Razorpay
                        </span>
                        <span className="mt-1 block text-[12px] leading-normal text-[#71717A]">
                          UPI, credit / debit cards, net banking and wallets
                        </span>
                        {paymentMethods}
                      </div>
                    </label>
                  </div>

                  <p className="mt-3.5 flex items-center gap-1.5 text-[11.5px] text-[#71717A]">
                    <Lock className="h-3 w-3 shrink-0" />
                    256-bit encrypted payment. Your card details never touch our servers.
                  </p>
                </section>

                <section className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#71717A]">
                        Shipping to
                      </p>
                      <p className="mt-1.5 text-[13.5px] font-medium text-[#111]">
                        {form.name}
                      </p>
                      <p className="text-[12px] text-[#52525B] leading-relaxed">
                        {[form.address, form.place, form.landmark, form.district, form.state]
                          .filter(Boolean)
                          .join(', ')}{' '}
                        – {form.pincode}
                      </p>
                      <p className="mt-1 text-[12px] text-[#71717A]">
                        {form.phone} · {email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep(0)}
                      className="shrink-0 text-[12px] font-medium text-[#52525B] underline underline-offset-2 transition-colors hover:text-black cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </section>

                {paymentError ? (
                  <div
                    className="flex items-start gap-2.5 rounded-lg border border-[#f2d3d0] bg-[#fdf4f3] px-3.5 py-3 text-[12px] leading-[1.5] text-[#9a3f3a]"
                    role="alert"
                  >
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#141414] hover:bg-black px-5 text-[13.5px] font-medium text-white transition-colors cursor-pointer"
                >
                  <span>Continue to review</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-medium text-[#52525B] transition-colors hover:text-black cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to shipping
                </button>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <section className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
                  <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                    Review order
                  </h2>
                  <p className="mt-1 text-[12px] text-[#71717A]">
                    Confirm your details before completing payment.
                  </p>

                  <div className="mt-4 divide-y divide-[#F0EFEA]">
                    <div className="flex items-start justify-between gap-4 pb-3.5">
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#71717A]">
                          Contact
                        </p>
                        <p className="mt-1 truncate text-[13px] text-[#111]">
                          {email}
                        </p>
                        <p className="text-[12px] text-[#71717A]">{form.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep(0)}
                        className="shrink-0 text-[12px] font-medium text-[#52525B] underline underline-offset-2 hover:text-black cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#71717A]">
                          Shipping address
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-[#111]">
                          {form.name}
                        </p>
                        <p className="text-[12px] text-[#52525B] leading-relaxed">
                          {[form.address, form.place, form.landmark, form.district, form.state]
                            .filter(Boolean)
                            .join(', ')}{' '}
                          – {form.pincode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep(0)}
                        className="shrink-0 text-[12px] font-medium text-[#52525B] underline underline-offset-2 hover:text-black cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#71717A]">
                          Delivery
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-[#111]">
                          Standard delivery · {shippingDisplay}
                        </p>
                        <p className="text-[12px] text-[#71717A]">
                          {deliveryOptionSubtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep(0)}
                        className="shrink-0 text-[12px] font-medium text-[#52525B] underline underline-offset-2 hover:text-black cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="flex items-start justify-between gap-4 pt-3.5">
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[#71717A]">
                          Payment
                        </p>
                        <p className="mt-1 text-[13px] font-medium text-[#111]">
                          Razorpay secure checkout
                        </p>
                        <p className="text-[12px] text-[#71717A]">
                          UPI, cards, net banking and wallets
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="shrink-0 text-[12px] font-medium text-[#52525B] underline underline-offset-2 hover:text-black cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </section>

                {paymentError ? (
                  <div
                    className="flex items-start gap-2.5 rounded-lg border border-[#f2d3d0] bg-[#fdf4f3] px-3.5 py-3 text-[12px] leading-[1.5] text-[#9a3f3a]"
                    role="alert"
                  >
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canPay}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#141414] hover:bg-black px-5 text-[13.5px] font-medium text-white transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:bg-[#DCDAD4] disabled:text-[#8B8F8E]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>
                    {isProcessing
                      ? 'Connecting to Razorpay…'
                      : `Pay ${formatPrice(total)} securely`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-medium text-[#52525B] transition-colors hover:text-black cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to payment
                </button>
              </>
            ) : null}
          </form>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-6 self-start">
            <div className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                  Order summary
                </h2>
                <Link
                  href={backHref}
                  className="text-[12px] font-medium text-[#52525B] underline underline-offset-2 transition-colors hover:text-black"
                >
                  {isProductMode ? 'Back to product' : 'Back to cart'}
                </Link>
              </div>

              <div className="mt-5 flex max-h-[380px] flex-col gap-5 overflow-y-auto pr-0.5">
                {itemsWithPricing.map((item) => (
                  <div key={`${item.id}-${item.variantId ?? item.size}`} className="flex gap-3.5 items-start">
                    <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-lg border border-[#eeece7] bg-[#f6f5f1]">
                      <Image
                        src={item.img}
                        alt={item.name}
                        width={82}
                        height={82}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold leading-tight text-[#111]">
                            {item.name}
                          </p>
                          <p className="mt-1 text-[12px] text-[#71717A]">
                            {[item.color, item.size].filter(Boolean).join(' / ')}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-[14px] font-bold text-[#111]">
                            {formatPrice(item.priceNum * item.qty)}
                          </span>
                          <span className="block text-[11.5px] text-[#A1A1AA] line-through mt-0.5">
                            {formatPrice(item.originalPrice * item.qty)}
                          </span>
                          <span className="inline-block mt-0.5 rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-bold text-[#15803D]">
                            {item.discountPercent}% OFF
                          </span>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-md border border-[#E0DED7] bg-white h-7">
                          <button
                            type="button"
                            onClick={() => handleDecrement(item)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="grid h-7 w-7 cursor-pointer place-items-center text-[#52525B] transition-colors hover:text-black disabled:cursor-not-allowed disabled:text-[#D1D0C9]"
                            disabled={item.qty <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 select-none text-center text-[12px] font-medium text-[#111]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrement(item)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="grid h-7 w-7 cursor-pointer place-items-center text-[#52525B] transition-colors hover:text-black"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          aria-label={`Remove ${item.name}`}
                          className="p-1 text-[#A1A1AA] transition-colors hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value)
                      if (couponMessage) setCouponMessage(null)
                    }}
                    placeholder="Discount code or gift card"
                    aria-label="Discount code or gift card"
                    className="h-[38px] w-full rounded-lg border border-[#E2E0D8] bg-white pl-9 pr-3 text-[12px] text-[#111] placeholder:text-[#A1A1AA] outline-none transition-[border-color,box-shadow] focus:border-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="h-[38px] shrink-0 cursor-pointer rounded-lg bg-[#F0EFEA] hover:bg-[#E6E5DF] px-4 text-[12px] font-medium text-[#18181B] transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMessage ? (
                <p className="mt-1.5 text-[11px] leading-[1.4] text-[#cf5b55]">{couponMessage}</p>
              ) : null}

              <div className="mt-5 border-t border-[#F0EFEA] pt-4">
                <p className="text-[12px] text-[#71717A]">Estimated arrival</p>
                <p className="mt-1 text-[15px] font-bold text-[#111]">
                  {arrivalDisplay}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#F0EFEA] pt-4 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#52525B]">Subtotal</span>
                  <span className="font-medium text-[#111]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#52525B]">Shipping charges</span>
                  <span className="font-medium text-[#111]">{shippingDisplay}</span>
                </div>
                {totalSavings > 0 ? (
                  <div className="mt-1 flex justify-end">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EE] px-3 py-1.5 text-[11.5px] font-medium text-[#15803D] shadow-xs">
                      <span>🎉</span>
                      <span>You saved {formatPrice(totalSavings)} on this purchase!</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {deliveryQuote && shipping === 0 ? (
                <div className="mt-3.5 rounded-lg bg-[#E8F8EE] px-3 py-2 text-[11px] font-medium leading-normal text-[#15803D]">
                  Free standard delivery applied to this order
                </div>
              ) : null}

              <div className="mt-4 border-t border-[#F0EFEA] pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[18px] font-bold text-[#111]">Total</span>
                  <span className="text-[24px] font-bold tracking-tight text-[#111]">
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="mt-1 text-right text-[11px] text-[#71717A]">
                  Inclusive of all taxes
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
