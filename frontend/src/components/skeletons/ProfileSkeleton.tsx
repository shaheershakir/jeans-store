import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Profile & Account settings.
 * Replicates the Apple ID sidebar and right master-detail form canvas.
 */
export default function ProfileSkeleton() {
  return (
    <div className="apple-profile-page" aria-busy="true" aria-label="Loading Profile Details">
      <main className="apple-profile-container">
        {/* 1. Breadcrumb */}
        <nav className="infit-breadcrumb-nav" aria-label="Breadcrumbs">
          <Skeleton width={75} height={12} />
          <span style={{ color: '#999', fontSize: 12 }}>/</span>
          <Skeleton width={50} height={12} />
          <span style={{ color: '#999', fontSize: 12 }}>/</span>
          <Skeleton width={120} height={12} />
        </nav>

        {/* 2. Mobile Profile Card */}
        <div className="lg:hidden apple-mobile-profile-card" style={{ marginBottom: 16 }}>
          <div className="apple-mobile-profile-main">
            <Skeleton variant="circular" width={48} height={48} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height={18} style={{ marginBottom: 6 }} />
              <Skeleton width="45%" height={12} />
            </div>
          </div>
        </div>

        {/* 3. Master-Detail Layout */}
        <div className="apple-profile-layout">
          {/* Left Column: Apple Settings Sidebar */}
          <aside className="apple-profile-sidebar">
            <div className="apple-glass-card">
              {/* Apple ID Card Header */}
              <div className="apple-id-header">
                <div className="apple-id-avatar-row">
                  <Skeleton variant="circular" width={52} height={52} />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="75%" height={18} style={{ marginBottom: 6 }} />
                    <Skeleton width="55%" height={12} />
                  </div>
                </div>
              </div>

              {/* Sidebar Navigation Items */}
              <div className="hidden lg:flex apple-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: i === 0 ? 'rgba(0,0,0,0.04)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Skeleton variant="circular" width={18} height={18} />
                      <Skeleton width={110 + (i % 2) * 20} height={14} />
                    </div>
                    <Skeleton width={12} height={12} />
                  </div>
                ))}
              </div>

              {/* Sidebar Actions */}
              <div className="apple-sidebar-actions" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton width="100%" height={40} style={{ borderRadius: 8 }} />
                <Skeleton width="100%" height={36} style={{ borderRadius: 8 }} />
              </div>
            </div>
          </aside>

          {/* Right Column: Master Detail Canvas */}
          <section className="apple-profile-main">
            <div className="apple-detail-card">
              {/* Header */}
              <div className="apple-card-header apple-card-header-split">
                <div style={{ flex: 1 }}>
                  <Skeleton width={200} height={26} style={{ marginBottom: 8 }} />
                  <Skeleton width="75%" height={14} />
                </div>
                <Skeleton variant="pill" width={70} height={32} />
              </div>

              {/* Info Display Grid */}
              <div className="apple-info-display-container">
                <div className="apple-info-display-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="apple-info-display-item">
                      <Skeleton width={70} height={10} style={{ marginBottom: 8 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Skeleton variant="circular" width={16} height={16} />
                        <Skeleton width={130} height={16} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Callout box */}
                <div className="apple-grouped-box mt-3" style={{ padding: '16px 20px', borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Skeleton width={210} height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="80%" height={12} />
                  </div>
                  <Skeleton variant="pill" width={56} height={20} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
