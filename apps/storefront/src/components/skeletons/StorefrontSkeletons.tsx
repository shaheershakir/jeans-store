import React from 'react'

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Hero card placeholder */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8 pt-4 pb-6">
        <div className="w-full h-[380px] sm:h-[430px] md:h-[460px] rounded-[24px] max-[768px]:rounded-[18px] skeleton-shimmer" />
      </div>

      {/* Quick Category Strip placeholder */}
      <section className="pb-12" aria-hidden="true">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="flex overflow-x-hidden gap-3 md:gap-3.5 pb-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex-[0_0_135px] sm:flex-[0_0_145px] lg:flex-[0_0_152px] aspect-[1/1.42] rounded-[18px] skeleton-shimmer shrink-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals placeholder */}
      <section className="pb-14" aria-hidden="true">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-5.5 flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-8 w-44 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-60 rounded-md skeleton-shimmer" />
            </div>
            <div className="h-5 w-20 rounded-md skeleton-shimmer" />
          </div>

          <div className="grid grid-cols-4 gap-4.5 max-[900px]:grid-cols-2 max-[900px]:gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="w-full aspect-[1/1.18] rounded-[18px] skeleton-shimmer" />
                <div className="mt-3 h-4 w-3/4 rounded-md skeleton-shimmer" />
                <div className="mt-1.5 h-3 w-1/2 rounded-md skeleton-shimmer" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="h-4 w-16 rounded-md skeleton-shimmer" />
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer" />
                    <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer" />
                    <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export function ShopSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4">
        <div className="h-4 w-40 rounded-md skeleton-shimmer" />
      </div>

      {/* Title & Count Bar */}
      <div className="pt-1 pb-4">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 flex items-baseline gap-3">
          <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-5 w-20 rounded-md skeleton-shimmer" />
        </div>
      </div>

      {/* Main catalog */}
      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex items-start">
            {/* Desktop left filter sidebar */}
            <aside className="w-[240px] lg:w-[250px] shrink-0 border-r border-gray-200 pr-6 pt-5 pb-12 hidden md:block">
              <div className="flex items-center justify-between pb-4">
                <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                <div className="h-3 w-14 rounded-md skeleton-shimmer" />
              </div>
              <div className="space-y-6 pt-4 border-t border-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="h-4 w-28 rounded-md skeleton-shimmer" />
                    <div className="space-y-1.5 pl-1">
                      <div className="h-3.5 w-36 rounded-md skeleton-shimmer" />
                      <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
                      <div className="h-3.5 w-32 rounded-md skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Right main column */}
            <main className="flex-1 min-w-0 pl-0 md:pl-6 lg:pl-8 pt-4 pb-12">
              <div className="flex justify-end pb-5">
                <div className="h-8 w-44 rounded-lg skeleton-shimmer" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-4 xl:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="w-full aspect-[3/4] rounded-md skeleton-shimmer" />
                    <div className="mt-3 h-4 w-4/5 rounded-md skeleton-shimmer" />
                    <div className="mt-1.5 h-3 w-2/5 rounded-md skeleton-shimmer" />
                    <div className="mt-2 h-4 w-1/4 rounded-md skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* Breadcrumb bone row */}
        <div className="h-4 w-48 rounded-md skeleton-shimmer mb-6" />

        {/* 12-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column (lg:col-span-7) */}
          <div className="lg:col-span-7">
            <div className="aspect-[4/5] w-full rounded-2xl skeleton-shimmer" />
            <div className="grid grid-cols-5 gap-3 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>

          {/* Right Column (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col pt-1 space-y-4">
            {/* Category Eyebrow */}
            <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
            {/* Title */}
            <div className="h-8 w-4/5 rounded-lg skeleton-shimmer" />
            {/* Price + Discount pill */}
            <div className="flex items-center gap-3">
              <div className="h-7 w-24 rounded-md skeleton-shimmer" />
              <div className="h-5 w-16 rounded-md skeleton-shimmer" />
              <div className="h-6 w-20 rounded-full skeleton-shimmer" />
            </div>
            {/* Taxes notice */}
            <div className="h-3 w-28 rounded-md skeleton-shimmer" />

            {/* 7 circular color swatch bones */}
            <div className="pt-2">
              <div className="h-4 w-28 rounded-md skeleton-shimmer mb-3" />
              <div className="flex gap-2.5 sm:gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full skeleton-shimmer" />
                ))}
              </div>
            </div>

            {/* 5 size button bones */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                <div className="h-4 w-18 rounded-md skeleton-shimmer" />
              </div>
              <div className="flex gap-2.5 sm:gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-14 sm:w-16 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            </div>

            {/* Delivery Box */}
            <div className="h-[74px] w-full rounded-2xl skeleton-shimmer mt-2" />

            {/* Action buttons: wishlist + Add to bag + Buy now */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0" />
                <div className="flex-1 h-12 rounded-xl skeleton-shimmer" />
              </div>
              <div className="w-full h-12 rounded-xl skeleton-shimmer" />
            </div>

            {/* 3 accordion row bones */}
            <div className="border-t border-gray-200/80 pt-2 space-y-4">
              <div className="h-12 w-full rounded-lg skeleton-shimmer" />
              <div className="h-12 w-full rounded-lg skeleton-shimmer" />
              <div className="h-12 w-full rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AccountOrdersSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 w-44 rounded-lg skeleton-shimmer" />
        <div className="mt-1 h-4 w-64 rounded-md skeleton-shimmer" />
      </div>

      {/* 3 Order Cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[20px] bg-white p-5 sm:p-6 border border-black/4 shadow-xs space-y-4"
          >
            {/* Top row: orderId, date, badge */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-28 rounded-md skeleton-shimmer" />
                <div className="h-4 w-20 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-6 w-24 rounded-full skeleton-shimmer" />
            </div>
            {/* Body */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-[84px] h-[84px] sm:w-[105px] sm:h-[105px] rounded-[14px] skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 rounded-md skeleton-shimmer" />
                <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                <div className="h-4 w-24 rounded-md skeleton-shimmer" />
              </div>
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
                <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AccountProfileSkeleton() {
  return (
    <div>
      {/* Mobile view (< md) */}
      <div className="block md:hidden space-y-6">
        <div>
          <div className="h-8 w-40 rounded-lg skeleton-shimmer" />
          <div className="mt-1 h-4 w-56 rounded-md skeleton-shimmer" />
        </div>
        <div className="rounded-[20px] bg-white p-5 border border-black/4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full skeleton-shimmer shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 rounded-md skeleton-shimmer" />
              <div className="h-4 w-44 rounded-md skeleton-shimmer" />
            </div>
          </div>
          <div className="h-10 w-full rounded-xl skeleton-shimmer" />
        </div>
        <div className="rounded-[20px] bg-white p-5 border border-black/4 space-y-3">
          <div className="h-5 w-36 rounded-md skeleton-shimmer" />
          <div className="h-14 w-full rounded-xl skeleton-shimmer" />
          <div className="h-14 w-full rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Desktop view (hidden md:block) */}
      <div className="hidden md:block space-y-6">
        <div>
          <div className="h-9 w-48 rounded-lg skeleton-shimmer" />
          <div className="mt-1 h-4 w-60 rounded-md skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[20px] bg-white p-6 border border-black/4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded-md skeleton-shimmer" />
              <div className="h-4 w-12 rounded-md skeleton-shimmer" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-4 w-40 rounded-md skeleton-shimmer" />
              <div className="h-4 w-48 rounded-md skeleton-shimmer" />
              <div className="h-4 w-36 rounded-md skeleton-shimmer" />
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-6 border border-black/4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 rounded-md skeleton-shimmer" />
              <div className="h-4 w-12 rounded-md skeleton-shimmer" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-4 w-44 rounded-md skeleton-shimmer" />
              <div className="h-4 w-52 rounded-md skeleton-shimmer" />
              <div className="h-4 w-28 rounded-md skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderConfirmationSkeleton() {
  return (
    <main className="min-h-screen bg-[#faf9f6] pb-16 pt-7 font-ui text-[#111] lg:pb-20">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_532px]">
          {/* Left Column */}
          <div className="flex min-w-0 flex-col">
            {/* Confirmation Header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-[30px] lg:pl-[38px] lg:pt-[25px]">
              <div className="h-[72px] w-[72px] sm:h-[84px] sm:w-[84px] rounded-full skeleton-shimmer shrink-0" />
              <div className="min-w-0 flex-1 space-y-3 pt-1">
                <div className="h-8 w-3/4 rounded-lg skeleton-shimmer" />
                <div className="h-4 w-full rounded-md skeleton-shimmer" />
                <div className="h-4 w-2/3 rounded-md skeleton-shimmer" />
                <div className="flex gap-4 pt-2">
                  <div className="h-[46px] w-[180px] rounded-[7px] skeleton-shimmer" />
                  <div className="h-[46px] w-[200px] rounded-[7px] skeleton-shimmer" />
                </div>
              </div>
            </div>

            {/* Estimated Arrival Card */}
            <div className="mt-8 rounded-[10px] border border-[#e7e5df] bg-white px-6 pb-6 pt-7 sm:px-7 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg skeleton-shimmer shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded-md skeleton-shimmer" />
                  <div className="h-6 w-44 rounded-md skeleton-shimmer" />
                  <div className="h-4 w-60 rounded-md skeleton-shimmer" />
                </div>
              </div>
              {/* 4-step timeline bar */}
              <div className="pt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-2 rounded-full skeleton-shimmer" />
                ))}
              </div>
            </div>

            {/* Order Details Card */}
            <div className="mt-6 rounded-[10px] border border-[#e7e5df] bg-white p-6 space-y-4">
              <div className="h-5 w-36 rounded-md skeleton-shimmer" />
              <div className="space-y-3">
                <div className="flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-md skeleton-shimmer shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-32 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="rounded-[10px] border border-[#e7e5df] bg-white p-6 space-y-4">
              <div className="h-5 w-36 rounded-md skeleton-shimmer" />
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                  <div className="h-4 w-16 rounded-md skeleton-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                  <div className="h-4 w-16 rounded-md skeleton-shimmer" />
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <div className="h-5 w-24 rounded-md skeleton-shimmer" />
                  <div className="h-5 w-20 rounded-md skeleton-shimmer" />
                </div>
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="rounded-[10px] border border-[#e7e5df] bg-white p-6 space-y-3">
              <div className="h-5 w-40 rounded-md skeleton-shimmer" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-36 rounded-md skeleton-shimmer" />
                <div className="h-4 w-52 rounded-md skeleton-shimmer" />
                <div className="h-4 w-44 rounded-md skeleton-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-[420px] space-y-6">
      {/* Brand Logo bone */}
      <div className="h-10 w-36 rounded-lg skeleton-shimmer mb-6" />

      {/* Heading & Subtitle bones */}
      <div className="space-y-2 mb-7">
        <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-56 rounded-md skeleton-shimmer" />
      </div>

      {/* Google button bone */}
      <div className="h-11 w-full rounded-xl skeleton-shimmer" />

      {/* Divider */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="border-t border-zinc-200/90 w-full" />
      </div>

      {/* 2-3 input bones */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
          <div className="h-11 w-full rounded-xl skeleton-shimmer" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-20 rounded-md skeleton-shimmer" />
          <div className="h-11 w-full rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Submit button bone */}
      <div className="h-12 w-full rounded-xl skeleton-shimmer mt-6" />
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Top Search Bar */}
      <div className="border-b border-black/8 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 flex-1 max-w-2xl rounded-full skeleton-shimmer" />
            <div className="h-10 w-24 rounded-full skeleton-shimmer hidden sm:block" />
          </div>
          {/* Categories strip shimmer */}
          <div className="flex gap-2 overflow-hidden mt-3.5 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full skeleton-shimmer shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter / Sort bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
          <div className="h-4 w-32 rounded-md skeleton-shimmer" />
          <div className="h-8 w-28 rounded-lg skeleton-shimmer" />
        </div>

        {/* 4-column 3:4 portrait card grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="w-full aspect-[3/4] rounded-xl skeleton-shimmer" />
              <div className="space-y-1.5">
                <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
                <div className="h-3.5 w-1/3 rounded-md skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
