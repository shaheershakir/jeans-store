export interface CustomerOrderItem {
  id: string
  name: string
  size: string
  price: string
  priceNum: number
  img: string
  qty: number
}

export interface OrderTrackingEvent {
  id: string
  status: string
  note: string
  at: string
  by: string
}

export interface CustomerOrder {
  id?: number
  orderId: string
  date: string
  status: string
  expectedDelivery: string
  items: CustomerOrderItem[]
  subtotal: number
  shipping: number
  total: number
  shippingAddress: string
  carrier?: string
  trackingCourier?: string
  trackingNumber?: string
  shippedAt?: string | null
  deliveredAt?: string | null
  events?: OrderTrackingEvent[]
  city?: string
  state?: string
  pincode?: string
}

interface ApiOrder {
  id?: number
  orderNumber: string
  createdAt: string
  status: string
  carrier?: string | null
  trackingNumber?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  events?: OrderTrackingEvent[]
  items: Array<{
    id: string
    name?: string
    size: string
    price?: string
    priceNum?: number
    img?: string
    quantity: number
  }>
  subtotal: number
  shipping: number
  total: number
  address?: string
  apartment?: string
  city?: string
  state?: string
  pincode?: string
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

export const TRACKING_STAGES = ['Placed', 'Confirmed', 'Shipped', 'Delivered'] as const

export function displayStatus(status: string): string {
  if (!status) return 'Placed'
  const s = status.trim().toLowerCase()
  if (s === 'delivered') return 'Delivered'
  if (s === 'shipped' || s === 'out for delivery' || s === 'dispatched') return 'Shipped'
  if (s === 'confirmed' || s === 'processing' || s === 'paid') return 'Confirmed'
  if (s === 'placed' || s === 'pending') return 'Placed'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'returned') return 'Returned'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getOrderStageIndex(status: string): number {
  const s = (status || '').trim().toLowerCase()
  if (s === 'delivered') return 3
  if (s === 'shipped' || s === 'dispatched' || s === 'out for delivery') return 2
  if (s === 'confirmed' || s === 'processing' || s === 'paid') return 1
  return 0
}

export function getStatusBadgeConfig(status: string) {
  const s = (status || '').trim().toLowerCase()
  if (s === 'delivered') {
    return {
      bg: 'bg-[#eaf5ed]',
      text: 'text-[#1e833a]',
      dot: 'bg-[#1e833a]',
      border: 'border-[#1e833a]/20',
      label: 'Delivered'
    }
  }
  if (s === 'shipped' || s === 'dispatched' || s === 'out for delivery') {
    return {
      bg: 'bg-[#ebf3fc]',
      text: 'text-[#1d6ee5]',
      dot: 'bg-[#1d6ee5]',
      border: 'border-[#1d6ee5]/20',
      label: 'Shipped'
    }
  }
  if (s === 'confirmed' || s === 'processing' || s === 'paid') {
    return {
      bg: 'bg-[#e6f4ea]',
      text: 'text-[#137333]',
      dot: 'bg-[#137333]',
      border: 'border-[#137333]/20',
      label: 'Confirmed'
    }
  }
  if (s === 'cancelled' || s === 'returned' || s === 'refunded') {
    return {
      bg: 'bg-[#fdeeed]',
      text: 'text-[#d93838]',
      dot: 'bg-[#d93838]',
      border: 'border-[#d93838]/20',
      label: s === 'cancelled' ? 'Cancelled' : s === 'returned' ? 'Returned' : 'Refunded'
    }
  }
  return {
    bg: 'bg-[#fef5e7]',
    text: 'text-[#c05621]',
    dot: 'bg-[#c05621]',
    border: 'border-[#c05621]/20',
    label: 'Placed'
  }
}

export function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(parsed)
}

export function formatDateTime(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(parsed)
}

export function getCarrierTrackingUrl(
  carrier?: string | null,
  trackingNumber?: string | null
): string | null {
  if (!trackingNumber) return null
  const c = (carrier || '').trim().toLowerCase()
  const awb = encodeURIComponent(trackingNumber.trim())

  if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${awb}`
  if (c.includes('bluedart') || c.includes('blue dart'))
    return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${awb}`
  if (c.includes('dtdc'))
    return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${awb}`
  if (c.includes('post') || c.includes('speed post') || c.includes('india post'))
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.eta/eta.aspx?TrackingNumber=${awb}`
  if (c.includes('ecom')) return `https://ecomexpress.in/tracking/?awb_number=${awb}`
  if (c.includes('shadowfax')) return `https://tracker.shadowfax.in/#/track?awb=${awb}`
  if (c.includes('xpress') || c.includes('xpressbees'))
    return `https://www.xpressbees.com/shipment/tracking?awb=${awb}`
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${awb}`
  if (c.includes('dhl'))
    return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${awb}`

  if (carrier && carrier.trim()) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} tracking ${trackingNumber}`)}`
  }
  return null
}

