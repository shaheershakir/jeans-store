'use client'

import React, { createContext, useContext, useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsUserTraits
} from '@jeans-store/shared'

const isClient = typeof window !== 'undefined'
const isDev = process.env.NODE_ENV === 'development'
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || '/ingest'

let isInitialized = false

export function initPostHog(): boolean {
  if (!isClient) return false
  if (isInitialized) return true

  if (!POSTHOG_KEY) {
    return false
  }

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      ui_host: 'https://us.posthog.com',
      capture_pageview: false, // Handled manually by PostHogPageView in Next.js 15
      capture_pageleave: true,
      autocapture: false, // As decided: explicit custom events only
      person_profiles: 'identified_only',
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '.ph-mask',
      }
    })
    isInitialized = true
    return true
  } catch (err) {
    if (isDev) {
      console.warn('[PostHog] Failed to initialize analytics client.')
    }
    return false
  }
}

/**
 * Strongly typed tracking helper
 */
export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  properties: AnalyticsEventMap[E]
): void {
  if (!isClient) return

  if (isInitialized && POSTHOG_KEY) {
    try {
      posthog.capture(event, properties as unknown as Record<string, unknown>)
    } catch {
      // Fail silently to never interrupt checkout or browsing UX
    }
  }
}

/**
 * Identify user upon login, signup, or checkout completion
 */
export function identifyUser(
  userId: string | number,
  traits?: AnalyticsUserTraits
): void {
  if (!isClient) return

  if (isInitialized && POSTHOG_KEY) {
    try {
      posthog.identify(String(userId), traits as unknown as Record<string, unknown>)
    } catch {
      // Fail silently to never interrupt user flows
    }
  }
}

/**
 * Reset PostHog distinct ID upon logout
 */
export function resetUser(): void {
  if (!isClient) return

  if (isInitialized && POSTHOG_KEY) {
    try {
      posthog.reset()
    } catch {
      // Fail silently
    }
  }
}

/**
 * Next.js 15 PageView Tracking Component
 */
function PostHogPageViewInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || !isClient) return

    let url = window.origin + pathname
    if (searchParams && searchParams.toString()) {
      url = `${url}?${searchParams.toString()}`
    }

    if (isInitialized && POSTHOG_KEY) {
      posthog.capture('$pageview', {
        $current_url: url
      })
    }
  }, [pathname, searchParams])

  return null
}

export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewInner />
    </Suspense>
  )
}

interface AnalyticsContextValue {
  track: typeof trackEvent
  identify: typeof identifyUser
  reset: typeof resetUser
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: trackEvent,
  identify: identifyUser,
  reset: resetUser
})

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <AnalyticsContext.Provider value={{ track: trackEvent, identify: identifyUser, reset: resetUser }}>
      <PostHogPageView />
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext)
}
