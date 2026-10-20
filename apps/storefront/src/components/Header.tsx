'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  X,
  Menu,
  ShoppingBag,
  User,
  ChevronDown,
  Package,
  MessageCircle,
  LogOut,
  Sparkles,
  ArrowRight,
  Heart,
  Settings,
  ChevronRight,
  ArrowLeft,
  TrendingUp
} from 'lucide-react'
import { cartCount, useCartStore, useUIStore, useFilterStore, useAuthStore, useFavoriteStore } from '@/lib/store'
import { DEFAULT_NAV_LINKS, type NavigationItem, type Fit, PRODUCTS } from '@/lib/constants'
import { searchProducts } from '@/lib/utils'
import UserOrdersModal from '@/components/UserOrdersModal'

const TRENDING_SEARCHES = ['Stripes', 'Printed Tees', 'Henley', 'Trackpants', 'Oversized', 'Sweatpants']

interface HeaderProps {
  initialNavItems?: NavigationItem[]
}

export default function Header({ initialNavItems }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const setFit = useFilterStoreSync()
  const setCategory = useFilterStore((state) => state.setCategory)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const favorites = useFavoriteStore((state) => state.favorites)

  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [ordersModalOpen, setOrdersModalOpen] = useState(false)
  // Mobile full-screen search overlay (Flipkart-style)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileQuery, setMobileQuery] = useState('')
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [navLinks, setNavLinks] = useState<NavigationItem[]>(
    initialNavItems && initialNavItems.length > 0 ? initialNavItems : DEFAULT_NAV_LINKS
  )

  useEffect(() => {
    setMounted(true)
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useAuthStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      setUserMenuOpen(false)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Click outside user menu popover
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    // Keyboard shortcut: '/' opens search overlay (no animation per Emil — frequent action)
    // 'Escape' closes any open overlay
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '/') {
        e.preventDefault()
        openOverlay('search')
      } else if (e.key === 'Escape') {
        closeOverlay()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openOverlay, closeOverlay])

  useEffect(() => {
    if (initialNavItems && initialNavItems.length > 0) {
      setNavLinks(initialNavItems)
    }
  }, [initialNavItems])

  // Lock body scroll when mobile search overlay is open
  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.style.overflow = 'hidden'
      const t = setTimeout(() => mobileSearchInputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileSearchOpen])

  const openMobileSearch = useCallback(() => {
    setMobileQuery('')
    setMobileSearchOpen(true)
  }, [])

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false)
    setMobileQuery('')
  }, [])

  const handleMobileSearchSubmit = useCallback((q: string) => {
    const trimmed = q.trim()
    closeMobileSearch()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/search')
    }
  }, [closeMobileSearch, router])

  const isLinkActive = (href: string) => {
    if (href === '/shop') {
      return pathname === '/shop'
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleNavClick = (link: NavigationItem, e?: React.MouseEvent) => {
    if (link.href.startsWith('/shop') || link.href.startsWith('/category/')) {
      if (link.type === 'category') {
        const target = link.targetValue || 'all'
        setCategory(target)
      } else if (link.type === 'fit') {
        const target = (link.targetValue || 'all') as Fit | 'all'
        setFit(target)
      }
      return
    }

    if (link.type === 'fit') {
      if (e) e.preventDefault()
      const target = (link.targetValue || 'all') as Fit | 'all'
      setFit(target)
      router.push(`/shop?fit=${target}`)
    } else if (link.type === 'category') {
      if (e) e.preventDefault()
      const target = link.targetValue || 'all'
      setCategory(target)
      router.push(target === 'all' ? '/shop' : `/shop/${target}`)
    } else if (link.href === '/' || link.href.startsWith('/#')) {
      if (pathname !== '/') {
        router.push(link.href)
      } else {
        if (e) e.preventDefault()
        scrollToCatalog()
      }
    }
  }

  const handleShopAllClick = () => {
    setCategory('all')
    setFit('all')
    router.push('/shop')
  }

  const scrollToCatalog = () => {
    const catalog = document.getElementById('catalog') || document.querySelector('.collection-toolbar-wrapper')
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const count = cartCount(items)
  const activeLinks = navLinks.filter((l) => l.isActive)
  const mobileSuggestions = mobileQuery.trim() ? searchProducts(mobileQuery, PRODUCTS).slice(0, 8) : []

  return (
    <>
      <style jsx global>{`
        .macy-header {
          position: sticky;
          top: 0;
          z-index: 60;
          background: rgba(250, 249, 246, 0.96);
          border-bottom: 1px solid #e9e7e1;
          box-shadow: none;
          backdrop-filter: blur(18px);
        }
        .macy-header-main { min-height: 72px; }
        .macy-header-main-inner {
          position: relative;
          display: grid;
          grid-template-columns: minmax(150px, 1fr) auto minmax(150px, 1fr);
          align-items: center;
          max-width: 1480px;
          min-height: 72px;
          padding: 0 30px;
        }
        .macy-brand { justify-self: start; color: #111; text-decoration: none; }
        .macy-brand-wordmark { display: block; font-size: 21px; font-weight: 750; letter-spacing: -.025em; line-height: 1; }
        .macy-search-trigger {
          grid-column: 3;
          justify-self: end;
          display: inline-flex;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #111;
        }
        .macy-search-trigger-icon { width: 22px; height: 22px; color: #111; stroke: #111; }
        .macy-search-trigger-text, .macy-search-shortcut { display: none; }
        .macy-actions-group {
          grid-column: 3;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-right: 0;
        }
        .macy-header-main-inner > .macy-search-trigger { position: absolute; right: 174px; }
        .apple-user-name-label, .apple-chevron, .apple-header-account-btn span { display: none; }
        .apple-header-user-btn, .apple-header-account-btn {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          padding: 0;
          border: 0;
          background: transparent;
        }
        .apple-user-avatar-circle {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: 50%;
          background: #e9e7e2;
          color: #555;
          font-size: 15px;
          font-weight: 500;
        }
        .macy-bag-btn { width: 42px; height: 42px; color: #111; }
        .macy-favorite-btn { display: grid; width: 42px; height: 42px; place-items: center; color: #111; text-decoration: none; }
        .macy-favorite-btn:hover, .macy-bag-btn:hover, .macy-search-trigger:hover { background: #f0efeb; }
        .macy-nav-bar {
          position: absolute;
          inset: 0;
          display: flex;
          width: 100%;
          height: 72px;
          justify-content: center;
          pointer-events: none;
          border: 0;
          background: transparent;
        }
        .macy-nav-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: auto;
          max-width: none;
          padding: 0;
          pointer-events: auto;
        }
        .macy-shop-all-btn { display: none; }
        .macy-nav-links-scroll { gap: 30px; overflow: visible; }
        .macy-nav-link {
          padding: 8px 0;
          color: #242424;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        .macy-nav-link::after { bottom: 1px; }
        .apple-detail-card { border: 1px solid #ebe9e4; border-radius: 18px; background: rgba(255,255,255,.5); box-shadow: 0 7px 20px rgba(32,28,20,.025); }
        .apple-card-title { color: #151515; letter-spacing: -.035em; }
        .apple-card-subtitle { color: #72747a; }
        .apple-profile-page { background: #faf9f6; }
        .apple-profile-layout { gap: 46px; }
        .apple-profile-sidebar { width: 220px; flex: 0 0 220px; }
        .apple-profile-sidebar .apple-glass-card { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; backdrop-filter: none; }
        .apple-profile-sidebar .apple-id-header { display: none; }
        .apple-profile-sidebar .apple-sidebar-nav { gap: 4px; }
        .apple-profile-sidebar .apple-nav-item { min-height: 48px; border: 0; border-radius: 12px; padding: 0 15px; color: #64666a; background: transparent; }
        .apple-profile-sidebar .apple-nav-item.active { background: #efeeeb; color: #111; }
        .apple-profile-sidebar .apple-nav-item.active :is(span, svg) { color: #111; }
        .apple-profile-sidebar .apple-nav-item.active .apple-nav-chevron { opacity: 0; }
        .apple-profile-sidebar .apple-sidebar-actions { margin-top: 18px; padding-top: 14px; border-top: 1px solid #e9e7e2; }
        .wishlist-row { border-color: #ebe9e4; background: rgba(255,255,255,.45); }
        @media (max-width: 1100px) {
          .macy-header-main-inner { display: grid; grid-template-columns: 1fr auto; padding: 0 20px; }
          .macy-search-trigger { right: 175px; }
          .macy-actions-group { grid-column: 2; }
          .macy-nav-bar { position: absolute; inset: 0; height: 72px; border: 0; }
          .macy-nav-container { width: auto; justify-content: center; }
          .macy-nav-links-scroll { gap: 14px; }
        }
        @media (max-width: 1000px) {
          .macy-nav-bar { position: static; height: 42px; overflow: hidden; border-top: 1px solid #efeee9; }
          .macy-nav-container { width: 100%; justify-content: flex-start; overflow: hidden; }
          .macy-nav-links-scroll { width: 100%; justify-content: flex-start; gap: 22px; overflow-x: auto; padding: 0 20px; scrollbar-width: none; }
          .macy-nav-links-scroll::-webkit-scrollbar { display: none; }
          .macy-nav-link { font-size: 12px; }
        }
        @media (max-width: 700px) {
          .macy-header-main, .macy-header-main-inner { min-height: 60px; }
          .macy-header-main-inner { display: flex; justify-content: space-between; padding: 0 16px; }
          .macy-brand-wordmark { font-size: 18px; }
          .macy-search-trigger { display: none; }
          .macy-actions-group { gap: 7px; }
          .macy-favorite-btn, .macy-bag-btn, .apple-header-user-btn, .apple-header-account-btn { width: 38px; height: 38px; }
          .macy-nav-bar { position: static; height: 42px; overflow: hidden; border-top: 1px solid #efeee9; }
          .macy-nav-container { width: 100%; justify-content: flex-start; overflow: hidden; }
          .macy-nav-links-scroll { width: 100%; justify-content: flex-start; gap: 22px; overflow-x: auto; padding: 0 16px; scrollbar-width: none; }
          .macy-nav-links-scroll::-webkit-scrollbar { display: none; }
          .macy-nav-link { font-size: 12px; }
        }
        @media (max-width: 1023px) {
          .apple-profile-layout { gap: 24px; }
        }
      `}</style>
      <header className={`macy-header ${scrolled ? 'scrolled' : ''} ${userMenuOpen ? 'user-popover-open' : ''}`}>
        {/* Tier 1: Main Brand, Search Trigger & Customer Action Utilities */}
        <div className="macy-header-main">
          <div className="macy-header-main-inner">
            {/* Mobile Menu Hamburger */}
            <button
              className="macy-mobile-toggle"
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Brand Logo */}
            <Link className="macy-brand" href="/" aria-label="TEESGARAGE Homepage">
              <span className="macy-brand-wordmark">TEESGARAGE</span>
            </Link>

            {/* Desktop search trigger — opens shared SearchOverlay (same UI as mobile) */}
            <button
              type="button"
              className="macy-search-trigger"
              aria-label="Search products (press / to open)"
              onClick={() => openOverlay('search')}
            >
              <Search className="macy-search-trigger-icon" aria-hidden="true" />
              <span className="macy-search-trigger-text">What are you looking for?</span>
              <kbd className="macy-search-shortcut" aria-hidden="true">/</kbd>
            </button>

            {/* Mobile search icon (visible only on mobile) */}
            <button
              type="button"
              className="macy-mobile-search"
              aria-label="Search products"
              onClick={openMobileSearch}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Right Action Utilities (Sign In / User Popover & Bag) */}
            <div className="macy-actions-group">
              {/* Account Sign In / User Control Section */}
              {mounted && isAuthenticated && user ? (
                <div className="apple-user-menu-wrap" ref={userMenuRef}>
                  <button
                    type="button"
                    className={`apple-header-user-btn ${userMenuOpen ? 'active' : ''}`}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-label={`Account menu for ${user.name}`}
                  >
                    <div className="apple-user-avatar-circle">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="apple-user-name-label">{user.name.split(' ')[0]}</span>
                    <ChevronDown className={`h-3 w-3 apple-chevron ${userMenuOpen ? 'open' : ''}`} />
                  </button>

                  {/* User Controls Dropdown Popover */}
                  {userMenuOpen && (
                    <>
                    {/* Backdrop: portaled to body so sticky header does not trap fixed coordinates */}
                    {mounted && typeof document !== 'undefined' && createPortal(
                      <div
                        className="apple-user-popover-backdrop"
                        aria-hidden="true"
                        onClick={() => setUserMenuOpen(false)}
                      />,
                      document.body
                    )}
                    <div className="apple-user-popover">
                      <Link
                        href="/profile"
                        className="apple-popover-profile clickable"
                        onClick={() => setUserMenuOpen(false)}
                        title="Go to Profile & Account Settings"
                      >
                        <div className="apple-popover-avatar">{user.name.charAt(0).toUpperCase()}</div>
                        <div className="apple-popover-user-info">
                          <h4 className="apple-popover-name">{user.name}</h4>
                          <span className="apple-popover-subtext">Manage Profile &amp; Account</span>
                        </div>
                        <ChevronRight className="h-4 w-4 apple-popover-arrow" />
                      </Link>

                      <div className="apple-popover-divider" />

                      <div className="apple-popover-actions">
                        <Link
                          href="/orders"
                          className="apple-popover-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Package className="h-4 w-4 mr-2.5 text-zinc-700" />
                          <span>My Orders &amp; Tracking</span>
                          <span className="apple-popover-pill">Active</span>
                        </Link>

                        <Link
                          href="/profile"
                          className="apple-popover-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2.5 text-zinc-700" />
                          <span>Profile &amp; Addresses</span>
                        </Link>

                        <Link
                          href="/profile?tab=favorites"
                          className="apple-popover-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4 mr-2.5 text-rose-500" />
                          <span>Favorites &amp; Saved Fits</span>
                          {favorites.length > 0 && <span className="apple-popover-pill">{favorites.length}</span>}
                        </Link>

                        <button
                          type="button"
                          className="apple-popover-item"
                          onClick={() => {
                            setUserMenuOpen(false)
                            openOverlay('cart')
                          }}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2.5 text-zinc-700" />
                          <span>Shopping Bag</span>
                          {count > 0 && <span className="apple-popover-pill">{count}</span>}
                        </button>

                        <Link
                          href="/profile?tab=preferences"
                          className="apple-popover-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Sparkles className="h-4 w-4 mr-2.5 text-amber-600" />
                          <span>Fit &amp; Size Preferences</span>
                        </Link>

                        {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                          <a
                            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi TEESGARAGE, I have an inquiry regarding my account.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="apple-popover-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2.5 text-emerald-600" />
                            <span>Concierge WhatsApp</span>
                          </a>
                        )}
                      </div>

                      <div className="apple-popover-divider" />

                      <button
                        type="button"
                        className="apple-popover-item logout"
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2.5 text-red-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="apple-header-account-btn" aria-label="Sign in to your account">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  <span>Sign In</span>
                </Link>
              )}

              <Link
                href="/favorites"
                className="macy-favorite-btn"
                aria-label={favorites.length ? `Wishlist with ${favorites.length} saved items` : 'Wishlist'}
                title="Wishlist"
              >
                <Heart className="h-5 w-5" aria-hidden="true" />
              </Link>

          

              {/* Shopping Bag Button with Badge */}
              <button
                className="macy-bag-btn"
                type="button"
                aria-label={`Shopping bag with ${count} items`}
                title="View shopping bag"
                onClick={() => openOverlay('cart')}
              >
                <div className="macy-bag-icon-wrap">
                  <ShoppingBag className="h-5 w-5" />
                  <span className={`macy-bag-count ${count > 0 ? 'highlight' : ''}`}>{count}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Category Navigation Bar (Shop All, Categories, Silhouettes, and Sale) */}
        <nav className="macy-nav-bar" aria-label="Department and Category Navigation">
          <div className="macy-nav-container">
            {/* Shop All Menu Trigger */}
            <button
              type="button"
              className={`macy-shop-all-btn ${pathname === '/shop' ? 'active' : ''}`}
              onClick={handleShopAllClick}
            >
              <Menu className="h-3.5 w-3.5 mr-1.5" />
              <span>Shop All</span>
            </button>

            {/* Department & Category Links (Dynamically configured via Admin) */}
            <div className="macy-nav-links-scroll">
              {activeLinks.map((link) => {
                const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
                const isActive = isLinkActive(link.href)
                return (
                  <Link
                    key={link.id || link.label}
                    href={link.href}
                    className={`macy-nav-link ${isSale ? 'sale-link' : ''} ${isActive ? 'active' : ''}`}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={(e) => handleNavClick(link, e)}
                  >
                    <span>{link.label}</span>
                    {link.badge && <span className="macy-nav-badge">{link.badge}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="mobile-nav-panel">
            <div className="mobile-nav-links">
              <Link
                href="/search"
                className="mobile-nav-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--paper-subtle, #f4f4f5)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '10px',
                  fontWeight: 600
                }}
                onClick={() => setMenuOpen(false)}
              >
                <Search className="h-4 w-4 text-zinc-500" />
                <span>Search Garments &amp; Fits...</span>
              </Link>

              <button
                type="button"
                className={`mobile-nav-item ${pathname === '/shop' ? 'active' : ''}`}
                style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  handleShopAllClick()
                  setMenuOpen(false)
                }}
              >
                Shop All Garments
              </button>

              {activeLinks.map((link) => {
                const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
                const isActive = isLinkActive(link.href)
                return (
                  <Link
                    key={link.id || link.label}
                    href={link.href}
                    className={`mobile-nav-item ${isSale ? 'sale-link' : ''} ${isActive ? 'active' : ''}`}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      handleNavClick(link, e)
                      setMenuOpen(false)
                    }}
                  >
                    <span>{link.label}</span>
                    {link.badge && <span className="nav-item-badge">{link.badge}</span>}
                  </Link>
                )
              })}

              {mounted && isAuthenticated && user ? (
                <>
                  <Link
                    href="/orders"
                    className="mobile-nav-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders &amp; Tracking
                  </Link>

                  <Link
                    href="/profile"
                    className="mobile-nav-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile &amp; Addresses
                  </Link>

                  <Link
                    href="/profile?tab=favorites"
                    className="mobile-nav-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    Saved Favorites ({favorites.length})
                  </Link>

                  <button
                    type="button"
                    className="mobile-nav-item text-red-600"
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
                </>
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
                <a href="mailto:concierge@teesgarage.in">concierge@teesgarage.in</a>
              </div>
            </div>
          </div>
        )}

        {/* User Orders & Tracking Modal */}
        <UserOrdersModal
          isOpen={ordersModalOpen}
          onClose={() => setOrdersModalOpen(false)}
          userEmail={user?.email}
        />
      </header>

      {/* ============================================================
          MOBILE FULL-SCREEN SEARCH OVERLAY (Flipkart-style)
          ============================================================ */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay" role="dialog" aria-modal="true" aria-label="Search">
          {/* Top bar */}
          <div className="mobile-search-overlay-bar">
            <button
              type="button"
              className="mobile-search-back-btn"
              onClick={closeMobileSearch}
              aria-label="Close search"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <form
              className="mobile-search-overlay-form"
              onSubmit={(e) => { e.preventDefault(); handleMobileSearchSubmit(mobileQuery) }}
              role="search"
            >
              <Search className="mobile-search-overlay-icon" aria-hidden="true" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                className="mobile-search-overlay-input"
                placeholder="Search garments, fits, styles…"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                aria-label="Search"
              />
              {mobileQuery && (
                <button
                  type="button"
                  className="mobile-search-overlay-clear"
                  onClick={() => { setMobileQuery(''); mobileSearchInputRef.current?.focus() }}
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {/* Body */}
          <div className="mobile-search-overlay-body">
            {mobileQuery.trim().length === 0 ? (
              <div className="mobile-search-trending">
                <p className="mobile-search-section-label">
                  <TrendingUp className="h-3.5 w-3.5" />
                  TRENDING NOW
                </p>
                <div className="mobile-search-trending-pills">
                  {TRENDING_SEARCHES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="mobile-search-trending-pill"
                      onClick={() => handleMobileSearchSubmit(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : mobileSuggestions.length === 0 ? (
              <div className="mobile-search-no-results">
                <Search className="h-8 w-8" />
                <p>No results for <strong>&ldquo;{mobileQuery}&rdquo;</strong></p>
                <span>Try checking your spelling or different keywords</span>
              </div>
            ) : (
              <ul className="mobile-search-suggestions" role="listbox">
                <li>
                  <button
                    type="button"
                    className="mobile-search-suggestion-row search-for"
                    onClick={() => handleMobileSearchSubmit(mobileQuery)}
                    role="option"
                  >
                    <span className="mobile-suggestion-icon">
                      <Search className="h-4 w-4" />
                    </span>
                    <span className="mobile-suggestion-text">
                      Search for <strong>&ldquo;{mobileQuery}&rdquo;</strong>
                    </span>
                    <ArrowRight className="mobile-suggestion-arrow h-3.5 w-3.5" />
                  </button>
                </li>

                {mobileSuggestions.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.id}`}
                      className="mobile-search-suggestion-row product-row"
                      onClick={closeMobileSearch}
                      role="option"
                    >
                      <div className="mobile-suggestion-thumb">
                        <Image
                          src={product.img}
                          alt={product.name}
                          width={44}
                          height={54}
                          className="mobile-suggestion-thumb-img"
                        />
                      </div>
                      <div className="mobile-suggestion-details">
                        <span className="mobile-suggestion-name">{product.name}</span>
                        <span className="mobile-suggestion-meta">
                          {product.fit ? `${product.fit} fit` : product.category} · {product.price}
                        </span>
                      </div>
                      <ArrowRight className="mobile-suggestion-arrow h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function useFilterStoreSync() {
  const setFit = useFilterStore((state) => state.setFit)
  return setFit
}