export function mapOrder(order: ApiOrder): CustomerOrder {
  const status = displayStatus(order.status)
  const deliveryMessage = order.deliveredAt
    ? `Delivered ${formatDate(order.deliveredAt)}`
    : order.trackingNumber
      ? `Tracking${order.carrier ? ` with ${order.carrier}` : ' available'}`
      : 'Delivery updates appear after dispatch'

  const rawAddressParts = [order.address, order.apartment, order.city, order.state, order.pincode]
    .filter(Boolean)
    .join(', ')

  return {
    id: order.id,
    orderId: order.orderNumber,
    date: formatDate(order.createdAt),
    status,
    expectedDelivery: deliveryMessage,
    items: (order.items || []).map((item) => {
      const priceNum = Number(item.priceNum ?? 0)
      return {
        id: item.id,
        name: item.name || 'TEESGARAGE product',
        size: item.size,
        price: item.price || `₹${priceNum.toLocaleString('en-IN')}`,
        priceNum,
        img: item.img || '/featured-collection.jpg',
        qty: item.quantity
      }
    }),
    subtotal: order.subtotal ?? 0,
    shipping: order.shipping ?? 0,
    total: order.total ?? 0,
    shippingAddress: rawAddressParts || 'Address on file',
    carrier: order.carrier || undefined,
    trackingCourier: order.carrier || undefined,
    trackingNumber: order.trackingNumber || undefined,
    shippedAt: order.shippedAt || null,
    deliveredAt: order.deliveredAt || null,
    events: Array.isArray(order.events) ? order.events : [],
    city: order.city,
    state: order.state,
    pincode: order.pincode
  }
}

export function isActiveCustomerOrder(status: string): boolean {
  if (!status) return true
  const s = status.trim().toLowerCase()
  return !['delivered', 'cancelled', 'returned'].includes(s)
}

export async function fetchCustomerOrders(
  token: string,
  signal?: AbortSignal
): Promise<CustomerOrder[]> {
  if (!API_BASE) throw new Error('Order history is not configured for this storefront.')

  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      signal
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Order history is temporarily unavailable. Please try again shortly.')
  }

  const payload = (await response.json().catch(() => ({}))) as {
    orders?: ApiOrder[]
    error?: string
  }
  if (!response.ok) throw new Error(payload.error || 'Could not load your order history.')
  return Array.isArray(payload.orders) ? payload.orders.map(mapOrder) : []
}

export async function fetchOrderTracking(
  orderNumber: string,
  options?: {
    phone?: string
    email?: string
    token?: string
    authToken?: string
    signal?: AbortSignal
  }
): Promise<CustomerOrder> {
  if (!API_BASE) throw new Error('Order tracking service is not configured.')

  const cleanOrderNumber = orderNumber.trim()
  const params = new URLSearchParams()
  if (options?.phone) params.set('phone', options.phone.trim())
  if (options?.email) params.set('email', options.email.trim())
  if (options?.token) params.set('token', options.token.trim())

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options?.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`
  }

  let response: Response
  try {
    response = await fetch(
      `${API_BASE}/api/orders/track/${encodeURIComponent(cleanOrderNumber)}${queryString}`,
      {
        headers,
        signal: options?.signal
      }
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('Unable to reach the server. Please check your connection.')
  }

  const payload = (await response.json().catch(() => ({}))) as {
    order?: ApiOrder
    error?: string
  }

  if (!response.ok) {
    throw new Error(payload.error || `Could not find tracking for order #${cleanOrderNumber}.`)
  }

  if (!payload.order) {
    throw new Error(`Order #${cleanOrderNumber} was not found.`)
  }

  return mapOrder(payload.order)
}

export async function cancelCustomerOrder(
  token: string,
  orderIdOrNumber: string | number
): Promise<void> {
  if (!API_BASE) throw new Error('Order service is not configured for this storefront.')

  const response = await fetch(`${API_BASE}/api/orders/${orderIdOrNumber}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to cancel order.')
  }
}
