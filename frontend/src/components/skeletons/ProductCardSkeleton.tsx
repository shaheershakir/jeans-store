import React from 'react'
import Skeleton from './Skeleton'

/**
 * High-fidelity Skeleton for ProductCard.
 * Matches exact geometry, 3:4 portrait aspect ratio, and typography hierarchy
 * to eliminate Cumulative Layout Shift (CLS).
 */
export default function ProductCardSkeleton() {
  return (
    <article className="product-card skeleton-product-card" aria-hidden="true">
      {/* 3:4 Image container */}
      <div className="product-image-container">
        <div className="image-wrapper">
          <Skeleton width="100%" height="100%" />
        </div>

        {/* Favorite circle outline top-left */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
          <Skeleton variant="circular" width={34} height={34} />
        </div>

        {/* Rating pill bottom-left */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2 }}>
          <Skeleton variant="pill" width={72} height={22} />
        </div>
      </div>

      {/* Info wrap */}
      <div className="product-info-wrap">
        {/* Brand label */}
        <Skeleton width="35%" height={11} style={{ marginBottom: 4 }} />

        {/* Product title (2 lines max) */}
        <Skeleton width="88%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="55%" height={16} style={{ marginBottom: 8 }} />

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Skeleton width={64} height={18} />
          <Skeleton width={50} height={14} />
          <Skeleton width={62} height={14} variant="pill" />
        </div>

        {/* Wash / fabric description line */}
        <Skeleton width="75%" height={12} style={{ marginBottom: 14 }} />

        {/* Add to bag button placeholder */}
        <Skeleton
          width="100%"
          height={42}
          style={{ borderRadius: 'var(--radius-sm, 6px)', marginTop: 'auto' }}
        />
      </div>
    </article>
  )
}
