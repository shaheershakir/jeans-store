export interface ShippingRate {
  baseWeightGrams: number
  baseCharge: number
  additionalWeightGrams: number
  additionalCharge: number
  estimatedDaysMin?: number
  estimatedDaysMax?: number
  exactDeliveryDate?: string
}

export interface ShippingRates {
  dispatchDaysMin?: number
  dispatchDaysMax?: number
  kerala: ShippingRate
  restOfIndia: ShippingRate
}

export interface PincodeDeliveryInfo {
  serviceable: boolean
  pincode: string
  isKerala: boolean
  state: string
  city?: string
  dispatchDaysMin: number
  dispatchDaysMax: number
  dispatchText: string
  dispatchDateRange: string
  estimatedDaysMin: number
  estimatedDaysMax: number
  deliveryText: string
  estimatedDeliveryRange: string
  baseCharge: number
  exactDeliveryDate?: string
  error?: string
}

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  dispatchDaysMin: 1,
  dispatchDaysMax: 2,
  kerala: {
    baseWeightGrams: 500,
    baseCharge: 60,
    additionalWeightGrams: 500,
    additionalCharge: 20,
    estimatedDaysMin: 2,
    estimatedDaysMax: 2,
    exactDeliveryDate: ''
  },
  restOfIndia: {
    baseWeightGrams: 500,
    baseCharge: 90,
    additionalWeightGrams: 500,
    additionalCharge: 30,
    estimatedDaysMin: 5,
    estimatedDaysMax: 7,
    exactDeliveryDate: ''
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

export function isKeralaPincode(pincode: string): boolean {
  const clean = pincode.replace(/\D/g, '')
  if (clean.length === 6) {
    return /^(67|68|69)/.test(clean)
  }
  return false
}

export function calculatePincodeDelivery(
  pincode: string,
  rates: ShippingRates = DEFAULT_SHIPPING_RATES,
  city?: string
): PincodeDeliveryInfo {
  const cleanPin = pincode.replace(/\D/g, '').slice(0, 6)
  const isValid = /^[1-9]\d{5}$/.test(cleanPin)

  if (!isValid) {
    return {
      serviceable: false,
      pincode: cleanPin,
      isKerala: false,
      state: '',
      dispatchDaysMin: 1,
      dispatchDaysMax: 2,
      dispatchText: 'Typically dispatched in 1–2 days',
      dispatchDateRange: '',
      estimatedDaysMin: 5,
      estimatedDaysMax: 7,
      deliveryText: '5–7 days outside Kerala',
      estimatedDeliveryRange: '',
      baseCharge: 90,
      error: 'Please enter a valid 6-digit Indian PIN code.'
    }
  }

  const isKerala = isKeralaPincode(cleanPin)
  const zoneRate = isKerala ? rates.kerala : rates.restOfIndia

  const dispatchMin = rates.dispatchDaysMin ?? 1
  const dispatchMax = rates.dispatchDaysMax ?? 2
  const deliveryMin = zoneRate.estimatedDaysMin ?? (isKerala ? 2 : 5)
  const deliveryMax = zoneRate.estimatedDaysMax ?? (isKerala ? 2 : 7)

  const now = new Date()
  const dispatchStart = new Date(now.getTime() + dispatchMin * 86400000)
  const dispatchEnd = new Date(now.getTime() + dispatchMax * 86400000)
  const deliveryStart = new Date(now.getTime() + (dispatchMin + deliveryMin) * 86400000)
  const deliveryEnd = new Date(now.getTime() + (dispatchMax + deliveryMax) * 86400000)

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(d)

  const dispatchText =
    dispatchMin === dispatchMax
      ? `${dispatchMin} ${dispatchMin === 1 ? 'day' : 'days'}`
      : `${dispatchMin}–${dispatchMax} days`

  const deliveryText = isKerala
    ? deliveryMin === deliveryMax
      ? `${deliveryMin} ${deliveryMin === 1 ? 'day' : 'days'} in Kerala`
      : `${deliveryMin}–${deliveryMax} days in Kerala`
    : deliveryMin === deliveryMax
      ? `${deliveryMin} ${deliveryMin === 1 ? 'day' : 'days'} outside Kerala`
      : `${deliveryMin}–${deliveryMax} days outside Kerala`

  const estimatedDeliveryRange =
    zoneRate.exactDeliveryDate && zoneRate.exactDeliveryDate.trim()
      ? zoneRate.exactDeliveryDate.trim()
      : deliveryMin === deliveryMax
        ? fmt(deliveryStart)
        : `${fmt(deliveryStart)} – ${fmt(deliveryEnd)}`

  return {
    serviceable: true,
    pincode: cleanPin,
    isKerala,
    state: isKerala ? 'Kerala' : 'Outside Kerala',
    city,
    dispatchDaysMin: dispatchMin,
    dispatchDaysMax: dispatchMax,
    dispatchText: `Typically dispatched in ${dispatchText}`,
    dispatchDateRange:
      dispatchMin === dispatchMax ? fmt(dispatchStart) : `${fmt(dispatchStart)} – ${fmt(dispatchEnd)}`,
    estimatedDaysMin: deliveryMin,
    estimatedDaysMax: deliveryMax,
    deliveryText,
    estimatedDeliveryRange,
    baseCharge: zoneRate.baseCharge,
    exactDeliveryDate: zoneRate.exactDeliveryDate || undefined
  }
}

export async function fetchLiveShippingRates(signal?: AbortSignal): Promise<ShippingRates> {
  if (!API_BASE) return DEFAULT_SHIPPING_RATES
  try {
    const res = await fetch(`${API_BASE}/api/shipping/rates`, { signal })
    if (res.ok) {
      const data = await res.json()
      if (data?.rates) {
        return {
          dispatchDaysMin: data.rates.dispatchDaysMin ?? DEFAULT_SHIPPING_RATES.dispatchDaysMin,
          dispatchDaysMax: data.rates.dispatchDaysMax ?? DEFAULT_SHIPPING_RATES.dispatchDaysMax,
          kerala: {
            ...DEFAULT_SHIPPING_RATES.kerala,
            ...data.rates.kerala
          },
          restOfIndia: {
            ...DEFAULT_SHIPPING_RATES.restOfIndia,
            ...data.rates.restOfIndia
          }
        }
      }
    }
  } catch {
    // fallback to default rates
  }
  return DEFAULT_SHIPPING_RATES
}

export async function checkPincodeAvailability(
  pincode: string,
  rates?: ShippingRates,
  signal?: AbortSignal
): Promise<PincodeDeliveryInfo> {
  const cleanPin = pincode.replace(/\D/g, '').slice(0, 6)
  if (!/^[1-9]\d{5}$/.test(cleanPin)) {
    return {
      serviceable: false,
      pincode: cleanPin,
      isKerala: false,
      state: '',
      dispatchDaysMin: 1,
      dispatchDaysMax: 2,
      dispatchText: 'Typically dispatched in 1–2 days',
      dispatchDateRange: '',
      estimatedDaysMin: 5,
      estimatedDaysMax: 7,
      deliveryText: '5–7 days outside Kerala',
      estimatedDeliveryRange: '',
      baseCharge: 90,
      error: 'Please enter a valid 6-digit Indian PIN code.'
    }
  }

  // 1. Try server check endpoint first
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/shipping/check?pincode=${cleanPin}`, { signal })
      if (res.ok) {
        const data = await res.json()
        if (data && data.serviceable) {
          return {
            ...data,
            baseCharge: data.baseCharge ?? (data.isKerala ? 60 : 90)
          }
        }
      }
    } catch {
      // fallback to client calculation
    }
  }

  // 2. Client-side fallback with live or default rates
  return calculatePincodeDelivery(cleanPin, rates || DEFAULT_SHIPPING_RATES)
}
