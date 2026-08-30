'use client'

import { simulateLatency } from './api'
import { useAdminStore } from '@/store/admin-store'
import type { AdminUser } from '@/lib/types'

/** Sets `dataReady` so pages can render skeletons before first paint of data. */
export async function bootstrap(): Promise<void> {
  await simulateLatency(450)
  useAdminStore.getState().setReady()
}

export interface LoginResult {
  user: AdminUser
}

export async function login(email: string): Promise<LoginResult> {
  await simulateLatency(500)
  const data = useAdminStore.getState().data
  const user = data.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error('No admin account found for this email. Use one of the demo accounts below.')
  useAdminStore.getState().login(user)
  return { user }
}

export async function loginAs(userId: number): Promise<LoginResult> {
  await simulateLatency(350)
  const data = useAdminStore.getState().data
  const user = data.adminUsers.find((u) => u.id === userId)
  if (!user) throw new Error('Admin account not found.')
  useAdminStore.getState().login(user)
  return { user }
}

export async function logout(): Promise<void> {
  await simulateLatency(120)
  useAdminStore.getState().logout()
}