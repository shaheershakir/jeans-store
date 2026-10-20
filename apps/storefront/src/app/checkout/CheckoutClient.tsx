'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'
import {
  ShieldCheck,
  AlertCircle,
  Truck,
  RotateCcw,
  MapPin,
  Lock,
  ArrowRight,
  Check,
  User,
  ExternalLink
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useAuthStore, type UserAddress } from '@/lib/store'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/constants'
import { getProductSlug, getProductUrl, getAvailableProductSizes } from '@/lib/products'
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
  district: string
  state: string
  pincode: string
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
  district: '',
  state: '',
  pincode: ''
}

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
      width="18"
      height="18"
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
      width="18"
      height="18"
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
      width="32"
      height="13"
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
      width="22"
      height="15"
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
      width="18"
      height="18"
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

export default function CheckoutClient({
  mode = { type: 'bag' },
  checkoutUrl
}: CheckoutClientProps) {
  const router = useRouter()

  const isProductMode = mode.type === 'product'
  const product = isProductMode ? mode.product : null

  const cartItems = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

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
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // Profile Autofill State
  const [isAutofilled, setIsAutofilled] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [saveToProfile, setSaveToProfile] = useState(true)
  const [isManuallyEdited, setIsManuallyEdited] = useState(false)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeDetected, setPincodeDetected] = useState<string | null>(null)

  // Target URL to return to if redirected to login
  const targetRedirect =
    checkoutUrl ||
    (isProductMode && product ? `/${getProductSlug(product)}/checkout` : '/bag/checkout')

  // Check if user has completed saved information (address, name, and phone number)
  const completedSavedAddress = useMemo(() => {
    if (!addresses || addresses.length === 0) return null
    return (
      addresses.find(
        (a) =>
          Boolean(a.addressLine?.trim()) &&
          Boolean(a.pincode?.trim()) &&
          Boolean(a.fullName?.trim() || user?.name?.trim()) &&
          Boolean(a.phone?.trim() || user?.phone?.trim())
      ) || null
    )
  }, [addresses, user])

  const hasSavedInfo = Boolean(completedSavedAddress)
  const [deliveryMode, setDeliveryMode] = useState<'saved' | 'new'>('saved')

  const count = isProductMode ? productQty : cartCount(cartItems)
  const subtotal =
    deliveryQuote?.subtotal ??
    (isProductMode ? (product?.priceNum ?? 0) * productQty : cartSubtotal(cartItems))
  const shipping = deliveryQuote?.shipping ?? 0
  const total = deliveryQuote?.total ?? subtotal

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
        district: districtVal,
        state: addr.state || '',
        pincode: (addr.pincode || '').replace(/\D/g, '').slice(0, 6)
      })
      setSelectedAddressId(addr.id)
      setIsAutofilled(true)
      setIsManuallyEdited(false)
      if (districtVal || addr.state) {
        setPincodeDetected(districtVal ? `${districtVal}, ${addr.state}` : addr.state)
      }
    },
    [user]
  )

  function handleSelectDeliveryMode(mode: 'saved' | 'new') {
    if (mode === deliveryMode) return
    setDeliveryMode(mode)
    setShowAddressPicker(false)

    if (mode === 'saved') {
      const targetAddr =
        addresses?.find((a) => a.id === selectedAddressId) ||
        completedSavedAddress ||
        addresses?.find((a) => a.isDefault) ||
        addresses?.[0]
      if (targetAddr) {
        applySavedAddress(targetAddr)
      }
    } else {
      setForm(INITIAL_FORM)
      setSelectedAddressId(null)
      setPincodeDetected(null)
      setErrors({})
      setDeliveryQuote(null)
      setIsAutofilled(false)
      setIsManuallyEdited(true)
    }
  }

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void loadRazorpayScript()
  }, [])

  // Track checkout initiation
  useEffect(() => {
    if (items.length > 0) {
      trackEvent('checkout_started', {
        item_count: items.reduce((sum, item) => sum + item.qty, 0),
        subtotal,
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

  // Auto-populate from profile if available on sign-in
  useEffect(() => {
    if (completedSavedAddress) {
      applySavedAddress(completedSavedAddress)
      setDeliveryMode('saved')
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone: (user.phone || prev.phone).replace(/\D/g, '').slice(-10)
      }))
      setDeliveryMode('new')
    } else {
      setDeliveryMode('new')
    }
  }, [user, completedSavedAddress, applySavedAddress])

  // Recalculate quote whenever pincode or state changes
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

  // Dynamic delivery date calculation using date-fns determined by PIN code
  const deliveryEstimationInfo = useMemo(() => {
    const cleanPin = form.pincode.replace(/\D/g, '').slice(0, 6)
    const hasValidPin = cleanPin.length === 6
    const isKeralaPin = hasValidPin && /^(67|68|69)/.test(cleanPin)
    const isKeralaState = form.state.trim().toLowerCase() === 'kerala'
    const isKerala = isKeralaPin || isKeralaState

    const estimation = deliveryQuote?.deliveryEstimation

    if (estimation?.exactDeliveryDate?.trim()) {
      return {
        formattedRange: estimation.exactDeliveryDate.trim(),
        hasPin: hasValidPin,
        isKerala
      }
    }

    if (!hasValidPin && !form.state.trim()) {
      return {
        formattedRange: 'Enter PIN code to view delivery date',
        hasPin: false,
        isKerala: false
      }
    }

    // Kerala: 2-5 days, Outside Kerala: 1-2 weeks (7-14 days)
    const minDays = estimation?.minDays ?? (isKerala ? 2 : 7)
    const maxDays = estimation?.maxDays ?? (isKerala ? 5 : 14)

    const now = new Date()
    const minDate = addDays(now, minDays)
    const maxDate = addDays(now, maxDays)

    // Formatted example: 16 Oct 2026 – 21 Oct 2026
    const formattedRange = `${format(minDate, 'd MMM yyyy')} – ${format(maxDate, 'd MMM yyyy')}`

    return {
      formattedRange,
      hasPin: true,
      isKerala
    }
  }, [form.pincode, form.state, deliveryQuote?.deliveryEstimation])

  function handleFieldChange(field: keyof CheckoutForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setIsManuallyEdited(true)
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handlePincodeLookup(pin: string) {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6)
    handleFieldChange('pincode', cleanPin)

    if (cleanPin.length === 6) {
      setPincodeLoading(true)
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
        const data = await res.json()
        if (
          Array.isArray(data) &&
          data[0]?.Status === 'Success' &&
          data[0]?.PostOffice?.length > 0
        ) {
          const po = data[0].PostOffice[0]
          const district = po.District || po.Name || ''
          const state = po.State || ''
          const place = po.Name || ''
          setForm((prev) => ({
            ...prev,
            pincode: cleanPin,
            place: prev.place.trim() ? prev.place : place,
            district: prev.district.trim() ? prev.district : district,
            state: state || prev.state
          }))
          setPincodeDetected(district ? `${district}, ${state}` : state)
          setErrors((prev) => ({
            ...prev,
            pincode: undefined,
            state: undefined,
            district: undefined
          }))
        } else {
          setPincodeDetected(null)
          setErrors((prev) => ({ ...prev, pincode: 'Invalid PIN code or location not found' }))
        }
      } catch {
        setPincodeDetected(null)
      } finally {
        setPincodeLoading(false)
      }
    } else {
      setPincodeDetected(null)
    }
  }

  const isFormComplete = useMemo(() => {
    return Boolean(
      form.name.trim().length >= 2 &&
      form.phone.replace(/\D/g, '').length === 10 &&
      form.address.trim().length >= 5 &&
      form.place.trim().length >= 2 &&
      form.district.trim().length >= 2 &&
      form.state.trim().length >= 2 &&
      form.pincode.replace(/\D/g, '').length === 6
    )
  }, [form])

  const canSubmit = Boolean(
    isFormComplete && deliveryQuote && !quoteLoading && !isProcessing && items.length > 0
  )

  function handleClearForm() {
    setForm(INITIAL_FORM)
    setIsAutofilled(false)
    setSelectedAddressId(null)
    setShowAddressPicker(false)
    setIsManuallyEdited(true)
    setPincodeDetected(null)
    setErrors({})
    setDeliveryQuote(null)
    setPaymentError(null)
    setQuoteError(null)
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CheckoutForm, string>> = {}

    if (!form.name.trim()) nextErrors.name = 'Full name is required'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Valid 10-digit mobile number is required'
    }
    if (!form.address.trim()) nextErrors.address = 'Street / building address is required'
    if (!form.place.trim()) nextErrors.place = 'Place / locality is required'
    if (!form.district.trim()) nextErrors.district = 'District is required'
    if (!form.state.trim()) nextErrors.state = 'State is required'
    if (!form.pincode.trim() || form.pincode.replace(/\D/g, '').length !== 6) {
      nextErrors.pincode = 'Valid 6-digit PIN code is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 1. Enforce Authentication Requirement
    if (!isAuthenticated || !user || !authToken) {
      router.push(`/login?redirect=${encodeURIComponent(targetRedirect)}`)
      return
    }

    // 2. Validate Form Fields
    if (!validate()) return

    if (!deliveryQuote) {
      setPaymentError(
        quoteError || 'Please enter a valid PIN code and state to calculate delivery.'
      )
      return
    }

    const orderId = `TGE-${Date.now().toString().slice(-6)}`

    const orderPayload = {
      orderNumber: orderId,
      store: 'teesgarage',
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      customerEmail: user.email.trim(),
      address: form.address.trim(),
      apartment: form.place.trim() || undefined,
      city: form.district.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
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
          customerEmail: user.email.trim(),
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
          email: user.email.trim(),
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
            const verifyRes = await fetch(`${backendUrl}/api/orders/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
              },
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

            if (saveToProfile) {
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
              // The order is already verified. Do not turn a storage limitation
              // into a payment failure; the receipt page can recover via orders.
            }

            trackEvent('order_completed', {
              order_id: orderId,
              order_number: orderId,
              total: Number(verifyData.order?.total ?? rzpData.total ?? total),
              subtotal,
              shipping,
              currency: 'INR',
              item_count: items.reduce((sum, item) => sum + item.qty, 0),
              customer_email: user?.email,
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

  // Empty Bag View
  if (!isProductMode && count === 0) {
    return (
      <main className="checkout-page min-h-[calc(100dvh-120px)] bg-[#f8f7f3] px-[clamp(18px,4vw,56px)] pt-[clamp(28px,5vw,64px)] pb-20 font-ui text-[#172126] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pt-6 [@media(max-width:639px)]:pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto my-10 max-w-[640px] rounded-[2px] border border-[#dfded8] bg-white p-10 text-center">
          <span>BAG EMPTY</span>
          <h1 className="mb-2 font-brand text-[20px] font-semibold leading-[1.12] tracking-[-0.05em] text-[#172126]">
            Your shopping bag is empty
          </h1>
          <p className="mb-5 text-[14px] leading-[21px] text-[#6b7280]">
            Find a tee, Henley, or bottomwear style to start your order.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '16px'
            }}
          >
            <Link
              href="/bag"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border-0 bg-transparent px-6 py-3 font-brand text-[13.5px] font-semibold tracking-[-0.01em] text-[#172126] no-underline transition-all duration-150 ease-[ease]"
            >
              View Shopping Bag
            </Link>
            <Link
              href="/shop"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-ink bg-ink px-6 py-3 font-brand text-[13.5px] font-semibold tracking-[-0.01em] text-white no-underline transition-all duration-150 ease-[ease] hover:-translate-y-px hover:bg-[#1c2330] hover:shadow-[0_4px_14px_rgba(12,14,18,0.18)]"
            >
              Explore products <i>↗</i>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // 3. Unauthenticated Gate View - Restrict ordering without signing in
  if (!isAuthenticated || !user) {
    return (
      <main className="checkout-page min-h-[calc(100dvh-120px)] bg-[#f8f7f3] px-[clamp(18px,4vw,56px)] pt-[clamp(28px,5vw,64px)] pb-20 font-ui text-[#172126] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pt-6 [@media(max-width:639px)]:pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-9">
            <nav
              className="mb-6 flex items-center gap-2 font-ui text-[11px] font-medium uppercase tracking-[0.025em] text-[#747d80]"
              aria-label="Breadcrumb"
            >
              <Link href="/">Home</Link>
              <span className="text-[#a1a1aa] opacity-40">/</span>
              {isProductMode && product ? (
                <>
                  <Link href={getProductUrl(product)}>{product.name}</Link>
                  <span className="text-[#a1a1aa] opacity-40">/</span>
                  <span className="max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#172126]">
                    Checkout
                  </span>
                </>
              ) : (
                <>
                  <Link href="/bag">Shopping Bag</Link>
                  <span className="text-[#a1a1aa] opacity-40">/</span>
                  <span className="max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#172126]">
                    Checkout
                  </span>
                </>
              )}
            </nav>
            <h1 className="my-2 font-brand text-[clamp(28px,3.5vw,36px)] font-semibold leading-[normal] tracking-[-0.05em] text-[#172126]">
              {isProductMode && product
                ? `Sign in to order ${product.name}`
                : 'Sign in to complete your order'}
            </h1>
            <p className="max-w-[620px] text-[14px] leading-[21px] text-[#3f4753]">
              {isProductMode && product
                ? `An account is required to place your direct order for ${product.name}, calculate live courier delivery, and protect your purchase.`
                : 'An account is required to place an order, view live delivery tracking, and protect your purchase.'}
            </p>
          </div>

          <div className="grid grid-cols-[1.5fr_1fr] items-start gap-6 [@media(min-width:640px)]:gap-8 [@media(min-width:901px)]:gap-12 [@media(max-width:900px)]:grid-cols-1">
            <div className="flex flex-col gap-6 rounded-[6px] border border-line bg-white p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-line bg-bone">
                  <Lock className="w-5 h-5 text-ink" />
                </div>
                <div>
                  <h2 className="m-0 mb-1.5 font-brand text-[18px] font-semibold leading-[normal] tracking-[-0.01em] text-ink">
                    Authentication Required
                  </h2>
                  <p className="m-0 text-[13.5px] leading-[1.5] text-ink-secondary">
                    Sign in with your email or Google account to access your saved delivery address,
                    or create a new account in under a minute.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(targetRedirect)}`}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[3px] border border-ink bg-ink px-[22px] py-[13px] font-brand text-[13px] font-semibold leading-[1.5] tracking-[-0.01em] text-white no-underline transition-all duration-150 ease-[ease]"
                >
                  <span>Sign in to your account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(targetRedirect)}`}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[3px] border-0 bg-transparent px-[22px] py-[13px] font-brand text-[13px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#172126] no-underline transition-all duration-150 ease-[ease]"
                >
                  <span>Create new account</span>
                </Link>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-line pt-5">
                <div className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Saved addresses auto-fill instantly</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live expected delivery calculation based on your PIN code</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-ink">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure online payment via Razorpay (UPI, Cards &amp; NetBanking)</span>
                </div>
              </div>
            </div>

            {/* Bag Summary Sidebar for unauthenticated users */}
            <aside className="sticky top-[90px] [@media(max-width:900px)]:static [@media(max-width:900px)]:-order-1">
              <div className="rounded-[2px] border border-[#dfded8] bg-white p-6 [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:py-[18px]">
                <div className="mb-5 border-b border-line pb-3">
                  <span className="font-ui text-[10px] font-semibold leading-[normal] tracking-[0.08em] text-[#6b7280]">
                    {isProductMode
                      ? `DIRECT // 1 ITEM (${productQty} QTY)`
                      : `MANIFEST // ${count} ITEMS`}
                  </span>
                  <h2 className="m-0 mt-1 font-brand text-[18px] font-semibold leading-[normal] tracking-[-0.05em] text-[#172126]">
                    {isProductMode ? 'Product Summary' : 'Order Summary'}
                  </h2>
                </div>

                <div className="mb-5 flex max-h-80 flex-col gap-3.5 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.variantId ?? item.size}`}
                      className="flex items-center gap-3"
                    >
                      <Image
                        src={item.img}
                        alt={item.name}
                        width={56}
                        height={70}
                        className="h-[70px] w-14 rounded-[3px] bg-white object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="m-0 mb-0.5 font-brand text-[13px] font-medium leading-[normal] tracking-[-0.025em] text-ink">
                          {item.name}
                        </h3>
                        <p className="m-0 mb-1 font-ui text-[11px] leading-[normal] text-ink-secondary">
                          {[
                            item.color,
                            item.fit ? `${item.fit} Fit` : null,
                            `Size ${item.size}`,
                            `Qty ${item.qty}`
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <span className="font-ui text-[13px] font-semibold leading-[normal] text-ink [font-feature-settings:'tnum']">
                          {formatPrice(item.priceNum * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 border-y border-line py-3.5">
                  <div className="flex justify-between font-ui text-[13px] font-medium text-ink-secondary [font-feature-settings:'tnum'] leading-[normal]">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-ui text-[13px] font-medium text-ink-secondary [font-feature-settings:'tnum'] leading-[normal]">
                    <span>Delivery charge</span>
                    <span>Calculated after sign-in</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-line pt-1.5 font-ui text-[15px] font-semibold leading-[normal] text-ink [font-feature-settings:'tnum']">
                    <span>Subtotal before delivery</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <div className="mt-[18px] flex flex-col gap-[5px] rounded-[3px] border border-[#bbf7d0] bg-[#f4fbf7] px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#166534]">
                      Expected delivery
                    </span>
                  </div>
                  <div className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                    {deliveryEstimationInfo.formattedRange}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    )
  }

  // 4. Authenticated Checkout Flow
  const activeAddrObj =
    addresses?.find((a) => a.id === selectedAddressId) ||
    addresses?.find((a) => a.isDefault) ||
    addresses?.[0]

  const renderFormFields = () => (
    <>
      {/* Row 1: Name and Mobile */}
      <div className="mb-4 flex gap-4 last:mb-0 [@media(max-width:639px)]:flex-col [@media(max-width:639px)]:gap-3.5 [@media(max-width:900px)]:flex-col">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="name"
          >
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Full Name"
            className={
              errors.name
                ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
            }
            autoComplete="name"
          />
          {errors.name && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.name}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="phone"
          >
            Mobile *
          </label>
          <input
            id="phone"
            type="tel"
            maxLength={10}
            value={form.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, ''))}
            placeholder="10-digit mobile number"
            className={
              errors.phone
                ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
            }
            autoComplete="tel"
          />
          {errors.phone && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.phone}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Address */}
      <div className="mb-4 flex gap-4 last:mb-0 [@media(max-width:639px)]:flex-col [@media(max-width:639px)]:gap-3.5">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="address"
          >
            Address *
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="House / Flat / Building / Street address"
            className={
              errors.address
                ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
            }
            autoComplete="street-address"
          />
          {errors.address && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.address}
            </span>
          )}
        </div>
      </div>

      {/* Row 3: Place and Pincode */}
      <div className="mb-4 flex gap-4 last:mb-0 [@media(max-width:639px)]:flex-col [@media(max-width:639px)]:gap-3.5 [@media(max-width:900px)]:flex-col">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="place"
          >
            Place *
          </label>
          <input
            id="place"
            type="text"
            value={form.place}
            onChange={(e) => handleFieldChange('place', e.target.value)}
            placeholder="Town / Locality / Landmark"
            className={
              errors.place
                ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
            }
          />
          {errors.place && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.place}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="pincode"
          >
            Pincode *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="pincode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => handlePincodeLookup(e.target.value)}
              placeholder="6-digit PIN code"
              className={
                errors.pincode
                  ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                  : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
              }
              autoComplete="postal-code"
            />
            {pincodeLoading && (
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  color: 'var(--ink-secondary, #71717a)'
                }}
              >
                Locating…
              </span>
            )}
          </div>
          {errors.pincode && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.pincode}
            </span>
          )}
        </div>
      </div>

      {/* Row 4: District and State - Balanced & Aligned */}
      <div className="mb-4 flex gap-4 last:mb-0 [@media(max-width:639px)]:flex-col [@media(max-width:639px)]:gap-3.5 [@media(max-width:900px)]:flex-col">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="district"
          >
            District *
          </label>
          <input
            id="district"
            type="text"
            value={form.district}
            onChange={(e) => handleFieldChange('district', e.target.value)}
            placeholder="District"
            className={
              errors.district
                ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
            }
          />
          {errors.district && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.district}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="font-ui text-[11px] font-medium uppercase leading-[normal] tracking-[0.04em] text-ink-secondary"
            htmlFor="state"
          >
            State *
          </label>
          <input
            id="state"
            type="text"
            value={form.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            placeholder="State (e.g. Kerala, Tamil Nadu, Karnataka)"
            className={
              errors.state
                ? 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#dc2626]'
                : 'min-h-[46px] rounded-[2px] border bg-white px-3.5 py-2.5 font-ui text-[16px] leading-[normal] text-[#172126] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#294455] focus:shadow-[0_0_0_2px_rgba(41,68,85,0.12)] border-[#d6d7d3]'
            }
          />
          {errors.state && (
            <span className="font-ui text-[11px] font-medium leading-[normal] text-[#dc2626]">
              {errors.state}
            </span>
          )}
        </div>
      </div>

      {pincodeDetected && (
        <div
          style={{
            margin: '-4px 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#047857'
          }}
        >
          <span>✓</span>
          <span>
            Location detected: <strong>{pincodeDetected}</strong>
          </span>
        </div>
      )}

      {/* Option to Save Address to Profile */}
      <label
        className="mt-4 flex cursor-pointer items-center gap-2 text-[12.5px] text-ink"
        style={{ marginTop: '16px' }}
      >
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer accent-ink"
          checked={saveToProfile}
          onChange={(e) => setSaveToProfile(e.target.checked)}
        />
        <span>Save this address to my profile for future orders</span>
      </label>
    </>
  )

  return (
    <main className="checkout-page min-h-[calc(100dvh-120px)] bg-[#f8f7f3] px-[clamp(18px,4vw,56px)] pt-[clamp(28px,5vw,64px)] pb-20 font-ui text-[#172126] [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:pt-6 [@media(max-width:639px)]:pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-9">
          <nav
            className="mb-6 flex items-center gap-2 font-ui text-[11px] font-medium uppercase tracking-[0.025em] text-[#747d80]"
            aria-label="Breadcrumb"
          >
            <Link href="/">Home</Link>
            <span className="text-[#a1a1aa] opacity-40">/</span>
            {isProductMode && product ? (
              <>
                <Link href={getProductUrl(product)}>{product.name}</Link>
                <span className="text-[#a1a1aa] opacity-40">/</span>
                <span className="max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#172126]">
                  Checkout
                </span>
              </>
            ) : (
              <>
                <Link href="/bag">Shopping Bag</Link>
                <span className="text-[#a1a1aa] opacity-40">/</span>
                <span className="max-w-[320px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#172126]">
                  Checkout
                </span>
              </>
            )}
          </nav>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px'
            }}
          >
            <span>
              {isProductMode
                ? 'DIRECT PRODUCT ORDER // INSTANT CHECKOUT'
                : 'BAG CHECKOUT // MULTI-ITEM ORDER'}
            </span>
            {isProductMode && product ? (
              <Link
                href={getProductUrl(product)}
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-secondary)',
                  textDecoration: 'underline'
                }}
              >
                ← Back to {product.name}
              </Link>
            ) : (
              <Link
                href="/bag"
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-secondary)',
                  textDecoration: 'underline'
                }}
              >
                ← Return to Shopping Bag
              </Link>
            )}
          </div>
          <h1 className="my-2 font-brand text-[clamp(28px,3.5vw,36px)] font-semibold leading-[normal] tracking-[-0.05em] text-[#172126]">
            {isProductMode && product ? `Direct Checkout: ${product.name}` : 'Order Checkout'}
          </h1>
          <p className="max-w-[620px] text-[14px] leading-[21px] text-[#3f4753]">
            {isProductMode
              ? 'Complete your single-product order with verified delivery and payment.'
              : 'Provide your delivery details. We will prepare your pieces for delivery and dispatch through verified courier partners.'}
          </p>
        </div>

        <div className="grid grid-cols-[1.5fr_1fr] items-start gap-6 [@media(min-width:640px)]:gap-8 [@media(min-width:901px)]:gap-12 [@media(max-width:900px)]:grid-cols-1">
          {/* Order Form */}
          <form className="flex flex-col gap-8 ph-no-capture" onSubmit={handleSubmit} noValidate>
            {/* If user has saved info in profile: render the 2 radio options with animated expansion */}
            {hasSavedInfo ? (
              <div className="flex flex-col">
                <div
                  className="flex flex-col gap-3"
                  role="radiogroup"
                  aria-label="Delivery destination options"
                >
                  {/* Option 1: Saved Address */}
                  <div
                    className={`flex cursor-pointer select-none items-start gap-3.5 rounded-[6px] border-[1.5px] border-line bg-white px-[18px] py-4 transition-[border-color,background-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#a1a1aa] ${deliveryMode === 'saved' ? '!border-ink bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]' : ''}`}
                    onClick={() => handleSelectDeliveryMode('saved')}
                    role="radio"
                    aria-checked={deliveryMode === 'saved'}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        handleSelectDeliveryMode('saved')
                      }
                    }}
                  >
                    <input
                      type="radio"
                      id="delivery-mode-saved"
                      name="deliveryMode"
                      value="saved"
                      checked={deliveryMode === 'saved'}
                      onChange={() => handleSelectDeliveryMode('saved')}
                      className="mt-[3px] h-[17px] w-[17px] cursor-pointer accent-ink"
                      tabIndex={-1}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="font-brand text-[13px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink">
                          Use saved information
                        </span>
                        {activeAddrObj?.isDefault && (
                          <span className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-[7px] py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#047857]">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="mb-0 mt-[3px] font-ui text-[12.5px] leading-[1.45] text-ink-secondary">
                        Use your saved address, recipient name, and phone number.
                      </p>

                      {/* Saved Address Preview Card */}
                      {activeAddrObj && (
                        <div className="mt-3 flex flex-col gap-1.5 rounded-[3px] border border-line bg-bone px-3.5 py-3">
                          <div className="flex items-center gap-2 font-brand text-[13px] font-semibold leading-[normal] text-ink">
                            <span>{activeAddrObj.fullName || user?.name}</span>
                            <span
                              style={{
                                fontWeight: 400,
                                color: 'var(--ink-secondary)',
                                fontSize: '12px'
                              }}
                            >
                              · {activeAddrObj.phone || user?.phone}
                            </span>
                          </div>
                          <p className="m-0 font-ui text-[12.5px] leading-[1.5] text-ink-secondary">
                            {activeAddrObj.addressLine},{' '}
                            {activeAddrObj.place ? `${activeAddrObj.place}, ` : ''}
                            {activeAddrObj.district || activeAddrObj.city}, {activeAddrObj.state} –{' '}
                            <strong>{activeAddrObj.pincode}</strong>
                          </p>

                          {addresses && addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowAddressPicker(!showAddressPicker)
                              }}
                              className="mt-1.5 cursor-pointer self-start border-0 bg-transparent p-0 font-brand text-[11px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink underline transition-colors duration-150 ease-[ease] hover:text-ink-secondary"
                            >
                              {showAddressPicker ? 'Hide Address List' : 'Switch Saved Address ▾'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Multiple Saved Addresses Picker */}
                      {showAddressPicker && addresses && addresses.length > 1 && (
                        <div
                          className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 border-t border-dashed border-[#e4e4e7] pt-2.5 [animation:fadeIn_0.2s_ease-out]"
                          style={{ marginTop: '12px' }}
                        >
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                applySavedAddress(addr)
                                setShowAddressPicker(false)
                              }}
                              className={`relative cursor-pointer rounded-[6px] border border-[#e4e4e7] bg-white px-3.5 py-3 text-left transition-all duration-[180ms] ease-[ease] hover:-translate-y-px hover:border-ink hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${selectedAddressId === addr.id ? '!border-ink bg-[#fdfdfd] shadow-[0_0_0_1.5px_#0c0e12]' : ''}`}
                            >
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="m-0 text-[13px] font-bold leading-[1.5] text-ink">
                                  {addr.fullName || user?.name}
                                </span>
                                {addr.isDefault && (
                                  <span className="rounded-full bg-[#090a0c] px-1.5 py-px text-[10px] font-bold uppercase text-white">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="m-0 mb-1 text-[11px] text-ink-secondary">
                                {addr.phone || user?.phone}
                              </p>
                              <p className="m-0 text-[12px] leading-[1.4] text-[#6b7280]">
                                {addr.addressLine}, {addr.place ? `${addr.place}, ` : ''}
                                {addr.district || addr.city} · {addr.pincode}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Option 2: Enter New Details */}
                  <div
                    className={`flex cursor-pointer select-none items-start gap-3.5 rounded-[6px] border-[1.5px] border-line bg-white px-[18px] py-4 transition-[border-color,background-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#a1a1aa] ${deliveryMode === 'new' ? '!border-ink bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]' : ''}`}
                    onClick={() => handleSelectDeliveryMode('new')}
                    role="radio"
                    aria-checked={deliveryMode === 'new'}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        handleSelectDeliveryMode('new')
                      }
                    }}
                  >
                    <input
                      type="radio"
                      id="delivery-mode-new"
                      name="deliveryMode"
                      value="new"
                      checked={deliveryMode === 'new'}
                      onChange={() => handleSelectDeliveryMode('new')}
                      className="mt-[3px] h-[17px] w-[17px] cursor-pointer accent-ink"
                      tabIndex={-1}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="font-brand text-[13px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-ink">
                          Enter new name, phone and address
                        </span>
                      </div>
                      <p className="mb-0 mt-[3px] font-ui text-[12.5px] leading-[1.45] text-ink-secondary">
                        Enter a different recipient name, phone number, and delivery address.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated expansion for Option 2 */}
                <div
                  className={`grid overflow-hidden opacity-0 [grid-template-rows:0fr] [transition:grid-template-rows_260ms_cubic-bezier(0.23,1,0.32,1),opacity_200ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${deliveryMode === 'new' ? '[grid-template-rows:1fr] opacity-100' : ''}`}
                >
                  <div className="min-h-0 overflow-hidden [&>div]:mt-4">
                    <div className="rounded-[2px] border border-[#dfded8] bg-white p-6 [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:py-[18px]">
                      <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-2.5">
                        <h2 className="mb-0 border-b-0 pb-0 font-brand text-[13px] font-semibold uppercase leading-[normal] tracking-[0.045em] text-[#172126]">
                          Delivery Information
                        </h2>
                        <button
                          type="button"
                          onClick={handleClearForm}
                          className="inline-flex cursor-pointer items-center gap-[5px] rounded-[3px] border border-[#fecaca] bg-[#fef2f2] px-3 py-[5px] font-brand text-[11px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-[#b91c1c] transition-all duration-150 ease-[ease] hover:border-[#f87171] hover:bg-[#fee2e2] hover:text-[#991b1b]"
                          title="Clear all fields"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      </div>

                      {renderFormFields()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* If no saved information exists: directly render the Delivery Information form */
              <div className="rounded-[2px] border border-[#dfded8] bg-white p-6 [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:py-[18px]">
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-2.5">
                  <h2 className="mb-0 border-b-0 pb-0 font-brand text-[13px] font-semibold uppercase leading-[normal] tracking-[0.045em] text-[#172126]">
                    Delivery Information
                  </h2>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="inline-flex cursor-pointer items-center gap-[5px] rounded-[3px] border border-[#fecaca] bg-[#fef2f2] px-3 py-[5px] font-brand text-[11px] font-semibold uppercase leading-[normal] tracking-[0.05em] text-[#b91c1c] transition-all duration-150 ease-[ease] hover:border-[#f87171] hover:bg-[#fee2e2] hover:text-[#991b1b]"
                    title="Clear all fields"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                {renderFormFields()}
              </div>
            )}

            {/* Error alerts */}
            {paymentError && (
              <div
                className="mt-3.5 flex items-start gap-2.5 rounded-[3px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-[12.5px] leading-[1.4] text-[#991b1b] [&>svg]:mt-px [&>svg]:shrink-0"
                role="alert"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{paymentError}</span>
              </div>
            )}
            {quoteError && !paymentError && (
              <div
                className="mt-3.5 flex items-start gap-2.5 rounded-[3px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-[12.5px] leading-[1.4] text-[#991b1b] [&>svg]:mt-px [&>svg]:shrink-0"
                role="alert"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{quoteError}</span>
              </div>
            )}

            {/* Submit section: Razorpay Only */}
            <div className="rounded-[2px] border border-[#dfded8] bg-white p-6 [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:py-[18px] flex flex-col gap-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-[2px] border border-[#172126] bg-[#172126] px-6 py-4 font-brand text-[13px] font-bold uppercase leading-[normal] tracking-[0.06em] text-white shadow-none transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px hover:border-[#181c24] hover:bg-[#181c24] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:transform-none disabled:border-[#475569] disabled:bg-[#475569] disabled:text-[#cbd5e1] disabled:opacity-45 disabled:shadow-none disabled:blur-[0.4px] disabled:grayscale-[0.5]"
                aria-label="Place your order"
              >
                <span>{isProcessing ? 'Connecting to Razorpay...' : 'Place your order'}</span>
                {canSubmit && (
                  <span className="font-bold tracking-[0.02em]">{formatPrice(total)} ↗</span>
                )}
              </button>

              {/* Supported Payment Methods Badges */}
              <div
                className="flex flex-col gap-2.5 border-t border-dashed border-line pt-3.5"
                aria-label="Accepted payment methods"
              >
                <span className="font-brand text-[10.5px] font-semibold uppercase leading-[normal] tracking-[0.06em] text-ink-secondary">
                  Accepted Payment Options
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-[11px] py-1.5 font-ui text-[11.5px] font-medium leading-[normal] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,background-color] duration-150 ease-[ease] hover:border-ink"
                    title="Google Pay (UPI)"
                  >
                    <GooglePayIcon />
                    <span>Google Pay</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-[11px] py-1.5 font-ui text-[11.5px] font-medium leading-[normal] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,background-color] duration-150 ease-[ease] hover:border-ink"
                    title="PhonePe (UPI)"
                  >
                    <PhonePeIcon />
                    <span>PhonePe</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-[11px] py-1.5 font-ui text-[11.5px] font-medium leading-[normal] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,background-color] duration-150 ease-[ease] hover:border-ink"
                    title="Paytm (UPI / Wallet)"
                  >
                    <PaytmIcon />
                    <span>Paytm</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-[11px] py-1.5 font-ui text-[11.5px] font-medium leading-[normal] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,background-color] duration-150 ease-[ease] hover:border-ink"
                    title="Credit / Debit Card (Visa, Mastercard, RuPay)"
                  >
                    <CardsIcon />
                    <span>Credit / Debit Card</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-white px-[11px] py-1.5 font-ui text-[11.5px] font-medium leading-[normal] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[border-color,background-color] duration-150 ease-[ease] hover:border-ink"
                    title="NetBanking (All major Indian banks)"
                  >
                    <NetBankingIcon />
                    <span>NetBanking</span>
                  </div>
                </div>
              </div>

              <p className="m-0 text-[12px] leading-[1.5] text-ink-secondary">
                Secure 256-bit encrypted checkout via Razorpay. Supports UPI, Cards, and NetBanking.
              </p>
            </div>
          </form>

          {/* Order Summary Sidebar */}
          <aside className="sticky top-[90px] [@media(max-width:900px)]:static [@media(max-width:900px)]:-order-1">
            <div className="rounded-[2px] border border-[#dfded8] bg-white p-6 [@media(max-width:639px)]:px-4 [@media(max-width:639px)]:py-[18px]">
              <div className="mb-5 border-b border-line pb-3">
                <span className="font-ui text-[10px] font-semibold leading-[normal] tracking-[0.08em] text-[#6b7280]">
                  {isProductMode
                    ? `DIRECT // 1 PRODUCT (${productQty} QTY)`
                    : `MANIFEST // ${count} ITEMS`}
                </span>
                <h2 className="m-0 mt-1 font-brand text-[18px] font-semibold leading-[normal] tracking-[-0.05em] text-[#172126]">
                  {isProductMode ? 'Product Summary' : 'Bag Summary'}
                </h2>
              </div>

              <div className="mb-5 flex max-h-80 flex-col gap-3.5 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.variantId ?? item.size}`}
                    className="flex items-center gap-3"
                  >
                    <Image
                      src={item.img}
                      alt={item.name}
                      width={56}
                      height={70}
                      className="h-[70px] w-14 rounded-[3px] bg-white object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="m-0 mb-0.5 font-brand text-[13px] font-medium leading-[normal] tracking-[-0.025em] text-ink">
                        {item.name}
                      </h3>
                      <p className="m-0 mb-1 font-ui text-[11px] leading-[normal] text-ink-secondary">
                        {[
                          item.color,
                          item.fit ? `${item.fit} Fit` : null,
                          `Size ${item.size}`,
                          `Qty ${item.qty}`
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <span className="font-ui text-[13px] font-semibold leading-[normal] text-ink [font-feature-settings:'tnum']">
                        {formatPrice(item.priceNum * item.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-y border-line py-3.5">
                <div className="flex justify-between font-ui text-[13px] font-medium text-ink-secondary [font-feature-settings:'tnum'] leading-[normal]">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between font-ui text-[13px] font-medium text-ink-secondary [font-feature-settings:'tnum'] leading-[normal]">
                  <span>Delivery charge</span>
                  <span>
                    {deliveryQuote
                      ? formatPrice(shipping)
                      : quoteLoading
                        ? 'Calculating…'
                        : 'Enter Pincode'}
                  </span>
                </div>
                <div
                  className="flex justify-between font-ui text-[13px] font-medium text-ink-secondary [font-feature-settings:'tnum'] leading-[normal]"
                  style={{ borderTop: '1px dashed var(--line)', paddingTop: '8px' }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: 'var(--ink-secondary)'
                    }}
                  >
                    <Truck className="w-3.5 h-3.5" /> Expected delivery
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>
                    {deliveryEstimationInfo.formattedRange}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-line pt-1.5 font-ui text-[15px] font-semibold leading-[normal] text-ink [font-feature-settings:'tnum']">
                  <span>{deliveryQuote ? 'Order total' : 'Estimated subtotal'}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-[18px] flex flex-col gap-[5px] rounded-[3px] border border-[#bbf7d0] bg-[#f4fbf7] px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#166534]">
                    Expected delivery
                  </span>
                </div>
                <div className="text-[14px] font-bold tracking-[-0.01em] text-ink">
                  {deliveryEstimationInfo.formattedRange}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
