'use client'

import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  Minus,
  Plus,
  Tag,
  Trash2,
  Wallet
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useAuthStore, type UserAddress } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/constants'
import { getProductUrl, getAvailableProductSizes } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'
import { FloatingInput, FloatingSelect } from '@/components/ui/FloatingInput'

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

interface CheckoutOrderPayload {
  orderNumber: string
  store: string
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  apartment?: string
  city: string
  state: string
  pincode: string
  notes: string
  items: Array<{ id: number; variantId?: number; size: string; quantity: number }>
}

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

const UPI_ID_PATTERN = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/

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

function UpiIcon() {
  return (
    <svg
      className="inline-block shrink-0"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M5 3h5l7 9-7 9H5l7-9-7-9Z" fill="#171717" />
      <path d="M11 3h5l7 9-7 9h-5l7-9-7-9Z" fill="#F5A623" />
    </svg>
  )
}

function VisaLogo() {
  return (
    <svg
      viewBox="0 0 36 12"
      width="34"
      height="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Visa"
    >
      <text
        x="0"
        y="10.5"
        fill="#1A1F71"
        fontSize="11"
        fontWeight="800"
        fontStyle="italic"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.2"
      >
        VISA
      </text>
    </svg>
  )
}

function MastercardLogo() {
  return (
    <svg
      viewBox="0 0 26 16"
      width="26"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mastercard"
    >
      <circle cx="9" cy="8" r="7" fill="#EB001B" />
      <circle cx="17" cy="8" r="7" fill="#F79E1B" />
      <path d="M13 3.1a7 7 0 0 0 0 9.8 7 7 0 0 0 0-9.8Z" fill="#FF5F00" />
    </svg>
  )
}

function RuPayLogo() {
  return (
    <svg
      viewBox="0 0 42 14"
      width="40"
      height="14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RuPay"
    >
      <text
        x="0"
        y="11"
        fill="#0B2E68"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.2"
      >
        RuPay
      </text>
      <path d="M34 3.5 40 7l-6 3.5V3.5Z" fill="#F58220" />
    </svg>
  )
}

