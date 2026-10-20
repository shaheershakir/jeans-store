'use client'

import React, { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { googleAuth } from '@/lib/auth'
import { useAuthStore, useUIStore, useOnboardingStore } from '@/lib/store'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  const setAuth = useAuthStore((s) => s.setAuth)
  const showToast = useUIStore((s) => s.showToast)
  const hasExecutedRef = useRef(false)

  useEffect(() => {
    if (hasExecutedRef.current) return
    hasExecutedRef.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const urlError = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (urlError) {
      setStatus('error')
      if (urlError === 'redirect_uri_mismatch') {
        setError(
          `Google OAuth Error: redirect_uri_mismatch. The redirect URI "${window.location.origin}/auth/callback" must be added to Authorized redirect URIs in Google Cloud Console.`
        )
      } else {
        setError(
          errorDescription ||
            (urlError === 'access_denied'
              ? 'Sign in was cancelled.'
              : `Authentication error: ${urlError}`)
        )
      }
      return
    }

    if (!code) {
      setStatus('error')
      setError('No authorization code was received from Google.')
      return
    }

    const cleanOrigin = window.location.origin.replace(/\/+$/, '')
    const redirectUri = `${cleanOrigin}/auth/callback`

    googleAuth({ code, redirectUri })
      .then((res) => {
        setStatus('success')
        setAuth(res.user, res.token)
        showToast(`Signed in with Google as ${res.user.name}`)

        // Determine destination target
        let target = '/'
        if (state) {
          try {
            target = decodeURIComponent(state)
          } catch {
            target = state
          }
        }

        if (res.isNewUser) {
          const onboarding = useOnboardingStore.getState()
          onboarding.triggerAfterRegister(res.user.id || (res.user as any).uid)

          const onboardingTarget =
            target && target !== '/'
              ? `/onboarding?redirect=${encodeURIComponent(target)}`
              : '/onboarding'
          router.push(onboardingTarget)
        } else {
          router.push(target || '/')
        }
      })
      .catch((err: any) => {
        setStatus('error')
        setError(err?.message || 'Failed to authenticate session with Google.')
      })
  }, [searchParams, router, setAuth, showToast])

  return (
    <div className="apple-auth-page">
      <div className="apple-auth-card">
        {status === 'verifying' && (
          <div className="text-center py-8">
            <div className="apple-spinner w-8 h-8 mx-auto mb-4" />
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 mb-1">
              Authenticating with Google
            </h2>
            <p className="text-xs text-neutral-500">Securing session and verifying identity...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 mb-1">
              Verified Successfully
            </h2>
            <p className="text-xs text-neutral-500">Redirecting you to your destination...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-center tracking-tight text-neutral-900 mb-2">
              Authentication Failed
            </h2>
            <div className="apple-auth-error-banner mb-6">
              <p className="text-xs">{error}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/login" className="apple-auth-submit-btn text-center block text-xs">
                Return to Sign In
              </Link>
              <Link href="/" className="apple-demo-fill-btn text-center block text-xs">
                Back to Storefront
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  )
}
