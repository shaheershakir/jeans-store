import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Checkout Page.
 * Prevents CLS on contact details, shipping destination form, and manifest summary card.
 */
export default function CheckoutSkeleton() {
  return (
    <div className="skeleton-checkout-wrap" aria-busy="true" aria-label="Loading Checkout Manifest">
      {/* 1. Header & Breadcrumb */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={60} height={12} />
          <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
          <Skeleton width={60} height={12} />
        </div>
        <Skeleton width={220} height={32} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} />
      </div>

      {/* 2. Checkout 2-Column Grid */}
      <div className="checkout-grid">
        {/* Left: Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Section 1: Contact Info */}
          <div
            style={{
              padding: '24px',
              background: '#ffffff',
              border: '1px solid var(--line, rgba(12,14,18,0.09))',
              borderRadius: 'var(--radius-md, 10px)'
            }}
          >
            <Skeleton width={180} height={20} style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="100%" height={44} style={{ borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Skeleton width={100} height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="100%" height={44} style={{ borderRadius: 6 }} />
                </div>
                <div>
                  <Skeleton width={90} height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="100%" height={44} style={{ borderRadius: 6 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Address */}
          <div
            style={{
              padding: '24px',
              background: '#ffffff',
              border: '1px solid var(--line, rgba(12,14,18,0.09))',
              borderRadius: 'var(--radius-md, 10px)'
            }}
          >
            <Skeleton width={190} height={20} style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Skeleton width={110} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="100%" height={44} style={{ borderRadius: 6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Skeleton width={70} height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="100%" height={44} style={{ borderRadius: 6 }} />
                </div>
                <div>
                  <Skeleton width={70} height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="100%" height={44} style={{ borderRadius: 6 }} />
                </div>
              </div>
              <div>
                <Skeleton width={70} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="50%" height={44} style={{ borderRadius: 6 }} />
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <Skeleton width="100%" height={54} style={{ borderRadius: 'var(--radius-sm, 6px)' }} />
        </div>

        {/* Right: Order Summary Sidebar */}
        <aside>
          <div
            style={{
              padding: '24px',
              background: 'var(--bone, #f8f8f6)',
              border: '1px solid var(--line, rgba(12,14,18,0.09))',
              borderRadius: 'var(--radius-md, 10px)'
            }}
          >
            <Skeleton variant="pill" width={120} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={150} height={24} style={{ marginBottom: 20 }} />

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Skeleton width={56} height={70} style={{ borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="85%" height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="50%" height={12} style={{ marginBottom: 6 }} />
                    <Skeleton width={60} height={14} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--line, rgba(12,14,18,0.09))', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width={60} height={14} />
                <Skeleton width={60} height={14} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width={60} height={14} />
                <Skeleton width={40} height={14} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line, rgba(12,14,18,0.09))', paddingTop: 12 }}>
                <Skeleton width={80} height={18} />
                <Skeleton width={90} height={22} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
