'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Product, HomepageConfig } from '@/lib/constants'
import { useCartStore, useFilterStore, useFavoriteStore } from '@/lib/store'

// ─── Data Definitions matching Mockup ───────────────────────────────────────

interface QuickCategory {
  name: string
  href: string
  image: string
}

const QUICK_CATEGORIES: QuickCategory[] = [
  { name: 'Stripes', href: '/shop/stripes', image: '/mock-assets/quick-cat-stripes.jpg' },
  { name: 'Fullsleeve', href: '/shop/fullsleeve', image: '/mock-assets/quick-cat-fullsleeve.jpg' },
  { name: 'Drsleeve', href: '/shop/drsleeve', image: '/mock-assets/quick-cat-drsleeve.jpg' },
  { name: 'Printed tees', href: '/shop/printed-tees', image: '/mock-assets/quick-cat-printed-tees.jpg' },
  { name: 'Ringer tees', href: '/shop/ringer-tees', image: '/mock-assets/quick-cat-ringer-tees.jpg' },
  { name: 'Henley', href: '/shop/henley', image: '/mock-assets/quick-cat-henley.jpg' },
  { name: 'Trackpants', href: '/shop/trackpants', image: '/mock-assets/quick-cat-trackpants.jpg' },
  { name: 'Sweatpants', href: '/shop/sweatpants', image: '/mock-assets/quick-cat-sweatpants.jpg' },
]

interface MockArrival {
  fallbackId: number
  name: string
  wash: string
  price: string
  swatches: string[]
  image: string
  searchTerm: string
}

const MOCK_NEW_ARRIVALS: MockArrival[] = [
  {
    fallbackId: 101,
    name: 'Vintage Skate Micro-Stripe Tee',
    wash: 'Washed Black / Ash',
    price: '₹1,249',
    swatches: ['#1c1c1c', '#9e9e9e'],
    image: '/mock-assets/product-vintage-skate-clean.jpg',
    searchTerm: 'Vintage Skate'
  },
  {
    fallbackId: 102,
    name: 'Doodle Archive Oversized Tee',
    wash: 'Off White',
    price: '₹1,099',
    swatches: ['#333333', '#e0dcd5', '#7a7a7a'],
    image: '/mock-assets/product-doodle-archive-clean.jpg',
    searchTerm: 'Doodle Archive'
  },
  {
    fallbackId: 103,
    name: 'Good Days Ahead Tee',
    wash: 'Forest Green',
    price: '₹1,249',
    swatches: ['#1c3b2b', '#232323'],
    image: '/mock-assets/product-good-days-ahead-clean.jpg',
    searchTerm: 'Good Days Ahead'
  },
  {
    fallbackId: 104,
    name: 'Daisy Minimal Tee',
    wash: 'Black',
    price: '₹1,099',
    swatches: ['#111111', '#c5c5c5'],
    image: '/mock-assets/product-daisy-minimal-clean.jpg',
    searchTerm: 'Daisy Minimal'
  }
]

interface ShopCategory {
  name: string
  href: string
  image: string
}

const SHOP_CATEGORIES: ShopCategory[] = [
  { name: 'Stripes', href: '/shop/stripes', image: '/mock-assets/shop-cat-stripes-clean.jpg' },
  { name: 'Fullsleeve', href: '/shop/fullsleeve', image: '/mock-assets/shop-cat-fullsleeve-clean.jpg' },
  { name: 'Drsleeve', href: '/shop/drsleeve', image: '/mock-assets/shop-cat-drsleeve-clean.jpg' },
  { name: 'Printed tees', href: '/shop/printed-tees', image: '/mock-assets/shop-cat-printed-tees-clean.jpg' },
  { name: 'Ringer tees', href: '/shop/ringer-tees', image: '/mock-assets/shop-cat-ringer-tees-clean.jpg' },
  { name: 'Henley', href: '/shop/henley', image: '/mock-assets/shop-cat-henley-clean.jpg' },
  { name: 'Trackpants', href: '/shop/trackpants', image: '/mock-assets/shop-cat-trackpants-clean.jpg' },
  { name: 'Sweatpants', href: '/shop/sweatpants', image: '/mock-assets/shop-cat-sweatpants-clean.jpg' },
]

// ─── Main Homepage Component ────────────────────────────────────────────────

interface HomepageClientProps {
  products: Product[]
  config?: HomepageConfig
}

