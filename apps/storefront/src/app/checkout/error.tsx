'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RotateCcw, ShoppingBag, ShieldCheck } from 'lucide-react'

export default function CheckoutError({
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
    <main className="min-h-[70vh] flex items-center justify-center bg-[#FAF9F6] px-4 py-16">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-8 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Checkout Session Interrupted</h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Your payment method was not charged</span>
        </div>
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
          An unexpected error interrupted your checkout step. Your bag items are still intact and can be resumed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Checkout</span>
          </button>
          <Link
            href="/bag"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:border-neutral-900 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Return to Bag</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
