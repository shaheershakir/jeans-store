'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Product, HomepageConfig } from '@/lib/constants'
import { useCartStore, useFilterStore, useFavoriteStore } from '@/lib/store'
import { getProductUrl } from '@/lib/products'

// ─── Data Definitions matching Storefront Assets ───────────────────────────

interface QuickCategory {
  name: string
  href: string
  image: string
}

const QUICK_CATEGORIES: QuickCategory[] = [
  { name: 'Stripes', href: '/shop/stripes', image: '/teesgarage-category-assets/category-stripes.webp' },
  { name: 'Fullsleeve', href: '/shop/fullsleeve', image: '/teesgarage-category-assets/category-fullsleeve.webp' },
  { name: 'Drsleeve', href: '/shop/drsleeve', image: '/teesgarage-category-assets/category-drsleeve.webp' },
  { name: 'Printed tees', href: '/shop/printed-tees', image: '/teesgarage-category-assets/category-printed-tees.webp' },
  { name: 'Ringer tees', href: '/shop/ringer-tees', image: '/teesgarage-category-assets/category-ringer-tees.webp' },
  { name: 'Henley', href: '/shop/henley', image: '/teesgarage-category-assets/category-henley.webp' },
  { name: 'Waffle', href: '/shop/waffle', image: '/teesgarage-category-assets/category-fullsleeve.webp' },
  { name: 'Trackpants', href: '/shop/trackpants', image: '/teesgarage-category-assets/category-trackpants.webp' },
  { name: 'Sweatpants', href: '/shop/sweatpants', image: '/teesgarage-category-assets/category-sweatpants.webp' },
]

interface TopBanner {
  image: string
  alt: string
  eyebrow: string
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  align?: 'left' | 'right'
  imagePositionClass?: string
}

const TOP_BANNERS: TopBanner[] = [
  {
    image: '/tessgarage-banner-assets/wide_horizontal_photo_of_a_young_woman_against_a_t.webp',
    alt: 'TEESGARAGE Streetwear - Graphic Tees for Real Life',
    eyebrow: 'NEW SEASON',
    title: 'Graphic Tees\nfor Real Life',
    subtitle: 'Clean designs. Better fits. Made for\neveryday escapes.',
    ctaText: 'Shop Printed Tees',
    ctaLink: '/shop/printed-tees',
    align: 'left',
    imagePositionClass: 'object-[78%_20%] md:object-[70%_25%]'
  },
  {
    image: '/tessgarage-banner-assets/338e5bf0-2823-44cd-96f2-dcf461e28d65.webp',
    alt: 'TEESGARAGE Heavyweight Cotton Collection',
    eyebrow: 'HEAVYWEIGHT DROPS',
    title: 'Structured Cuts\nThat Last',
    subtitle: '260+ GSM combed cotton. Engineered for\nall-day comfort & clean drape.',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
    align: 'left',
    imagePositionClass: 'object-[85%_12%] md:object-[75%_25%]'
  },
  {
    image: '/tessgarage-banner-assets/f20a9215-9f17-44e8-97d3-77cd271b72e8.webp',
    alt: 'TEESGARAGE Timeless Basics',
    eyebrow: 'EVERYDAY ROTATION',
    title: 'Timeless Basics\nModern Silhouettes',
    subtitle: 'Micro-stripes, henleys & engineered pants.\nCuts that hold shape wash after wear.',
    ctaText: 'Shop All Styles',
    ctaLink: '/shop',
    align: 'right',
    imagePositionClass: 'object-center md:object-[25%_center]'
  }
]

