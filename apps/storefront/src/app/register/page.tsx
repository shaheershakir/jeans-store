'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Check
} from 'lucide-react'
import { signUp, signIn, googleAuth, getGoogleOAuthUrl } from '@/lib/auth'
import { useAuthStore, useUIStore, useOnboardingStore } from '@/lib/store'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useOnboardingStore.persist.rehydrate()
  }, [])

  const isSubmittingRef = React.useRef(false)

  // If already authenticated on initial mount, redirect away
  useEffect(() => {
    if (isSubmittingRef.current) return
    if (isAuthenticated && user) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [isAuthenticated, user, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please provide your full name.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service to create your account.')
      return
    }

    try {
      setLoading(true)
      isSubmittingRef.current = true
      const res = await signUp({
        name: name.trim(),
        email: email.trim(),
        password
      })

      setAuth(res.user, res.token)
      showToast(`Welcome to TEESGARAGE, ${res.user.name}!`)

      // Trigger onboarding for new member setup
      const onboarding = useOnboardingStore.getState()
      onboarding.triggerAfterRegister()

      // Redirect immediately to onboarding after registration
      const redirectParam = searchParams.get('redirect')
      const target = redirectParam && redirectParam !== '/'
        ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
        : '/onboarding'

      router.push(target)
    } catch (err: any) {
      isSubmittingRef.current = false
      setError(err?.message || 'Registration failed. Please try a different email.')
    } finally {
      setLoading(false)
    }
  }

  // Initialize Google Identity Services (One Tap & Credential API) if available
  useEffect(() => {
    if (typeof window === 'undefined') return
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    if (!clientId) return

    const handleCredentialResponse = async (response: any) => {
      if (!response?.credential) return
      setLoading(true)
      try {
        isSubmittingRef.current = true
        const res = await googleAuth({ credential: response.credential })
        setAuth(res.user, res.token)
        showToast(`Signed up with Google as ${res.user.name}`)

        if (res.isNewUser) {
          const onboarding = useOnboardingStore.getState()
          onboarding.triggerAfterRegister()

          const redirectParam = searchParams.get('redirect')
          const target = redirectParam && redirectParam !== '/'
            ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
            : '/onboarding'
          router.push(target)
          return
        }

        const redirect = searchParams.get('redirect') || '/'
        router.push(redirect)
      } catch (err: any) {
        isSubmittingRef.current = false
        setError(err?.message || 'Google authentication failed.')
      } finally {
        setLoading(false)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      try {
        // @ts-ignore
        if (window.google?.accounts?.id) {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          })
        }
      } catch {
        // Safe fallback
      }
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [router, searchParams, setAuth, showToast])

  const handleGoogleSignUp = () => {
    setError(null)
    setLoading(true)
    try {
      isSubmittingRef.current = true
      const redirectParam = searchParams.get('redirect') || '/'
      const oauthUrl = getGoogleOAuthUrl(undefined, redirectParam)
      window.location.href = oauthUrl
    } catch (err: any) {
      isSubmittingRef.current = false
      setLoading(false)
      setError(err?.message || 'Failed to initiate Google sign up.')
    }
  }

  return (
    <div className="apple-auth-page">
      {/* Centered Single-Column Apple Auth Card */}
      <div className="apple-auth-card">
        {/* Navigation & Brand Header */}
        <div className="apple-auth-nav-header">
          <Link href="/" className="apple-auth-back-btn" title="Back to storefront">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Storefront</span>
          </Link>

          <Link href="/" aria-label="TEESGARAGE Home">
            <Image
              src="/teesgarage_logo.svg"
              alt="TEESGARAGE"
              width={140}
              height={40}
              priority
              className="apple-auth-brand-logo"
            />
          </Link>
        </div>

        {/* Title Group */}
        <div className="apple-auth-title-group">
          <h1 className="apple-auth-title">Create your TEESGARAGE account</h1>
          <p className="apple-auth-subtitle">
            Sign up for personalized streetwear fits, fast express checkout, and tracked dispatch.
          </p>
        </div>

        {/* Navigation Segmented Control */}
        <div className="apple-segmented-control auth-segmented" role="tablist">
          <Link
            href={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
            role="tab"
            aria-selected={false}
            className="apple-segment-item"
          >
            <span>Sign In</span>
          </Link>
          <div
            role="tab"
            aria-selected={true}
            className="apple-segment-item active"
          >
            <span>Create Account</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="apple-auth-error-banner" role="alert">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Stack */}
        <form onSubmit={handleSubmit} className="apple-auth-form" noValidate>
          {/* Full Name */}
          <div className="apple-form-field">
            <label htmlFor="register-name" className="apple-form-label">
              Full Name
            </label>
            <div className="apple-input-container">
              <User className="apple-input-icon" />
              <input
                id="register-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                className="apple-form-input has-icon"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="apple-form-field">
            <label htmlFor="register-email" className="apple-form-label">
              Email Address
            </label>
            <div className="apple-input-container">
              <Mail className="apple-input-icon" />
              <input
                id="register-email"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="apple-form-input has-icon"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="apple-form-field">
            <label htmlFor="register-password" className="apple-form-label">
              Password
            </label>
            <div className="apple-input-container">
              <Lock className="apple-input-icon" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="apple-form-input has-icon has-eye"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="apple-input-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="apple-form-field">
            <label htmlFor="register-confirm-password" className="apple-form-label">
              Confirm Password
            </label>
            <div className="apple-input-container">
              <Lock className="apple-input-icon" />
              <input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className="apple-form-input has-icon"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Terms Agreement & Encryption note */}
          <div className="apple-auth-meta-row">
            <label className="apple-checkbox-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="apple-checkbox"
              />
              <span>I agree to Terms &amp; Privacy</span>
            </label>
            <span className="apple-security-note">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              <span>Encrypted</span>
            </span>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="apple-auth-submit-btn"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="apple-spinner" />
                <span>Creating Account...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Create Account &amp; Continue</span>
              </span>
            )}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && <>
        <div className="apple-auth-divider">
          <span>or sign up with</span>
        </div>
        <div className="apple-auth-alt-group">
          <button
            type="button"
            className="apple-google-btn"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2.5">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

        </div>
        </>}

        {/* Existing account prompt */}
        <div className="mt-5 text-center font-ui text-xs text-zinc-500">
          Already have a TEESGARAGE account?{' '}
          <Link
            href={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
            className="text-zinc-900 font-semibold hover:underline"
          >
            Sign in here
          </Link>
        </div>

        {/* Footer Guarantee */}
        <p className="apple-auth-footer-note">
          By registering, you agree to TEESGARAGE&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

import { AuthSkeleton } from '@/components/skeletons'

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton mode="signup" />}>
      <RegisterForm />
    </Suspense>
  )
}

