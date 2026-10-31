'use client'

import * as React from 'react'
import { apiFetch } from '@/services/api'
import { useAdminStore } from '@/store/admin-store'
import { toastError } from '@/components/ui/toast'
import type { DbState } from '@/lib/types'

type OperationalData = Partial<Pick<DbState, 'collections' | 'customers' | 'refunds' | 'coupons' | 'reviews' | 'sizeCharts' | 'shipments' | 'payments' | 'inventoryMovements' | 'auditLog' | 'notifications' | 'settings'>>

const PERSISTED_KEYS = [
  'collections', 'customers', 'refunds', 'coupons', 'reviews',
  'sizeCharts', 'shipments', 'payments', 'notifications', 'settings'
] as const

function selectOperationalData(data: ReturnType<typeof useAdminStore.getState>['data']) {
  return Object.fromEntries(PERSISTED_KEYS.map((key) => [key, data[key]]))
}

export function AdminStateSync() {
  const session = useAdminStore((state) => state.session)
  const data = useAdminStore((state) => state.data)
  const [loaded, setLoaded] = React.useState(false)
  const stateJson = React.useMemo(() => JSON.stringify(selectOperationalData(data)), [data])

  React.useEffect(() => {
    if (!session) return
    let active = true
    void apiFetch<{ state: OperationalData }>('/api/admin/state')
      .then(({ state }) => {
        if (active && Object.keys(state).length) {
          useAdminStore.getState().replaceOperationalData(state)
        }
        if (active) setLoaded(true)
      })
      .catch((error) => {
        if (active) toastError(error instanceof Error ? error.message : 'Could not load saved admin data.')
      })
    return () => { active = false }
  }, [session])

  React.useEffect(() => {
    if (!session || !loaded) return
    const timer = setTimeout(() => {
      void apiFetch('/api/admin/state', { method: 'PUT', body: stateJson }).catch((error) => {
        toastError(error instanceof Error ? error.message : 'Could not save admin data.')
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [loaded, session, stateJson])

  return null
}
