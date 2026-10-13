import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Onboarding and size setup flow.
 */
export default function OnboardingSkeleton() {
  return (
    <div className="onboarding-page-layout" aria-busy="true" aria-label="Loading Onboarding Flow">
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#ffffff',
          borderRadius: 24,
          border: '1px solid var(--line, rgba(12,14,18,0.09))',
          padding: '36px 32px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.06)'
        }}
      >
        {/* Progress Bar & Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Skeleton variant="pill" width={70} height={20} />
            <Skeleton width={80} height={12} />
          </div>
          <Skeleton width="100%" height={6} style={{ borderRadius: 9999, marginBottom: 20 }} />
          <Skeleton width="70%" height={26} style={{ marginBottom: 8 }} />
          <Skeleton width="90%" height={14} />
        </div>

        {/* Options grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
          <div>
            <Skeleton width={120} height={14} style={{ marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={46} style={{ borderRadius: 10 }} />
              ))}
            </div>
          </div>

          <div>
            <Skeleton width={140} height={14} style={{ marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={70} style={{ borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="pill" width={70} height={36} />
          <Skeleton variant="pill" width={160} height={46} />
        </div>
      </div>
    </div>
  )
}
