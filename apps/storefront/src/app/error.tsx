'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { AlertCircle, RotateCcw, ShoppingBag } from 'lucide-react'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-[#FAF9F6] px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white border border-neutral-200 rounded-xl p-8 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-5">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full border border-neutral-200 bg-neutral-50 text-[11px] font-mono font-medium tracking-wider text-neutral-600 uppercase mb-3">
          Session Interrupted
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
          Unable to Load Content
        </h1>

        <p className="text-sm text-neutral-600 leading-relaxed mb-6">
          We ran into an unexpected issue while loading this view. Your cart and preferences remain safely preserved.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-neutral-600 bg-neutral-100 rounded px-2.5 py-1 mb-6 break-all">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry View</span>
          </button>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:border-neutral-900 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
