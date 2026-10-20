import React from 'react'
import Skeleton from './Skeleton'

/**
 * High-fidelity Skeleton for ProductCard.
 * Matches exact geometry, 4:5 portrait aspect ratio, and typography hierarchy
 * to eliminate Cumulative Layout Shift (CLS).
 */
export default function ProductCardSkeleton() {
  return (
    <article
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-[#fbfbfa] p-2 pb-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
      aria-hidden="true"
    >
      {/* 4:5 Image container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#eeede7]">
        <div className="relative h-full w-full">
          <Skeleton width="100%" height="100%" />
        </div>

        {/* Favorite circle outline */}
        <div className="absolute right-2.5 top-2.5 z-[2]">
          <Skeleton variant="circular" width={34} height={34} />
        </div>
      </div>

      {/* Info wrap */}
      <div className="flex flex-1 flex-col px-1.5 pb-0.5 pt-3.5 max-[640px]:px-1 max-[640px]:pt-2.5">
        {/* Brand label */}
        <Skeleton width="35%" height={10} className="mb-[5px]" />

        {/* Product title (2 lines max) */}
        <Skeleton width="88%" height={14} className="mb-1" />
        <Skeleton width="55%" height={14} className="mb-2" />

        {/* Price row */}
        <div className="mb-[5px] flex items-center gap-2">
          <Skeleton width={64} height={16} />
        </div>

        {/* Wash / fabric description line */}
        <Skeleton width="75%" height={11} className="mb-2.5" />

        {/* Add to bag button placeholder */}
        <Skeleton width="100%" height={42} className="mt-auto rounded-sm" />
      </div>
    </article>
  )
}
