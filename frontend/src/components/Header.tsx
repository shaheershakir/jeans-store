'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  X,
  Menu,
  ShoppingBag,
  Store,
  Gift,
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { cartCount, useCartStore, useUIStore, useFilterStore, useAuthStore } from '@/lib/store'
import { DEFAULT_NAV_LINKS, type NavigationItem, type Fit, PRODUCTS } from '@/lib/constants'
import { searchProducts } from '@/lib/utils'

interface HeaderProps {
  initialNavItems?: NavigationItem[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function Header({ initialNavItems }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const setFit = useFilterStoreSync()
  const setCategory = useFilterStore((state) => state.setCategory)
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)

  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchQuery || '')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement>(null)

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

    // Client sync for live updates from admin/backend
    const syncNav = () => {
      const backendEndpoint =
        typeof window !== 'undefined' && window.location.origin.includes(':3000')
          ? window.location.origin.replace(':3000', ':4000')
          : BACKEND_URL
      fetch(`${backendEndpoint}/api/navigation?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.navigation) && data.navigation.length > 0) {
            setNavLinks(data.navigation)
          }
        })
        .catch(() => {})
    }

    syncNav()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncNav()
    }
    window.addEventListener('focus', syncNav)
    document.addEventListener('visibilitychange', handleVisibility)
    const interval = setInterval(syncNav, 2000)

    // Click outside search dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('focus', syncNav)
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('mousedown', handleClickOutside)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (initialNavItems && initialNavItems.length > 0) {
      setNavLinks(initialNavItems)
    }
  }, [initialNavItems])

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

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
        if (target !== 'all' && target !== 'jeans') setFit('all')
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
      router.push(`/shop/jeans?fit=${target}`)
    } else if (link.type === 'category') {
      if (e) e.preventDefault()
      const target = link.targetValue || 'all'
      setCategory(target)
      if (target !== 'all' && target !== 'jeans') {
        setFit('all')
      }
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
    setSearchQuery('')
    setLocalQuery('')
    router.push('/shop')
  }

  const scrollToCatalog = () => {
    const catalog = document.getElementById('catalog') || document.querySelector('.collection-toolbar-wrapper')
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearchFocused(false)
    setSearchQuery(localQuery)

    if (pathname !== '/shop' && !pathname.startsWith('/shop/')) {
      router.push(`/shop?q=${encodeURIComponent(localQuery)}`)
    }
  }

  const handleSearchChange = (val: string) => {
    setLocalQuery(val)
    setSearchQuery(val)
    if (!isSearchFocused) setIsSearchFocused(true)
  }

  const handleClearSearch = () => {
    setLocalQuery('')
    setSearchQuery('')
    setIsSearchFocused(false)
  }

  const count = cartCount(items)
  const activeLinks = navLinks.filter((l) => l.isActive)
  const matchingResults = localQuery.trim() ? searchProducts(localQuery, PRODUCTS).slice(0, 5) : []

  return (
    <>
      <header className={`macy-header ${scrolled ? 'scrolled' : ''}`}>
        {/* Tier 1: Main Brand, Wide Search Bar & Customer Action Utilities */}
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
            <Link className="macy-brand" href="/" aria-label="INFIT Homepage">
              <Image
                src="/infit_logo.svg"
                alt="INFIT"
                width={140}
                height={36}
                priority
                className="brand-logo-img"
              />
            </Link>

            {/* Centered Reworked Search Bar with Shadcn/Lucide Search Icon */}
            <div className="macy-search-container" ref={searchWrapRef}>
              <form className="macy-search-form" onSubmit={handleSearchSubmit} role="search">
                <Search className="macy-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="macy-search-input"
                  placeholder="What are you looking for?"
                  value={localQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  aria-label="What are you looking for?"
                  autoComplete="off"
                  spellCheck={false}
                />
                {localQuery && (
                  <button
                    type="button"
                    className="macy-search-clear"
                    onClick={handleClearSearch}
                    aria-label="Clear search text"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Instant Search Suggestions Dropdown */}
              {isSearchFocused && localQuery.trim().length > 0 && (
                <div className="macy-search-dropdown">
                  <div className="macy-search-dropdown-header">
                    <span>MATCHING PRODUCTS ({matchingResults.length})</span>
                    <button
                      type="button"
                      className="macy-search-dropdown-close"
                      onClick={() => setIsSearchFocused(false)}
                    >
                      Close
                    </button>
                  </div>

                  {matchingResults.length === 0 ? (
                    <div className="macy-search-no-results">
                      No products found matching “{localQuery}”.
                    </div>
                  ) : (
                    <div className="macy-search-results-list">
                      {matchingResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className="macy-search-result-item"
                          onClick={() => {
                            setIsSearchFocused(false)
                          }}
                        >
                          <div className="macy-search-item-thumb">
                            <Image
                              src={product.img}
                              alt={product.name}
                              width={44}
                              height={55}
                              className="macy-search-thumb-img"
                            />
                          </div>
                          <div className="macy-search-item-details">
                            <h4 className="macy-search-item-title">{product.name}</h4>
                            <p className="macy-search-item-meta">
                              {product.fit ? `${product.fit} fit` : product.category} ·{' '}
                              <span className="macy-search-item-price">{product.price}</span>
                            </p>
                          </div>
                        </Link>
                      ))}

                      <button
                        type="button"
                        className="macy-search-view-all"
                        onClick={handleSearchSubmit}
                      >
                        <span>View all matching results for &ldquo;{localQuery}&rdquo;</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Action Utilities (Sign In, Your Store, Gift Registry, Bag) */}
            <div className="macy-actions-group">
              {/* Account Sign In Section */}
              <div className="macy-account-box">
                <div className="macy-account-meta">
                  <span className="macy-account-caption">See more of what you love</span>
                  {mounted && isAuthenticated && user ? (
                    <button
                      type="button"
                      className="macy-signin-link authenticated"
                      title={`Signed in as ${user.name}. Click to sign out.`}
                      onClick={() => {
                        if (window.confirm(`Sign out from ${user.name}?`)) {
                          logout()
                        }
                      }}
                    >
                      <User className="h-3.5 w-3.5 mr-1" />
                      <span>{user.name.split(' ')[0]}</span>
                    </button>
                  ) : (
                    <Link href="/login" className="macy-signin-pill">
                      Sign In
                    </Link>
                  )}
                </div>
              </div>


        

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
