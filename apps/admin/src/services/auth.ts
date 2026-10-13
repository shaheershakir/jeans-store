'use client'

import { useAdminStore } from '@/store/admin-store'
import type { AdminUser } from '@/lib/types'

/** Sets `dataReady` so pages can render skeletons before first paint of data. */
export async function bootstrap(): Promise<void> {
  try {
    const response = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) {
      useAdminStore.getState().logout()
      return
    }
    const { user } = (await response.json()) as { user: { id: number; name: string; email: string } }
    useAdminStore.getState().login({ ...user, roleId: 1, status: 'Active', lastLoginAt: null })
  } finally {
    useAdminStore.getState().setReady()
  }
}

export interface LoginResult {
  user: AdminUser
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await fetch('/api/admin/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ email, password })
  })
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    user?: { id: number; name: string; email: string }
  }
  if (!response.ok || !payload.user) throw new Error(payload.error || 'Unable to sign in.')
  const user: AdminUser = { ...payload.user, roleId: 1, status: 'Active', lastLoginAt: null }
  useAdminStore.getState().login(user)
  return { user }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/admin/session', { method: 'DELETE', credentials: 'same-origin' })
  } finally {
    useAdminStore.getState().logout()
  }
}