export default function HomepageClient({ products }: HomepageClientProps) {
  const isFavorite = useFavoriteStore((s) => s.isFavorite)
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useFilterStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  // Resolve product links to existing DB products where matching, or fallback to search
  const resolvedArrivals = MOCK_NEW_ARRIVALS.map((arrival) => {
    const match = products.find((p) =>
      p.name.toLowerCase().includes(arrival.searchTerm.toLowerCase())
    )
    const id = match ? match.id : arrival.fallbackId
    const href = match ? `/product/${match.id}` : `/shop?search=${encodeURIComponent(arrival.searchTerm)}`
    return {
      ...arrival,
      id,
      href,
    }
  })

  return (
    <div className="tg-home-page">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="tg-hero-section" aria-label="Hero Banner">
        <div className="tg-container">
          <div className="tg-hero-card">
            <Image
              src="/test-hero-model.jpg"
              alt="Graphic Tees for Real Life - New Season"
              fill
              priority
              className="tg-hero-bg"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
            {/* Stamp Logo */}
            <Image
              src="/mock-assets/good-tees-stamp.png"
              alt="Good Tees Better Days"
              width={112}
              height={112}
              priority
              className="tg-hero-stamp"
            />
            {/* Content Left */}
            <div className="tg-hero-content">
              <span className="tg-hero-eyebrow">NEW SEASON</span>
              <h1 className="tg-hero-title">
                Graphic Tees<br />for Real Life
              </h1>
              <p className="tg-hero-sub">
                Clean designs. Better fits. Made for<br />everyday escapes.
              </p>
              <Link href="/shop/printed-tees" className="tg-pill-btn">
                <span>Shop Printed Tees</span>
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
            {/* Bottom Left Pagination Dots */}
            <div className="tg-hero-dots" aria-hidden="true">
              <span className="tg-hero-dot active" />
              <span className="tg-hero-dot" />
              <span className="tg-hero-dot" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Quick Category Strip (8 Cards Row) ──────────────────── */}
      <section className="tg-quick-cats-section" aria-label="Quick Category Shortcuts">
        <div className="tg-container">
          <div className="tg-quick-cats-grid">
            {QUICK_CATEGORIES.map((cat) => (
              <Link key={cat.name} href={cat.href} className="tg-quick-cat-card">
                <div className="tg-quick-cat-img-wrap">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 130px, 160px"
                    className="tg-quick-cat-img"
                  />
                </div>
                <div className="tg-quick-cat-pill">
                  <span className="tg-quick-cat-name">{cat.name}</span>
                  <span className="tg-quick-cat-arrow" aria-hidden="true">
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
      <section className="tg-arrivals-section" aria-labelledby="tg-arrivals-heading">
        <div className="tg-container">
          <div className="tg-section-header">
            <div>
              <h2 className="tg-section-title" id="tg-arrivals-heading">New Arrivals</h2>
              <p className="tg-section-sub">Fresh drops. Same good energy.</p>
            </div>
            <Link href="/shop" className="tg-view-all-link">
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
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="tg-arrivals-grid">
            {resolvedArrivals.map((item) => {
              const favorited = isFavorite(item.id)
              return (
                <div key={item.name} className="tg-product-card">
                  <div className="tg-product-img-wrap">
                    <Link href={item.href} className="tg-product-img-link" aria-label={`View ${item.name}`}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 900px) 50vw, 25vw"
                        className="tg-product-img"
                      />
                    </Link>
                    <button
                      type="button"
                      className={`tg-wishlist-btn ${favorited ? 'active' : ''}`}
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
                  <div className="tg-product-info">
                    <Link href={item.href} className="tg-product-info-link" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 className="tg-product-name">{item.name}</h3>
                    </Link>
                    <p className="tg-product-wash">{item.wash}</p>
                    <div className="tg-product-bottom-row">
                      <span className="tg-product-price">{item.price}</span>
                      <div className="tg-product-swatches" aria-label="Available colors">
                        {item.swatches.map((color, idx) => (
                          <span
                            key={idx}
                            className="tg-swatch-dot"
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
      <section className="tg-editorial-section" aria-label="Everyday Essentials Editorial Banner">
        <div className="tg-container">
          <div className="tg-editorial-card">
            <Image
              src="/mock-assets/editorial-banner-clean.jpg"
              alt="Everyday Essentials - Oversized Fits Minimal Effort"
              fill
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="tg-editorial-bg"
            />
            <div className="tg-editorial-content">
              <span className="tg-editorial-eyebrow">EVERYDAY ESSENTIALS</span>
              <h2 className="tg-editorial-title">
                Oversized Fits<br />Minimal Effort
              </h2>
              <p className="tg-editorial-sub">
                Relaxed silhouettes. Timeless designs.<br />Built for wherever you&apos;re headed.
              </p>
              <Link href="/shop" className="tg-pill-btn">
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

      {/* ── 5. Shop by Category (8 Cards: 2 Rows x 4 Cols) ─────────── */}
      <section className="tg-shop-cats-section" aria-labelledby="tg-shop-cats-heading">
        <div className="tg-container">
          <div className="tg-section-header">
            <div>
              <h2 className="tg-section-title" id="tg-shop-cats-heading">Shop by Category</h2>
              <p className="tg-section-sub">Find your fit. Explore the collection.</p>
            </div>
          </div>
          <div className="tg-shop-cats-grid">
            {SHOP_CATEGORIES.map((cat) => (
              <Link key={cat.name} href={cat.href} className="tg-shop-cat-card">
                <div className="tg-shop-cat-img-wrap">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 900px) 50vw, 25vw"
                    className="tg-shop-cat-img"
                  />
                </div>
                <div className="tg-shop-cat-bar">
                  <span className="tg-shop-cat-title">{cat.name}</span>
                  <span className="tg-shop-cat-circle-arrow" aria-hidden="true">
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

      {/* ── 6. Trust Bar (Value Props Strip) ───────────────────────── */}
      <section className="tg-trust-bar-section" aria-label="Store Guarantees">
        <div className="tg-container">
          <div className="tg-trust-bar-grid">
            <div className="tg-trust-item">
              <svg
                className="tg-trust-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <div className="tg-trust-text">
                <span className="tg-trust-heading">Free 7-day</span>
                <span className="tg-trust-caption">exchanges</span>
              </div>
            </div>

            <div className="tg-trust-item">
              <svg
                className="tg-trust-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <div className="tg-trust-text">
                <span className="tg-trust-heading">Secure</span>
                <span className="tg-trust-caption">payments</span>
              </div>
            </div>

            <div className="tg-trust-item">
              <svg
                className="tg-trust-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <div className="tg-trust-text">
                <span className="tg-trust-heading">Pan India</span>
                <span className="tg-trust-caption">delivery</span>
              </div>
            </div>

            <div className="tg-trust-item">
              <svg
                className="tg-trust-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <div className="tg-trust-text">
                <span className="tg-trust-heading">Dedicated</span>
                <span className="tg-trust-caption">support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
