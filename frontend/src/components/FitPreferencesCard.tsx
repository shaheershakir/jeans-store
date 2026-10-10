'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Ruler,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import {
  usePreferencesStore,
  useUIStore,
  DEFAULT_PREFERENCES,
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
    desc: 'Deep rise with relaxed thigh and generous stack over low or high-top sneakers.'
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
    desc: 'Slight flare starting at the knee designed to break cleanly over chunky footwear.'
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

interface FitPreferencesCardProps {
  standalone?: boolean
}

export default function FitPreferencesCard({ standalone = false }: FitPreferencesCardProps) {
  const preferences = usePreferencesStore((s) => s.preferences)
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences)
  const resetPreferences = usePreferencesStore((s) => s.resetPreferences)
  const showToast = useUIStore((s) => s.showToast)

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null)

  useEffect(() => {
    void usePreferencesStore.persist.rehydrate()
  }, [])

  const triggerFeedback = (message: string) => {
    setSavedFeedback(message)
    showToast(message)
    setTimeout(() => setSavedFeedback(null), 3000)
  }

  const handleSelectWaist = (waist: string) => {
    updatePreferences({ waistSize: waist })
    triggerFeedback(`Waist size ${waist}" auto-selected on all jeans & trousers`)
  }

  const handleSelectTop = (top: string) => {
    updatePreferences({ topSize: top })
    triggerFeedback(`Top size ${top} auto-selected on tees, shirts & hoodies`)
  }

  const handleSelectFit = (fit: Fit) => {
    updatePreferences({ preferredFit: fit })
    triggerFeedback(`Signature silhouette set to ${fit}`)
  }

  const handleSelectInseam = (inseam: string) => {
    updatePreferences({ inseam })
    triggerFeedback(`Inseam preference set to ${inseam}"`)
  }

  const handleSelectComfort = (comfort: FitPreferences['comfortFit']) => {
    updatePreferences({ comfortFit: comfort })
    triggerFeedback(`Comfort feel updated to ${comfort.replace('-', ' ')}`)
  }

  const handleReset = () => {
    resetPreferences()
    triggerFeedback('Fit & size preferences reset to default studio specifications')
  }

  return (
    <div className={`apple-detail-card ${standalone ? 'apple-detail-card-standalone' : ''}`}>
      {/* ── Card Header ── */}
      <div className="apple-card-header">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="fit-studio-pill">
            <Ruler className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>Smart Sizing Studio</span>
          </span>
          <span className="fit-auto-pill">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Auto-Applied on Products</span>
          </span>
        </div>
        <h1 className="apple-card-title">Fit &amp; Size Preferences</h1>
        <p className="apple-card-subtitle">
          Configure your body proportions and silhouette style once. We automatically select your exact waist, inseam, and top sizes whenever you open any product page.
        </p>
      </div>

      {/* ── Live Feedback Banner ── */}
      {savedFeedback && (
        <div className="apple-status-toast" role="status">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* ── Active Profile Snapshot Card ── */}
      <div className="fit-active-snapshot-card">
        <div className="fit-snapshot-header">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="fit-snapshot-title">Active Sizing Profile</span>
          </div>
          <span className="fit-snapshot-status">
            <span className="fit-snapshot-dot" />
            Active on Storefront
          </span>
        </div>

        <div className="fit-snapshot-grid">
          <div className="fit-snapshot-item">
            <span className="fit-snapshot-label">Waist (Bottoms)</span>
            <strong className="fit-snapshot-value">{preferences.waistSize}&quot;</strong>
            <span className="fit-snapshot-sub">
              {WAIST_OPTIONS.find((w) => w.size === preferences.waistSize)?.cm || ''}
            </span>
          </div>

          <div className="fit-snapshot-item">
            <span className="fit-snapshot-label">Tops &amp; Tees</span>
            <strong className="fit-snapshot-value">{preferences.topSize}</strong>
            <span className="fit-snapshot-sub">
              {TOP_OPTIONS.find((t) => t.size === preferences.topSize)?.chest || ''}
            </span>
          </div>

          <div className="fit-snapshot-item">
            <span className="fit-snapshot-label">Signature Cut</span>
            <strong className="fit-snapshot-value">{preferences.preferredFit}</strong>
            <span className="fit-snapshot-sub">Preferred silhouette</span>
          </div>

          <div className="fit-snapshot-item">
            <span className="fit-snapshot-label">Inseam</span>
            <strong className="fit-snapshot-value">{preferences.inseam}&quot;</strong>
            <span className="fit-snapshot-sub">Leg length</span>
          </div>
        </div>
      </div>

      {/* ── Section 1: Bottoms & Denim Waist Size ── */}
      <div className="fit-section">
        <div className="fit-section-header">
          <div className="fit-section-info">
            <h2 className="fit-section-title">1. Bottoms &amp; Denim Waist Size</h2>
            <p className="fit-section-desc">
              Your exact waist size in inches. Denim waistbands are sanforized and true to size.
            </p>
          </div>
          <span className="fit-selected-indicator">
            Selected: <strong>{preferences.waistSize}&quot;</strong>
          </span>
        </div>

        <div className="fit-waist-grid" role="radiogroup" aria-label="Waist size options">
          {WAIST_OPTIONS.map((opt) => {
            const isSelected = preferences.waistSize === opt.size
            return (
              <button
                key={opt.size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectWaist(opt.size)}
                className={`fit-waist-btn ${isSelected ? 'active' : ''}`}
              >
                <div className="fit-waist-top">
                  <span className="fit-waist-num">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </div>
                <span className="fit-waist-cm">{opt.cm}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section 2: Tops, Shirts & Hoodies ── */}
      <div className="fit-section">
        <div className="fit-section-header">
          <div className="fit-section-info">
            <h2 className="fit-section-title">2. Tops, T-Shirts &amp; Outerwear Size</h2>
            <p className="fit-section-desc">
              Alpha sizing for boxy tees, vintage heavyweight jackets, and overshirts.
            </p>
          </div>
          <span className="fit-selected-indicator">
            Selected: <strong>{preferences.topSize}</strong>
          </span>
        </div>

        <div className="fit-tops-grid" role="radiogroup" aria-label="Top size options">
          {TOP_OPTIONS.map((opt) => {
            const isSelected = preferences.topSize === opt.size
            return (
              <button
                key={opt.size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectTop(opt.size)}
                className={`fit-top-btn ${isSelected ? 'active' : ''}`}
              >
                <div className="fit-top-header">
                  <span className="fit-top-size">{opt.size}</span>
                  {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                </div>
                <span className="fit-top-chest">{opt.chest}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section 3: Signature Denim Silhouette ── */}
      <div className="fit-section">
        <div className="fit-section-header">
          <div className="fit-section-info">
            <h2 className="fit-section-title">3. Signature Denim Silhouette</h2>
            <p className="fit-section-desc">
              Choose your go-to cut. We emphasize matching silhouettes when recommending garments.
            </p>
          </div>
          <span className="fit-selected-indicator">
            Selected: <strong>{preferences.preferredFit}</strong>
          </span>
        </div>

        <div className="fit-cuts-grid" role="radiogroup" aria-label="Denim cut options">
          {FIT_OPTIONS.map((opt) => {
            const isSelected = preferences.preferredFit === opt.fit
            return (
              <button
                key={opt.fit}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectFit(opt.fit)}
                className={`fit-cut-card ${isSelected ? 'active' : ''}`}
              >
                <div className="fit-cut-header">
                  <div>
                    <h3 className="fit-cut-name">{opt.fit}</h3>
                    <span className="fit-cut-tagline">{opt.tagline}</span>
                  </div>
                  <div className={`fit-cut-radio ${isSelected ? 'active' : ''}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="fit-cut-desc">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section 4: Inseam Length ── */}
      <div className="fit-section">
        <div className="fit-section-header">
          <div className="fit-section-info">
            <h2 className="fit-section-title">4. Inseam Length</h2>
            <p className="fit-section-desc">
              Distance from the crotch point to the cuff hem. Influences stacking behavior over shoes.
            </p>
          </div>
          <span className="fit-selected-indicator">
            Selected: <strong>{preferences.inseam}&quot;</strong>
          </span>
        </div>

        <div className="fit-inseam-grid" role="radiogroup" aria-label="Inseam length options">
          {INSEAM_OPTIONS.map((opt) => {
            const isSelected = preferences.inseam === opt.length
            return (
              <button
                key={opt.length}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectInseam(opt.length)}
                className={`fit-inseam-btn ${isSelected ? 'active' : ''}`}
              >
                <div className="fit-inseam-top">
                  <span className="fit-inseam-label">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </div>
                <span className="fit-inseam-desc">{opt.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section 5: Comfort & Silhouette Feel ── */}
      <div className="fit-section">
        <div className="fit-section-header">
          <div className="fit-section-info">
            <h2 className="fit-section-title">5. Comfort &amp; Silhouette Feel</h2>
            <p className="fit-section-desc">
              How you prefer garments to fit around your waist and thighs.
            </p>
          </div>
          <span className="fit-selected-indicator">
            Selected:{' '}
            <strong className="capitalize">{preferences.comfortFit.replace('-', ' ')}</strong>
          </span>
        </div>

        <div className="fit-comfort-grid" role="radiogroup" aria-label="Comfort feel options">
          {COMFORT_OPTIONS.map((opt) => {
            const isSelected = preferences.comfortFit === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectComfort(opt.key)}
                className={`fit-comfort-card ${isSelected ? 'active' : ''}`}
              >
                <div className="fit-comfort-header">
                  <span className="fit-comfort-label">{opt.label}</span>
                  <div className={`fit-cut-radio ${isSelected ? 'active' : ''}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="fit-comfort-desc">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section 6: Footer Actions & Reassurance ── */}
      <div className="fit-footer-row">
        <button
          type="button"
          onClick={handleReset}
          className="apple-btn-secondary !text-xs !py-2.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Reset to Defaults</span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="apple-btn-primary !py-2.5 !px-5 !text-xs"
          >
            <span>Browse Products with Auto-Size</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