function BhimLogo() {
  return (
    <svg
      viewBox="0 0 38 14"
      width="36"
      height="14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BHIM"
    >
      <text
        x="0"
        y="11"
        fill="#0B2E68"
        fontSize="11"
        fontWeight="800"
        fontStyle="italic"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.3"
      >
        BHIM
      </text>
      <path d="M30 3.5 36 7l-6 3.5V3.5Z" fill="#F58220" />
    </svg>
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

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'

function PaymentOption({
  id,
  title,
  description,
  icon,
  selected,
  onSelect,
  badges,
  showChevron
}: {
  id: string
  title: string
  description: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
  badges?: ReactNode
  showChevron?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border bg-white px-4 py-3.5 transition-[border-color,box-shadow] duration-150 sm:gap-4 ${
        selected
          ? 'border-black shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
          : 'border-[#E7E5DF] hover:border-[#CFCDC6]'
      }`}
    >
      <input
        id={id}
        type="radio"
        name="payment-method"
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-black/20 peer-focus-visible:ring-offset-2 ${
          selected ? 'border-black' : 'border-[#C9C7C0]'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full bg-black transition-transform duration-150 ${
            selected ? 'scale-100' : 'scale-0'
          }`}
        />
      </span>
      <span className="shrink-0 text-[#111]" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-tight text-[#111]">{title}</span>
        <span className="mt-1 block text-[12.5px] leading-tight text-[#71717A]">{description}</span>
      </span>
      {badges ? (
        <span className="hidden shrink-0 items-center gap-2.5 sm:flex" aria-hidden="true">
          {badges}
        </span>
      ) : null}
      {showChevron ? (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-[#71717A]"
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : null}
    </label>
  )
}

type StepState = 'upcoming' | 'active' | 'done'

function StepMarker({
  index,
  label,
  state,
  align = 'center'
}: {
  index: number
  label: string
  state: StepState
  align?: 'start' | 'center' | 'end'
}) {
  const isCurrent = state === 'active'
  const isComplete = state === 'done'
  const isDone = isCurrent || isComplete
  const labelAlignment =
    align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'

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
        className={`absolute top-[34px] whitespace-nowrap text-[12px] leading-none transition-colors duration-300 sm:text-[12.5px] ${labelAlignment} ${
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
            <StepMarker
              key={item.label}
              index={i + 1}
              label={item.label}
              state={item.state}
              align={i === 0 ? 'start' : i === steps.length - 1 ? 'end' : 'center'}
            />
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [upiId, setUpiId] = useState('')
  const [upiError, setUpiError] = useState<string | null>(null)

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

  function handlePaymentMethodChange(method: PaymentMethod) {
    setPaymentMethod(method)
    setPaymentError(null)
    setUpiError(null)
  }

  function validatePayment(): boolean {
    if (paymentMethod !== 'upi') {
      setUpiError(null)
      return true
    }

    const value = upiId.trim()
    if (!value) {
      setUpiError(null)
      return true
    }
    if (!UPI_ID_PATTERN.test(value)) {
      setUpiError('Enter a valid UPI ID, for example yourname@bank')
      return false
    }

    setUpiError(null)
    return true
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

  function saveCheckoutAddress() {
    if (!saveAddress) return

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
      return
    }

    try {
      window.localStorage.setItem(
        GUEST_CHECKOUT_KEY,
        JSON.stringify({ email: email.trim(), form })
      )
    } catch {
      // Saving details is optional; never block a paid order.
    }
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
      if (!validatePayment()) return
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

    const orderPayload: CheckoutOrderPayload = {
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

    if (paymentMethod === 'cod') {
      await placeCashOnDeliveryOrder(orderPayload, orderId)
      return
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
          contact: form.phone.trim(),
          ...(paymentMethod === 'upi'
            ? { method: 'upi', ...(upiId.trim() ? { vpa: upiId.trim() } : {}) }
            : { method: paymentMethod })
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

            saveCheckoutAddress()

            const confirmedOrder = verifyData.order || {}
            try {
              window.sessionStorage.setItem(
                'teesgarage-order-confirmation',
                JSON.stringify({
                  orderNumber: confirmedOrder.orderNumber || orderId,
                  paymentId: response.razorpay_payment_id,
                  paymentMethod: 'online',
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

  async function placeCashOnDeliveryOrder(orderPayload: CheckoutOrderPayload, orderId: string) {
    setIsProcessing(true)
    setPaymentError(null)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers.Authorization = `Bearer ${authToken}`

      const res = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...orderPayload,
          handoffType: 'cod',
          paymentMethod: 'COD',
          notes: `${orderPayload.notes} Payment method: Cash on delivery.`
        })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not place your order. Please try again.')

      saveCheckoutAddress()

      const confirmedOrder = (data.order || {}) as Record<string, any>
      try {
        window.sessionStorage.setItem(
          'teesgarage-order-confirmation',
          JSON.stringify({
            orderNumber: confirmedOrder.orderNumber || orderId,
            paymentId: 'Cash on delivery',
            paymentMethod: 'cod',
            total: Number(confirmedOrder.total ?? total),
            subtotal: Number(confirmedOrder.subtotal ?? subtotal),
            shipping: Number(confirmedOrder.shipping ?? shipping),
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
        // The order is recorded; the receipt page can recover via the order number.
      }

      trackEvent('order_completed', {
        order_id: orderId,
        order_number: orderId,
        total: Number(confirmedOrder.total ?? total),
        subtotal,
        shipping,
        currency: 'INR',
        item_count: items.reduce((sum, item) => sum + item.qty, 0),
        customer_email: email.trim(),
        payment_method: 'cod',
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
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : 'Could not place your order. Please try again.'
      )
    } finally {
      setIsProcessing(false)
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

  const paymentMethodLabel: Record<PaymentMethod, string> = {
    upi: 'UPI',
    card: 'Credit or debit card',
    netbanking: 'Net banking',
    wallet: 'Wallet',
    cod: 'Cash on delivery'
  }

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
                    <FloatingInput
                      id="email"
                      label="Email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
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
                    <FloatingInput
                      id="name"
                      label="Full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      error={errors.name}
                    />
                    <FloatingInput
                      id="phone"
                      label="Phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      error={errors.phone}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                    <FloatingInput
                      id="pincode"
                      label="Pincode"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="postal-code"
                      maxLength={6}
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
                    <FloatingInput
                      id="address"
                      label="Address line 1"
                      autoComplete="address-line1"
                      value={form.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      error={errors.address}
                    />
                  </div>

                  <div className="mt-3">
                    <FloatingInput
                      id="place"
                      label="Address line 2"
                      optional
                      autoComplete="address-line2"
                      value={form.place}
                      onChange={(e) => handleFieldChange('place', e.target.value)}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FloatingInput
                      id="district"
                      label="City"
                      autoComplete="address-level2"
                      value={form.district}
                      onChange={(e) => handleFieldChange('district', e.target.value)}
                      error={errors.district}
                    />
                    <FloatingSelect
                      id="state"
                      label="State"
                      value={form.state}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      error={errors.state}
                      className={form.state ? undefined : 'text-neutral-400'}
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
                    </FloatingSelect>
                    <FloatingInput
                      id="landmark"
                      label="Landmark"
                      optional
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
                  <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                    Payment method
                  </h2>
                  <p className="mt-1 text-[12px] text-[#71717A]">Choose how you’d like to pay.</p>

                  <div
                    className="mt-4 flex flex-col gap-2.5"
                    role="radiogroup"
                    aria-label="Payment method"
                  >
                    <PaymentOption
                      id="payment-upi"
                      title="UPI"
                      description="Pay using any UPI app"
                      icon={<UpiIcon />}
                      selected={paymentMethod === 'upi'}
                      onSelect={() => handlePaymentMethodChange('upi')}
                      badges={
                        <>
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#3C4043]">
                            <GooglePayIcon /> Pay
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#5F259F]">
                            <PhonePeIcon /> PhonePe
                          </span>
                          <PaytmIcon />
                          <BhimLogo />
                        </>
                      }
                    />
                    <PaymentOption
                      id="payment-card"
                      title="Credit or debit card"
                      description="Visa, Mastercard, RuPay"
                      icon={<CreditCard className="h-[22px] w-[22px]" strokeWidth={1.7} />}
                      selected={paymentMethod === 'card'}
                      onSelect={() => handlePaymentMethodChange('card')}
                      badges={
                        <>
                          <VisaLogo />
                          <MastercardLogo />
                          <RuPayLogo />
                        </>
                      }
                    />
                    <PaymentOption
                      id="payment-netbanking"
                      title="Net banking"
                      description="All major Indian banks"
                      icon={<Landmark className="h-[22px] w-[22px]" strokeWidth={1.7} />}
                      selected={paymentMethod === 'netbanking'}
                      onSelect={() => handlePaymentMethodChange('netbanking')}
                      showChevron
                    />
                    <PaymentOption
                      id="payment-wallet"
                      title="Wallets"
                      description="Pay with supported wallets"
                      icon={<Wallet className="h-[22px] w-[22px]" strokeWidth={1.7} />}
                      selected={paymentMethod === 'wallet'}
                      onSelect={() => handlePaymentMethodChange('wallet')}
                      showChevron
                    />
                    <PaymentOption
                      id="payment-cod"
                      title="Cash on delivery"
                      description="Pay when your order arrives"
                      icon={<Banknote className="h-[22px] w-[22px]" strokeWidth={1.7} />}
                      selected={paymentMethod === 'cod'}
                      onSelect={() => handlePaymentMethodChange('cod')}
                      showChevron
                    />
                  </div>

                  {paymentMethod === 'upi' ? (
                    <div className="mt-4 rounded-xl border border-[#E7E5DF] p-4">
                      <label
                        htmlFor="upi-id"
                        className="block text-[12px] font-medium text-[#3F4442]"
                      >
                        UPI ID
                      </label>
                      <input
                        id="upi-id"
                        type="text"
                        inputMode="email"
                        autoComplete="off"
                        spellCheck={false}
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value)
                          if (upiError) setUpiError(null)
                        }}
                        placeholder="yourname@bank"
                        aria-invalid={Boolean(upiError)}
                        aria-describedby="upi-id-help"
                        className={`mt-1.5 h-11 w-full rounded-lg border bg-white px-3.5 text-[13.5px] text-[#111] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#A1A1AA] focus:border-black ${
                          upiError ? 'border-[#cf5b55]' : 'border-[#E4E3DE]'
                        }`}
                      />
                      <p
                        id="upi-id-help"
                        className={`mt-1.5 text-[11.5px] ${
                          upiError ? 'font-medium text-[#cf5b55]' : 'text-[#8A8F8D]'
                        }`}
                      >
                        {upiError || 'Enter your UPI ID to receive a payment request.'}
                      </p>
                      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[#8A8F8D]">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        Your payment details are secure and encrypted.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[#8A8F8D]">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      Your payment details are secure and encrypted.
                    </p>
                  )}
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

                <div className="grid gap-3 sm:grid-cols-[1fr_2fr] sm:items-center sm:gap-5">
                  <button
                    type="submit"
                    className="order-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#141414] px-5 text-[13.5px] font-medium text-white transition-colors duration-200 hover:bg-black cursor-pointer sm:order-2"
                  >
                    <span>Continue to review</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="order-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-1 text-[13px] font-medium text-[#52525B] underline underline-offset-2 transition-colors hover:text-black cursor-pointer sm:order-1 sm:justify-start"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to shipping
                  </button>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <section className="rounded-xl border border-[#E5E5DF] bg-white p-6 shadow-none">
                  <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#111]">
                    Review order
                  </h2>
                  <p className="mt-1 text-[12px] text-[#71717A]">
                    {paymentMethod === 'cod'
                      ? 'Confirm your details before placing your order.'
                      : 'Confirm your details before completing payment.'}
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
                          {paymentMethod === 'cod'
                            ? 'Cash on delivery'
                            : `Razorpay · ${paymentMethodLabel[paymentMethod]}`}
                        </p>
                        <p className="text-[12px] text-[#71717A]">
                          {paymentMethod === 'cod'
                            ? 'Pay in cash when your order arrives'
                            : paymentMethod === 'upi' && upiId.trim()
                              ? upiId.trim()
                              : 'Secure online payment'}
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
                  {paymentMethod === 'cod' ? (
                    <Banknote className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isProcessing
                      ? paymentMethod === 'cod'
                        ? 'Placing your order…'
                        : 'Connecting to Razorpay…'
                      : paymentMethod === 'cod'
                        ? `Place order · ${formatPrice(total)}`
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
