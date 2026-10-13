import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import OnboardingModal from '@/components/OnboardingModal'
import { OnboardingSkeleton } from '@/components/skeletons'

export const metadata: Metadata = {
  title: 'Onboarding & Size Setup — TEESGARAGE',
  description: 'Personalize your delivery destination and apparel fit preferences.'
}

export default function OnboardingPage() {
  return (
    <div className="onboarding-page-layout">
      <Suspense fallback={<OnboardingSkeleton />}>
        <OnboardingModal standalone={true} />
      </Suspense>
    </div>
  )
}

