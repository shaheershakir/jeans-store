'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product, HomepageConfig, HomepageSectionType } from '@/lib/constants'
import { DEFAULT_HOMEPAGE_CONFIG } from '@/lib/constants'
import { useCartStore, useFilterStore } from '@/lib/store'
import ProductCard from '@/components/ProductCard'
import CategoryGroups from '@/components/homepage/CategoryGroups'
import CollectionClient from '@/app/CollectionClient'
import { isProductAvailable } from '@/lib/products'

// ─── Sub-components ────────────────────────────────────────────────────────────

function AnnouncementBar({ messages, intervalSeconds }: { messages: string[]; intervalSeconds: number }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!messages || messages.length <= 1) return
    const ms = Math.max(1, intervalSeconds || 4) * 1000
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % messages.length)
        setVisible(true)
      }, 400)
    }, ms)
    return () => clearInterval(id)
  }, [messages, intervalSeconds])

  if (!messages || messages.length === 0) return null

  return (
    <div className="hp-announcement-bar" role="status" aria-live="polite" aria-atomic="true">
      <span className={`hp-announcement-text ${visible ? 'hp-ann-visible' : 'hp-ann-hidden'}`}>
        {messages[idx % messages.length]}
      </span>
    </div>
  )
}

function StarRating({ count }: { count: number }) {
  return (
    <span className="hp-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`hp-star-icon ${i < count ? 'filled' : 'empty'}`}
          viewBox="0 0 24 24"
          fill={i < count ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          width="14"
          height="14"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface HomepageClientProps {
  products: Product[]
  config?: HomepageConfig
}

export default function HomepageClient({ products, config }: HomepageClientProps) {
  const setCategory = useFilterStore((s) => s.setCategory)
  const [activeReview, setActiveReview] = useState(0)

  const cfg = config || DEFAULT_HOMEPAGE_CONFIG

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useFilterStore.persist.rehydrate()
  }, [])

  const reviewsCount = cfg.reviews?.items?.length || 0

  const newArrivalsLimit = cfg.new_arrivals?.limit || 4
  const bestSellersLimit = cfg.best_sellers?.limit || 4

  const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const newArrivals = products
    .filter((product) => {
      if (!isProductAvailable(product)) return false
      if (!product.createdAt) return product.badge?.toLowerCase() === 'new'
      const createdAt = Date.parse(product.createdAt)
      return Number.isFinite(createdAt) && createdAt <= Date.now() && createdAt >= recentCutoff
    })
    .sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
    .slice(0, newArrivalsLimit)
  const bestSellers = products
    .filter((product) => product.badge?.toLowerCase() === 'bestseller')
    .slice(0, bestSellersLimit)

  // Section renderers
  const renderSection = (sectionId: HomepageSectionType) => {
    // Check if section is enabled
    const isEnabled = cfg.sectionsEnabled?.[sectionId] ?? true
    if (!isEnabled) return null

    switch (sectionId) {
      case 'announcement': {
        if (!cfg.announcement?.enabled) return null
        return (
          <AnnouncementBar
            key="announcement"
            messages={cfg.announcement.messages}
            intervalSeconds={cfg.announcement.intervalSeconds}
          />
        )
      }

      case 'hero': {
        if (!cfg.hero?.enabled) return null
        const h = cfg.hero
        return (
          <section key="hero" className="hp-hero" id="hero">
            <div className="hp-hero-media">
              <Image
                src={h.imageUrl || '/hero-man.jpg'}
                alt={h.title || 'TEESGARAGE — Built for everyday apparel'}
                fill
                priority
                className="hp-hero-img"
                sizes="100vw"
              />
              <div className="hp-hero-overlay" />
            </div>
            <div className="hp-hero-content">
              <div className="hp-hero-inner">
                {h.eyebrow && <span className="hp-hero-eyebrow">{h.eyebrow}</span>}
                <h1 className="hp-hero-title" style={{ whiteSpace: 'pre-line' }}>
                  {h.title}
                </h1>
                <p className="hp-hero-sub" style={{ whiteSpace: 'pre-line' }}>
                  {h.subtitle}
                </p>
                <div className="hp-hero-ctas">
                  {h.primaryCtaText && (
                    <Link
                      href={h.primaryCtaLink || '/#catalog'}
                      className="hp-cta-primary"
                      onClick={() => setCategory('all')}
                    >
                      {h.primaryCtaText}
                    </Link>
                  )}
                  {h.secondaryCtaText && (
                    <Link
                      href={h.secondaryCtaLink || '/#catalog'}
                      className="hp-cta-secondary"
                      onClick={() => setCategory('all')}
                    >
                      {h.secondaryCtaText}
                    </Link>
                  )}
                </div>
                {h.trustBadges && h.trustBadges.length > 0 && (
                  <div className="hp-hero-trust">
                    {h.trustBadges.map((badge, idx) => (
                      <span key={idx} className="inline-flex items-center">
                        {idx > 0 && <span className="hp-trust-divider">·</span>}
                        <span>{badge}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="hp-hero-scroll-hint" aria-hidden="true">
              <span className="hp-scroll-label">Scroll</span>
              <div className="hp-scroll-line" />
            </div>
          </section>
        )
      }

      case 'categories': {
        if (!cfg.categories?.enabled) return null
        const cats = cfg.categories
        return (
          <section key="categories" className="hp-section hp-categories-section" aria-labelledby="hp-cat-heading">
            <div className="hp-section-header">
              {cats.eyebrow && <span className="hp-section-eyebrow">{cats.eyebrow}</span>}
              <h2 className="hp-section-title" id="hp-cat-heading">
                {cats.title}
              </h2>
            </div>
            <CategoryGroups config={cats} onSelectCategory={setCategory} />
          </section>
        )
      }

      case 'new_arrivals': {
        if (!cfg.new_arrivals?.enabled) return null
        const na = cfg.new_arrivals
        return (
          <section key="new_arrivals" id="new-arrivals" className="hp-section hp-arrivals-section" aria-labelledby="hp-arrivals-heading">
            <div className="hp-section-header">
              {na.eyebrow && <span className="hp-section-eyebrow">{na.eyebrow}</span>}
              <h2 className="hp-section-title" id="hp-arrivals-heading">
                {na.title}
              </h2>
            </div>
            <div className="hp-product-grid">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {newArrivals.length === 0 && (
              <p className="hp-empty-message">New pieces will appear here as they arrive.</p>
            )}
            {na.ctaText && (
              <div className="hp-section-cta-row">
                <Link
                  href={na.ctaLink && na.ctaLink !== '/#catalog' ? na.ctaLink : '/shop'}
                  className="hp-view-all-btn"
                  onClick={() => setCategory('all')}
                >
                  {na.ctaText}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </section>
        )
      }

      case 'featured_collection': {
        if (!cfg.featured_collection?.enabled) return null
        const fc = cfg.featured_collection
        return (
          <section key="featured_collection" className="hp-section hp-featured-section" aria-labelledby="hp-featured-heading">
            <div className="hp-featured-inner">
              <div className="hp-featured-media">
                <Image
                  src={fc.imageUrl || '/featured-collection.jpg'}
                  alt={fc.title}
                  fill
                  className="hp-featured-img"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                <div className="hp-featured-overlay" />
              </div>
              <div className="hp-featured-content">
                {fc.eyebrow && <span className="hp-featured-eyebrow">{fc.eyebrow}</span>}
                <h2 className="hp-featured-title" id="hp-featured-heading" style={{ whiteSpace: 'pre-line' }}>
                  {fc.title}
                </h2>
                <p className="hp-featured-desc">{fc.description}</p>
                {fc.ctaText && (
                  <Link href={fc.ctaLink || '/#catalog'} className="hp-featured-cta" onClick={() => setCategory('all')}>
                    {fc.ctaText}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )
      }

      case 'best_sellers': {
        if (!cfg.best_sellers?.enabled || bestSellers.length === 0) return null
        const bs = cfg.best_sellers
        return (
          <section key="best_sellers" className="hp-section hp-bestsellers-section" aria-labelledby="hp-bs-heading">
            <div className="hp-section-header">
              {bs.eyebrow && <span className="hp-section-eyebrow">{bs.eyebrow}</span>}
              <h2 className="hp-section-title" id="hp-bs-heading">
                {bs.title}
              </h2>
              {bs.subtitle && <p className="hp-section-sub">{bs.subtitle}</p>}
            </div>
            <div className="hp-product-grid">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )
      }

      case 'brand_story': {
        if (!cfg.brand_story?.enabled) return null
        const bs = cfg.brand_story
        return (
          <section key="brand_story" className="hp-section hp-brand-section" aria-labelledby="hp-brand-heading">
            <div className="hp-brand-inner">
              <div className="hp-brand-media">
                <Image
                  src={bs.imageUrl || '/brand-editorial.jpg'}
                  alt={bs.title}
                  fill
                  className="hp-brand-img"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="hp-brand-content">
                {bs.eyebrow && <span className="hp-brand-eyebrow">{bs.eyebrow}</span>}
                <h2 className="hp-brand-title" id="hp-brand-heading" style={{ whiteSpace: 'pre-line' }}>
                  {bs.title}
                </h2>
                {bs.paragraphs.map((p, idx) => (
                  <p key={idx} className="hp-brand-body">
                    {p}
                  </p>
                ))}
                {bs.stats && bs.stats.length > 0 && (
                  <div className="hp-brand-stats">
                    {bs.stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center">
                        {idx > 0 && <div className="hp-stat-divider" />}
                        <div className="hp-stat">
                          <span className="hp-stat-num">{stat.num}</span>
                          <span className="hp-stat-label">{stat.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {bs.ctaText && (
                  <a href={bs.ctaLink || 'mailto:concierge@teesgarage.in'} className="hp-brand-cta">
                    {bs.ctaText}
                  </a>
                )}
              </div>
            </div>
          </section>
        )
      }

      case 'looks': {
        if (!cfg.looks?.enabled || cfg.looks.items.length === 0) return null
        const lk = cfg.looks
        return (
          <section key="looks" className="hp-section hp-looks-section" aria-labelledby="hp-looks-heading">
            <div className="hp-section-header">
              {lk.eyebrow && <span className="hp-section-eyebrow">{lk.eyebrow}</span>}
              <h2 className="hp-section-title" id="hp-looks-heading">
                {lk.title}
              </h2>
              {lk.subtitle && <p className="hp-section-sub">{lk.subtitle}</p>}
            </div>
            <div className="hp-looks-grid">
              {lk.items.map((look) => (
                <Link key={look.id} href={look.link || '/#catalog'} className="hp-look-card" onClick={() => setCategory('all')}>
                  <div className="hp-look-img-wrap">
                    <Image
                      src={look.img}
                      alt={look.title}
                      fill
                      className="hp-look-img"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="hp-look-overlay" />
                    <div className="hp-look-info">
                      <span className="hp-look-tag">{look.tag}</span>
                      <span className="hp-look-title">{look.title}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      }

      case 'instagram': {
        if (!cfg.instagram?.enabled || cfg.instagram.photos.length === 0) return null
        const ig = cfg.instagram
        return (
          <section key="instagram" className="hp-section hp-instagram-section" aria-labelledby="hp-ig-heading">
            <div className="hp-section-header">
              {ig.eyebrow && <span className="hp-section-eyebrow">{ig.eyebrow}</span>}
              <h2 className="hp-section-title" id="hp-ig-heading">
                {ig.title}
              </h2>
              {ig.subtitle && <p className="hp-section-sub">{ig.subtitle}</p>}
            </div>
            <div className="hp-instagram-grid">
              {ig.photos.map((src, i) => (
                <a
                  key={i}
                  href={ig.instagramUrl || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hp-ig-cell"
                  aria-label={`View Instagram post ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt={`TEESGARAGE look ${i + 1}`}
                    fill
                    className="hp-ig-img"
                    sizes="(max-width: 768px) 33vw, 16vw"
                  />
                  <div className="hp-ig-overlay">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )
      }

      case 'reviews': {
        if (!cfg.reviews?.enabled || reviewsCount === 0) return null
        const rev = cfg.reviews
        return (
          <section key="reviews" className="hp-section hp-reviews-section" aria-labelledby="hp-reviews-heading">
            <div className="hp-section-header">
              <div className="hp-review-rating-summary">
                <StarRating count={5} />
                <span className="hp-rating-text">{rev.ratingText}</span>
              </div>
              <h2 className="hp-section-title" id="hp-reviews-heading">
                {rev.title}
              </h2>
            </div>
            <div className="hp-reviews-carousel">
              <div className="hp-reviews-track" style={{ transform: `translateX(-${activeReview * 100}%)` }}>
                {rev.items.map((r) => (
                  <div key={r.id} className="hp-review-slide">
                    <blockquote className="hp-review-card">
                      <StarRating count={r.stars} />
                      <p className="hp-review-text">&ldquo;{r.text}&rdquo;</p>
                      <footer className="hp-review-footer">
                        <span className="hp-review-name">{r.name}</span>
                        <span className="hp-review-sep">·</span>
                        <span className="hp-review-location">{r.location}</span>
                        <span className="hp-review-sep">·</span>
                        <span className="hp-review-product">{r.product}</span>
                      </footer>
                    </blockquote>
                  </div>
                ))}
              </div>
              {rev.items.length > 1 && (
                <div className="hp-review-dots" role="tablist" aria-label="Review navigation">
                  {rev.items.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={i === activeReview}
                      aria-label={`Review ${i + 1}`}
                      className={`hp-dot ${i === activeReview ? 'active' : ''}`}
                      onClick={() => setActiveReview(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      }

      case 'trust_bar': {
        if (!cfg.trust_bar?.enabled) return null
        const tb = cfg.trust_bar
        return (
          <div key="trust_bar" className="hp-trust-bar">
            {tb.items.map((item, idx) => (
              <div key={item.id || idx} className="hp-trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  {idx === 0 && <path d="M5 12h14M12 5l7 7-7 7" />}
                  {idx === 1 && (
                    <>
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </>
                  )}
                  {idx === 2 && (
                    <>
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </>
                  )}
                  {idx === 3 && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />}
                </svg>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        )
      }

      case 'catalog': {
        if (!cfg.catalog?.enabled) return null
        return <CollectionClient key="catalog" initialProducts={products} />
      }

      default:
        return null
    }
  }

  // Check if catalog was already rendered as part of sectionsOrder
  const catalogInOrder = cfg.sectionsOrder.includes('catalog')
  const catalogEnabled = cfg.sectionsEnabled?.catalog ?? true

  return (
    <div className="hp-root">
      {cfg.sectionsOrder.map((sectionId) => renderSection(sectionId))}
      {/* If catalog was not in sectionsOrder but is enabled, render at bottom as fallback */}
      {!catalogInOrder && catalogEnabled && <CollectionClient initialProducts={products} />}
    </div>
  )
}
