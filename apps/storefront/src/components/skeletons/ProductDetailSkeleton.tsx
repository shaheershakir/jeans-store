import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Product Detail Page (PDP).
 * Mirrors dual-card layout: Product Showcase Card and Product Details Card.
 */
export default function ProductDetailSkeleton() {
  return (
    <div className="skeleton-pdp-wrap" aria-busy="true" aria-label="Loading Product Details">
      {/* 1. Breadcrumbs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        <Skeleton width={45} height={12} />
        <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
        <Skeleton width={40} height={12} />
        <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
        <Skeleton width={70} height={12} />
        <span style={{ color: 'var(--ink-muted, #999)', fontSize: 12 }}>/</span>
        <Skeleton width={140} height={12} />
      </div>

      {/* 2. Main 2-Column Split: Dual Card System */}
      <div className="pdp-layout">
        {/* Left Column: Product Showcase Card */}
        <div className="pdp-showcase-card apple-product-card" style={{ gap: 12 }}>
          {/* Main Hero Stage */}
          <div
            className="pdp-hero-stage product-image-container"
            style={{ width: '100%', aspectRatio: '4/5', borderRadius: 14, overflow: 'hidden' }}
          >
            <Skeleton width="100%" height="100%" />
          </div>
        </div>

        {/* Right Column: Product Detail Card */}
        <div className="pdp-details-card apple-product-card" style={{ gap: 16 }}>
          {/* Overline & title */}
          <div>
            <Skeleton width={90} height={12} style={{ marginBottom: 10 }} />
            <Skeleton width="92%" height={32} style={{ marginBottom: 8 }} />
            <Skeleton width="65%" height={32} style={{ marginBottom: 14 }} />

            {/* Price & Stock row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Skeleton width={110} height={28} />
              <Skeleton variant="pill" width={140} height={24} />
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

          {/* Description narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="100%" height={14} />
            <Skeleton width="95%" height={14} />
            <Skeleton width="80%" height={14} />
          </div>

          {/* Color / Wash Swatches */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Skeleton width={110} height={14} />
              <Skeleton width={90} height={14} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="circular" width={24} height={24} />
              ))}
            </div>
          </div>

          {/* Sizing Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Skeleton width={120} height={14} />
              <Skeleton width={85} height={14} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {['XS', 'S', 'M', 'L', 'XL'].map((_, i) => (
                <Skeleton
                  key={i}
                  width="100%"
                  height={48}
                  style={{ borderRadius: 10 }}
                />
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <Skeleton width="100%" height={52} style={{ borderRadius: 12 }} />
            <Skeleton width="100%" height={48} style={{ borderRadius: 12 }} />
          </div>

          {/* Shipping & Delivery Guarantee box */}
          <div
            style={{
              padding: '16px 18px',
              backgroundColor: '#f4f3ee',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <Skeleton width="75%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      </div>
    </div>
  )
}
