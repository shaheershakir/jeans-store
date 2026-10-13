import React from 'react'
import Skeleton from './Skeleton'
import ProductCardSkeleton from './ProductCardSkeleton'

/**
 * Apple-grade skeleton layout for the storefront homepage.
 * Prevents CLS across hero carousel, category navigation, and 4-column product grid.
 */
export default function HomepageSkeleton() {
  return (
    <div className="skeleton-page-wrap" aria-busy="true" aria-label="Loading Storefront Archive">
      {/* 1. Announcement bar placeholder */}
      <div
        style={{
          height: 38,
          backgroundColor: '#0c0e12',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px'
        }}
      >
        <Skeleton
          width={280}
          height={12}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
        />
      </div>

      {/* 2. Hero banner placeholder */}
      <div className="skeleton-hero-banner">
        <div className="skeleton-hero-content">
          <Skeleton variant="pill" width={110} height={20} />
          <Skeleton width="90%" height={44} style={{ borderRadius: 8 }} />
          <Skeleton width="65%" height={16} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Skeleton variant="pill" width={140} height={44} />
            <Skeleton variant="pill" width={130} height={44} />
          </div>
        </div>
      </div>

      {/* 3. Category quick rail */}
      <div style={{ padding: '24px 4% 12px', borderBottom: '1px solid var(--line, rgba(12,14,18,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Skeleton width={140} height={16} />
          <Skeleton width={70} height={14} />
        </div>
        <div className="skeleton-rail">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="pill"
              width={i % 2 === 0 ? 110 : 90}
              height={36}
              style={{ flexShrink: 0 }}
            />
          ))}
        </div>
      </div>

      {/* 4. Curated Showcase Section Header */}
      <div style={{ padding: '40px 4% 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <Skeleton width={100} height={12} variant="pill" style={{ marginBottom: 8 }} />
            <Skeleton width={260} height={28} />
          </div>
          <Skeleton width={80} height={20} variant="pill" />
        </div>

        {/* 4-column product grid */}
        <div className="collection-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* 5. Values / Editorial banner skeleton */}
      <div style={{ padding: '60px 4% 80px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--line, rgba(12,14,18,0.09))',
            borderRadius: 'var(--radius-lg, 14px)',
            padding: '36px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Skeleton variant="circular" width={42} height={42} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="90%" height={12} style={{ marginBottom: 4 }} />
                <Skeleton width="75%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
