'use client'

import { useState, useEffect } from 'react'
import { useUIStore } from '@/lib/store'
import { SIZE_CHART } from '@/lib/constants'

export default function SizeGuideModal() {
  const isOpen = useUIStore((state) => state.isSizeGuideOpen)
  const closeSizeGuide = useUIStore((state) => state.closeSizeGuide)
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches')

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        closeSizeGuide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeSizeGuide])

  const chartData = SIZE_CHART[unit]

  return (
    <div
      className={`modal-backdrop ${isOpen ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSizeGuide()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 id="size-guide-title" className="modal-title">
            Garment Dimensions &amp; Size Guide
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeSizeGuide}
            aria-label="Close size guide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="unit-toggle-row">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Measurements in:
            </span>
            <div className="unit-toggle-pills">
              <button
                type="button"
                className={`unit-pill ${unit === 'inches' ? 'active' : ''}`}
                onClick={() => setUnit('inches')}
              >
                Inches (in)
              </button>
              <button
                type="button"
                className={`unit-pill ${unit === 'cm' ? 'active' : ''}`}
                onClick={() => setUnit('cm')}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          <table className="size-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest ({unit === 'inches' ? 'in' : 'cm'})</th>
                <th>Body Length</th>
                <th>Shoulder Width</th>
                <th>Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr key={row.size}>
                  <td className="highlight-size">{row.size}</td>
                  <td>{row.chest}</td>
                  <td>{row.length}</td>
                  <td>{row.shoulder}</td>
                  <td>{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="measure-tips-card">
            <strong>How to Measure for the Boxy Fit:</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                <strong>Chest:</strong> Measure across the fullest part of your chest, keeping the tape comfortably horizontal.
              </li>
              <li>
                <strong>Length:</strong> Measure from the highest point of the shoulder collar seam down to the bottom hem.
              </li>
              <li>
                <strong>Shoulder:</strong> Measure straight across the back from the edge of one shoulder seam to the other.
              </li>
            </ul>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              * If you fall between sizes: choose your normal size for the intended streetwear boxy drape, or size down for a conventional classic fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
