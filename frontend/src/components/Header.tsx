'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cartCount, useCartStore, useUIStore, useFilterStore, useAuthStore } from '@/lib/store'
import { DEFAULT_NAV_LINKS, type NavigationItem, type Fit } from '@/lib/constants'

interface HeaderProps {
  initialNavItems?: NavigationItem[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function Header({ initialNavItems }: HeaderProps) {
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const setFit = useFilterStoreSync()
  const setCategory = useFilterStore((state) => state.setCategory)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [navLinks, setNavLinks] = useState<NavigationItem[]>(
    initialNavItems && initialNavItems.length > 0 ? initialNavItems : DEFAULT_NAV_LINKS
  )

  useEffect(() => {
    setMounted(true)
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Client sync for local live updates
    const syncNav = () => {
      fetch(`${BACKEND_URL}/api/navigation?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.navigation) && data.navigation.length > 0) {
            setNavLinks(data.navigation)
          }
        })
        .catch(() => {
          // Silently use server-rendered navLinks on network fallback
        })
    }

    syncNav()
    window.addEventListener('focus', syncNav)
    const interval = setInterval(syncNav, 3000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('focus', syncNav)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (initialNavItems && initialNavItems.length > 0) {
      setNavLinks(initialNavItems)
    }
  }, [initialNavItems])

  const handleNavClick = (link: NavigationItem) => {
    if (link.type === 'fit') {
      const target = (link.targetValue || 'all') as Fit | 'all'
      setFit(target)
    } else if (link.type === 'category') {
      const target = link.targetValue || 'all'
      setCategory(target)
      if (target !== 'all' && target !== 'jeans') {
        setFit('all')
      }
    }
  }

  const count = cartCount(items)
  const activeLinks = navLinks.filter((l) => l.isActive)

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
            {activeLinks.map((link) => (
              <Link
                key={link.id || link.label}
                href={link.href}
                className="nav-item-link"
                target={link.openInNewTab ? '_blank' : undefined}
                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={() => handleNavClick(link)}
              >
                <span>{link.label}</span>
                {link.badge && <span className="nav-item-badge">{link.badge}</span>}
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

            {mounted && isAuthenticated && user ? (
              <button
                type="button"
                className="action-icon-btn account-btn"
                title={`Signed in as ${user.name}. Click to sign out.`}
                onClick={() => {
                  if (window.confirm(`Sign out from ${user.name}?`)) {
                    logout()
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="action-btn-text">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="action-icon-btn account-btn"
                title="Sign in or create account"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="action-btn-text">Sign In</span>
              </Link>
            )}

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
              {activeLinks.map((link) => (
                <Link
                  key={link.id || link.label}
                  href={link.href}
                  className="mobile-nav-item"
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    handleNavClick(link)
                    setMenuOpen(false)
                  }}
                >
                  <span>{link.label}</span>
                  {link.badge && <span className="nav-item-badge">{link.badge}</span>}
                </Link>
              ))}
              {mounted && isAuthenticated && user ? (
                <button
                  type="button"
                  className="mobile-nav-item"
                  style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', cursor: 'pointer' }}
                  onClick={() => {
                    if (window.confirm(`Sign out from ${user.name}?`)) {
                      logout()
                      setMenuOpen(false)
                    }
                  }}
                >
                  Sign Out ({user.name.split(' ')[0]})
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mobile-nav-item"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In / Create Account
                </Link>
              )}
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
