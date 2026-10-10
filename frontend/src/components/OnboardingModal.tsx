'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  MapPin,
  Ruler,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react'
import {
  useOnboardingStore,
  useAuthStore,
  usePreferencesStore,
  useUIStore,
  type FitPreferences
} from '@/lib/store'
import type { Fit } from '@/lib/constants'

const WAIST_OPTIONS = [
  { size: '28', cm: '71 cm', label: '28"' },
  { size: '30', cm: '76 cm', label: '30"' },
  { size: '32', cm: '81 cm', label: '32"' },
  { size: '34', cm: '86 cm', label: '34"' },
  { size: '36', cm: '91 cm', label: '36"' },
  { size: '38', cm: '96 cm', label: '38"' }
]

const TOP_OPTIONS = [
  { size: 'XS', chest: '34–36" Chest' },
  { size: 'S', chest: '36–38" Chest' },
  { size: 'M', chest: '38–40" Chest' },
  { size: 'L', chest: '40–42" Chest' },
  { size: 'XL', chest: '42–44" Chest' },
  { size: 'XXL', chest: '44–46" Chest' }
]

const FIT_OPTIONS: Array<{
  fit: Fit
  tagline: string
  desc: string
}> = [
  {
    fit: 'Straight',
    tagline: 'Timeless Standard',
    desc: 'Balanced 16" cuff leg opening from hip to hem. The versatile studio essential.'
  },
  {
    fit: 'Baggy',
    tagline: 'Skate & Street Drape',
    desc: 'Deep rise with relaxed thigh and generous stack over sneakers.'
  },
  {
    fit: 'Wide',
    tagline: 'Architectural Voluminous',
    desc: 'Dramatic full-leg silhouette tailored from Japanese selvedge-inspired block.'
  },
  {
    fit: 'Relaxed',
    tagline: 'Easy-Going Taper',
    desc: 'Generous room through seat and thigh with a modern, gentle taper toward the hem.'
  },
  {
    fit: 'Bootcut',
    tagline: 'Subtle Flare Break',
    desc: 'Slight flare starting at the knee designed to break cleanly over footwear.'
  }
]

const INSEAM_OPTIONS = [
  { length: '30', label: '30" (Crop / Under 5\'8")', desc: 'Clean zero-break hem' },
  { length: '32', label: '32" (Standard / 5\'8"–6\'1")', desc: 'Subtle classic break' },
  { length: '34', label: '34" (Stacked / 6\'1"+)', desc: 'Pronounced denim stacking' }
]

const COMFORT_OPTIONS: Array<{
  key: FitPreferences['comfortFit']
  label: string
  desc: string
}> = [
  {
    key: 'snug',
    label: 'Contoured & Snug',
    desc: 'Firm waistband fit, structured silhouette with zero excess drape.'
  },
  {
    key: 'true-to-size',
    label: 'True to Size',
    desc: 'Standard atelier proportions for accurate everyday sizing.'
  },
  {
    key: 'relaxed',
    label: 'Roomy & Relaxed',
    desc: 'Extra breathing room throughout waistband and legs for relaxed comfort.'
  }
]

interface OnboardingModalProps {
  standalone?: boolean
}

