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

interface TopSizeRow {
  size: string
  chestIn: number
  shoulderIn: number
  lengthIn: number
  sleeveIn: number
}

interface BottomSizeRow {
  size: string
  waistIn: string
  lengthIn: number
  inseamIn: number
  hipIn: number
}

const TOPS_MEASUREMENTS: TopSizeRow[] = [
  { size: 'S', chestIn: 40.0, shoulderIn: 18.5, lengthIn: 28.0, sleeveIn: 8.5 },
  { size: 'M', chestIn: 42.0, shoulderIn: 19.5, lengthIn: 29.0, sleeveIn: 9.0 },
  { size: 'L', chestIn: 44.0, shoulderIn: 20.5, lengthIn: 30.0, sleeveIn: 9.5 },
  { size: 'XL', chestIn: 47.0, shoulderIn: 21.5, lengthIn: 31.0, sleeveIn: 10.0 },
  { size: 'XXL', chestIn: 50.0, shoulderIn: 22.5, lengthIn: 32.0, sleeveIn: 10.5 },
]

const BOTTOMS_MEASUREMENTS: BottomSizeRow[] = [
  { size: 'S', waistIn: '28 - 30', lengthIn: 39.0, inseamIn: 29.5, hipIn: 39.0 },
  { size: 'M', waistIn: '31 - 33', lengthIn: 40.0, inseamIn: 30.0, hipIn: 41.5 },
  { size: 'L', waistIn: '34 - 36', lengthIn: 41.0, inseamIn: 30.5, hipIn: 44.0 },
  { size: 'XL', waistIn: '37 - 39', lengthIn: 42.0, inseamIn: 31.0, hipIn: 46.5 },
  { size: 'XXL', waistIn: '40 - 42', lengthIn: 42.5, inseamIn: 31.5, hipIn: 49.0 },
]

const FITS_EXPLANATION = [
  {
    name: 'Drop Shoulder / Boxy',
    category: 'T-Shirts',
    cut: 'Oversized Silhouette',
    silhouette: 'Dropped shoulder seams with wider body and generous drape.',
    vibe: 'Modern streetwear fit, crafted from substantial 240+ GSM combed cotton.',
  },
  {
    name: 'Classic Relaxed',
    category: 'T-Shirts',
    cut: 'Standard Fit',
    silhouette: 'True-to-shoulder cut with comfortable ease through chest and waist.',
    vibe: 'The quintessential daily tee. Structured collar that stays crisp wash after wash.',
  },
  {
    name: 'Heavyweight Fullsleeve',
    category: 'T-Shirts',
    cut: 'Engineered Ribbed Fit',
    silhouette: 'Roomy body with snug ribbed cuffs and reinforced neckline.',
    vibe: 'Year-round layering staple built from dense 260 GSM single jersey.',
  },
  {
    name: 'Tapered Trackpant',
    category: 'Bottomwear',
    cut: 'Athletic Taper',
    silhouette: 'Room through seat and thighs narrowing sharply at the ankle.',
    vibe: 'Engineered for clean sneaker stacking with deep zippered pocketing.',
  },
  {
    name: 'Heavy Fleece Sweatpant',
    category: 'Bottomwear',
    cut: 'Relaxed Cuffed Cut',
    silhouette: 'Plush 360 GSM French terry with elasticated ankle cuffs and drawcord.',
    vibe: 'Ultimate lounge and off-duty luxury silhouette with premium drape.',
  },
]

