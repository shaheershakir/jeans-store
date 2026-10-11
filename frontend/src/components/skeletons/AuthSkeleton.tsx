import React from 'react'
import Skeleton from './Skeleton'

interface AuthSkeletonProps {
  mode?: 'signin' | 'signup'
}

/**
 * Apple-grade skeleton layout for authentication flows (Login and Register).
 * Matches exact centered card, segmented control, and input fields.
 */
export default function AuthSkeleton({ mode = 'signin' }: AuthSkeletonProps) {
  const isSignup = mode === 'signup'

  return (
    <div className="apple-auth-page" aria-busy="true" aria-label="Loading Authentication">
      <div className="apple-auth-card">
        {/* Navigation & Brand Header */}
        <div className="apple-auth-nav-header">
          <Skeleton variant="pill" width={100} height={32} />
          <Skeleton width={140} height={36} style={{ borderRadius: 6 }} />
        </div>

        {/* Title Group */}
        <div className="apple-auth-title-group">
          <Skeleton width="75%" height={26} style={{ margin: '0 auto 8px' }} />
          <Skeleton width="90%" height={14} style={{ margin: '0 auto' }} />
        </div>

        {/* Mode Toggle (Segmented Pill) */}
        <div className="apple-segmented-control auth-segmented" style={{ height: 42, padding: 3, marginBottom: 24 }}>
          <Skeleton width="50%" height="100%" style={{ borderRadius: 8 }} />
          <Skeleton width="50%" height="100%" style={{ borderRadius: 8 }} />
        </div>

        {/* Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignup && (
            <div>
              <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="100%" height={46} style={{ borderRadius: 10 }} />
            </div>
          )}

          <div>
            <Skeleton width={90} height={12} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={46} style={{ borderRadius: 10 }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Skeleton width={70} height={12} />
              {!isSignup && <Skeleton width={50} height={12} />}
            </div>
            <Skeleton width="100%" height={46} style={{ borderRadius: 10 }} />
          </div>

          {isSignup && (
            <div>
              <Skeleton width={110} height={12} style={{ marginBottom: 6 }} />
              <Skeleton width="100%" height={46} style={{ borderRadius: 10 }} />
            </div>
          )}

          {/* Checkbox row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Skeleton width={150} height={14} />
            <Skeleton width={70} height={14} />
          </div>

          {/* Submit Button */}
          <Skeleton width="100%" height={48} style={{ borderRadius: 10, marginTop: 8 }} />
        </div>

        {/* Divider */}
        <div className="apple-auth-divider" style={{ margin: '24px 0' }}>
          <Skeleton width={120} height={12} />
        </div>

        {/* Alternative buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton width="100%" height={46} style={{ borderRadius: 10 }} />
          <Skeleton width="100%" height={40} style={{ borderRadius: 10 }} />
        </div>
      </div>
    </div>
  )
}
