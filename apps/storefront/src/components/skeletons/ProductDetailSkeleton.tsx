import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Product Detail Page (PDP).
 * Mirrors 2-column editorial gallery and right-rail purchase column.
 */
export default function ProductDetailSkeleton() {
  return (
    <div className="skeleton-pdp-wrap" aria-busy="true" aria-label="Loading Product Details">
      {/* 1. Breadcrumbs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28 }}>
        <Skeleton width={45} height={12} />
        <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
        <Skeleton width={40} height={12} />
        <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
        <Skeleton width={70} height={12} />
        <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
        <Skeleton width={140} height={12} />
      </div>

      {/* 2. Main 2-Column Split */}
      <div className="pdp-layout">
        {/* Left Column: 2-Column Gallery Grid */}
        <div className="pdp-gallery-grid">
          <div className="pdp-gallery-card single-span" style={{ height: 'clamp(420px, 55vw, 680px)' }}>
            <Skeleton width="100%" height="100%" />
          </div>
          <div className="pdp-gallery-card">
            <Skeleton width="100%" height="100%" />
          </div>
          <div className="pdp-gallery-card">
            <Skeleton width="100%" height="100%" />
          </div>
        </div>

        {/* Right Column: Product Detail Rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Brand tag & title */}
          <div>
            <Skeleton width={90} height={12} style={{ marginBottom: 10 }} />
            <Skeleton width="92%" height={32} style={{ marginBottom: 8 }} />
            <Skeleton width="65%" height={32} style={{ marginBottom: 14 }} />

            {/* Rating pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Skeleton variant="pill" width={74} height={22} />
              <Skeleton width={110} height={14} />
            </div>
          </div>

          {/* Price section */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--bone, #f8f8f6)',
              borderRadius: 'var(--radius-md, 10px)',
              border: '1px solid var(--line, rgba(12,14,18,0.08))',
              display: 'flex',
              alignItems: 'baseline',
              gap: 12
            }}
          >
            <Skeleton width={100} height={28} />
            <Skeleton width={70} height={18} />
            <Skeleton variant="pill" width={80} height={20} />
          </div>

          {/* Color / Wash Swatches */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Skeleton width={110} height={14} />
              <Skeleton width={80} height={14} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="circular" width={34} height={34} />
              ))}
            </div>
          </div>

          {/* Sizing Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Skeleton width={120} height={14} />
              <Skeleton width={85} height={14} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['30', '32', '34', '36', '38'].map((_, i) => (
                <Skeleton
                  key={i}
                  width={52}
                  height={44}
                  style={{ borderRadius: 'var(--radius-sm, 6px)' }}
                />
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <Skeleton width="100%" height={52} style={{ borderRadius: 'var(--radius-sm, 6px)' }} />
            <Skeleton width="100%" height={48} style={{ borderRadius: 'var(--radius-sm, 6px)' }} />
          </div>

          {/* Shipping & Delivery Guarantee box */}
          <div
            style={{
              padding: '18px 20px',
              border: '1px dashed var(--line-strong, rgba(12,14,18,0.18))',
              borderRadius: 'var(--radius-md, 10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <Skeleton width="75%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>

          {/* Accordion tabs */}
          <div style={{ borderTop: '1px solid var(--line, rgba(12,14,18,0.09))', paddingTop: 16 }}>
            {['Material & construction', 'Fit guide & sizing', 'Delivery & care'].map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid var(--line, rgba(12,14,18,0.09))'
                }}
              >
                <Skeleton width="55%" height={16} />
                <Skeleton width={16} height={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
