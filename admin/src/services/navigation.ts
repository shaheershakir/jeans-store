'use client'

import { apiFetch, simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import type { NavigationItem } from '@/lib/types'

export async function fetchBackendNavigation(): Promise<NavigationItem[]> {
  try {
    const data = await apiFetch<{ count: number; navigation: NavigationItem[] }>('/api/navigation?all=true')
    if (data && Array.isArray(data.navigation) && data.navigation.length > 0) {
      useAdminStore.getState().setNavigation(data.navigation)
      return data.navigation
    }
  } catch (err) {
    console.warn('[Admin] Could not load backend navigation items:', err)
  }
  return useAdminStore.getState().data.navigation || []
}

export async function saveNavigationList(items: NavigationItem[]): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().reorderNavigationItems(items)

  try {
    await apiFetch('/api/navigation', {
      method: 'PUT',
      body: JSON.stringify({ navigation: items })
    })
  } catch (err) {
    console.error('[Admin] Failed to sync navigation changes to backend:', err)
    throw err
  }

  // Trigger storefront revalidation if reachable
  try {
    const storefrontUrl =
      process.env.NEXT_PUBLIC_STOREFRONT_URL ||
      (typeof window !== 'undefined' ? window.location.origin.replace(':3001', ':3000') : 'http://localhost:3000')
    await fetch(`${storefrontUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'navigation', path: '/' })
    })
  } catch {
    // Non-critical if storefront is currently building
  }
}

export async function resetBackendNavigation(): Promise<NavigationItem[]> {
  await simulateLatency()
  useAdminStore.getState().resetNavigationToDefault()

  try {
    const res = await apiFetch<{ navigation: NavigationItem[] }>('/api/navigation/reset', {
      method: 'POST'
    })
    if (res && Array.isArray(res.navigation)) {
      useAdminStore.getState().setNavigation(res.navigation)
      return res.navigation
    }
  } catch (err) {
    console.warn('[Admin] Failed to reset navigation on backend:', err)
  }

  return useAdminStore.getState().data.navigation || []
}
