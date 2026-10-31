'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
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
  Package,
  LogOut,
  Heart,
  Settings,
  ChevronRight,
  ChevronDown,
  MapPin
} from 'lucide-react'
import { cartCount, useCartStore, useUIStore, useFilterStore, useAuthStore, useFavoriteStore } from '@/lib/store'
import { DEFAULT_NAV_LINKS, type NavigationItem } from '@/lib/constants'
import UserOrdersModal from '@/components/UserOrdersModal'
import MobileTabBar from '@/components/MobileTabBar'

const HEADER_ACTION_BTN =
  'grid h-[38px] w-[38px] cursor-pointer place-items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#111] no-underline transition-[background-color] duration-150 ease-[ease] hover:bg-[rgba(0,0,0,0.05)]'

const BOTTOMWEAR_SLUGS = new Set(['bottomwear', 'jeans', 'trackpants', 'sweatpants'])
const TSHIRT_SLUGS = new Set([
  't-shirts',
  'stripes',
  'fullsleeve',
  'drsleeve',
  'printed-tees',
  'ringer-tees',
  'henley',
  'waffle'
])

type Department = 't-shirts' | 'bottomwear'

function getInitialDepartment(pathname: string): Department {
  const clean = pathname.replace('/shop/', '').toLowerCase()
  if (BOTTOMWEAR_SLUGS.has(clean)) return 'bottomwear'
  return 't-shirts'
}

interface HeaderProps {
  initialNavItems?: NavigationItem[]
}

