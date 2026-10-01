'use client'

import { apiFetch, simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import { DEFAULT_HOMEPAGE_CONFIG } from '@/data/seed'
import type { HomepageConfig } from '@/lib/types'

export async function fetchBackendHomepage(): Promise<HomepageConfig> {
  try {
    const data = await apiFetch<{ success: boolean; config: HomepageConfig }>('/api/homepage')
    if (data?.config && Array.isArray(data.config.sectionsOrder)) {
      useAdminStore.getState().setHomepageConfig(data.config)
      return data.config
    }
  } catch (err) {
    console.warn('[Admin] Could not load backend homepage config:', err)
  }
  return useAdminStore.getState().data.homepage || DEFAULT_HOMEPAGE_CONFIG
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<void> {
  await simulateLatency()
  useAdminStore.getState().setHomepageConfig(config)

  try {
    await apiFetch('/api/homepage', {
      method: 'PUT',
      body: JSON.stringify({ config })
    })
  } catch (err) {
    console.error('[Admin] Failed to sync homepage changes to backend:', err)
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
      body: JSON.stringify({ tag: 'homepage', path: '/' })
    })
  } catch {
    // Non-critical if storefront is currently building
  }
}

export async function resetBackendHomepage(): Promise<HomepageConfig> {
  await simulateLatency()
  useAdminStore.getState().resetHomepageConfig()

  try {
    const res = await apiFetch<{ success: boolean; config: HomepageConfig }>('/api/homepage/reset', {
      method: 'POST'
    })
    if (res?.config && Array.isArray(res.config.sectionsOrder)) {
      useAdminStore.getState().setHomepageConfig(res.config)
      return res.config
    }
  } catch (err) {
    console.warn('[Admin] Failed to reset homepage on backend:', err)
  }

  return useAdminStore.getState().data.homepage || DEFAULT_HOMEPAGE_CONFIG
}
