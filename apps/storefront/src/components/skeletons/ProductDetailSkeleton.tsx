import React from 'react'
import Skeleton from './Skeleton'

/**
 * Apple-grade skeleton layout for the Product Detail Page (PDP).
 * Mirrors dual-card layout: Product Showcase Card and Product Details Card.
 */
export default function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1440px] px-[4%] pt-6 pb-[90px]"
      aria-busy="true"
      aria-label="Loading Product Details"
    >
      {/* 1. Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton width={45} height={12} />
        <span className="text-[12px] text-[#999]">/</span>
        <Skeleton width={40} height={12} />
        <span className="text-[12px] text-[#999]">/</span>
        <Skeleton width={70} height={12} />
        <span className="text-[12px] text-[#999]">/</span>
        <Skeleton width={140} height={12} />
      </div>

      {/* 2. Main 2-Column Split: Dual Card System */}
      <div className="grid grid-cols-[1.08fr_0.92fr] items-start gap-[clamp(24px,3.5vw,44px)] max-[1080px]:grid-cols-1 max-[1080px]:gap-7">
        {/* Left Column: Product Showcase Card */}
        <div className="relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-black/5 bg-[#fbfbfa] p-2 pb-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {/* Main Hero Stage */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-sm bg-[#f4f4f2]">
            <Skeleton width="100%" height="100%" />
          </div>
        </div>

        {/* Right Column: Product Detail Card */}
        <div className="relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-black/5 bg-[#fbfbfa] p-2 pb-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {/* Overline & title */}
          <div>
            <Skeleton width={90} height={12} className="mb-2.5" />
            <Skeleton width="92%" height={32} className="mb-2" />
            <Skeleton width="65%" height={32} className="mb-3.5" />

            {/* Price & Stock row */}
            <div className="flex items-center justify-between">
              <Skeleton width={110} height={28} />
              <Skeleton variant="pill" width={140} height={24} />
            </div>
          </div>

          <div className="my-1 h-px bg-black/[0.06]" />

          {/* Description narrative */}
          <div className="flex flex-col gap-2">
            <Skeleton width="100%" height={14} />
            <Skeleton width="95%" height={14} />
            <Skeleton width="80%" height={14} />
          </div>

          {/* Color / Wash Swatches */}
          <div>
            <div className="mb-2.5 flex justify-between">
              <Skeleton width={110} height={14} />
              <Skeleton width={90} height={14} />
            </div>
            <div className="flex gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="circular" width={24} height={24} />
              ))}
            </div>
          </div>

          {/* Sizing Section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Skeleton width={120} height={14} />
              <Skeleton width={85} height={14} />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['XS', 'S', 'M', 'L', 'XL'].map((_, i) => (
                <Skeleton key={i} width="100%" height={48} className="rounded-[2px]" />
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-1 flex flex-col gap-2.5">
            <Skeleton width="100%" height={48} className="rounded-[2px]" />
            <Skeleton width="100%" height={48} className="rounded-[2px]" />
          </div>

          {/* Shipping & Delivery Guarantee box */}
          <div className="flex flex-col gap-3 rounded-[14px] border border-black/5 bg-[#f4f3ee] px-[18px] py-4">
            <Skeleton width="75%" height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      </div>
    </div>
  )
}
