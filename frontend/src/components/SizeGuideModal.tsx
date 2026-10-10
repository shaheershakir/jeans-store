'use client'

import { useState, useEffect } from 'react'
import { X, Ruler, HelpCircle, CheckCircle2 } from 'lucide-react'

interface SizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  productCategory?: string
  productFit?: string
}

type Unit = 'in' | 'cm'

interface DenimSizeRow {
  size: string
  waistIn: number
  inseamIn: number
  thighIn: number
  riseIn: number
  legOpeningIn: number
}

const DENIM_MEASUREMENTS: DenimSizeRow[] = [
  { size: '28', waistIn: 29.0, inseamIn: 32.0, thighIn: 23.5, riseIn: 11.0, legOpeningIn: 16.5 },
  { size: '30', waistIn: 31.0, inseamIn: 32.0, thighIn: 24.5, riseIn: 11.5, legOpeningIn: 17.0 },
  { size: '32', waistIn: 33.0, inseamIn: 32.5, thighIn: 25.5, riseIn: 12.0, legOpeningIn: 17.5 },
  { size: '34', waistIn: 35.0, inseamIn: 33.0, thighIn: 26.5, riseIn: 12.5, legOpeningIn: 18.0 },
  { size: '36', waistIn: 37.0, inseamIn: 33.0, thighIn: 27.5, riseIn: 13.0, legOpeningIn: 18.5 },
  { size: '38', waistIn: 39.0, inseamIn: 33.0, thighIn: 28.5, riseIn: 13.5, legOpeningIn: 19.0 },
]

interface TopSizeRow {
  size: string
  chestIn: number
  shoulderIn: number
  lengthIn: number
  sleeveIn: number
}

const TOPS_MEASUREMENTS: TopSizeRow[] = [
  { size: 'S', chestIn: 40.0, shoulderIn: 18.5, lengthIn: 28.0, sleeveIn: 8.5 },
  { size: 'M', chestIn: 42.0, shoulderIn: 19.5, lengthIn: 29.0, sleeveIn: 9.0 },
  { size: 'L', chestIn: 44.0, shoulderIn: 20.5, lengthIn: 30.0, sleeveIn: 9.5 },
  { size: 'XL', chestIn: 47.0, shoulderIn: 21.5, lengthIn: 31.0, sleeveIn: 10.0 },
]

const FITS_EXPLANATION = [
  {
    name: 'Straight Fit',
    rise: 'Mid-to-High Rise',
    silhouette: 'Parallel line from hip to hem with zero taper.',
    vibe: 'Timeless, clean silhouette that balances boots and low-profile sneakers.',
  },
  {
    name: 'Baggy Fit',
    rise: 'Relaxed Mid Rise',
    silhouette: 'Extra volume throughout thigh and calf with pronounced pooling.',
    vibe: '90s skate-inspired drape designed for effortless casual streetwear.',
  },
  {
    name: 'Wide Leg',
    rise: 'High Rise',
    silhouette: 'Architectural column cut falling straight from the hip.',
    vibe: 'Bold, structured aesthetic crafted from weighty 14oz+ ring-spun denim.',
  },
  {
    name: 'Relaxed Fit',
    rise: 'Mid Rise',
    silhouette: 'Comfortable ease through thigh with a subtle, gentle taper.',
    vibe: 'The ultimate daily driver with freedom of movement and clean drape.',
  },
  {
    name: 'Bootcut Fit',
    rise: 'Mid Rise',
    silhouette: 'Sculpted thigh with an engineered flare below the knee.',
    vibe: 'Elongates the silhouette, designed to fall cleanly over footwear.',
  },
]

