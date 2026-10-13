'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Storefront error:', error)
  }, [error])

  return (
    <main className="error-page">
      <div className="error-card">
        <span className="error-badge">SYSTEM NOTICE</span>
        <h1 className="error-title">Something interrupted your session</h1>
        <p className="error-desc">
          We encountered an unexpected issue while preparing the product catalog. You can retry loading
          the view or return to the main archive.
        </p>
        <div className="error-actions">
          <button type="button" className="button primary" onClick={() => reset()}>
            Retry View
          </button>
          <Link href="/" className="button outline">
            Return to Archive
          </Link>
        </div>
      </div>
    </main>
  )
}
