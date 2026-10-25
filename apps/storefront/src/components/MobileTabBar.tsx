'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { cartCount, useCartStore, useUIStore, useAuthStore } from '@/lib/store'

interface MobileTabBarProps {
  onOpenSearch?: () => void
  isSearchOpen?: boolean
}

export default function MobileTabBar({
  onOpenSearch,
  isSearchOpen: isSearchOpenProp
}: MobileTabBarProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const items = useCartStore((state) => state.items)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const overlay = useUIStore((state) => state.overlay)
  const isSearchOpen = isSearchOpenProp !== undefined ? isSearchOpenProp : overlay === 'search'
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const count = mounted ? cartCount(items) : 0
  const isBagActive = (pathname === '/bag' || pathname.startsWith('/bag')) && !isSearchOpen

  // Tab definitions
  const isHomeActive = pathname === '/' && !isSearchOpen && !isBagActive
  const isSearchActive = (isSearchOpen || pathname.startsWith('/search')) && !isBagActive
  const isProfileActive =
    (pathname.startsWith('/profile') || pathname.startsWith('/orders') || (pathname === '/login' && !isAuthenticated)) &&
    !isSearchOpen &&
    !isBagActive

  const handleHomeClick = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
  }

  const handleSearchClick = () => {
    if (onOpenSearch) {
      onOpenSearch()
    } else {
      openOverlay('search')
    }
  }

  const handleBagClick = () => {
    if (overlay) {
      useUIStore.getState().closeOverlay()
    }
    router.push('/bag')
  }

  const handleProfileClick = () => {
    if (isAuthenticated) {
      router.push('/profile')
    } else {
      router.push('/login')
    }
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[75] md:hidden h-[calc(56px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-[rgba(250,249,246,0.95)] backdrop-blur-2xl border-t border-[rgba(0,0,0,0.08)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)]"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-4 h-full items-center max-w-[500px] mx-auto px-1">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={handleHomeClick}
          aria-label="Home"
          className="relative flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-transform duration-100 ease-out select-none [-webkit-tap-highlight-color:transparent] touch-manipulation active:scale-[0.92]"
        >
          <div className="relative inline-flex items-center justify-center">
            <Home
              className={`h-5 w-5 transition-colors duration-150 ${
                isHomeActive ? 'text-[#0c0e12]' : 'text-[#71717a]'
              }`}
              strokeWidth={isHomeActive ? 2.3 : 1.8}
              aria-hidden="true"
            />
          </div>
          <span
            className={`text-[10px] tracking-tight leading-none transition-colors duration-150 ${
              isHomeActive ? 'font-bold text-[#0c0e12]' : 'font-medium text-[#71717a]'
            }`}
          >
            Home
          </span>
          {isHomeActive && (
            <span
              className="absolute bottom-1 h-0.5 w-3.5 rounded-full bg-[#0c0e12]"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Tab 2: Search */}
        <button
          type="button"
          onClick={handleSearchClick}
          aria-label="Search"
          className="relative flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-transform duration-100 ease-out select-none [-webkit-tap-highlight-color:transparent] touch-manipulation active:scale-[0.92]"
        >
          <div className="relative inline-flex items-center justify-center">
            <Search
              className={`h-5 w-5 transition-colors duration-150 ${
                isSearchActive ? 'text-[#0c0e12]' : 'text-[#71717a]'
              }`}
              strokeWidth={isSearchActive ? 2.3 : 1.8}
              aria-hidden="true"
            />
          </div>
          <span
            className={`text-[10px] tracking-tight leading-none transition-colors duration-150 ${
              isSearchActive ? 'font-bold text-[#0c0e12]' : 'font-medium text-[#71717a]'
            }`}
          >
            Search
          </span>
          {isSearchActive && (
            <span
              className="absolute bottom-1 h-0.5 w-3.5 rounded-full bg-[#0c0e12]"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Tab 3: Bag */}
        <button
          type="button"
          onClick={handleBagClick}
          aria-label={`Bag with ${count} items`}
          className="relative flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-transform duration-100 ease-out select-none [-webkit-tap-highlight-color:transparent] touch-manipulation active:scale-[0.92]"
        >
          <div className="relative inline-flex items-center justify-center">
            <ShoppingBag
              className={`h-5 w-5 transition-colors duration-150 ${
                isBagActive ? 'text-[#0c0e12]' : 'text-[#71717a]'
              }`}
              strokeWidth={isBagActive ? 2.3 : 1.8}
              aria-hidden="true"
            />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e01a2b] px-1 text-[9.5px] font-bold text-white tabular-nums leading-none shadow-xs">
                {count}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight leading-none transition-colors duration-150 ${
              isBagActive ? 'font-bold text-[#0c0e12]' : 'font-medium text-[#71717a]'
            }`}
          >
            Bag
          </span>
          {isBagActive && (
            <span
              className="absolute bottom-1 h-0.5 w-3.5 rounded-full bg-[#0c0e12]"
              aria-hidden="true"
            />
          )}
        </button>

        {/* Tab 4: Profile */}
        <button
          type="button"
          onClick={handleProfileClick}
          aria-label={isAuthenticated && user?.name ? `Profile (${user.name})` : 'Profile'}
          className="relative flex flex-col items-center justify-center gap-1 h-full py-1 text-center transition-transform duration-100 ease-out select-none [-webkit-tap-highlight-color:transparent] touch-manipulation active:scale-[0.92]"
        >
          <div className="relative inline-flex items-center justify-center">
            {mounted && isAuthenticated && user?.name ? (
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold leading-none ${
                  isProfileActive
                    ? 'border-[#0c0e12] bg-[#0c0e12] text-white'
                    : 'border-[#71717a] bg-transparent text-[#71717a]'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User
                className={`h-5 w-5 transition-colors duration-150 ${
                  isProfileActive ? 'text-[#0c0e12]' : 'text-[#71717a]'
                }`}
                strokeWidth={isProfileActive ? 2.3 : 1.8}
                aria-hidden="true"
              />
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight leading-none transition-colors duration-150 ${
              isProfileActive ? 'font-bold text-[#0c0e12]' : 'font-medium text-[#71717a]'
            }`}
          >
            Profile
          </span>
          {isProfileActive && (
            <span
              className="absolute bottom-1 h-0.5 w-3.5 rounded-full bg-[#0c0e12]"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </nav>
  )
}
