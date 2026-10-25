'use client'

import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { signUp, googleAuth, getGoogleOAuthUrl, getGoogleClientId } from '@/lib/auth'
import { useAuthStore, useUIStore, useOnboardingStore } from '@/lib/store'
import { AuthFormSkeleton } from '@/components/skeletons/StorefrontSkeletons'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const isSubmittingRef = useRef(false)

  const redirectParam = searchParams.get('redirect')

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
    void useOnboardingStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (isSubmittingRef.current) return
    if (isAuthenticated && user) {
      const redirect = redirectParam || '/'
      router.push(redirect)
    }
  }, [isAuthenticated, user, router, redirectParam])

  // Live password strength calculation
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    return { score, label: labels[score] || '' }
  }, [password])

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

      // Trigger onboarding for new member setup with uid
      const onboarding = useOnboardingStore.getState()
      const uid = res.user.id ? String(res.user.id) : (res.user as { uid?: string }).uid
      onboarding.triggerAfterRegister(uid)

      const target =
        redirectParam && redirectParam !== '/'
          ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
          : '/onboarding'

      router.push(target)
    } catch (err: any) {
      isSubmittingRef.current = false
      setError(err?.message || 'Registration failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Google One-Tap & Identity Services initialization
  useEffect(() => {
    if (typeof window === 'undefined') return
    const clientId = getGoogleClientId()
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
          const uid = res.user.id ? String(res.user.id) : (res.user as { uid?: string }).uid
          onboarding.triggerAfterRegister(uid)

          const target =
            redirectParam && redirectParam !== '/'
              ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
              : '/onboarding'
          router.push(target)
          return
        }

        const redirect = redirectParam || '/'
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
  }, [router, redirectParam, setAuth, showToast])

  const handleGoogleSignUp = () => {
    setError(null)
    setLoading(true)
    try {
      isSubmittingRef.current = true
      const oauthUrl = getGoogleOAuthUrl(undefined, redirectParam || '/')
      window.location.href = oauthUrl
    } catch (err: any) {
      isSubmittingRef.current = false
      setLoading(false)
      setError(err?.message || 'Failed to initiate Google sign up.')
    }
  }

  return (
    <div className="w-full">
      {/* Brand Logo - Aligned to top-left of the form across from model's head */}
      <div className="mb-6">
        <Link
          href="/"
          aria-label="TEESGARAGE Home"
          className="inline-block transition-opacity hover:opacity-80"
        >
          <Image
            src="/teesgarage-logo.svg"
            alt="TEESGARAGE"
            width={195}
            height={57}
            priority
            className="h-10 sm:h-11 w-auto text-black object-contain -ml-0.5"
          />
        </Link>
      </div>

      {/* Heading & Subtitle */}
      <div className="mb-7">
        <h1 className="text-3xl sm:text-[34px] font-bold tracking-tight text-zinc-950 mb-1.5 leading-tight">
          Create account
        </h1>
        <p className="text-zinc-500 text-sm font-normal">Sign up for your Teesgarage account.</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200/90 bg-rose-50/90 p-3.5 text-xs text-rose-800 animate-auth-enter">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Continue with Google */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full border border-zinc-200/90 hover:bg-zinc-50/80 active:scale-[0.98] bg-white text-zinc-800 text-sm font-medium py-3 px-4 rounded-xl transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
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
        <span>Continue with Google</span>
      </button>

      {/* OR Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="border-t border-zinc-200/90 w-full" />
        <span className="bg-white px-3 text-[11px] font-medium tracking-wider text-zinc-400 absolute uppercase">
          OR
        </span>
      </div>

      {/* Register Form */}
      <form
        key={error || 'form'}
        onSubmit={handleSubmit}
        noValidate
        className={`space-y-4 ${error ? 'animate-error-shake' : ''}`}
      >
        {/* Full Name */}
        <div>
          <label htmlFor="register-name" className="block text-xs font-semibold text-zinc-800 mb-2">
            Full name
          </label>
          <div className="group relative flex items-center border border-zinc-200/90 rounded-xl bg-zinc-50/40 hover:bg-zinc-50/80 focus-within:bg-white focus-within:border-zinc-950 focus-within:ring-1 focus-within:ring-zinc-950 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xs">
            <User className="w-4 h-4 text-zinc-400 shrink-0 ml-3.5 pointer-events-none transition-all duration-150 group-focus-within:text-zinc-950 group-focus-within:scale-105" />
            <input
              id="register-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              autoComplete="name"
              className="w-full bg-transparent py-3 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold text-zinc-800 mb-2"
          >
            Email address
          </label>
          <div className="group relative flex items-center border border-zinc-200/90 rounded-xl bg-zinc-50/40 hover:bg-zinc-50/80 focus-within:bg-white focus-within:border-zinc-950 focus-within:ring-1 focus-within:ring-zinc-950 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xs">
            <Mail className="w-4 h-4 text-zinc-400 shrink-0 ml-3.5 pointer-events-none transition-all duration-150 group-focus-within:text-zinc-950 group-focus-within:scale-105" />
            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
              className="w-full bg-transparent py-3 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-zinc-800 mb-2"
          >
            Password
          </label>
          <div className="group relative flex items-center border border-zinc-200/90 rounded-xl bg-zinc-50/40 hover:bg-zinc-50/80 focus-within:bg-white focus-within:border-zinc-950 focus-within:ring-1 focus-within:ring-zinc-950 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xs">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0 ml-3.5 pointer-events-none transition-all duration-150 group-focus-within:text-zinc-950 group-focus-within:scale-105" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="new-password"
              className="w-full bg-transparent py-3 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="mr-3.5 text-zinc-400 hover:text-zinc-700 transition-colors duration-150 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 4-segment password strength meter */}
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-auth-enter">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((seg) => {
                  let fill = 'bg-zinc-200'
                  if (seg <= strength.score) {
                    if (strength.score === 1) fill = 'bg-rose-500'
                    else if (strength.score === 2) fill = 'bg-amber-500'
                    else if (strength.score === 3) fill = 'bg-emerald-500'
                    else fill = 'bg-emerald-600'
                  }
                  return (
                    <div
                      key={seg}
                      className={`h-1 rounded-full transition-colors duration-200 ${fill}`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-500">
                <span>Password strength</span>
                <span className="font-medium text-zinc-700">{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-xs font-semibold text-zinc-800 mb-2"
          >
            Confirm password
          </label>
          <div className="group relative flex items-center border border-zinc-200/90 rounded-xl bg-zinc-50/40 hover:bg-zinc-50/80 focus-within:bg-white focus-within:border-zinc-950 focus-within:ring-1 focus-within:ring-zinc-950 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xs">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0 ml-3.5 pointer-events-none transition-all duration-150 group-focus-within:text-zinc-950 group-focus-within:scale-105" />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="new-password"
              className="w-full bg-transparent py-3 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="mr-3.5 text-zinc-400 hover:text-zinc-700 transition-colors duration-150 focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Inline match indicator */}
          {confirmPassword.length > 0 && (
            <p
              className={`mt-1.5 text-xs font-medium transition-colors duration-150 ${
                password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#121212] hover:bg-black active:scale-[0.98] text-white text-sm font-medium py-3.5 px-4 rounded-xl transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation Link */}
      <div className="mt-8 text-center text-xs text-zinc-500">
        Already have an account?{' '}
        <Link
          href={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
          className="text-zinc-950 font-semibold underline underline-offset-2 hover:text-black transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
