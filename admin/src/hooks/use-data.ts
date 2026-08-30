'use client'

import * as React from 'react'
import { useAdminStore } from '@/store/admin-store'
import { bootstrap } from '@/services/auth'
import type { Permission } from '@/lib/permissions'

/** Bootstraps the simulated data load. Pages render skeletons until ready. */
export function useDataReady(): boolean {
  const hydrated = useAdminStore((s) => s.hydrated)
  const ready = useAdminStore((s) => s.ready)
  React.useEffect(() => {
    if (hydrated && !ready) {
      void bootstrap()
    }
  }, [hydrated, ready])
  return hydrated && ready
}

export function useSession() {
  return useAdminStore((s) => s.session)
}

export function useCan(permission: Permission): boolean {
  const session = useAdminStore((s) => s.session)
  return session ? session.permissions.includes(permission) : false
}

/** Redirects to /login when signed out. */
export function useRequireAuth(): boolean {
  const hydrated = useAdminStore((s) => s.hydrated)
  const session = useAdminStore((s) => s.session)
  React.useEffect(() => {
    if (hydrated && !session) {
      window.location.assign('/login')
    }
  }, [hydrated, session])
  return hydrated && !!session
}