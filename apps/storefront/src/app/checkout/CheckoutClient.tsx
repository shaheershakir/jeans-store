'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Lock,
  ArrowRight,
  Check
} from 'lucide-react'
import { cartCount, cartSubtotal, useCartStore, useAuthStore, type UserAddress } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

declare global {
  interface Window {
    Razorpay?: any
  }
}

interface CheckoutForm {
  name: string
  phone: string
  email: string
  address: string
  apartment: string
  city: string
  state: string
  pincode: string
  notes: string
}

interface SubmittedOrder {
  orderId: string
  summary: string
  paymentMethod: 'razorpay' | 'cod'
  paymentId?: string
  total: number
}

interface DeliveryQuote {
  subtotal: number
  shipping: number
  total: number
  weightGrams: number
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:4000'

const INITIAL_FORM: CheckoutForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  pincode: '',
  notes: ''
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

export default function CheckoutClient() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)

  const user = useAuthStore((state) => state.user)
  const authToken = useAuthStore((state) => state.token)
  const addresses = useAuthStore((state) => state.addresses)
  const addAddress = useAuthStore((state) => state.addAddress)

  const [form, setForm] = useState<CheckoutForm>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(null)
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // Profile Autofill State
  const [isAutofilled, setIsAutofilled] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [saveToProfile, setSaveToProfile] = useState(false)
  const [isManuallyEdited, setIsManuallyEdited] = useState(false)

  const count = cartCount(items)
  const subtotal = deliveryQuote?.subtotal ?? cartSubtotal(items)
  const shipping = deliveryQuote?.shipping ?? 0
  const total = deliveryQuote?.total ?? subtotal

  const applySavedAddress = useCallback((addr: UserAddress) => {
    setForm((prev) => ({
      ...prev,
      name: addr.fullName || prev.name,
      phone: (addr.phone || prev.phone).replace(/\D/g, '').slice(-10),
      address: addr.addressLine || prev.address,
      city: addr.city || prev.city,
      state: addr.state || prev.state,
      pincode: (addr.pincode || prev.pincode).replace(/\D/g, '').slice(0, 6)
    }))
    setSelectedAddressId(addr.id)
    setIsAutofilled(true)
    setIsManuallyEdited(false)
  }, [])

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void loadRazorpayScript()
  }, [])

  useEffect(() => {
    if (!form.state.trim() || items.length === 0) {
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
          items: items.map((item) => ({ id: item.id, variantId: item.variantId, size: String(item.size), quantity: item.qty }))
        }),
        signal: controller.signal
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(payload.error || 'Could not calculate delivery for this cart.')
          setDeliveryQuote(payload as DeliveryQuote)
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setQuoteError(error instanceof Error ? error.message : 'Could not calculate delivery for this cart.')
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false)
        })
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [form.state, items])

  // Auto-populate from profile if available
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      applySavedAddress(defaultAddr)
      if (user?.email) {
        setForm((prev) => ({ ...prev, email: user.email }))
      }
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: (user.phone || prev.phone).replace(/\D/g, '').slice(-10)
      }))
      setIsAutofilled(true)
    }
  }, [user, addresses, applySavedAddress])

  function handleFieldChange(field: keyof CheckoutForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setIsManuallyEdited(true)
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleClearAutofill() {
    setForm(INITIAL_FORM)
    setIsAutofilled(false)
    setSelectedAddressId(null)
    setShowAddressPicker(false)
    setIsManuallyEdited(true)
  }

  function handleRestoreProfile() {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
      applySavedAddress(defaultAddr)
      if (user?.email) {
        setForm((prev) => ({ ...prev, email: user.email }))
      }
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: (user.phone || prev.phone).replace(/\D/g, '').slice(-10)
      }))
      setIsAutofilled(true)
      setIsManuallyEdited(false)
    }
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CheckoutForm, string>> = {}

    if (!form.name.trim()) nextErrors.name = 'Full name is required'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Valid 10-digit phone number is required'
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      nextErrors.email = 'Valid email address is required'
    }
    if (!form.address.trim()) nextErrors.address = 'Street address is required'
    if (!form.city.trim()) nextErrors.city = 'City is required'
    if (!form.state.trim()) nextErrors.state = 'State is required'
    if (!form.pincode.trim() || form.pincode.replace(/\D/g, '').length !== 6) {
      nextErrors.pincode = 'Valid 6-digit PIN code is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function buildSummaryText(orderId: string, methodTitle: string, paymentId?: string) {
    const itemLines = items
      .map((item, index) => {
        const spec = [item.fit ? `${item.fit} Fit` : null, `Size ${item.size}`, item.wash]
          .filter(Boolean)
          .join(', ')
        return `${index + 1}. ${item.name} (${spec})\n   Qty: ${item.qty} | ${formatPrice(item.priceNum * item.qty)}`
      })
      .join('\n')

    return [
      `*TEESGARAGE ORDER CONFIRMATION [${orderId}]*`,
      '--------------------------------',
      `Payment Method: ${methodTitle}`,
      paymentId ? `Razorpay Payment ID: ${paymentId}` : null,
      '',
      '*Customer Information:*',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      `Email: ${form.email.trim()}`,
      '',
      '*Delivery Address:*',
      form.address.trim(),
      form.apartment.trim() ? form.apartment.trim() : null,
      `${form.city.trim()}, ${form.state.trim()} - ${form.pincode.trim()}`,
      form.notes.trim() ? `Delivery Notes: ${form.notes.trim()}` : null,
      '',
      '*Ordered Items:*',
      itemLines,
      '',
      '*Bill Summary:*',
      `Subtotal: ${formatPrice(subtotal)}`,
      `Delivery charge: ${formatPrice(shipping)}`,
      `Total: ${formatPrice(total)}`,
      '--------------------------------',
      'Confirmed and queued for TEESGARAGE dispatch.'
    ]
      .filter(Boolean)
      .join('\n')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!deliveryQuote) {
      setPaymentError(quoteError || 'Enter a delivery state and wait for the delivery charge to calculate.')
      return
    }

    const orderId = `TGE-${Date.now().toString().slice(-6)}`

    const orderPayload = {
      orderNumber: orderId,
      store: 'teesgarage',
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      customerEmail: form.email.trim(),
      address: form.address.trim(),
      apartment: form.apartment.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      notes: form.notes.trim() || undefined,
      items: items.map((item) => ({ id: item.id, variantId: item.variantId, size: String(item.size), quantity: item.qty }))
    }

    if (paymentMethod === 'razorpay') {
      setIsProcessing(true)
      setPaymentError(null)

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
        setPaymentError('Unable to load Razorpay payment SDK. Please select Cash on Delivery or reload the page.')
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
            items: orderPayload.items,
            customerName: form.name.trim(),
            customerEmail: form.email.trim(),
            customerPhone: form.phone.trim()
          })
        })

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to create payment order')
        }

        const rzpData = await createRes.json()
        const activeKey = rzpData.keyId
        if (!activeKey) throw new Error('Online payment is not configured. Select Cash on Delivery or contact support.')

        const options = {
          key: activeKey,
          amount: rzpData.amount,
          currency: rzpData.currency || 'INR',
          name: 'TEESGARAGE',
          description: `Order ${orderId}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: form.name.trim(),
            email: form.email.trim(),
            contact: form.phone.trim()
          },
          notes: {
            orderNumber: orderId,
            address: `${form.address.trim()}, ${form.city.trim()} - ${form.pincode.trim()}`
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
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
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
                  city: form.city.trim(),
                  state: form.state.trim(),
                  pincode: form.pincode.trim(),
                  isDefault: false
                })
              }

              setSubmittedOrder({
                orderId,
                paymentMethod: 'razorpay',
                paymentId: response.razorpay_payment_id,
                total: Number(verifyData.order?.total ?? rzpData.total ?? total),
                summary: buildSummaryText(orderId, 'Razorpay (Paid Online)', response.razorpay_payment_id)
              })

              clearCart()
            } catch (err: any) {
              setPaymentError(err.message || 'Payment verification encountered an issue. Please contact support.')
            } finally {
              setIsProcessing(false)
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false)
              setPaymentError('Payment window was closed. You can retry payment or select Cash on Delivery.')
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessing(false)
          setPaymentError(resp.error?.description || 'Payment was declined. Please try another card or UPI account.')
        })
        rzp.open()
      } catch (err: any) {
        setIsProcessing(false)
        setPaymentError(err.message || 'Failed to initialize payment gateway')
      }
    } else {
      // Cash on Delivery
      setIsProcessing(true)
      setPaymentError(null)

      try {
        const orderResponse = await fetch(`${backendUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({
            ...orderPayload,
            handoffType: 'cod',
            status: 'pending'
          })
        })
        const orderResult = await orderResponse.json().catch(() => ({}))
        if (!orderResponse.ok) throw new Error(orderResult.error || 'Could not place this order. Please try again.')

        if (saveToProfile) {
          addAddress({
            fullName: form.name.trim(),
            phone: form.phone.trim(),
            addressLine: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
            isDefault: false
          })
        }

        setSubmittedOrder({
          orderId,
          paymentMethod: 'cod',
          total: Number(orderResult.order?.total ?? total),
          summary: buildSummaryText(orderId, 'Cash on Delivery')
        })

        clearCart()
      } catch (err: any) {
        setPaymentError(err.message || 'Failed to place Cash on Delivery order')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  if (submittedOrder) {
    return (
      <main className="checkout-page">
        <div className="checkout-container confirmation-card">
          <div className="confirmation-header">
            <span
              className={`confirmation-status-pill ${
                submittedOrder.paymentMethod === 'razorpay' ? 'success' : 'pending'
              }`}
            >
              {submittedOrder.paymentMethod === 'razorpay'
                ? '✓ Paid via Razorpay'
                : 'Cash on Delivery'}
            </span>
            <h1 className="confirmation-title">Thank you, {form.name.split(' ')[0]}.</h1>
            <p className="confirmation-lead">
              Reference code: <strong>{submittedOrder.orderId}</strong>
            </p>
          </div>

          <div className="confirmation-body">
            {submittedOrder.paymentMethod === 'razorpay' ? (
              <p>
                Your payment of <strong>{formatPrice(submittedOrder.total)}</strong> has been verified
                through Razorpay. Our studio is preparing your pieces for dispatch from Kerala.
              </p>
            ) : (
              <p>
                Your order is confirmed for Cash on Delivery. You can pay{' '}
                <strong>{formatPrice(submittedOrder.total)}</strong> in cash or UPI upon delivery.
              </p>
            )}

            {submittedOrder.paymentId && (
              <div className="confirmation-payment-meta">
                <div className="confirmation-payment-meta-row">
                  <span>Razorpay Payment ID:</span>
                  <strong>{submittedOrder.paymentId}</strong>
                </div>
                <div className="confirmation-payment-meta-row">
                  <span>Payment Status:</span>
                  <strong className="text-emerald-700">Verified &amp; Captured</strong>
                </div>
                <div className="confirmation-payment-meta-row">
                  <span>Shipping Address:</span>
                  <span>{form.address}, {form.city}</span>
                </div>
              </div>
            )}

            <details className="confirmation-details">
              <summary>View order transmission copy</summary>
              <pre className="order-summary-raw">{submittedOrder.summary}</pre>
            </details>
          </div>

          <div className="confirmation-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/orders" className="button secondary">
              View My Orders
            </Link>
            <Link href="/" className="button primary">
              Return to Catalog
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (count === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-container empty-checkout-card">
          <span className="cart-empty-badge">BAG EMPTY</span>
          <h1 className="empty-title">Your shopping bag is empty</h1>
          <p className="empty-desc">
            Find a tee, Henley, or bottomwear style to start your order.
          </p>
          <Link href="/" className="button primary">
            Explore products <i>↗</i>
          </Link>
        </div>
      </main>
    )
  }

  const activeAddrObj = addresses.find((a) => a.id === selectedAddressId)

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Storefront</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Checkout</span>
          </nav>
          <h1 className="checkout-title">Order Checkout</h1>
          <p className="checkout-subtitle">
            Provide your delivery details. We will prepare your dispatch manifest and hand off the order
            to our studio team.
          </p>
        </div>

        <div className="checkout-grid">
          {/* Order Form */}
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            {/* Autofill Notification & Address Switcher */}
            {isAutofilled && (
              <div className="checkout-autofill-banner">
                <div className="checkout-autofill-header">
                  <div className="checkout-autofill-info">
                    <span className="autofill-badge">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Profile Connected</span>
                    </span>
                    <p className="autofill-desc">
                      {activeAddrObj ? (
                        <>
                          Autofilled with saved address for <strong>{activeAddrObj.fullName}</strong>.
                        </>
                      ) : (
                        <>Autofilled with account credentials.</>
                      )}
                      {isManuallyEdited && ' (Modified)'}
                    </p>
                  </div>

                  <div className="checkout-autofill-actions">
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressPicker(!showAddressPicker)}
                        className="autofill-action-btn"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{showAddressPicker ? 'Hide Saved Addresses' : 'Switch Address'}</span>
                      </button>
                    )}
                    {isManuallyEdited ? (
                      <button
                        type="button"
                        onClick={handleRestoreProfile}
                        className="autofill-action-btn"
                        title="Reset fields to profile defaults"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset to Profile</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClearAutofill}
                        className="autofill-action-btn danger"
                        title="Clear autofilled information and enter new details"
                      >
                        <span>Change Information</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Multiple Saved Addresses Picker */}
                {showAddressPicker && addresses.length > 1 && (
                  <div className="saved-addresses-grid">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          applySavedAddress(addr)
                          setShowAddressPicker(false)
                        }}
                        className={`saved-address-card ${
                          selectedAddressId === addr.id ? 'selected' : ''
                        }`}
                      >
                        <div className="saved-address-card-header">
                          <span className="saved-address-name">{addr.fullName}</span>
                          {addr.isDefault && (
                            <span className="saved-address-default-tag">Default</span>
                          )}
                        </div>
                        <p className="saved-address-phone">{addr.phone}</p>
                        <p className="saved-address-line">
                          {addr.addressLine}, {addr.city} · {addr.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-section">
              <h2 className="section-heading">1. Contact Information</h2>
              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Kabir Mehta"
                    className={errors.name ? 'has-error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="field-group">
                  <label htmlFor="phone">Phone Number (10 digits) *</label>
                  <input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className={errors.phone ? 'has-error' : ''}
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="kabir@example.com"
                    className={errors.email ? 'has-error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-heading">2. Delivery Address</h2>
              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="address">Street Address *</label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="14 Lotus Court, Bandra West"
                    className={errors.address ? 'has-error' : ''}
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="apartment">Apartment, Floor, Suite (Optional)</label>
                  <input
                    id="apartment"
                    type="text"
                    value={form.apartment}
                    onChange={(e) => handleFieldChange('apartment', e.target.value)}
                    placeholder="Flat 4B, 4th Floor"
                  />
                </div>
              </div>

              <div className="form-row form-row-3">
                <div className="field-group">
                  <label htmlFor="city">City *</label>
                  <input
                    id="city"
                    type="text"
                    value={form.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="Mumbai"
                    className={errors.city ? 'has-error' : ''}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="state">State *</label>
                  <input
                    id="state"
                    type="text"
                    value={form.state}
                    onChange={(e) => handleFieldChange('state', e.target.value)}
                    placeholder="Maharashtra"
                    className={errors.state ? 'has-error' : ''}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="pincode">PIN Code *</label>
                  <input
                    id="pincode"
                    type="text"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => handleFieldChange('pincode', e.target.value.replace(/\D/g, ''))}
                    placeholder="400050"
                    className={errors.pincode ? 'has-error' : ''}
                  />
                  {errors.pincode && <span className="error-text">{errors.pincode}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="notes">Delivery Notes (Optional)</label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Leave with security or call on arrival"
                  />
                </div>
              </div>

              {/* Option to Save Modified Address to Profile */}
              {isManuallyEdited && (
                <label className="save-address-option">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                  />
                  <span>Save this address to my profile for faster checkout next time</span>
                </label>
              )}
            </div>

            {/* Payment Gateway Selection */}
            <div className="form-section">
              <h2 className="section-heading">3. Payment Method</h2>

              <div className="payment-methods-list">
                {/* Razorpay Option */}
                <div
                  className={`payment-method-card ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <div className="payment-radio-circle">
                    <div className="payment-radio-dot" />
                  </div>
                  <div className="payment-method-info">
                    <div className="payment-method-title-row">
                      <span className="payment-method-title">
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Online via Razorpay</span>
                      </span>
                      <div className="payment-method-badges">
                        <span className="payment-badge brand-razorpay">Razorpay Secure</span>
                        <span className="payment-badge">UPI / Cards</span>
                        <span className="payment-badge">NetBanking</span>
                      </div>
                    </div>
                    <p className="payment-method-desc">
                      Pay instantly with UPI (Google Pay, PhonePe, Paytm), Visa, Mastercard, RuPay,
                      or NetBanking. 256-bit encrypted checkout.
                    </p>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div
                  className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="payment-radio-circle">
                    <div className="payment-radio-dot" />
                  </div>
                  <div className="payment-method-info">
                    <div className="payment-method-title-row">
                      <span className="payment-method-title">
                        <Truck className="w-4 h-4" />
                        <span>Cash on Delivery</span>
                      </span>
                      <div className="payment-method-badges">
                        <span className="payment-badge">Pay on Doorstep</span>
                      </div>
                    </div>
                    <p className="payment-method-desc">
                      Pay in cash or via UPI QR code directly to the courier upon doorstep delivery.
                    </p>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="payment-error-alert" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  <span>{paymentError}</span>
                </div>
              )}
              {quoteError && !paymentError && (
                <div className="payment-error-alert" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  <span>{quoteError}</span>
                </div>
              )}
            </div>

            <div className="form-section submit-section">
              <button
                type="submit"
                disabled={isProcessing || quoteLoading || !deliveryQuote}
                className="button primary checkout-submit-btn"
                aria-label="Place you order"
              >
                <span>
                  {isProcessing ? 'Processing Order...' : 'Place you order'}
                </span>
                <span>{deliveryQuote ? `${formatPrice(total)} ↗` : quoteLoading ? 'Calculating…' : 'Enter delivery state'}</span>
              </button>

              <p className="submit-footnote">
                {paymentMethod === 'razorpay'
                  ? 'Your transaction is secured by Razorpay. Delivery is charged by destination and cart weight.'
                  : 'Pay upon delivery. Delivery charges are calculated by destination and cart weight.'}
              </p>
            </div>
          </form>

          {/* Order Summary Sidebar */}
          <aside className="checkout-summary-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <span className="summary-label">MANIFEST // {count} ITEMS</span>
                <h2 className="summary-title">Bag Summary</h2>
              </div>

              <div className="summary-items">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variantId ?? item.size}`} className="summary-item">
                    <Image
                      src={item.img}
                      alt={item.name}
                      width={56}
                      height={70}
                      className="summary-item-img"
                    />
                    <div className="summary-item-info">
                      <h3 className="summary-item-name">{item.name}</h3>
                      <p className="summary-item-meta">
                        {[item.color, item.fit ? `${item.fit} Fit` : null, `Size ${item.size}`, `Qty ${item.qty}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <span className="summary-item-price">
                        {formatPrice(item.priceNum * item.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="total-row">
                  <span>Delivery charge</span>
                  <span>{deliveryQuote ? formatPrice(shipping) : quoteLoading ? 'Calculating…' : 'Enter state'}</span>
                </div>
                <div className="total-row total-row-final">
                  <span>{deliveryQuote ? 'Order total' : 'Estimated subtotal'}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="summary-badges">
                <div className="badge-item">
                  <span className="badge-icon">✓</span>
                  <span>Free 7-Day Size Exchanges</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">✓</span>
                  <span>24h Dispatch from Kerala</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">✓</span>
                  <span>Razorpay Verified &amp; Encrypted</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
