'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { AlertCircle, RotateCcw, ShoppingBag } from 'lucide-react'

export default function ProductError({
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
    <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6] px-4 py-16">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-8 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Product Silhouette Unavailable</h2>
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
          We could not load the specifications for this garment. The piece may have been restocked or archived.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:border-neutral-900 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore All Pieces</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