export default function Header({ initialNavItems }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const overlay = useUIStore((state) => state.overlay)
  const setCategory = useFilterStore((state) => state.setCategory)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const favorites = useFavoriteStore((state) => state.favorites)
  const showToast = useUIStore((state) => state.showToast)

  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [ordersModalOpen, setOrdersModalOpen] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const [expandedDept, setExpandedDept] = useState<Department>(() => getInitialDepartment(pathname))
  const [mobileExpandedDept, setMobileExpandedDept] = useState<Department | null>(() => getInitialDepartment(pathname))

  useEffect(() => {
    setPendingHref(null)
    const clean = pathname.replace('/shop/', '').toLowerCase()
    if (BOTTOMWEAR_SLUGS.has(clean)) {
      setExpandedDept('bottomwear')
      setMobileExpandedDept('bottomwear')
    } else if (TSHIRT_SLUGS.has(clean)) {
      setExpandedDept('t-shirts')
      setMobileExpandedDept('t-shirts')
    }
  }, [pathname])

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

  const activeLinks = navLinks.filter((l) => l.isActive)

  const tshirtLinks = useMemo(() => {
    return activeLinks.filter((link) => {
      const val = (link.targetValue || link.href.replace('/shop/', '')).toLowerCase()
      return TSHIRT_SLUGS.has(val)
    })
  }, [activeLinks])

  const bottomwearLinks = useMemo(() => {
    return activeLinks.filter((link) => {
      const val = (link.targetValue || link.href.replace('/shop/', '')).toLowerCase()
      return BOTTOMWEAR_SLUGS.has(val)
    })
  }, [activeLinks])

  const otherLinks = useMemo(() => {
    return activeLinks.filter((link) => {
      const val = (link.targetValue || link.href.replace('/shop/', '')).toLowerCase()
      return !TSHIRT_SLUGS.has(val) && !BOTTOMWEAR_SLUGS.has(val)
    })
  }, [activeLinks])

  const isLinkActive = (href: string) => {
    if (href === '/shop') {
      return pathname === '/shop'
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleNavClick = (link: NavigationItem, e?: React.MouseEvent) => {
    const targetHref =
      link.type === 'category'
        ? (link.targetValue || 'all') === 'all'
          ? '/shop'
          : `/shop/${link.targetValue}`
        : link.href

    if (pathname !== targetHref && !targetHref.startsWith('/#') && targetHref !== '#') {
      setPendingHref(targetHref)
    }

    if (link.href.startsWith('/shop') || link.href.startsWith('/category/')) {
      if (link.type === 'category') {
        const target = link.targetValue || 'all'
        setCategory(target)
      }
      return
    }

    if (link.type === 'category') {
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
    if (pathname !== '/shop') {
      setPendingHref('/shop')
    }
    setCategory('all')
    router.push('/shop')
  }

  const scrollToCatalog = () => {
    const catalog = document.getElementById('catalog') || document.querySelector('.collection-toolbar-wrapper')
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isAuthOrCheckoutRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/checkout' ||
    pathname?.endsWith('/checkout') ||
    pathname?.includes('/checkout/')
  if (isAuthOrCheckoutRoute) {
    return null
  }

  const count = cartCount(items)

  const handleDepartmentClick = (dept: Department, e?: React.MouseEvent) => {
    if (expandedDept !== dept) {
      if (e) e.preventDefault()
      setExpandedDept(dept)
    } else {
      const targetHref = `/shop/${dept}`
      if (pathname !== targetHref) {
        setPendingHref(targetHref)
      }
      setCategory(dept)
      router.push(targetHref)
    }
  }

  const renderNavLink = (link: NavigationItem) => {
    const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
    const isActive = isLinkActive(link.href)
    const targetHref =
      link.type === 'category'
        ? (link.targetValue || 'all') === 'all'
          ? '/shop'
          : `/shop/${link.targetValue}`
        : link.href
    const isPending = pendingHref === targetHref || pendingHref === link.href

    return (
      <Link
        key={link.id || link.label}
        href={link.href}
        className={`relative shrink-0 whitespace-nowrap text-[13.5px] font-medium leading-none tracking-[0.02em] text-[#242424] no-underline transition-colors duration-150 hover:text-black active:scale-[0.98] press-feedback ${
          isPending ? 'opacity-70' : ''
        } ${
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
          <span className="ml-[5px] rounded-[2px] bg-black px-[5px] py-px text-[9px] font-semibold uppercase text-white">
            {link.badge}
          </span>
        )}
      </Link>
    )
  }

  const userInitial = (user?.name?.trim()?.charAt(0) || user?.email?.trim()?.charAt(0) || 'U').toUpperCase()

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    showToast('Signed out successfully')
    router.push('/login')
  }

  const handleDrawerLogout = () => {
    setMenuOpen(false)
    logout()
    showToast('Signed out successfully')
    router.push('/login')
  }

  return (
    <>
      {pendingHref && (
        <div
          className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none route-progress-bar"
          aria-hidden="true"
        />
      )}
      <header
        className={`sticky top-0 ${userMenuOpen ? 'z-[1005]' : 'z-[60]'} border-b border-b-[#e9e7e1] bg-[rgba(250,249,246,0.96)] backdrop-blur-[18px] transition-[box-shadow,background-color] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] [@media(prefers-reduced-transparency:reduce)]:bg-white [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none [&_:is(a,button,input):focus-visible]:outline-2 [&_:is(a,button,input):focus-visible]:outline-[#31586f] [&_:is(a,button,input):focus-visible]:outline-offset-[3px] motion-reduce:[transition-duration:0.01ms]`}
      >
        {/* Main Navigation Bar: Single row, perfectly vertically centered */}
        <div className="h-[76px] min-h-[76px] bg-transparent pt-[env(safe-area-inset-top)] max-[700px]:h-[60px] max-[700px]:min-h-[60px]">
          <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile Hamburger + Brand Logo */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                className="flex lg:hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[#182126] transition-colors hover:bg-black/5 active:scale-95 press-feedback [-webkit-tap-highlight-color:transparent] touch-manipulation"
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <Link
                className={`inline-flex shrink-0 items-center text-[#111] no-underline transition-opacity duration-200 hover:opacity-85 ${
                  pendingHref === '/' ? 'opacity-70' : ''
                }`}
                href="/"
                aria-label="TEESGARAGE Homepage"
                onClick={() => {
                  if (pathname !== '/') setPendingHref('/')
                }}
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
              className="hidden lg:flex flex-1 items-center justify-center overflow-x-auto no-scrollbar py-2"
              aria-label="Department and Category Navigation"
            >
              <div className="flex items-center">
                {/* T-Shirts Department Cluster */}
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDepartmentClick('t-shirts', e)}
                    aria-expanded={expandedDept === 't-shirts'}
                    aria-controls="desktop-tshirt-subcategories"
                    className={`relative inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-semibold leading-none tracking-[0.02em] no-underline transition-colors duration-150 cursor-pointer active:scale-[0.98] press-feedback select-none ${
                      expandedDept === 't-shirts' ? 'text-black' : 'text-[#444] hover:text-black'
                    } ${
                      pathname === '/shop/t-shirts'
                        ? "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-[1px] after:bg-black after:content-['']"
                        : ''
                    }`}
                  >
                    <span>T-Shirts</span>
                    <ChevronDown
                      className={`h-3 w-3 text-zinc-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        expandedDept === 't-shirts' ? 'rotate-0 text-black' : '-rotate-90'
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* T-Shirts Subcategories (Horizontal Smooth Accordion) */}
                  <div
                    id="desktop-tshirt-subcategories"
                    className={`flex items-center overflow-hidden transition-[max-width,opacity,transform] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      expandedDept === 't-shirts'
                        ? 'max-w-[750px] opacity-100 translate-x-0 pointer-events-auto'
                        : 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                    }`}
                    aria-hidden={expandedDept !== 't-shirts'}
                  >
                    <div className="flex items-center gap-6 xl:gap-7 pl-4 xl:pl-5 whitespace-nowrap">
                      {tshirtLinks.map(renderNavLink)}
                    </div>
                  </div>
                </div>

                {/* Divider between Departments */}
                <div className="mx-4 xl:mx-5 flex items-center shrink-0" aria-hidden="true">
                  <span className="h-3.5 w-px bg-black/15 shrink-0" />
                </div>

                {/* Bottomwear Department Cluster */}
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDepartmentClick('bottomwear', e)}
                    aria-expanded={expandedDept === 'bottomwear'}
                    aria-controls="desktop-bottomwear-subcategories"
                    className={`relative inline-flex items-center gap-1.5 whitespace-nowrap text-[13.5px] font-semibold leading-none tracking-[0.02em] no-underline transition-colors duration-150 cursor-pointer active:scale-[0.98] press-feedback select-none ${
                      expandedDept === 'bottomwear' ? 'text-black' : 'text-[#444] hover:text-black'
                    } ${
                      pathname === '/shop/bottomwear'
                        ? "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-[1px] after:bg-black after:content-['']"
                        : ''
                    }`}
                  >
                    <span>Bottomwear</span>
                    <ChevronDown
                      className={`h-3 w-3 text-zinc-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        expandedDept === 'bottomwear' ? 'rotate-0 text-black' : '-rotate-90'
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Bottomwear Subcategories (Horizontal Smooth Accordion) */}
                  <div
                    id="desktop-bottomwear-subcategories"
                    className={`flex items-center overflow-hidden transition-[max-width,opacity,transform] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      expandedDept === 'bottomwear'
                        ? 'max-w-[450px] opacity-100 translate-x-0 pointer-events-auto'
                        : 'max-w-0 opacity-0 -translate-x-3 pointer-events-none'
                    }`}
                    aria-hidden={expandedDept !== 'bottomwear'}
                  >
                    <div className="flex items-center gap-6 xl:gap-7 pl-4 xl:pl-5 whitespace-nowrap">
                      {bottomwearLinks.map(renderNavLink)}
                    </div>
                  </div>
                </div>

                {/* Other Links (e.g. Sale) if any */}
                {otherLinks.length > 0 && (
                  <>
                    <div className="mx-4 xl:mx-5 flex items-center shrink-0" aria-hidden="true">
                      <span className="h-3.5 w-px bg-black/15 shrink-0" />
                    </div>
                    <div className="flex items-center gap-6 xl:gap-7 shrink-0">
                      {otherLinks.map(renderNavLink)}
                    </div>
                  </>
                )}
              </div>
            </nav>

            {/* Right: Action Utilities */}
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              {/* Desktop Search Trigger (Hidden on mobile; Search is in MobileTabBar) */}
              <button
                type="button"
                className={`hidden md:grid ${HEADER_ACTION_BTN} press-feedback`}
                aria-label="Search products (press / to open)"
                onClick={() => openOverlay('search')}
              >
                <Search className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </button>

              {/* Wishlist (Visible on mobile & desktop) */}
              <Link
                href="/wishlist"
                className={`${HEADER_ACTION_BTN} press-feedback ${pendingHref === '/wishlist' ? 'opacity-70' : ''}`}
                aria-label={favorites.length ? `Wishlist with ${favorites.length} saved items` : 'Wishlist'}
                title="Wishlist"
                onClick={() => {
                  if (pathname !== '/wishlist') setPendingHref('/wishlist')
                }}
              >
                <div className="relative inline-flex items-center justify-center">
                  <Heart className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  {mounted && favorites.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0c0e12] px-1 text-[9px] font-bold leading-none text-white tabular-nums shadow-xs">
                      {favorites.length}
                    </span>
                  )}
                </div>
              </Link>

              {/* Shopping Bag Button with Badge (Desktop only; on mobile it is in MobileTabBar) */}
              <button
                className={`hidden md:grid ${HEADER_ACTION_BTN} min-h-[42px] min-w-[42px] press-feedback`}
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

              {/* User Avatar Circle / Login Button (Desktop only; on mobile, profile is in MobileTabBar) */}
              {mounted && isAuthenticated && user ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-label={`Account menu for ${user.name || 'Member'}`}
                    className="group relative flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out hover:scale-105 active:scale-95 press-feedback focus-visible:outline-2 focus-visible:outline-[#31586f] focus-visible:outline-offset-2 select-none"
                  >
                    <div
                      className={`flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#182126] text-[#faf9f6] text-[13px] font-bold tracking-tight shadow-[0_1px_3px_rgba(0,0,0,0.16)] transition-all duration-200 group-hover:bg-black group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${
                        userMenuOpen
                          ? 'ring-2 ring-[#182126] ring-offset-2 ring-offset-[#faf9f6]'
                          : 'border border-black/10'
                      }`}
                    >
                      <span>{userInitial}</span>
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
                    <div className="absolute right-0 top-[calc(100%+14px)] z-[1010] w-[340px] max-w-[calc(100vw-24px)] origin-top-right animate-[applePopoverEnter_var(--dur-base,220ms)_var(--ease-out,cubic-bezier(0.16,1,0.3,1))] rounded-[24px] border border-black/8 bg-white p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] flex flex-col gap-3.5">
                      {/* Top pointer notch */}
                      <div className="absolute -top-1.5 right-3.5 h-3.5 w-3.5 rotate-45 rounded-xs border-l border-t border-black/8 bg-white" aria-hidden="true" />

                      {/* Header Row: User Info & Close */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#182126] text-[18px] font-bold text-white shadow-xs [font-family:var(--font-brand)]">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <h3 className="m-0 truncate text-[16px] font-bold tracking-tight text-[#111111]">
                              {user.name}
                            </h3>
                            <p className="mt-0.5 text-[12.5px] text-[#777777] font-normal leading-normal">
                              Member since {user.createdAt ? new Date(user.createdAt).getFullYear() : '2025'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#777777] hover:text-[#111111] hover:bg-black/5 transition-colors cursor-pointer press-feedback"
                          aria-label="Close menu"
                        >
                          <X className="h-4 w-4 stroke-[2.2]" />
                        </button>
                      </div>

                      {/* View Profile Button */}
                      <Link
                        href="/profile"
                        onClick={() => {
                          setUserMenuOpen(false)
                          if (pathname !== '/profile') setPendingHref('/profile')
                        }}
                        className={`group flex items-center justify-between w-full rounded-2xl bg-[#f4f2ee] hover:bg-[#eae7e1] px-4 py-2.5 transition-colors text-[13.5px] font-semibold text-[#111111] cursor-pointer press-feedback ${
                          pendingHref === '/profile' ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="h-4 w-4 text-[#333333] stroke-[2]" />
                          <span>View profile</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#888888] transition-transform group-hover:translate-x-0.5" />
                      </Link>

                      {/* 4 Action Cards */}
                      <div className="flex flex-col gap-2">
                        {/* 1. Orders */}
                        <Link
                          href="/orders"
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (pathname !== '/orders') setPendingHref('/orders')
                          }}
                          className={`group flex items-center justify-between w-full rounded-2xl bg-[#f4f2ee] hover:bg-[#eae7e1] p-3 transition-colors cursor-pointer press-feedback ${
                            pendingHref === '/orders' ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-2xs border border-black/5 text-[#111111]">
                              <Package className="h-5 w-5 stroke-[1.8]" />
                            </div>
                            <div className="min-w-0 text-left">
                              <h4 className="text-[14px] font-bold text-[#111111] leading-tight">Orders</h4>
                              <p className="text-[12px] text-[#777777] mt-0.5 leading-tight truncate">Track or view orders</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#888888] transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        {/* 2. Addresses */}
                        <Link
                          href="/addresses"
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (pathname !== '/addresses') setPendingHref('/addresses')
                          }}
                          className={`group flex items-center justify-between w-full rounded-2xl bg-[#f4f2ee] hover:bg-[#eae7e1] p-3 transition-colors cursor-pointer press-feedback ${
                            pendingHref === '/addresses' ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-2xs border border-black/5 text-[#111111]">
                              <MapPin className="h-5 w-5 stroke-[1.8]" />
                            </div>
                            <div className="min-w-0 text-left">
                              <h4 className="text-[14px] font-bold text-[#111111] leading-tight">Addresses</h4>
                              <p className="text-[12px] text-[#777777] mt-0.5 leading-tight truncate">Manage delivery addresses</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#888888] transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        {/* 3. Wishlist */}
                        <Link
                          href="/wishlist"
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (pathname !== '/wishlist') setPendingHref('/wishlist')
                          }}
                          className={`group flex items-center justify-between w-full rounded-2xl bg-[#f4f2ee] hover:bg-[#eae7e1] p-3 transition-colors cursor-pointer press-feedback ${
                            pendingHref === '/wishlist' ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-2xs border border-black/5 text-[#111111]">
                              <Heart className="h-5 w-5 stroke-[1.8]" />
                            </div>
                            <div className="min-w-0 text-left">
                              <h4 className="text-[14px] font-bold text-[#111111] leading-tight">Wishlist</h4>
                              <p className="text-[12px] text-[#777777] mt-0.5 leading-tight truncate">Your saved pieces</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#888888] transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        {/* 4. Account settings */}
                        <Link
                          href="/settings"
                          onClick={() => {
                            setUserMenuOpen(false)
                            if (pathname !== '/settings') setPendingHref('/settings')
                          }}
                          className={`group flex items-center justify-between w-full rounded-2xl bg-[#f4f2ee] hover:bg-[#eae7e1] p-3 transition-colors cursor-pointer press-feedback ${
                            pendingHref === '/settings' ? 'opacity-70' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-2xs border border-black/5 text-[#111111]">
                              <Settings className="h-5 w-5 stroke-[1.8]" />
                            </div>
                            <div className="min-w-0 text-left">
                              <h4 className="text-[14px] font-bold text-[#111111] leading-tight">Account settings</h4>
                              <p className="text-[12px] text-[#777777] mt-0.5 leading-tight truncate">Password and preferences</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#888888] transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>

                      {/* Sign Out Button */}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex items-center justify-between w-full rounded-2xl bg-[#fff1f2] hover:bg-[#ffe4e6] p-3.5 transition-colors cursor-pointer border border-rose-100 text-[#e11d48] press-feedback"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="h-4 w-4 stroke-[2]" />
                          <span className="text-[13.5px] font-semibold">Sign out</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#e11d48] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`hidden md:inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#182126] px-3.5 text-[12.5px] font-semibold text-white shadow-2xs transition-all duration-150 hover:bg-black hover:shadow-xs active:scale-95 press-feedback [-webkit-tap-highlight-color:transparent] touch-manipulation ${
                    pendingHref === '/login' ? 'opacity-70' : ''
                  }`}
                  aria-label="Sign in to your account"
                  onClick={() => {
                    if (pathname !== '/login') setPendingHref('/login')
                  }}
                >
                  <User className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="block animate-[navPanelSlideIn_var(--dur-base)_var(--ease-out)_both] border-t border-t-[#e4e2dd] bg-[rgba(250,249,246,0.92)] px-[max(20px,env(safe-area-inset-right))] pb-[calc(22px+env(safe-area-inset-bottom))] pl-[max(20px,env(safe-area-inset-left))] pt-3 backdrop-blur-[20px] backdrop-saturate-[1.8] motion-reduce:[animation-duration:0.01ms]">
            <div className="flex flex-col gap-0">
              <button
                type="button"
                className="mb-2.5 flex min-h-[46px] w-full cursor-pointer items-center justify-between gap-2.5 rounded-[8px] border-0 border-b border-b-[#e9e7e1] bg-[#f4f4f5] px-3.5 py-2.5 text-left text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline press-feedback [font-family:var(--font-brand)]"
                onClick={() => {
                  setMenuOpen(false)
                  openOverlay('search')
                }}
              >
                <Search className="h-4 w-4 text-zinc-500" />
                <span>Search Garments &amp; Fits...</span>
              </button>

              <button
                type="button"
                className={`flex min-h-[46px] cursor-pointer items-center justify-between border-0 bg-transparent py-2 pr-0 text-left text-[14px] font-semibold uppercase leading-normal text-[#182126] press-feedback [font-family:var(--font-ui)] ${
                  pathname === '/shop' ? 'rounded-[6px] pl-2.5 text-black' : 'pl-0'
                } ${pendingHref === '/shop' ? 'opacity-70' : ''}`}
                onClick={() => {
                  handleShopAllClick()
                  setMenuOpen(false)
                }}
              >
                Shop All Garments
              </button>

              {/* T-Shirts Mobile Section */}
              <div className="border-b border-b-[#e9e7e1]">
                <button
                  type="button"
                  className="flex min-h-[46px] w-full cursor-pointer items-center justify-between border-0 bg-transparent py-2 text-left text-[14px] font-semibold uppercase leading-normal text-[#182126] press-feedback [font-family:var(--font-ui)]"
                  onClick={() => setMobileExpandedDept((curr) => (curr === 't-shirts' ? null : 't-shirts'))}
                  aria-expanded={mobileExpandedDept === 't-shirts'}
                >
                  <span className={mobileExpandedDept === 't-shirts' ? 'text-black font-bold' : 'text-[#182126]'}>T-Shirts</span>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform duration-250 ease-out ${
                      mobileExpandedDept === 't-shirts' ? 'rotate-180 text-black' : 'rotate-0'
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    mobileExpandedDept === 't-shirts' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col pl-3 border-l-2 border-l-black/10 my-1 mb-2 space-y-0.5">
                      <Link
                        href="/shop/t-shirts"
                        className={`flex min-h-[40px] items-center justify-between py-1.5 text-[12.5px] uppercase leading-normal no-underline press-feedback [font-family:var(--font-brand)] ${
                          pathname === '/shop/t-shirts' ? 'font-bold text-black' : 'font-medium text-zinc-600'
                        }`}
                        onClick={() => {
                          setPendingHref('/shop/t-shirts')
                          setCategory('t-shirts')
                          setMenuOpen(false)
                        }}
                      >
                        All T-Shirts
                      </Link>
                      {tshirtLinks.map((link) => {
                        const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
                        const isActive = isLinkActive(link.href)
                        return (
                          <Link
                            key={link.id || link.label}
                            href={link.href}
                            className={`flex min-h-[40px] items-center justify-between py-1.5 text-[12.5px] uppercase leading-normal no-underline press-feedback [font-family:var(--font-brand)] ${
                              isActive ? 'font-bold text-black' : 'font-medium text-zinc-700'
                            } ${isSale ? 'text-[#e01a2b]!' : ''}`}
                            onClick={(e) => {
                              handleNavClick(link, e)
                              setMenuOpen(false)
                            }}
                          >
                            <span>{link.label}</span>
                            {link.badge && (
                              <span className="rounded-[2px] bg-black px-[5px] py-px text-[9px] font-semibold uppercase text-white">
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottomwear Mobile Section */}
              <div className="border-b border-b-[#e9e7e1]">
                <button
                  type="button"
                  className="flex min-h-[46px] w-full cursor-pointer items-center justify-between border-0 bg-transparent py-2 text-left text-[14px] font-semibold uppercase leading-normal text-[#182126] press-feedback [font-family:var(--font-ui)]"
                  onClick={() => setMobileExpandedDept((curr) => (curr === 'bottomwear' ? null : 'bottomwear'))}
                  aria-expanded={mobileExpandedDept === 'bottomwear'}
                >
                  <span className={mobileExpandedDept === 'bottomwear' ? 'text-black font-bold' : 'text-[#182126]'}>Bottomwear</span>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform duration-250 ease-out ${
                      mobileExpandedDept === 'bottomwear' ? 'rotate-180 text-black' : 'rotate-0'
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    mobileExpandedDept === 'bottomwear' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col pl-3 border-l-2 border-l-black/10 my-1 mb-2 space-y-0.5">
                      <Link
                        href="/shop/bottomwear"
                        className={`flex min-h-[40px] items-center justify-between py-1.5 text-[12.5px] uppercase leading-normal no-underline press-feedback [font-family:var(--font-brand)] ${
                          pathname === '/shop/bottomwear' ? 'font-bold text-black' : 'font-medium text-zinc-600'
                        }`}
                        onClick={() => {
                          setPendingHref('/shop/bottomwear')
                          setCategory('bottomwear')
                          setMenuOpen(false)
                        }}
                      >
                        All Bottomwear
                      </Link>
                      {bottomwearLinks.map((link) => {
                        const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
                        const isActive = isLinkActive(link.href)
                        return (
                          <Link
                            key={link.id || link.label}
                            href={link.href}
                            className={`flex min-h-[40px] items-center justify-between py-1.5 text-[12.5px] uppercase leading-normal no-underline press-feedback [font-family:var(--font-brand)] ${
                              isActive ? 'font-bold text-black' : 'font-medium text-zinc-700'
                            } ${isSale ? 'text-[#e01a2b]!' : ''}`}
                            onClick={(e) => {
                              handleNavClick(link, e)
                              setMenuOpen(false)
                            }}
                          >
                            <span>{link.label}</span>
                            {link.badge && (
                              <span className="rounded-[2px] bg-black px-[5px] py-px text-[9px] font-semibold uppercase text-white">
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Links (e.g. Sale) if any */}
              {otherLinks.map((link) => {
                const isSale = link.badge?.toLowerCase() === 'sale' || link.label.toLowerCase() === 'sale'
                const isActive = isLinkActive(link.href)
                return (
                  <Link
                    key={link.id || link.label}
                    href={link.href}
                    className={`flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] py-2 text-[13px] uppercase leading-[normal] no-underline press-feedback [font-family:var(--font-brand)] ${
                      isActive
                        ? 'rounded-[6px] bg-[var(--bone)] pr-0 pl-2.5 font-bold text-black'
                        : 'px-0 font-semibold text-[#182126]'
                    } ${isSale ? 'font-semibold' : ''}`}
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
                    className={`flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline press-feedback [font-family:var(--font-brand)] ${
                      pendingHref === '/orders' ? 'opacity-70' : ''
                    }`}
                    onClick={() => {
                      if (pathname !== '/orders') setPendingHref('/orders')
                      setMenuOpen(false)
                    }}
                  >
                    My Orders &amp; Tracking
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline press-feedback [font-family:var(--font-brand)] ${
                      pendingHref === '/profile' ? 'opacity-70' : ''
                    }`}
                    onClick={() => {
                      if (pathname !== '/profile') setPendingHref('/profile')
                      setMenuOpen(false)
                    }}
                  >
                    Profile &amp; Addresses
                  </Link>

                  <Link
                    href="/profile?tab=favorites"
                    className={`flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline press-feedback [font-family:var(--font-brand)] ${
                      pendingHref === '/profile?tab=favorites' ? 'opacity-70' : ''
                    }`}
                    onClick={() => {
                      if (pathname !== '/profile?tab=favorites') setPendingHref('/profile?tab=favorites')
                      setMenuOpen(false)
                    }}
                  >
                    Saved Favorites ({favorites.length})
                  </Link>

                  <button
                    type="button"
                    className="flex min-h-[46px] cursor-pointer items-center justify-between border-0 bg-transparent py-2 pr-0 pl-0 text-left text-[14px] font-semibold uppercase leading-normal text-red-600 press-feedback [font-family:var(--font-ui)]"
                    onClick={handleDrawerLogout}
                  >
                    Sign Out ({user.name.split(' ')[0]})
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={`flex min-h-[46px] items-center justify-between border-b border-b-[#e9e7e1] px-0 py-2 text-[13px] font-semibold uppercase leading-[normal] text-[#182126] no-underline press-feedback [font-family:var(--font-brand)] ${
                    pendingHref === '/login' ? 'opacity-70' : ''
                  }`}
                  onClick={() => {
                    if (pathname !== '/login') setPendingHref('/login')
                    setMenuOpen(false)
                  }}
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

      {/* Mobile Bottom Tab Bar Navigation */}
      <MobileTabBar
        onOpenSearch={() => openOverlay('search')}
        isSearchOpen={overlay === 'search'}
        pendingHref={pendingHref}
        onNavigate={(href) => setPendingHref(href)}
      />
    </>
  )
}