export default function SizeGuideModal({
  isOpen,
  onClose,
  productCategory = 'printed-tees',
  productFit,
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<Unit>('in')
  const [activeTab, setActiveTab] = useState<'chart' | 'fits' | 'how-to'>('chart')

  const isBottomwear =
    productCategory === 'trackpants' ||
    productCategory === 'sweatpants' ||
    productCategory === 'bottomwear'

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
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'fits'}
              className={`apple-segment-item ${activeTab === 'fits' ? 'active' : ''}`}
              onClick={() => setActiveTab('fits')}
            >
              <span>Silhouette Guide</span>
            </button>
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
                All measurements reflect garment dimensions laid flat. TEESGARAGE heavyweight fabrics are pre-shrunk for consistent fit wash after wash.
              </p>

              {isBottomwear ? (
                <div className="apple-table-container">
                  <table className="apple-size-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Waist Range ({unit})</th>
                        <th>Total Length</th>
                        <th>Inseam</th>
                        <th>Hip Circumference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BOTTOMS_MEASUREMENTS.map((row) => (
                        <tr key={row.size}>
                          <td className="size-primary-cell">
                            <strong>{row.size}</strong>
                          </td>
                          <td>
                            {unit === 'in'
                              ? `${row.waistIn}"`
                              : `${Math.round(28 * 2.54)} - ${Math.round(
                                  parseInt(row.waistIn.split('-')[1]?.trim() ?? '30', 10) * 2.54
                                )} cm`}
                          </td>
                          <td>{formatVal(row.lengthIn)}</td>
                          <td>{formatVal(row.inseamIn)}</td>
                          <td>{formatVal(row.hipIn)}</td>
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
                  <strong>TEESGARAGE Fit Guarantee:</strong> If the fit isn&apos;t dialed in, we provide free 7-day doorstep exchanges across India. Simply message our concierge via WhatsApp.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fits' && (
            <div className="apple-fits-grid">
              {FITS_EXPLANATION.map((fit) => {
                const isCurrent =
                  productFit &&
                  fit.name.toLowerCase().includes(productFit.toLowerCase().split(' ')[0] ?? '')
                return (
                  <div key={fit.name} className={`apple-fit-card ${isCurrent ? 'current' : ''}`}>
                    <div className="apple-fit-card-header">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-muted block mb-0.5">
                          {fit.category}
                        </span>
                        <h4 className="apple-fit-card-title">{fit.name}</h4>
                      </div>
                      {isCurrent && <span className="apple-fit-badge">Current Product</span>}
                    </div>
                    <div className="apple-fit-prop">
                      <span className="prop-label">Cut:</span>
                      <span className="prop-val">{fit.cut}</span>
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
              {isBottomwear ? (
                <>
                  <div className="how-to-step">
                    <span className="step-num">01</span>
                    <div>
                      <h4 className="step-title">Waist</h4>
                      <p className="step-desc">
                        Measure around your natural waistline, where you typically wear trackpants or sweatpants. Keep the tape comfortably loose.
                      </p>
                    </div>
                  </div>

                  <div className="how-to-step">
                    <span className="step-num">02</span>
                    <div>
                      <h4 className="step-title">Inseam</h4>
                      <p className="step-desc">
                        Measure along the inner leg seam from crotch to the bottom hem or ankle cuff.
                      </p>
                    </div>
                  </div>

                  <div className="how-to-step">
                    <span className="step-num">03</span>
                    <div>
                      <h4 className="step-title">Hip / Seat</h4>
                      <p className="step-desc">
                        Measure around the fullest point of your hips with feet together to ensure comfortable drape and stretch.
                      </p>
                    </div>
                  </div>

                  <div className="how-to-step">
                    <span className="step-num">04</span>
                    <div>
                      <h4 className="step-title">Total Length</h4>
                      <p className="step-desc">
                        Measure vertically along the outer seam from the waistband down to the bottom cuff opening.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="how-to-step">
                    <span className="step-num">01</span>
                    <div>
                      <h4 className="step-title">Chest Width</h4>
                      <p className="step-desc">
                        Lay your best-fitting t-shirt flat. Measure across the chest from armpit seam to armpit seam, 1 inch below the armhole.
                      </p>
                    </div>
                  </div>

                  <div className="how-to-step">
                    <span className="step-num">02</span>
                    <div>
                      <h4 className="step-title">Body Length</h4>
                      <p className="step-desc">
                        Measure straight down from the highest point of the shoulder seam (next to the collar) to the bottom hem.
                      </p>
                    </div>
                  </div>

                  <div className="how-to-step">
                    <span className="step-num">03</span>
                    <div>
                      <h4 className="step-title">Shoulder Width</h4>
                      <p className="step-desc">
                        Measure straight across the back from shoulder seam point to shoulder seam point.
                      </p>
                    </div>
                  </div>

                  <div className="how-to-step">
                    <span className="step-num">04</span>
                    <div>
                      <h4 className="step-title">Sleeve Length</h4>
                      <p className="step-desc">
                        Measure from the top shoulder seam down to the outer edge of the sleeve cuff.
                      </p>
                    </div>
                  </div>
                </>
              )}
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
