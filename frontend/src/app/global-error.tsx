'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '40px 20px',
          background: '#f5f3ef',
          fontFamily: 'monospace',
          color: '#151515',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: 520, textAlign: 'center', border: '1px solid rgba(21, 21, 21, 0.25)', padding: 32, background: '#ede8e1' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Application Error</h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#444', margin: '0 0 24px' }}>
            An unexpected error interrupted the application.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: '#151515',
              color: '#f5f3ef',
              border: 'none',
              padding: '12px 24px',
              fontFamily: 'inherit',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Retry Application
          </button>
        </div>
      </body>
    </html>
  )
}
