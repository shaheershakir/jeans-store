import type { FulfillmentStatus, PaymentStatus } from './types'

/**
 * Order lifecycle state machine. Guards against invalid transitions so
 * the store never reaches an inconsistent state (e.g. Delivered while
 * payment is still Pending unless the order is COD).
 */
export const ORDER_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  Delivered: ['Returned'],
  Returned: ['Refunded'],
  Cancelled: ['Refunded'],
  Refunded: [],
}

export function canTransition(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false
}

/** Returns why a transition is invalid, or null when allowed. */
export function transitionError(from: FulfillmentStatus, to: FulfillmentStatus): string | null {
  if (from === to) return 'Order is already in this state.'
  if (!ORDER_TRANSITIONS[from]?.includes(to)) {
    return `Orders cannot move from “${from}” to “${to}”. Allowed: ${ORDER_TRANSITIONS[from]?.join(', ') || 'none'}.`
  }
  return null
}

/**
 * Payment sync rules — keeps payment consistent with fulfillment.
 * COD orders are marked Paid only once delivered; cancelled orders
 * with no charge move to Failed instead of staying Pending.
 */
export function nextPaymentOnTransition(
  to: FulfillmentStatus,
  paymentStatus: PaymentStatus,
  method: string
): PaymentStatus | null {
  if (to === 'Delivered') {
    if (method === 'COD') return 'Paid'
    return null
  }
  if (to === 'Cancelled') {
    if (paymentStatus === 'Pending') return 'Failed'
    return null
  }
  if (to === 'Refunded') {
    return 'Refunded'
  }
  return null
}

export interface OrderDraft {
  items: { variantId: number; quantity: number }[]
  customerId: number
  paymentMethod: string
  discount: number
  shipped: boolean
}

export function computeTotals(
  subtotal: number,
  discount: number,
  shippingFee: number
): { shippingFee: number; tax: number; total: number } {
  const tax = Math.round((subtotal - discount) * 0.18)
  const total = subtotal - discount + shippingFee + tax
  return { shippingFee, tax, total }
}
