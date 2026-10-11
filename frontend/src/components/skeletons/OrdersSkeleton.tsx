import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Orders & Tracking page.
 * Matches exact account header, segmented filter bar, and order manifest cards.
 */
export default function OrdersSkeleton() {
  return (
    <div className="infit-account-page" aria-busy="true" aria-label="Loading Order Manifests">
      <main className="infit-account-container">
        {/* 1. Breadcrumbs */}
        <nav className="infit-breadcrumb-nav" aria-label="Breadcrumbs">
          <Skeleton width={80} height={12} />
          <span style={{ color: '#999', fontSize: 12 }}>/</span>
          <Skeleton width={140} height={12} />
        </nav>

        {/* 2. Top Header Card */}
        <div className="infit-account-hero">
          <div className="infit-hero-user-cluster">
            <Skeleton variant="circular" width={48} height={48} />
            <div>
              <Skeleton width={130} height={20} style={{ marginBottom: 6 }} />
              <Skeleton width={180} height={13} />
            </div>
          </div>
          <div className="infit-hero-actions">
            <Skeleton variant="pill" width={140} height={36} />
          </div>
        </div>

        {/* 3. Filter Pills Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 16,
            marginBottom: 24,
            borderBottom: '1px solid #e7e7e4'
          }}
        >
          <Skeleton width={160} height={20} />
          <div className="apple-segmented-control" style={{ maxWidth: 'fit-content' }}>
            <Skeleton variant="pill" width={90} height={32} />
            <Skeleton variant="pill" width={110} height={32} />
            <Skeleton variant="pill" width={80} height={32} />
          </div>
        </div>

        {/* 4. Order Manifest Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="infit-order-card">
              {/* Order Top Bar */}
              <div className="infit-order-header">
                <div className="infit-order-meta-grid">
                  <div>
                    <Skeleton width={50} height={10} style={{ marginBottom: 4 }} />
                    <Skeleton width={85} height={14} />
                  </div>
                  <div>
                    <Skeleton width={65} height={10} style={{ marginBottom: 4 }} />
                    <Skeleton width={110} height={14} />
                  </div>
                  <div>
                    <Skeleton width={75} height={10} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={14} />
                  </div>
                </div>
                <Skeleton variant="pill" width={100} height={26} />
              </div>

              {/* Delivery ETA Bar */}
              <div className="infit-order-timeline-bar">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Skeleton variant="circular" width={16} height={16} />
                  <Skeleton width={240} height={14} />
                </div>
                <Skeleton variant="pill" width={160} height={28} />
              </div>

              {/* Item Rows */}
              <div className="infit-order-item-row">
                <div className="infit-order-item-info">
                  <div className="infit-order-item-thumb">
                    <Skeleton width="100%" height="100%" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Skeleton width="65%" height={16} style={{ marginBottom: 6 }} />
                    <Skeleton width="45%" height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width={60} height={16} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Skeleton variant="pill" width={90} height={34} />
                  <Skeleton variant="pill" width={105} height={34} />
                </div>
              </div>

              {/* Order Footer */}
              <div className="infit-order-footer">
                <Skeleton width="55%" height={14} />
                <Skeleton width={120} height={14} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
