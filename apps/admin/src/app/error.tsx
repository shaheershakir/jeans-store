'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react'

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Structured admin client error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error('Admin operation error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4 text-white">
      <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-xl p-8 shadow-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Admin Dashboard Error</h2>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          An unexpected error interrupted the operations panel. You can retry the current action or reload the dashboard overview.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-neutral-400 bg-neutral-900 rounded p-2 mb-6 break-all">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Action</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-600 bg-neutral-800 text-neutral-200 text-sm font-semibold hover:border-neutral-400 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
