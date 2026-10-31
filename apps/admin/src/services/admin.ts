'use client'

import { simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import type { ShippingZone, StoreSettings } from '@/lib/types'

export async function saveShippingZone(zone: ShippingZone): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().saveShippingZone(zone)
}

export async function deleteShippingMethod(methodId: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteShippingMethod(methodId)
}

export async function updateSettings(patch: Partial<StoreSettings>): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().updateSettings(patch)
}

export async function markNotificationsRead(): Promise<void> {
  useAdminStore.getState().markNotificationsRead()
}
