'use client'

import { simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import type { Coupon, ReviewStatus, Review } from '@/lib/types'

export async function saveCoupon(coupon: Coupon): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().saveCoupon(coupon)
}

export async function deleteCoupon(id: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteCoupon(id)
}

export async function toggleCoupon(id: number): Promise<void> {
  await simulateLatency(120)
  useAdminStore.getState().toggleCoupon(id)
}

export async function setReviewStatus(id: number, status: ReviewStatus): Promise<void> {
  await simulateLatency(140)
  useAdminStore.getState().setReviewStatus(id, status)
}

export async function respondToReview(id: number, text: string): Promise<Review> {
  await simulateLatency()
  useAdminStore.getState().respondToReview(id, text)
  const review = useAdminStore.getState().data.reviews.find((r) => r.id === id)
  if (!review) throw new Error('Review not found.')
  return review
}