function getProductSwatches(product: Product): string[] {
  const colorMap: Record<string, string> = {
    black: '#141414',
    white: '#f5f5f5',
    grey: '#9e9e9e',
    gray: '#9e9e9e',
    ash: '#9e9e9e',
    navy: '#1b2b48',
    blue: '#2563eb',
    green: '#1e3a2b',
    forest: '#1e3a2b',
    beige: '#d6c8b2',
    cream: '#ede6d8',
    olive: '#556b2f',
    brown: '#5c4033',
    red: '#991b1b',
    charcoal: '#222222',
    washed: '#333333',
    waffle: '#d9cdbe'
  }

  if (product.variants && product.variants.length > 0) {
    const colors = Array.from(new Set(product.variants.map((v) => v.color.toLowerCase()).filter(Boolean)))
    if (colors.length > 1) {
      return colors.slice(0, 4).map((c) => colorMap[c] || '#444444')
    }
    if (colors.length === 1) {
      return [colorMap[colors[0]] || '#333333']
    }
  }
  if (product.color) {
    if (product.color.includes('/')) {
      const parts = product.color.split('/').map((s) => s.trim().toLowerCase())
      return parts.map((c) => colorMap[c] || '#333333')
    }
    return [colorMap[product.color.toLowerCase()] || '#333333']
  }
  return ['#141414']
}

interface ShopCategory {
  name: string
  href: string
  image: string
}

const SHOP_CATEGORIES: ShopCategory[] = [
  { name: 'Stripes', href: '/shop/stripes', image: '/teesgarage-category-assets/category-stripes.webp' },
  { name: 'Fullsleeve', href: '/shop/fullsleeve', image: '/teesgarage-category-assets/category-fullsleeve.webp' },
  { name: 'Drsleeve', href: '/shop/drsleeve', image: '/teesgarage-category-assets/category-drsleeve.webp' },
  { name: 'Printed tees', href: '/shop/printed-tees', image: '/teesgarage-category-assets/category-printed-tees.webp' },
  { name: 'Ringer tees', href: '/shop/ringer-tees', image: '/teesgarage-category-assets/category-ringer-tees.webp' },
  { name: 'Henley', href: '/shop/henley', image: '/teesgarage-category-assets/category-henley.webp' },
  { name: 'Waffle', href: '/shop/waffle', image: '/teesgarage-category-assets/category-fullsleeve.webp' },
  { name: 'Trackpants', href: '/shop/trackpants', image: '/teesgarage-category-assets/category-trackpants.webp' },
  { name: 'Sweatpants', href: '/shop/sweatpants', image: '/teesgarage-category-assets/category-sweatpants.webp' },
]

// ─── Main Homepage Component ────────────────────────────────────────────────

interface HomepageClientProps {
  products: Product[]
  config?: HomepageConfig
}

