'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import FitPreferencesCard from '@/components/FitPreferencesCard'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function PreferencesPage() {
  return (
    <div className="apple-profile-page">
      <div className="apple-profile-container max-w-4xl mx-auto">
        {/* Navigation Breadcrumbs */}
        <nav className="infit-breadcrumb-nav mb-6" aria-label="Breadcrumbs">
          <Link href="/" className="infit-breadcrumb-link">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <Link href="/profile" className="text-zinc-500 hover:text-black transition-colors">
            Account
          </Link>
          <span>/</span>
          <span className="infit-breadcrumb-current">Fit &amp; Size Preferences</span>
        </nav>

        {/* Top Header Row with Return Link */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Profile Dashboard</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full font-medium">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Applies automatically across all product pages</span>
          </span>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          }
        >
          <FitPreferencesCard standalone />
        </Suspense>
      </div>
    </div>
  )
}
