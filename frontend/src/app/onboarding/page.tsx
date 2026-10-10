import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import OnboardingModal from '@/components/OnboardingModal'

export const metadata: Metadata = {
  title: 'Onboarding & Size Setup — TEESGARAGE',
  description: 'Personalize your delivery destination and signature denim fit preferences.'
}

export default function OnboardingPage() {
  return (
    <div className="onboarding-page-layout">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          </div>
        }
      >
        <OnboardingModal standalone={true} />
      </Suspense>
    </div>
  )
}