export default function OnboardingModal({ standalone = false }: OnboardingModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    isOpen,
    step,
    hasCompletedOnboarding,
    hasSkippedOnboarding,
    closeOnboarding,
    completeOnboarding,
    skipOnboarding,
    setStep
  } = useOnboardingStore()

  const { addresses, addAddress, user } = useAuthStore()
  const { preferences, updatePreferences } = usePreferencesStore()
  const showToast = useUIStore((s) => s.showToast)

  // Step 1: Address form states
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]
  const [fullName, setFullName] = useState(user?.name || defaultAddr?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || defaultAddr?.phone || '')
  const [addressLine, setAddressLine] = useState(defaultAddr?.addressLine || '')
  const [city, setCity] = useState(defaultAddr?.city || '')
  const [stateName, setStateName] = useState(defaultAddr?.state || '')
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '')
  const [isDefault, setIsDefault] = useState(true)
  const [addressError, setAddressError] = useState<string | null>(null)

  // Step 2: Fit & Size preference states
  const [waistSize, setWaistSize] = useState(preferences.waistSize || '32')
  const [topSize, setTopSize] = useState(preferences.topSize || 'M')
  const [preferredFit, setPreferredFit] = useState<Fit>(preferences.preferredFit || 'Baggy')
  const [inseam, setInseam] = useState(preferences.inseam || '32')
  const [comfortFit, setComfortFit] = useState<FitPreferences['comfortFit']>(
    preferences.comfortFit || 'relaxed'
  )

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    void useOnboardingStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void usePreferencesStore.persist.rehydrate()
  }, [])

  // Auto-open for first-time visitors who haven't completed or skipped onboarding
  useEffect(() => {
    if (!mounted || standalone || pathname === '/onboarding') return
    const hasSeen = hasCompletedOnboarding || hasSkippedOnboarding
    if (!hasSeen) {
      // Gentle delay for non-jarring entrance
      const timer = setTimeout(() => {
        useOnboardingStore.getState().openOnboarding(1)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [mounted, standalone, pathname, hasCompletedOnboarding, hasSkippedOnboarding])

  const handleGlobalSkip = React.useCallback(() => {
    skipOnboarding()
    showToast('Setup skipped. You can update address & sizing anytime in your Profile.')
    if (standalone) {
      router.push('/shop')
    }
  }, [skipOnboarding, showToast, standalone, router])

  // ESC to skip/close modal
  useEffect(() => {
    if (!isOpen || standalone) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleGlobalSkip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, standalone, handleGlobalSkip])

  const handleStep1Skip = () => {
    // Skip address step directly to Step 2
    setAddressError(null)
    setStep(2)
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setAddressError(null)

    // If user filled at least some address info, validate and save
    if (fullName.trim() && phone.trim() && addressLine.trim() && city.trim() && pincode.trim()) {
      addAddress({
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        state: stateName.trim() || 'India',
        pincode: pincode.trim(),
        isDefault
      })
      showToast('Delivery address saved')
      setStep(2)
    } else {
      setAddressError('Please fill in your name, phone, address, city, and pincode, or click Skip.')
    }
  }

  const handleStep2Submit = () => {
    updatePreferences({
      waistSize,
      topSize,
      preferredFit,
      inseam,
      comfortFit
    })
    completeOnboarding()
    showToast('Size profile saved! Recommended sizes are now auto-selected.')
    if (standalone) {
      router.push('/shop')
    }
  }

  if (!mounted) return null
  if (!standalone && pathname === '/onboarding') return null
  if (!isOpen && !standalone) return null

  const content = (
    <div className={`onboarding-modal-card ${standalone ? 'standalone' : ''}`}>
      {/* Header bar with Stepper & Skip Option */}
      <div className="onboarding-header">
        <div className="onboarding-brand-group">
          <div className="onboarding-badge">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>TEESGARAGE STUDIO SETUP</span>
          </div>
          <div className="onboarding-step-counter">
            Step {step} of 2
          </div>
        </div>

        {/* Global Skip Button - Prominently visible as requested */}
        <div className="onboarding-header-actions">
          <button
            type="button"
            className="onboarding-skip-pill"
            onClick={handleGlobalSkip}
            title="Skip onboarding for now"
          >
            <span>Skip for now</span>
            <X className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Visual Stepper Indicators */}
      <div className="onboarding-stepper-track" role="tablist">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`onboarding-step-tab ${step === 1 ? 'active' : 'completed'}`}
        >
          <span className="step-tab-num">1</span>
          <span className="step-tab-label">Delivery Destination</span>
          {step === 2 && <Check className="w-3.5 h-3.5 ml-1 text-emerald-600" />}
        </button>

        <div className="onboarding-step-connector" />

        <button
          type="button"
          onClick={() => setStep(2)}
          className={`onboarding-step-tab ${step === 2 ? 'active' : ''}`}
        >
          <span className="step-tab-num">2</span>
          <span className="step-tab-label">Fit &amp; Sizing Profile</span>
        </button>
      </div>

      {/* Modal Body */}
      <div className="onboarding-body">
        {step === 1 && (
          <div className="onboarding-step-content animate-fade-in">
            <div className="onboarding-step-title-wrap">
              <div className="onboarding-step-icon-bubble">
                <MapPin className="w-5 h-5 text-zinc-900" />
              </div>
              <div>
                <h2 className="onboarding-title">Where should we deliver your denim?</h2>
                <p className="onboarding-desc">
                  Save your primary delivery destination once for instant 1-tap WhatsApp checkout and tracked express dispatch.
                </p>
              </div>
            </div>

            {addressError && (
              <div className="onboarding-alert-error">
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleStep1Submit} className="onboarding-form">
              <div className="onboarding-form-grid">
                <div className="onboarding-field">
                  <label className="onboarding-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Devon Vance"
                    className="onboarding-input"
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98201 44521"
                    className="onboarding-input"
                  />
                </div>
              </div>

              <div className="onboarding-field">
                <label className="onboarding-label">Street Address / Flat / Floor / Landmark *</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat 402, Sea Green Apartments, Perry Cross Road"
                  className="onboarding-input"
                />
              </div>

              <div className="onboarding-form-grid-3">
                <div className="onboarding-field">
                  <label className="onboarding-label">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="onboarding-input"
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">State / Region *</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Maharashtra"
                    className="onboarding-input"
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="400050"
                    className="onboarding-input"
                  />
                </div>
              </div>

              <div className="onboarding-checkbox-row">
                <input
                  type="checkbox"
                  id="onboarding-default-addr"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="onboarding-checkbox"
                />
                <label htmlFor="onboarding-default-addr" className="onboarding-checkbox-label">
                  Set as default shipping address for all future studio orders
                </label>
              </div>

              {/* Bottom Actions with prominent SKIP */}
              <div className="onboarding-actions-footer">
                <button
                  type="button"
                  onClick={handleStep1Skip}
                  className="onboarding-btn-skip"
                >
                  Skip Address Step
                </button>

                <button
                  type="submit"
                  className="onboarding-btn-primary"
                >
                  <span>Continue to Size Preference</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step-content animate-fade-in">
            <div className="onboarding-step-title-wrap">
              <div className="onboarding-step-icon-bubble">
                <Ruler className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="onboarding-title">Your Signature Fit &amp; Size Preference</h2>
                <p className="onboarding-desc">
                  Select your size profile. We will automatically pre-select these options when browsing jeans and apparel.
                </p>
              </div>
            </div>

            <div className="onboarding-pref-groups">
              {/* Waist Size Options */}
              <div className="onboarding-pref-section">
                <div className="onboarding-pref-header">
                  <span className="onboarding-pref-title">Denim Waist Size</span>
                  <span className="onboarding-pref-cur">Selected: {waistSize}&quot;</span>
                </div>
                <div className="onboarding-chips-grid">
                  {WAIST_OPTIONS.map((opt) => (
                    <button
                      key={opt.size}
                      type="button"
                      onClick={() => setWaistSize(opt.size)}
                      className={`onboarding-chip ${waistSize === opt.size ? 'active' : ''}`}
                    >
                      <span className="chip-primary">{opt.label}</span>
                      <span className="chip-sub">{opt.cm}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Size Options */}
              <div className="onboarding-pref-section">
                <div className="onboarding-pref-header">
                  <span className="onboarding-pref-title">Tees &amp; Tops Size</span>
                  <span className="onboarding-pref-cur">Selected: {topSize}</span>
                </div>
                <div className="onboarding-chips-grid-6">
                  {TOP_OPTIONS.map((opt) => (
                    <button
                      key={opt.size}
                      type="button"
                      onClick={() => setTopSize(opt.size)}
                      className={`onboarding-chip ${topSize === opt.size ? 'active' : ''}`}
                    >
                      <span className="chip-primary">{opt.size}</span>
                      <span className="chip-sub truncate">{opt.chest}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Denim Silhouette */}
              <div className="onboarding-pref-section">
                <div className="onboarding-pref-header">
                  <span className="onboarding-pref-title">Signature Denim Silhouette</span>
                  <span className="onboarding-pref-cur">Cut: {preferredFit}</span>
                </div>
                <div className="onboarding-cuts-grid">
                  {FIT_OPTIONS.map((opt) => (
                    <button
                      key={opt.fit}
                      type="button"
                      onClick={() => setPreferredFit(opt.fit)}
                      className={`onboarding-cut-card ${preferredFit === opt.fit ? 'active' : ''}`}
                    >
                      <div className="cut-card-top">
                        <span className="cut-card-title">{opt.fit}</span>
                        {preferredFit === opt.fit && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                      </div>
                      <span className="cut-card-tag">{opt.tagline}</span>
                      <p className="cut-card-desc">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inseam & Comfort Grid */}
              <div className="onboarding-pref-2col">
                <div className="onboarding-pref-section">
                  <div className="onboarding-pref-header">
                    <span className="onboarding-pref-title">Inseam Length</span>
                    <span className="onboarding-pref-cur">{inseam}&quot;</span>
                  </div>
                  <div className="onboarding-chips-col">
                    {INSEAM_OPTIONS.map((opt) => (
                      <button
                        key={opt.length}
                        type="button"
                        onClick={() => setInseam(opt.length)}
                        className={`onboarding-chip-row ${inseam === opt.length ? 'active' : ''}`}
                      >
                        <span className="chip-row-title">{opt.label}</span>
                        <span className="chip-row-sub">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="onboarding-pref-section">
                  <div className="onboarding-pref-header">
                    <span className="onboarding-pref-title">Comfort Feel</span>
                    <span className="onboarding-pref-cur">{comfortFit}</span>
                  </div>
                  <div className="onboarding-chips-col">
                    {COMFORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setComfortFit(opt.key)}
                        className={`onboarding-chip-row ${comfortFit === opt.key ? 'active' : ''}`}
                      >
                        <span className="chip-row-title">{opt.label}</span>
                        <span className="chip-row-sub">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions with prominent SKIP */}
            <div className="onboarding-actions-footer">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="onboarding-btn-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span>Address</span>
                </button>
                <button
                  type="button"
                  onClick={handleGlobalSkip}
                  className="onboarding-btn-skip"
                >
                  Skip for now
                </button>
              </div>

              <button
                type="button"
                onClick={handleStep2Submit}
                className="onboarding-btn-primary"
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>Complete Setup &amp; Start Shopping</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (standalone) {
    return (
      <div className="onboarding-standalone-container">
        {content}
      </div>
    )
  }

  return (
    <div
      className="onboarding-modal-scrim"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleGlobalSkip()
        }
      }}
    >
      {content}
    </div>
  )
}