export default function HomepageClient({ products }: HomepageClientProps) {
  const isFavorite = useFavoriteStore((s) => s.isFavorite)
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useFilterStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  // Auto-change top banner image every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TOP_BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Live database products for New Arrivals (fresh drops)
  const newArrivals = useMemo(() => {
    if (!products || products.length === 0) return []
    const explicitNew = products.filter(
      (p) => p.badge?.toLowerCase() === 'new' || p.collection?.toLowerCase() === 'new arrivals'
    )
    const list = explicitNew.length >= 4 ? explicitNew : products
    return list.slice(0, 4)
  }, [products])

  // Live database products for Curated Recommendations
  const recommendedProducts = useMemo(() => {
    if (!products || products.length === 0) return []
    const arrivalIds = new Set(newArrivals.map((p) => String(p.id)))
    const candidates = products.filter((p) => !arrivalIds.has(String(p.id)))

    const curated = candidates.filter(
      (p) =>
        p.badge?.toLowerCase() === 'bestseller' ||
        p.collection?.toLowerCase() === 'bestsellers' ||
        p.collection?.toLowerCase() === 'featured' ||
        (p.rating && p.rating >= 4.6)
    )

    const list = curated.length >= 4 ? curated : candidates
    return list.slice(0, 4)
  }, [products, newArrivals])

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] selection:bg-black selection:text-white">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="pt-3 pb-6 max-[768px]:pt-2 max-[768px]:pb-4" aria-label="Hero Banner">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="group relative flex h-[480px] sm:h-[500px] md:h-[540px] lg:h-[570px] w-full items-end md:items-center overflow-hidden rounded-[20px] md:rounded-[26px] bg-[#111111] shadow-[0_12px_36px_rgba(0,0,0,0.18)]">
            {/* Background Carousel Images */}
            {TOP_BANNERS.map((banner, idx) => (
              <div
                key={banner.image}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === currentSlide ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  priority={idx === 0}
                  className={`h-full w-full object-cover ${banner.imagePositionClass || 'object-center'}`}
                  sizes="(max-width: 1440px) 100vw, 1400px"
                />
              </div>
            ))}

            {/* Deep Black Gradient Overlay: from bottom on mobile, from left or right on desktop */}
            <div
              className={`absolute inset-0 bg-linear-to-t from-black/95 via-black/60 to-black/10 pointer-events-none z-[1] transition-all duration-700 ${
                TOP_BANNERS[currentSlide].align === 'right'
                  ? 'md:bg-linear-to-l md:from-black/85 md:via-black/50 md:to-transparent'
                  : 'md:bg-linear-to-r md:from-black/85 md:via-black/50 md:to-transparent'
              }`}
              aria-hidden="true"
            />

            {/* Stamp Logo: moves to top-left if text is on right */}
            <Image
              src="/good-tees-stamp.png"
              alt="Good Tees Better Days"
              width={130}
              height={130}
              priority
              className={`pointer-events-none absolute top-4 md:top-7 lg:top-9 z-10 w-16 sm:w-20 md:w-28 lg:w-32 h-auto opacity-80 invert brightness-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-500 ${
                TOP_BANNERS[currentSlide].align === 'right'
                  ? 'left-4 md:left-8 lg:left-11'
                  : 'right-4 md:right-8 lg:right-11'
              }`}
            />

            {/* Content: lower end on mobile, left or right on desktop */}
            <div
              className={`relative z-10 flex w-full max-w-[620px] flex-col justify-end px-5 py-6 sm:px-8 sm:py-8 md:p-14 lg:p-16 transition-all duration-500 ${
                TOP_BANNERS[currentSlide].align === 'right'
                  ? 'md:ml-auto md:items-start'
                  : 'md:mr-auto md:items-start'
              }`}
            >
              <span className="mb-2 sm:mb-3 md:mb-3.5 block text-[11.5px] sm:text-[12.5px] md:text-[13px] font-bold uppercase tracking-[0.18em] text-white/80">
                {TOP_BANNERS[currentSlide].eyebrow}
              </span>
              <h1 className="mb-3 sm:mb-4 md:mb-4.5 text-[32px] sm:text-[36px] md:text-[44px] lg:text-[54px] font-extrabold leading-[1.12] sm:leading-[1.14] md:leading-[1.12] tracking-[-0.025em] text-white whitespace-pre-line">
                {TOP_BANNERS[currentSlide].title}
              </h1>
              <p className="mb-5 sm:mb-6 md:mb-7 max-w-[340px] sm:max-w-[380px] md:max-w-[420px] text-[14.5px] sm:text-[15.5px] md:text-[16px] leading-[1.5] text-white/90 whitespace-pre-line">
                {TOP_BANNERS[currentSlide].subtitle}
              </p>
              
              <Link
                href={TOP_BANNERS[currentSlide].ctaLink}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 sm:px-6 sm:py-3.5 text-[13.5px] sm:text-[14.5px] font-bold text-[#111111] shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-[0_6px_20px_rgba(0,0,0,0.45)] active:scale-[0.98]"
              >
                <span>{TOP_BANNERS[currentSlide].ctaText}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Carousel Dots: positioned consistently at the lower-right of the banner for both Mobile and Desktop */}
            <div
              className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 md:bottom-10 md:right-10 z-20 flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/45 px-3 py-1.5 sm:px-3.5 sm:py-2 backdrop-blur-md border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              role="tablist"
              aria-label="Hero carousel pagination"
            >
              {TOP_BANNERS.map((banner, idx) => (
                <button
                  key={banner.image}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentSlide}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? 'w-5 sm:w-7 bg-white'
                      : 'w-2 sm:w-2.5 bg-white/45 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quick Category Strip (Carousel Row) ──────────────────── */}
      <section className="pb-12" aria-label="Quick Category Shortcuts">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-3 md:gap-3.5 pb-2.5 snap-x snap-mandatory scrollbar-none">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative flex flex-col overflow-hidden rounded-[18px] bg-[#f4f2ee] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] flex-[0_0_135px] sm:flex-[0_0_145px] lg:flex-[0_0_152px] snap-start shrink-0"
              >
                <div className="relative w-full aspect-[1/1.42] overflow-hidden bg-[#e9e6df]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 135px, 165px"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="m-2 flex items-center justify-between gap-1 rounded-[14px] bg-white/95 px-3 py-2 shadow-xs border border-black/4 backdrop-blur-xs">
                  <span className="truncate text-[12.5px] font-bold text-[#111111]">{cat.name}</span>
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-black/15 text-[#111111] transition-all duration-200 group-hover:border-[#111111] group-hover:bg-[#111111] group-hover:text-white group-hover:translate-x-0.5" aria-hidden="true">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. New Arrivals (4 Products) ───────────────────────────── */}
      <section className="pb-14" aria-labelledby="tg-arrivals-heading">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-5.5 flex items-end justify-between">
            <div>
              <h2 className="text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.025em] text-[#111111] leading-tight" id="tg-arrivals-heading">
                New Arrivals
              </h2>
              <p className="mt-1 text-[15px] text-[#666666]">Fresh drops. Same good energy.</p>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-[#111111] transition-colors hover:text-black"
            >
              <span>View All</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4.5 max-[900px]:grid-cols-2 max-[900px]:gap-3.5">
            {newArrivals.map((item) => {
              const favorited = isFavorite(item.id)
              const href = getProductUrl(item)
              const imageSrc = item.img || item.images?.[0] || '/hero-man.jpg'
              const swatches = getProductSwatches(item)
              const subtitle = item.color || item.category || 'Everyday Essential'
              return (
                <div key={String(item.id)} className="group relative flex flex-col">
                  {/* Image Stage */}
                  <div className="relative w-full aspect-[1/1.18] overflow-hidden rounded-[18px] bg-[#edeae4] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]">
                    <Link href={href} className="absolute inset-0 z-0 block h-full w-full" aria-label={`View ${item.name}`}>
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        sizes="(max-width: 900px) 50vw, 25vw"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-104"
                      />
                    </Link>
                    {item.badge && (
                      <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/80 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white backdrop-blur-xs shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`absolute right-2.5 top-2.5 z-10 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-xs transition-all duration-200 hover:scale-110 hover:bg-white ${
                        favorited ? 'text-[#e11d48]' : 'text-[#222222]'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(item.id)
                      }}
                      aria-label={favorited ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={favorited ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="mt-2.5 flex flex-col">
                    <Link href={href} className="truncate text-[13.5px] font-bold leading-snug text-[#111111] no-underline transition-colors hover:underline">
                      <h3>{item.name}</h3>
                    </Link>
                    <p className="mt-0.5 text-[11.5px] text-[#777777]">{subtitle}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[14.5px] font-extrabold tracking-tight text-[#111111]">{item.price}</span>
                      <div className="flex items-center gap-1.5" aria-label="Available colors">
                        {swatches.map((color, idx) => (
                          <span
                            key={idx}
                            className="inline-block h-[9px] w-[9px] rounded-full border border-black/15"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Editorial Feature Banner ────────────────────────────── */}
      <section className="pb-14" aria-label="Everyday Essentials Editorial Banner">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="relative flex min-h-[350px] lg:min-h-[390px] w-full items-center overflow-hidden rounded-[26px] bg-[#8f796c] shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-[768px]:min-h-[300px] max-[768px]:rounded-[18px] max-[640px]:min-h-[280px]">
            <Image
              src="/tessgarage-banner-assets/middle-banner/wide_cinematic_coastal_scene_a_photorealistic_sh.webp"
              alt="Everyday Essentials - Oversized Fits Minimal Effort"
              fill
              sizes="(max-width: 1440px) 100vw, 1400px"
              className="absolute inset-0 h-full w-full object-cover object-center z-0"
            />
            {/* Contrast Overlay for Right-Aligned Text */}
            <div
              className="absolute inset-0 bg-linear-to-l from-white/85 via-white/45 to-transparent pointer-events-none z-[1] max-[768px]:from-white/90 max-[768px]:via-white/70 max-[768px]:to-white/40"
              aria-hidden="true"
            />
            <div className="relative z-10 ml-auto mr-[clamp(40px,7vw,100px)] max-w-[440px] py-11 text-left max-[900px]:mr-6 max-[900px]:max-w-[320px] max-[900px]:py-8 max-[640px]:mr-4 max-[640px]:max-w-[260px]">
              <span className="mb-2.5 block text-[12.5px] font-bold uppercase tracking-[0.14em] text-black/70">
                EVERYDAY ESSENTIALS
              </span>
              <h2 className="mb-3 text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#111111]">
                Oversized Fits<br />Minimal Effort
              </h2>
              <p className="mb-5.5 text-[15px] leading-[1.45] text-[#3a3a3a] max-[640px]:mb-4 max-[640px]:text-[13px]">
                Relaxed silhouettes. Timeless designs.<br />Built for wherever you&apos;re headed.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 rounded-[13px] bg-[#141414] px-7 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#262626] hover:shadow-[0_6px_18px_rgba(0,0,0,0.2)] active:scale-[0.98]"
              >
                <span>Shop Now</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Recommended For You (Curated Picks) ─────────────────── */}
      <section className="pb-14" aria-labelledby="tg-recommended-heading">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-5.5 flex items-end justify-between">
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-black/60">
                Curated For You
              </span>
              <h2 className="text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.025em] text-[#111111] leading-tight" id="tg-recommended-heading">
                Recommended
              </h2>
              <p className="mt-1 text-[15px] text-[#666666]">Handpicked silhouettes tailored to your daily rotation.</p>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-[#111111] transition-colors hover:text-black"
            >
              <span>Explore Collection</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4.5 max-[900px]:grid-cols-2 max-[900px]:gap-3.5">
            {recommendedProducts.map((item) => {
              const favorited = isFavorite(item.id)
              const href = getProductUrl(item)
              const imageSrc = item.img || item.images?.[0] || '/hero-man.jpg'
              const swatches = getProductSwatches(item)
              const subtitle = item.color || item.category || 'Everyday Essential'
              return (
                <div key={String(item.id)} className="group relative flex flex-col">
                  {/* Image Stage */}
                  <div className="relative w-full aspect-[1/1.18] overflow-hidden rounded-[18px] bg-[#edeae4] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]">
                    <Link href={href} className="absolute inset-0 z-0 block h-full w-full" aria-label={`View ${item.name}`}>
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        sizes="(max-width: 900px) 50vw, 25vw"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-104"
                      />
                    </Link>
                    {item.badge && (
                      <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/80 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white backdrop-blur-xs shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`absolute right-2.5 top-2.5 z-10 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-xs backdrop-blur-xs transition-all duration-200 hover:scale-110 hover:bg-white ${
                        favorited ? 'text-[#e11d48]' : 'text-[#222222]'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite(item.id)
                      }}
                      aria-label={favorited ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={favorited ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="mt-2.5 flex flex-col">
                    <Link href={href} className="truncate text-[13.5px] font-bold leading-snug text-[#111111] no-underline transition-colors hover:underline">
                      <h3>{item.name}</h3>
                    </Link>
                    <p className="mt-0.5 text-[11.5px] text-[#777777]">{subtitle}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[14.5px] font-extrabold tracking-tight text-[#111111]">{item.price}</span>
                      <div className="flex items-center gap-1.5" aria-label="Available colors">
                        {swatches.map((color, idx) => (
                          <span
                            key={idx}
                            className="inline-block h-[9px] w-[9px] rounded-full border border-black/15"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Shop by Category (8 Cards: 2 Rows x 4 Cols) ─────────── */}
      <section className="pb-14" aria-labelledby="tg-shop-cats-heading">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="mb-5.5">
            <h2 className="text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.025em] text-[#111111] leading-tight" id="tg-shop-cats-heading">
              Shop by Category
            </h2>
            <p className="mt-1 text-[15px] text-[#666666]">Find your fit. Explore the collection.</p>
          </div>
          <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[900px]:gap-3">
            {SHOP_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group flex flex-col overflow-hidden rounded-[18px] border border-black/6 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]"
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#edeae4]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 900px) 50vw, 25vw"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <span className="text-[13.5px] font-bold text-[#111111]">{cat.name}</span>
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[#e5e3dc] text-[#111111] transition-all duration-200 group-hover:border-[#111111] group-hover:bg-[#111111] group-hover:text-white group-hover:translate-x-0.5" aria-hidden="true">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
