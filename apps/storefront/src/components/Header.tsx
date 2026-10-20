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

const HEADER_ACTION_BTN =
  'grid h-[38px] w-[38px] cursor-pointer place-items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#111] no-underline transition-[background-color] duration-150 ease-[ease] hover:bg-[rgba(0,0,0,0.05)]'

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
      <header
        className={`sticky top-0 ${userMenuOpen ? 'z-[1005]' : 'z-[60]'} border-b border-b-[#e9e7e1] bg-[rgba(250,249,246,0.96)] backdrop-blur-[18px] transition-[box-shadow,background-color] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] [@media(prefers-reduced-transparency:reduce)]:bg-white [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none [&_:is(a,button,input):focus-visible]:outline-2 [&_:is(a,button,input):focus-visible]:outline-[#31586f] [&_:is(a,button,input):focus-visible]:outline-offset-[3px] motion-reduce:[transition-duration:0.01ms]`}
      >
        {/* Main Navigation Bar: Single row, perfectly vertically centered */}
        <div className="h-[76px] min-h-[76px] bg-transparent pt-[env(safe-area-inset-top)] max-[700px]:h-[60px] max-[700px]:min-h-[60px]">
          <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-6 lg:px-8">
            {/* Left: Mobile Hamburger + Brand Logo */}
            <div className="flex shrink-0 items-center gap-3">
              <button
                className="hidden h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#182126] max-[1024px]:flex max-[640px]:w-10 max-[640px]:shrink-0"
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <Link
                className="inline-flex shrink-0 items-center text-[#111] no-underline transition-opacity duration-200 hover:opacity-85"
                href="/"
                aria-label="TEESGARAGE Homepage"
              >
                <Image
                  src="/teesgarage-logo.svg"
                  alt="TEESGARAGE"
                  width={160}
                  height={46}
                  priority
                  className="block h-[38px] md:h-[42px] w-auto max-[640px]:h-[26px]"
                />
              </Link>
            </div>

            {/* Center: Department & Category Links (Vertically Centered with logo and buttons) */}
            <nav
              className="hidden lg:flex flex-1 items-center justify-center gap-7 xl:gap-8"
              aria-label="Department and Category Navigation"
            >
              {activeLinks.map((link) => {
                const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
                const isActive = isLinkActive(link.href)
                return (
                  <Link
                    key={link.id || link.label}
                    href={link.href}
                    className={`relative whitespace-nowrap text-[13.5px] font-medium leading-none tracking-[0.02em] text-[#242424] no-underline transition-colors duration-150 hover:text-black active:scale-[0.98] ${
                      isSale ? 'font-semibold text-[#e01a2b]!' : ''
                    } ${
                      isActive
                        ? "font-semibold text-black after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-[1px] after:bg-black after:content-['']"
                        : ''
                    }`}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={(e) => handleNavClick(link, e)}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-[5px] rounded-[2px] bg-black px-[5px] py-px text-[9px] font-semibold uppercase text-white">{link.badge}</span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right: Action Utilities (Search, Wishlist, Bag, Sign In / User Popover) */}
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              {/* Mobile search icon */}
              <button
                type="button"
                className="hidden h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#182126] max-[1024px]:inline-flex"
                aria-label="Search products"
                onClick={openMobileSearch}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Desktop Search Trigger */}
              <button
                type="button"
                className={HEADER_ACTION_BTN}
                aria-label="Search products (press / to open)"
                onClick={() => openOverlay('search')}
              >
                <Search className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className={HEADER_ACTION_BTN}
                aria-label={favorites.length ? `Wishlist with ${favorites.length} saved items` : 'Wishlist'}
                title="Wishlist"
              >
                <Heart className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </Link>

              {/* Shopping Bag Button with Badge */}
              <button
                className={`${HEADER_ACTION_BTN} min-h-[42px] min-w-[42px] max-[640px]:min-h-10 max-[640px]:min-w-10`}
                type="button"
                aria-label={`Shopping bag with ${count} items`}
                title="View shopping bag"
                onClick={() => openOverlay('cart')}
              >
                <div className="relative inline-flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#e01a2b] px-1 text-[9.5px] font-bold leading-none text-white tabular-nums">
                      {count}
                    </span>
                  )}
                </div>
              </button>

              {/* User Avatar Circle */}
              {mounted && isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    className={HEADER_ACTION_BTN}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-label={`Account menu for ${user.name}`}
                  >
                    <div className="grid h-[32px] w-[32px] place-items-center justify-center rounded-full border-[1.5px] border-[#1c1c1c] bg-transparent text-[13px] font-semibold leading-none text-[#111]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {/* User Controls Dropdown Popover */}
                  {userMenuOpen && (
                    <>
                    {/* Backdrop: portaled to body so sticky header does not trap fixed coordinates */}
                    {mounted && typeof document !== 'undefined' && createPortal(
                      <div
                        className="fixed inset-0 z-[998] animate-[popoverBackdropIn_var(--dur-fast,180ms)_var(--ease-out,ease)_both] bg-[rgba(18,20,24,0.35)] backdrop-blur-[16px] backdrop-brightness-[0.88] backdrop-saturate-[1.8] supports-[not(backdrop-filter:blur(1px))]:bg-[rgba(18,20,24,0.45)]"
                        aria-hidden="true"
                        onClick={() => setUserMenuOpen(false)}
                      />,
                      document.body
                    )}
                    <div className="absolute right-0 top-[calc(100%+10px)] z-[1010] w-[280px] max-w-[calc(100vw-24px)] origin-top-right animate-[applePopoverEnter_var(--dur-base,220ms)_var(--ease-out,cubic-bezier(0.16,1,0.3,1))] rounded-[14px] border border-[rgba(21,21,21,0.1)] bg-[rgba(255,255,255,0.96)] p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9),0_24px_54px_-10px_rgba(12,14,18,0.22),0_8px_18px_-4px_rgba(12,14,18,0.08)] backdrop-blur-[32px] backdrop-saturate-[2] supports-[not(backdrop-filter:blur(1px))]:bg-white">
                      <Link
                        href="/profile"
                        className="group flex cursor-pointer items-center gap-3 rounded-[8px] px-2.5 py-2 no-underline transition-[background,transform] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] active:scale-[0.99]"
                        onClick={() => setUserMenuOpen(false)}
                        title="Go to Profile & Account Settings"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0c0e12] text-[14px] font-bold text-white [font-family:var(--font-brand)]">{user.name.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0 flex-1">
                          <h4 className="m-0 truncate text-[13.5px] font-bold tracking-[-0.01em] text-[#0c0e12] [font-family:var(--font-brand)]">{user.name}</h4>
                          <span className="mt-px block text-[11px] font-medium text-[#71717a]">Manage Profile &amp; Account</span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#a1a1aa] transition-[transform,color] duration-200 ease-[ease] group-hover:translate-x-0.5 group-hover:text-[#18181b]" />
                      </Link>

                      <div className="mx-0.5 my-[5px] h-px bg-[rgba(12,14,18,0.07)]" />

                      <div className="flex flex-col gap-0.5">
                        <Link
                          href="/orders"
                          className="flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#1f2937] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] hover:text-[#0c0e12] active:scale-[0.99]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Package className="h-4 w-4 mr-2.5 text-zinc-700" />
                          <span>My Orders &amp; Tracking</span>
                          <span className="ml-auto rounded-full bg-[#0c0e12] px-1.5 py-px text-[10px] font-bold text-white">Active</span>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#1f2937] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] hover:text-[#0c0e12] active:scale-[0.99]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-2.5 text-zinc-700" />
                          <span>Profile &amp; Addresses</span>
                        </Link>

                        <Link
                          href="/profile?tab=favorites"
                          className="flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#1f2937] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] hover:text-[#0c0e12] active:scale-[0.99]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4 mr-2.5 text-rose-500" />
                          <span>Favorites &amp; Saved Fits</span>
                          {favorites.length > 0 && <span className="ml-auto rounded-full bg-[#0c0e12] px-1.5 py-px text-[10px] font-bold text-white">{favorites.length}</span>}
                        </Link>

                        <button
                          type="button"
                          className="flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#1f2937] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] hover:text-[#0c0e12] active:scale-[0.99]"
                          onClick={() => {
                            setUserMenuOpen(false)
                            openOverlay('cart')
                          }}
                        >
                          <ShoppingBag className="h-4 w-4 mr-2.5 text-zinc-700" />
                          <span>Shopping Bag</span>
                          {count > 0 && <span className="ml-auto rounded-full bg-[#0c0e12] px-1.5 py-px text-[10px] font-bold text-white">{count}</span>}
                        </button>

                        <Link
                          href="/profile?tab=preferences"
                          className="flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#1f2937] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] hover:text-[#0c0e12] active:scale-[0.99]"
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
                            className="flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#1f2937] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(12,14,18,0.05)] hover:text-[#0c0e12] active:scale-[0.99]"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2.5 text-emerald-600" />
                            <span>Concierge WhatsApp</span>
                          </a>
                        )}
                      </div>

                      <div className="mx-0.5 my-[5px] h-px bg-[rgba(12,14,18,0.07)]" />

                      <button
                        type="button"
                        className="mt-0.5 flex min-h-[38px] w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-[#dc2626] no-underline transition-[background,color] duration-150 ease-[ease] hover:bg-[rgba(220,38,38,0.08)] hover:text-[#b91c1c] active:scale-[0.99]"
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
                <Link href="/login" className={HEADER_ACTION_BTN} aria-label="Sign in to your account">
                  <div className="grid h-[32px] w-[32px] place-items-center justify-center rounded-full border-[1.5px] border-[#1c1c1c] bg-transparent text-[13px] font-semibold leading-none text-[#111]">
                    S
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="block animate-[navPanelSlideIn_var(--dur-base)_var(--ease-out)_both] border-t border-t-[#e4e2dd] bg-[rgba(250,249,246,0.92)] px-[max(20px,env(safe-area-inset-right))] pb-[calc(22px+env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] pt-3 backdrop-blur-[20px] backdrop-saturate-[1.8] motion-reduce:[animation-duration:0.01ms]">
            <div className="flex flex-col gap-0">
              <Link
                href="/search"
                className="mb-2.5 flex min-h-[46px] items-center justify-between gap-2.5 rounded-[8px] border-b border-b-[#e9e7e1] bg-[#f4f4f5] px-3.5 py-2.5 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline [font-family:var(--font-brand)]"
                onClick={() => setMenuOpen(false)}
              >
                <Search className="h-4 w-4 text-zinc-500" />
                <span>Search Garments &amp; Fits...</span>
              </Link>

              <button
                type="button"
                className={`flex min-h-[46px] cursor-pointer items-center justify-between border-0 bg-transparent py-2 pr-0 text-left text-[14px] font-semibold uppercase leading-normal text-[#182126] [font-family:var(--font-ui)] ${pathname === '/shop' ? 'rounded-[6px] pl-2.5 text-black' : 'pl-0'}`}
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
                    className={`flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] py-2 text-[13px] uppercase leading-[normal] no-underline [font-family:var(--font-brand)] ${
                      isActive
                        ? 'rounded-[6px] bg-[var(--bone)] pr-0 pl-2.5 font-bold text-black'
                        : 'px-0 font-semibold text-[#182126]'
                    } ${isSale ? 'font-semibold' : ''}`}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    onClick={(e) => {
                      handleNavClick(link, e)
                      setMenuOpen(false)
                    }}
                  >
                    <span>{link.label}</span>
                    {link.badge && <span>{link.badge}</span>}
                  </Link>
                )
              })}

              {mounted && isAuthenticated && user ? (
                <>
                  <Link
                    href="/orders"
                    className="flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline [font-family:var(--font-brand)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders &amp; Tracking
                  </Link>

                  <Link
                    href="/profile"
                    className="flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline [font-family:var(--font-brand)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile &amp; Addresses
                  </Link>

                  <Link
                    href="/profile?tab=favorites"
                    className="flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline [font-family:var(--font-brand)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Saved Favorites ({favorites.length})
                  </Link>

                  <button
                    type="button"
                    className="flex min-h-[46px] cursor-pointer items-center justify-between border-0 bg-transparent py-2 pr-0 pl-0 text-left text-[14px] font-semibold uppercase leading-normal text-red-600 [font-family:var(--font-ui)]"
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
                  className="flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline [font-family:var(--font-brand)]"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In / Create Account
                </Link>
              )}

              <div className="mt-2.5 flex flex-col justify-between gap-1 border-t border-t-[var(--line)] pt-3 text-[11px] font-medium leading-[normal] text-[#6b7280]">
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
        <div
          className="fixed inset-0 z-[9999] flex animate-[mobileSearchSlideIn_0.22s_cubic-bezier(0.32,0.72,0,1)_both] flex-col overscroll-contain bg-[#faf9f6]"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          {/* Top bar */}
          <div className="flex items-center gap-1.5 border-b border-b-[rgba(0,0,0,0.07)] bg-[rgba(250,249,246,0.96)] px-3 pb-2.5 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-[20px] backdrop-saturate-[1.8]">
            <button
              type="button"
              className="flex h-10 w-10 flex-[0_0_40px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#182126] transition-[background] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] active:bg-[rgba(0,0,0,0.07)]"
              onClick={closeMobileSearch}
              aria-label="Close search"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <form
              className="relative flex flex-1 items-center"
              onSubmit={(e) => { e.preventDefault(); handleMobileSearchSubmit(mobileQuery) }}
              role="search"
            >
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#6b7280]" aria-hidden="true" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                className="h-[42px] w-full appearance-none rounded-[10px] border-[1.5px] border-transparent bg-[rgba(0,0,0,0.055)] px-10 text-[15px] font-normal text-[#182126] outline-none transition-[background,border-color] duration-150 ease-[ease] placeholder:text-[#9ca3af] focus:border-[rgba(40,72,92,0.25)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(40,72,92,0.08)] [&::-webkit-search-cancel-button]:appearance-none"
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
                  className="absolute right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(0,0,0,0.1)] p-0 text-[#6b7280] [-webkit-tap-highlight-color:transparent]"
                  onClick={() => { setMobileQuery(''); mobileSearchInputRef.current?.focus() }}
                  aria-label="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            {mobileQuery.trim().length === 0 ? (
              <div className="px-4 py-5">
                <p className="mb-3.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-[#9ca3af]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  TRENDING NOW
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="inline-flex cursor-pointer items-center rounded-full border border-[#e4e2dd] bg-[#f0efeb] px-4 py-2 text-[13px] font-medium text-[#182126] transition-[background] duration-150 ease-[ease] [-webkit-tap-highlight-color:transparent] active:bg-[#e4e2dd]"
                      onClick={() => handleMobileSearchSubmit(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : mobileSuggestions.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center text-[#9ca3af]">
                <Search className="h-8 w-8" />
                <p className="m-0 text-[15px] text-[#182126]">No results for <strong>&ldquo;{mobileQuery}&rdquo;</strong></p>
                <span className="text-[13px] text-[#6b7280]">Try checking your spelling or different keywords</span>
              </div>
            ) : (
              <ul className="m-0 list-none py-2" role="listbox">
                <li>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 mb-1 border-0 border-b border-b-[rgba(0,0,0,0.05)] bg-transparent px-4 pb-3.5 pt-2.5 text-left text-inherit no-underline transition-[background] duration-[120ms] ease-[ease] [-webkit-tap-highlight-color:transparent] active:bg-[rgba(0,0,0,0.04)]"
                    onClick={() => handleMobileSearchSubmit(mobileQuery)}
                    role="option"
                  >
                    <span className="flex h-9 w-9 flex-[0_0_36px] items-center justify-center rounded-[8px] bg-[#f0efeb] text-[#6b7280]">
                      <Search className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[14px] text-[#182126] [&_strong]:font-semibold">
                      Search for <strong>&ldquo;{mobileQuery}&rdquo;</strong>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#d1d5db]" />
                  </button>
                </li>

                {mobileSuggestions.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.id}`}
                      className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-2.5 text-left text-inherit no-underline transition-[background] duration-[120ms] ease-[ease] [-webkit-tap-highlight-color:transparent] active:bg-[rgba(0,0,0,0.04)]"
                      onClick={closeMobileSearch}
                      role="option"
                    >
                      <div className="h-[54px] w-11 flex-[0_0_44px] overflow-hidden rounded-[6px] bg-[#eeede7]">
                        <Image
                          src={product.img}
                          alt={product.name}
                          width={44}
                          height={54}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <span className="block truncate text-[13.5px] font-semibold text-[#182126]">{product.name}</span>
                        <span className="text-[12px] text-[#6b7280]">
                          {product.fit ? `${product.fit} fit` : product.category} · {product.price}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#d1d5db]" />
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
