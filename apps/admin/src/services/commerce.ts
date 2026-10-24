'use client'

import { apiFetch, simulateLatency } from './api'
import { fetchBackendProducts } from './catalog'
import { useAdminStore } from '@/store/admin-store'
import type { Order, PaymentMethod, FulfillmentStatus, PaymentStatus, ReturnRequest, ReturnStatus, Refund } from '@/lib/types'

/* ---------------- Inventory ---------------- */

export async function adjustStock(
  variantId: number,
  delta: number,
  reason: string,
  reference?: string
): Promise<void> {
  await apiFetch(`/api/products/variants/${variantId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ delta, reason, reference })
  })
  useAdminStore.getState().adjustStock(variantId, delta, reason, reference)
  await fetchBackendProducts()
}

export async function bulkAdjustStock(
  adjustments: { variantId: number; delta: number; reason: string }[]
): Promise<void> {
  for (const adjustment of adjustments) {
    await adjustStock(adjustment.variantId, adjustment.delta, adjustment.reason)
  }
}

/* ---------------- Orders ---------------- */

export async function transitionOrder(orderId: number, to: FulfillmentStatus): Promise<void> {
  await patchBackendOrder(orderId, { status: to })
}

export async function setOrderPaymentStatus(orderId: number, status: PaymentStatus): Promise<void> {
  await patchBackendOrder(orderId, { paymentStatus: status })
}

export async function addOrderNote(orderId: number, text: string, internal = false): Promise<void> {
  await apiFetch(`/api/orders/${orderId}/notes`, { method: 'POST', body: JSON.stringify({ text, internal }) })
  await fetchBackendOrders()
}

export async function setOrderTracking(orderId: number, carrier: string, trackingNumber: string): Promise<void> {
  await patchBackendOrder(orderId, { carrier, trackingNumber })
}

export async function createOrder(input: {
  customerId: number
  items: { variantId: number; quantity: number }[]
  paymentMethod: PaymentMethod
  discount: number
}): Promise<Order> {
  await simulateLatency(300)
  return useAdminStore.getState().createOrder(input)
}

/* ---------------- Returns & refunds ---------------- */

export async function createReturn(orderId: number, reason: string, details: string): Promise<ReturnRequest> {
  await simulateLatency()
  return useAdminStore.getState().createReturn(orderId, reason, details)
}

export async function transitionReturn(returnId: number, to: ReturnStatus): Promise<void> {
  await simulateLatency(160)
  useAdminStore.getState().transitionReturn(returnId, to)
}

export async function createRefund(input: {
  orderId: number
  returnId?: number
  amount: number
  reason: string
  method: PaymentMethod
}): Promise<Refund> {
  await simulateLatency()
  return useAdminStore.getState().createRefund(input)
}

export async function processRefund(refundId: number, fail = false): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().processRefund(refundId, fail)
}

interface ApiOrder {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  apartment?: string
  city: string
  state: string
  pincode: string
  notes?: string
  items: Array<{ id: string; variantId?: number; name?: string; size: string; color?: string; sku?: string; priceNum?: number; quantity: number }>
  subtotal: number
  shipping: number
  total: number
  status: string
  paymentStatus?: string
  handoffType: string
  carrier?: string | null
  trackingNumber?: string | null
  shippedAt?: string | Date | null
  deliveredAt?: string | Date | null
  adminNotes?: Array<{ id: string; text: string; at: string; by: string; internal: boolean }>
  events?: Array<{ id: string; status: string; note: string; at: string; by: string }>
  createdAt: string | Date
  updatedAt?: string | Date
}

async function patchBackendOrder(orderId: number, patch: Record<string, unknown>): Promise<void> {
  await apiFetch(`/api/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(patch) })
  await fetchBackendOrders()
}

export async function fetchBackendOrders(): Promise<Order[]> {
  const data = await apiFetch<{ count: number; orders: ApiOrder[] }>('/api/orders')
  const customerIds = new Map<string, number>()
  const customerRows = new Map<number, ReturnType<typeof toAdminCustomer>>()
  const orders = data.orders.map((remote) => {
    const email = remote.customerEmail.toLowerCase()
    let customerId = customerIds.get(email)
    if (!customerId) {
      customerId = stableCustomerId(email)
      customerIds.set(email, customerId)
      customerRows.set(customerId, toAdminCustomer(remote, customerId))
    } else {
      const customer = customerRows.get(customerId)
      const orderDate = new Date(remote.createdAt).toISOString()
      if (customer && orderDate < customer.joinedAt) customer.joinedAt = orderDate
    }
    const fulfillmentStatus = (['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(remote.status) ? remote.status : 'Pending') as FulfillmentStatus
    const paymentStatus = (['Pending', 'Paid', 'Failed', 'Refunded'].includes(remote.paymentStatus ?? '') ? remote.paymentStatus : remote.handoffType === 'razorpay' ? 'Paid' : 'Pending') as PaymentStatus
    const paymentMethod: PaymentMethod = remote.handoffType === 'cod' ? 'COD' : 'Razorpay'
    return {
      id: remote.id,
      number: remote.orderNumber,
      customerId,
      items: remote.items.map((item, index) => ({
        id: index + 1,
        productId: item.id,
        variantId: item.variantId ?? 0,
        productName: item.name ?? `Product ${item.id}`,
        variantLabel: [item.color, `Size ${item.size}`].filter(Boolean).join(' · '),
        sku: item.sku ?? '',
        quantity: item.quantity,
        price: item.priceNum ?? 0,
        total: (item.priceNum ?? 0) * item.quantity,
      })),
      subtotal: remote.subtotal,
      discount: 0,
      shippingFee: remote.shipping,
      tax: 0,
      total: remote.total,
      paymentMethod,
      paymentStatus,
      transactionId: null,
      fulfillmentStatus,
      shippingAddress: { id: remote.id, label: 'Home', line1: remote.address, line2: remote.apartment ?? '', city: remote.city, state: remote.state, pincode: remote.pincode, phone: remote.customerPhone },
      carrier: remote.carrier ?? null,
      trackingNumber: remote.trackingNumber ?? null,
      shippedAt: remote.shippedAt ? new Date(remote.shippedAt).toISOString() : null,
      deliveredAt: remote.deliveredAt ? new Date(remote.deliveredAt).toISOString() : null,
      timeline: (remote.events ?? []).map((event, index) => ({ id: index + 1, status: event.status, note: event.note, at: event.at, by: event.by })),
      notes: (remote.adminNotes ?? []).map((note, index) => ({ id: index + 1, text: note.text, at: note.at, by: note.by, internal: note.internal })),
      createdAt: new Date(remote.createdAt).toISOString(),
      updatedAt: new Date(remote.updatedAt ?? remote.createdAt).toISOString(),
    } satisfies Order
  })
  const payments = orders.map((order) => ({
    id: order.id,
    orderId: order.id,
    method: order.paymentMethod,
    amount: order.total,
    status: order.paymentStatus,
    gateway: order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay',
    gatewayFee: null,
    settled: order.paymentStatus === 'Paid',
    createdAt: order.createdAt,
    settledAt: null
  }))
  useAdminStore.setState((state) => ({ data: { ...state.data, orders, customers: [...customerRows.values()], payments } }))
  return orders
}

function stableCustomerId(email: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < email.length; index++) {
    hash = Math.imul(hash ^ email.charCodeAt(index), 0x01000193)
  }
  return (hash >>> 0) || 1
}

function toAdminCustomer(order: ApiOrder, id: number) {
  return {
    id,
    name: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    joinedAt: new Date(order.createdAt).toISOString(),
    addresses: [],
  }
}