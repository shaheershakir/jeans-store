'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cartCount, useCartStore, useUIStore } from '@/lib/store'
import { STORE_NAME, STORE_TAGLINE } from '@/lib/constants'

const NAV_LINKS = [
  { label: 'All Catalog', href: '/' },
  { label: 'T-Shirts', href: '/?category=t-shirts' },
  { label: 'Shirts & Overshirts', href: '/?category=shirts' },
  { label: 'Heavy Hoodies', href: '/?category=hoodies' },
  { label: 'Caps & Hats', href: '/?category=hats' }
]

export default function Header() {
  const items = useCartStore((state) => state.items)
  const isMobileNavOpen = useUIStore((state) => state.isMobileNavOpen)
  const toggleMobileNav = useUIStore((state) => state.toggleMobileNav)
  const closeMobileNav = useUIStore((state) => state.closeMobileNav)
  const openCart = useUIStore((state) => state.openCart)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    void useCartStore.persist.rehydrate()

    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const count = mounted ? cartCount(items) : 0

  return (
    <>
      {/* Announcement Ribbon */}
      <div className="announcement-bar">
        <span className="announcement-dot" />
        <span>Free Express Delivery Across India on Orders Over ₹999</span>
      </div>

      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <div className="header-left">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={toggleMobileNav}
              aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileNavOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>

            {/* Brand Logo */}
            <Link href="/" className="brand-logo" onClick={closeMobileNav}>
              <span className="brand-wordmark">{STORE_NAME}</span>
              <span className="brand-subtitle">{STORE_TAGLINE}</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="header-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Header Action Controls */}
          <div className="header-right">
            <button
              type="button"
              className="header-btn"
              onClick={openCart}
              aria-label="Open cart"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 && <span className="cart-counter">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Backdrop */}
      <div
        className={`mobile-nav-backdrop ${isMobileNavOpen ? 'open' : ''}`}
        onClick={closeMobileNav}
      >
        <div
          className="mobile-nav-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-nav-header">
            <span className="brand-wordmark">{STORE_NAME}</span>
            <button
              type="button"
              className="mobile-nav-toggle"
              onClick={closeMobileNav}
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <ul className="mobile-nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.label} className="mobile-nav-item">
                <Link href={link.href} onClick={closeMobileNav}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
