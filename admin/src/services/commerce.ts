'use client'

import { simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import type { Order, PaymentMethod, FulfillmentStatus, PaymentStatus, ReturnRequest, ReturnStatus, Refund } from '@/lib/types'

/* ---------------- Inventory ---------------- */

export async function adjustStock(
  variantId: number,
  delta: number,
  reason: string,
  reference?: string
): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().adjustStock(variantId, delta, reason, reference)
}

export async function bulkAdjustStock(
  adjustments: { variantId: number; delta: number; reason: string }[]
): Promise<void> {
  await simulateLatency(120)
  useAdminStore.getState().bulkAdjustStock(adjustments)
}

/* ---------------- Orders ---------------- */

export async function transitionOrder(orderId: number, to: FulfillmentStatus): Promise<void> {
  await simulateLatency(160)
  useAdminStore.getState().transitionOrder(orderId, to)
}

export async function setOrderPaymentStatus(orderId: number, status: PaymentStatus): Promise<void> {
  await simulateLatency(160)
  useAdminStore.getState().setOrderPaymentStatus(orderId, status)
}

export async function addOrderNote(orderId: number, text: string, internal = false): Promise<void> {
  await simulateLatency(120)
  useAdminStore.getState().addOrderNote(orderId, text, internal)
}

export async function setOrderTracking(orderId: number, carrier: string, trackingNumber: string): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().setOrderTracking(orderId, carrier, trackingNumber)
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