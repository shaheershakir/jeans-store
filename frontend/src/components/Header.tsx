'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cartCount, useCartStore, useUIStore } from '@/lib/store'

const NAV_LINKS = [
  { label: 'New arrivals', href: '/' },
  { label: 'Jeans', href: '/' },
  { label: 'Fits', href: '/' },
  { label: 'Our denim', href: '/' }
]

export default function Header() {
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  return (
    <>
      <nav className="nav">
        <button
          className="search-button menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          title="Menu"
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
        <Link className="wordmark" href="/">
          INFIT<span>®</span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="search-button"
            type="button"
            aria-label="Search"
            title="Search catalog"
            onClick={() => openOverlay('search')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            className="account-button"
            type="button"
            aria-label="Account"
            title="Account"
            onClick={() => showToast('Accounts are coming soon')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            className="cart-button"
            type="button"
            aria-label="Cart"
            title="View shopping bag"
            onClick={() => openOverlay('cart')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Bag</span>
            <b className="cart-badge">{cartCount(items)}</b>
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
