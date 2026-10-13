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

        {/* Favorite circle outline */}
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
          <Skeleton variant="circular" width={34} height={34} />
        </div>
      </div>

      {/* Info wrap */}
      <div className="product-info-wrap">
        {/* Brand label */}
        <Skeleton width="35%" height={10} style={{ marginBottom: 5 }} />

        {/* Product title (2 lines max) */}
        <Skeleton width="88%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="55%" height={14} style={{ marginBottom: 8 }} />

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <Skeleton width={64} height={16} />
        </div>

        {/* Wash / fabric description line */}
        <Skeleton width="75%" height={11} style={{ marginBottom: 10 }} />

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
