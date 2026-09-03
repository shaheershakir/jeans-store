'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cartCount, useCartStore, useUIStore, useFilterStore } from '@/lib/store'

const NAV_LINKS: { label: string; href: string; fit: 'all' | 'Straight' | 'Baggy' | 'Wide' | 'Relaxed' | 'Bootcut' }[] = [
  { label: 'All Silhouettes', href: '/', fit: 'all' },
  { label: 'Straight', href: '/', fit: 'Straight' },
  { label: 'Baggy & Wide', href: '/', fit: 'Baggy' },
  { label: 'Relaxed', href: '/', fit: 'Relaxed' }
]

export default function Header() {
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const setFit = useFilterStoreSync()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const count = cartCount(items)

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Elevated Wordmark */}
          <Link className="site-brand" href="/" aria-label="INFIT Homepage">
            <span className="brand-name">INFIT</span>
            <span className="brand-badge">ARCHIVE</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="nav-item-link"
                onClick={() => setFit(link.fit)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Tools */}
          <div className="header-actions">
            <button
              className="action-icon-btn search-trigger"
              type="button"
              aria-label="Search catalog"
              title="Search products"
              onClick={() => openOverlay('search')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="action-btn-text">Search</span>
            </button>

            <button
              className="header-cart-btn"
              type="button"
              aria-label={`Shopping bag with ${count} items`}
              title="View shopping bag"
              onClick={() => openOverlay('cart')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="cart-label">Bag</span>
              <span className={`cart-count-pill ${count > 0 ? 'highlight' : ''}`}>{count}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="mobile-nav-panel">
            <div className="mobile-nav-links">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="mobile-nav-item"
                  onClick={() => {
                    setFit(link.fit)
                    setMenuOpen(false)
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mobile-nav-meta">
                <span>Direct Studio Support</span>
                <a href="mailto:concierge@infit.in">concierge@infit.in</a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}

function useFilterStoreSync() {
  const setFit = useFilterStore((state) => state.setFit)
  return setFit
}
