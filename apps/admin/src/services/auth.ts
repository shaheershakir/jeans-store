'use client'

import { useAdminStore } from '@/store/admin-store'

export interface SessionUser {
  id: number
  name: string
  email: string
}

export interface LoginResult {
  user: SessionUser
}

/** Sets `dataReady` so pages can render skeletons before first paint of data. */
export async function bootstrap(): Promise<void> {
  try {
    const response = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) {
      useAdminStore.getState().logout()
      return
    }
    const { user } = (await response.json()) as { user: SessionUser }
    useAdminStore.getState().login(user)
  } finally {
    useAdminStore.getState().setReady()
  }
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
    user?: SessionUser
  }
  if (!response.ok || !payload.user) throw new Error(payload.error || 'Unable to sign in.')
  useAdminStore.getState().login(payload.user)
  return { user: payload.user }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/admin/session', { method: 'DELETE', credentials: 'same-origin' })
  } finally {
    useAdminStore.getState().logout()
  }
}
