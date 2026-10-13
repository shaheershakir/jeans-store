import React from 'react'
import Skeleton from './Skeleton'
import ProductCardSkeleton from './ProductCardSkeleton'

/**
 * Apple-grade skeleton layout for the Shop catalog & category views.
 * Mirrors the exact header typography, category tabs bar, desktop facets sidebar,
 * and multi-column product card grid.
 */
export default function ShopSkeleton() {
  return (
    <div className="skeleton-page-wrap" aria-busy="true" aria-label="Loading Garments Catalog">
      {/* 1. Header & Category Navigation Bar */}
      <div
        style={{
          backgroundColor: 'var(--bone, #f8f8f6)',
          borderBottom: '1px solid var(--line, rgba(12,14,18,0.09))',
          padding: '36px 4% 20px'
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          {/* Breadcrumb line */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
            <Skeleton width={50} height={12} />
            <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
            <Skeleton width={40} height={12} />
            <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
            <Skeleton width={80} height={12} />
          </div>

          {/* Title and summary */}
          <div style={{ maxWidth: 650, marginBottom: 24 }}>
            <Skeleton width="45%" height={34} style={{ marginBottom: 10 }} />
            <Skeleton width="85%" height={14} style={{ marginBottom: 6 }} />
            <Skeleton width="60%" height={14} />
          </div>

          {/* Category Tabs Rail */}
          <div className="skeleton-rail" style={{ paddingBottom: 6 }}>
            {['All Garments', 'Stripes', 'Fullsleeve', 'Drop Sleeve', 'Printed Tees', 'Ringer Tees', 'Henley', 'Trackpants'].map((_, i) => (
              <Skeleton
                key={i}
                variant="pill"
                width={i === 0 ? 110 : 96}
                height={38}
                style={{ flexShrink: 0 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Controls & Active Filters Toolbar */}
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '20px 4% 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Skeleton variant="pill" width={110} height={36} />
          <Skeleton variant="pill" width={90} height={36} />
          <Skeleton variant="pill" width={80} height={36} />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton width={90} height={14} />
          <Skeleton variant="pill" width={140} height={36} />
        </div>
      </div>

      {/* 3. Main Catalog Layout (Sidebar + Grid) */}
      <div className="shop-container">
        <div className="shop-main-layout">
          {/* Desktop Left Sidebar Facets */}
          <aside className="shop-desktop-sidebar" aria-hidden="true">
            <div className="shop-facets-sidebar-inner" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--line, rgba(12,14,18,0.08))', paddingBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Skeleton width={100} height={14} />
                    <Skeleton width={12} height={12} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Skeleton width="75%" height={14} />
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="85%" height={14} />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Catalog Grid Area */}
          <main className="shop-content-area">
            <div className="shop-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
