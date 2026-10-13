'use client'

import { simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import type { AdminUser, Role, ShippingZone, StoreSettings } from '@/lib/types'

export async function saveAdminUser(input: AdminUser): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().saveAdminUser(input)
}

export async function deleteAdminUser(id: number): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().deleteAdminUser(id)
}

export async function setAdminUserStatus(id: number, status: 'Active' | 'Inactive'): Promise<void> {
  await simulateLatency(140)
  useAdminStore.getState().setAdminUserStatus(id, status)
}

export async function saveRole(role: Role): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().saveRole(role)
}

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