export default function SizeGuideModal({
  isOpen,
  onClose,
  productCategory = 'jeans',
  productFit,
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<Unit>('in')
  const [activeTab, setActiveTab] = useState<'chart' | 'fits' | 'how-to'>('chart')

  const isTops = productCategory === 'tops' || productCategory === 't-shirts' || productCategory === 'shirts' || productCategory === 'hoodies'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatVal = (valInches: number) => {
    if (unit === 'in') return `${valInches.toFixed(1)}"`
    return `${(valInches * 2.54).toFixed(1)} cm`
  }

  return (
    <div
      className="apple-modal-scrim"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="apple-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
      >
        {/* Apple Frosted Modal Header */}
        <div className="apple-modal-header">
          <div className="apple-modal-header-text">
            <span className="apple-modal-eyebrow">FIT ARCHITECTURE // GUIDE</span>
            <h2 id="size-guide-title" className="apple-modal-title">
              Size &amp; Measurement Guide
            </h2>
          </div>
          <button
            type="button"
            className="apple-modal-close-btn"
            onClick={onClose}
            aria-label="Close size guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Segmented Control Tabs */}
        <div className="apple-modal-toolbar">
          <div className="apple-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chart'}
              className={`apple-segment-item ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <Ruler className="w-3.5 h-3.5 mr-1.5" />
              <span>Measurements</span>
            </button>
            {!isTops && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'fits'}
                className={`apple-segment-item ${activeTab === 'fits' ? 'active' : ''}`}
                onClick={() => setActiveTab('fits')}
              >
                <span>Silhouette Guide</span>
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'how-to'}
              className={`apple-segment-item ${activeTab === 'how-to' ? 'active' : ''}`}
              onClick={() => setActiveTab('how-to')}
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>How to Measure</span>
            </button>
          </div>

          {activeTab === 'chart' && (
            <div className="apple-unit-toggle" role="radiogroup" aria-label="Units">
              <button
                type="button"
                className={`apple-unit-btn ${unit === 'in' ? 'active' : ''}`}
                onClick={() => setUnit('in')}
              >
                Inches (in)
              </button>
              <button
                type="button"
                className={`apple-unit-btn ${unit === 'cm' ? 'active' : ''}`}
                onClick={() => setUnit('cm')}
              >
                Centimeters (cm)
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="apple-modal-content">
          {activeTab === 'chart' && (
            <div className="apple-size-table-wrap">
              <p className="apple-size-hint">
                All measurements reflect garment dimensions laid flat. Our heavyweight denim is designed to soften and form to your silhouette over 5–7 wears.
              </p>

              {!isTops ? (
                <div className="apple-table-container">
                  <table className="apple-size-table">
                    <thead>
                      <tr>
                        <th>Waist Size</th>
                        <th>Waist Circumference</th>
                        <th>Inseam Length</th>
                        <th>Thigh (at crotch)</th>
                        <th>Front Rise</th>
                        <th>Leg Opening</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DENIM_MEASUREMENTS.map((row) => (
                        <tr key={row.size}>
                          <td className="size-primary-cell">
                            <strong>{row.size}</strong>
                          </td>
                          <td>{formatVal(row.waistIn)}</td>
                          <td>{formatVal(row.inseamIn)}</td>
                          <td>{formatVal(row.thighIn)}</td>
                          <td>{formatVal(row.riseIn)}</td>
                          <td>{formatVal(row.legOpeningIn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="apple-table-container">
                  <table className="apple-size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Chest Width</th>
                        <th>Shoulder Width</th>
                        <th>Body Length</th>
                        <th>Sleeve Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOPS_MEASUREMENTS.map((row) => (
                        <tr key={row.size}>
                          <td className="size-primary-cell">
                            <strong>{row.size}</strong>
                          </td>
                          <td>{formatVal(row.chestIn)}</td>
                          <td>{formatVal(row.shoulderIn)}</td>
                          <td>{formatVal(row.lengthIn)}</td>
                          <td>{formatVal(row.sleeveIn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="apple-fit-callout">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>TEESGARAGE Fit Guarantee:</strong> If the size isn&apos;t flawless, we provide free 7-day doorstep exchanges across India. Simply message our concierge via WhatsApp.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fits' && !isTops && (
            <div className="apple-fits-grid">
              {FITS_EXPLANATION.map((fit) => {
                const isCurrent = productFit && productFit.toLowerCase() === fit.name.toLowerCase().split(' ')[0]
                return (
                  <div key={fit.name} className={`apple-fit-card ${isCurrent ? 'current' : ''}`}>
                    <div className="apple-fit-card-header">
                      <h4 className="apple-fit-card-title">{fit.name}</h4>
                      {isCurrent && <span className="apple-fit-badge">Current Product</span>}
                    </div>
                    <div className="apple-fit-prop">
                      <span className="prop-label">Rise:</span>
                      <span className="prop-val">{fit.rise}</span>
                    </div>
                    <p className="apple-fit-desc">{fit.silhouette}</p>
                    <p className="apple-fit-vibe">{fit.vibe}</p>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'how-to' && (
            <div className="apple-how-to-guide">
              <div className="how-to-step">
                <span className="step-num">01</span>
                <div>
                  <h4 className="step-title">Lay flat your best-fitting pair</h4>
                  <p className="step-desc">
                    Button and zip your best-fitting jeans. Smooth out any wrinkles and lay them completely flat on a firm surface (table or floor).
                  </p>
                </div>
              </div>

              <div className="how-to-step">
                <span className="step-num">02</span>
                <div>
                  <h4 className="step-title">Measure the Waist</h4>
                  <p className="step-desc">
                    Pull the waistband taut so the front and back align straight across. Measure from edge to edge and double the number.
                  </p>
                </div>
              </div>

              <div className="how-to-step">
                <span className="step-num">03</span>
                <div>
                  <h4 className="step-title">Measure the Inseam</h4>
                  <p className="step-desc">
                    Start at the lowest point of the crotch seam and run your tape straight down the inside leg all the way to the bottom hem.
                  </p>
                </div>
              </div>

              <div className="how-to-step">
                <span className="step-num">04</span>
                <div>
                  <h4 className="step-title">Thigh &amp; Leg Opening</h4>
                  <p className="step-desc">
                    For the thigh, measure 1 inch below the crotch straight across. For leg opening, measure across the bottom hem opening.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="apple-modal-footer">
          <span className="apple-modal-footer-note">Need personalized sizing advice?</span>
          <button
            type="button"
            className="apple-modal-done-btn"
            onClick={onClose}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
