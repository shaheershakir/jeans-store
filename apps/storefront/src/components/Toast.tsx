'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store'

export default function Toast() {
  const toast = useUIStore((state) => state.toast)
  const hideToast = useUIStore((state) => state.hideToast)

  useEffect(() => {
    void useUIStore.persist.rehydrate()
  }, [])

  if (!toast) return null

  return (
    <div className="toast show" role="status" aria-live="polite">
      <span>{toast}</span>
      <button type="button" aria-label="Dismiss notification" onClick={hideToast}>
        ×
      </button>
    </div>
  )
}
