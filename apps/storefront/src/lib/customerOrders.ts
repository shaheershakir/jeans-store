export interface CustomerOrderItem {
  id: string
  name: string
  size: string
  fit?: string
  wash?: string
  price: string
  priceNum: number
  img: string
  qty: number
}

export interface CustomerOrder {
  orderId: string
  date: string
  status: string
  expectedDelivery: string
  items: CustomerOrderItem[]
  subtotal: number
  shipping: number
  total: number
  shippingAddress: string
  trackingCourier?: string
  trackingNumber?: string
}

interface ApiOrder {
  orderNumber: string
  createdAt: string
  status: string
  carrier?: string | null
  trackingNumber?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  items: Array<{
    id: string
    name?: string
    size: string
    fit?: string
    wash?: string
    price?: string
    priceNum?: number
    img?: string
    quantity: number
  }>
  subtotal: number
  shipping: number
  total: number
  address: string
  apartment?: string
  city: string
  state: string
  pincode: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

function displayStatus(status: string): string {
  if (!status) return 'Pending'
  const s = status.trim().toLowerCase()
  if (s === 'shipped' || s === 'out for delivery' || s === 'dispatched') return 'Dispatched'
  if (s === 'delivered') return 'Delivered'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'returned') return 'Returned'
  if (s === 'confirmed' || s === 'paid') return 'Confirmed'
  if (s === 'processing') return 'Processing'
  if (s === 'pending') return 'Pending'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

function mapOrder(order: ApiOrder): CustomerOrder {
  const status = displayStatus(order.status)
  const deliveryMessage = order.deliveredAt
    ? `Delivered ${formatDate(order.deliveredAt)}`
    : order.trackingNumber
      ? `Tracking${order.carrier ? ` with ${order.carrier}` : ' available'}`
      : 'Delivery updates appear after dispatch'

  return {
    orderId: order.orderNumber,
    date: formatDate(order.createdAt),
    status,
    expectedDelivery: deliveryMessage,
    items: order.items.map((item) => {
      const priceNum = Number(item.priceNum ?? 0)
      return {
        id: item.id,
        name: item.name || 'TEESGARAGE product',
        size: item.size,
        fit: item.fit,
        wash: item.wash,
        price: item.price || `₹${priceNum.toLocaleString('en-IN')}`,
        priceNum,
        img: item.img || '/featured-collection.jpg',
        qty: item.quantity
      }
    }),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    shippingAddress: [order.address, order.apartment, order.city, order.state, order.pincode]
      .filter(Boolean)
      .join(', '),
    trackingCourier: order.carrier || undefined,
    trackingNumber: order.trackingNumber || undefined
  }
}

export function isActiveCustomerOrder(status: string): boolean {
  if (!status) return true
  const s = status.trim().toLowerCase()
  return !['delivered', 'cancelled', 'returned'].includes(s)
}

export async function fetchCustomerOrders(token: string, signal?: AbortSignal): Promise<CustomerOrder[]> {
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

  const payload = (await response.json().catch(() => ({}))) as { orders?: ApiOrder[]; error?: string }
  if (!response.ok) throw new Error(payload.error || 'Could not load your order history.')
  return Array.isArray(payload.orders) ? payload.orders.map(mapOrder) : []
}
