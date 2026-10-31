'use client'

import { Badge, type Tone } from './primitives'
import {
  ORDER_STATUSES,
  PAYMENT_STATUS_TONE,
  REVIEW_STATUSES,
  STOCK_STATUSES,
} from '@/lib/constants'
import type {
  FulfillmentStatus,
  PaymentStatus,
  ReviewStatus,
  StockStatus,
  RefundStatus,
  Coupon,
} from '@/lib/types'
import { couponStatusLabel } from '@/lib/constants'

export function OrderBadge({ status }: { status: FulfillmentStatus }) {
  const meta = ORDER_STATUSES.find((s) => s.value === status)
  return <Badge tone={meta?.tone ?? 'neutral'}>{status}</Badge>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_STATUS_TONE[status]}>{status}</Badge>
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const meta = REVIEW_STATUSES.find((s) => s.value === status)
  return <Badge tone={meta?.tone ?? 'neutral'}>{status}</Badge>
}

export function StockBadge({ status }: { status: StockStatus }) {
  const meta = STOCK_STATUSES.find((s) => s.value === status)
  return <Badge tone={meta?.tone ?? 'neutral'}>{status}</Badge>
}

export function RefundBadge({ status }: { status: RefundStatus }) {
  const tone: Tone = status === 'Processed' ? 'success' : status === 'Failed' ? 'danger' : 'warning'
  return <Badge tone={tone}>{status}</Badge>
}

export function CouponBadge({ coupon }: { coupon: Coupon }) {
  const label = couponStatusLabel(coupon)
  const tone: Tone =
    label === 'active' ? 'success' : label === 'scheduled' ? 'info' : label === 'exhausted' ? 'warning' : 'neutral'
  return <Badge tone={tone}>{label}</Badge>
}

export function ProductStatusBadge({ status }: { status: 'Active' | 'Draft' | 'Archived' }) {
  const tone: Tone = status === 'Active' ? 'success' : status === 'Draft' ? 'warning' : 'neutral'
  return <Badge tone={tone}>{status}</Badge>
}
