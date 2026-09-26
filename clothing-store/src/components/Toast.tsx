'use client'

import { useUIStore } from '@/lib/store'

export default function Toast() {
  const toast = useUIStore((state) => state.toast)
  const hideToast = useUIStore((state) => state.hideToast)

  if (!toast) return null

  return (
    <div className="toast-container" role="status" onClick={hideToast}>
      <span className="toast-icon">✓</span>
      <span>{toast.message}</span>
    </div>
  )
}
