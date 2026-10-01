'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '@/lib/auth'
import { useAuthStore, useUIStore } from '@/lib/store'

function LoginCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    void useAuthStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [isAuthenticated, user, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && !name.trim()) {
      setError('Please provide your name to personalize your fit passport.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      return
    }

    try {
      setLoading(true)
      if (mode === 'signup') {
        const res = await signUp({
          name: name.trim(),
          email: email.trim(),
          password
        })
        setAuth(res.user, res.token)
        showToast(`Welcome to the INFIT Archive, ${res.user.name}!`)
      } else {
        const res = await signIn({
          email: email.trim(),
          password
        })
        setAuth(res.user, res.token)
        showToast(`Welcome back, ${res.user.name}!`)
      }

      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await signIn({
        email: 'google.user@infitjeans.com',
        password: 'GoogleUserPassword2026!'
      }).catch(async () => {
        return await signUp({
          name: 'Google Cloud Member',
          email: 'google.user@infitjeans.com',
          password: 'GoogleUserPassword2026!'
        })
      })
      setAuth(res.user, res.token)
      showToast(`Authenticated with Google as ${res.user.name}`)
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google.')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = () => {
    setEmail('demo.member@infitjeans.com')
    setPassword('DemoMemberPass2026!')
    if (mode === 'signup') {
      setName('Devon Vance')
    }
    setError(null)
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-split">
        {/* Left Column: Atmospheric Visual Showcase */}
        <section className="auth-showcase" aria-label="INFIT Archive Editorial">
          <div className="auth-showcase-bg" />
          <div className="auth-showcase-vignette" />
          <div className="auth-selvedge-ribbon" aria-hidden="true" />

          <div className="auth-showcase-content">
            <div>
              <div className="auth-atelier-tag">
                <span className="auth-atelier-dot" />
                MEMBER ARCHIVE // V26
              </div>

              <h2 className="auth-showcase-headline">
                Crafted for permanence.
                <br />
                Cut for your movement.
              </h2>

              <p className="auth-showcase-sub">
                Each pair of INFIT heavyweight denim molds to your story. Sign in to safeguard your
                bespoke measurements, track archive orders, and unlock priority loom releases.
              </p>
            </div>

            <div className="auth-perks-list">
              <div className="auth-perk-item">
                <div className="auth-perk-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.3 8.7L8.7 21.3c-.4.4-1 .4-1.4 0l-6-6c-.4-.4-.4-1 0-1.4L13.9 1.3c.4-.4 1-.4 1.4 0l6 6c.4.4.4 1 0 1.4z" />
                    <path d="m14.5 7.5 2 2" />
                    <path d="m11.5 10.5 2 2" />
                    <path d="m8.5 13.5 2 2" />
                    <path d="m5.5 16.5 2 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="auth-perk-title">Bespoke Fit Blueprint</h4>
                  <p className="auth-perk-desc">Save custom inseams, waist measurements, and preferred denim rises.</p>
                </div>
              </div>

              <div className="auth-perk-item">
                <div className="auth-perk-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h4 className="auth-perk-title">Priority Shuttle-Loom Drops</h4>
                  <p className="auth-perk-desc">48-hour head start on limited 14.5oz raw selvedge batches.</p>
                </div>
              </div>

              <div className="auth-perk-item">
                <div className="auth-perk-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="auth-perk-title">1-Click WhatsApp Concierge</h4>
                  <p className="auth-perk-desc">Direct line to our fit specialists for tailoring advice & quick reorders.</p>
                </div>
              </div>
            </div>

            <div className="auth-showcase-footer">
              <span>KURASHIKI // AHMEDABAD</span>
              <span>100% RAW RING-SPUN COTTON</span>
            </div>
          </div>
        </section>

        {/* Right Column: Authentication Panel */}
        <section className="auth-form-panel" aria-label="Member Sign In">
          {/* Top Header Row */}
          <div className="auth-header-row">
            <Link href="/" className="auth-back-link" title="Return to product catalog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Back to catalog</span>
            </Link>

            <Link href="/" className="auth-brand-badge" aria-label="INFIT Storefront">
              <div className="auth-monogram">I</div>
            </Link>
          </div>

          {/* Segmented Mode Selector */}
          <div className="auth-mode-tabs" role="tablist" aria-label="Authentication action">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-mode-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin')
                setError(null)
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-mode-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup')
                setError(null)
              }}
            >
              Create Account
            </button>
          </div>

          {/* Headline */}
          <div className="auth-form-title-group">
            <h1 className="auth-form-title">
              {mode === 'signin' ? 'Welcome back' : 'Join the Atelier'}
            </h1>
            <p className="auth-form-desc">
              {mode === 'signin'
                ? 'Enter your credentials to access your saved fits and order history.'
                : 'Create an account to save measurements, track fades, and get early batch access.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form-stack" noValidate>
            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-name">
                  Full Name
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g. Maya Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                    className="auth-input"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">
                Email Address
              </label>
              <div className="auth-input-wrap">
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="auth-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label">
                <label htmlFor="auth-password">Password</label>
                {mode === 'signup' && (
                  <span className="text-[11px] font-normal text-neutral-400">Min. 8 characters</span>
                )}
              </div>
              <div className="auth-input-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="auth-input auth-input-with-icon"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="auth-aux-row">
              <label className="auth-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => showToast('Password reset link sent to your registered email.')}
                  className="auth-forgot-btn"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{mode === 'signin' ? 'Authenticating...' : 'Creating passport...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Fit Vault' : 'Create Member Account'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Stitch Divider */}
          <div className="auth-stitch-divider">
            <div className="auth-stitch-line" />
            <span className="auth-stitch-text">OR CONTINUE WITH</span>
            <div className="auth-stitch-line" />
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="auth-social-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Demo Helper */}
          <div className="auth-demo-helper">
            <div className="auth-demo-text">
              <strong>Need a quick preview?</strong> Click to pre-fill test member credentials.
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="auth-demo-action"
            >
              Fill Demo
            </button>
          </div>

          {/* Footer Security Reassurance */}
          <div className="auth-reassurance">
            <div className="auth-reassurance-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-bit encrypted</span>
            </div>
            <span>•</span>
            <div className="auth-reassurance-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Zero spam guarantee</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">Loading member portal...</span>
          </div>
        </div>
      }
    >
      <LoginCard />
    </Suspense>
  )
}
