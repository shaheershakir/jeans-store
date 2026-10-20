'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Settings,
  User,
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/lib/store'

export type AccountTabId =
  | 'account'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'settings'

export interface AccountSidebarProps {
  activeTab?: AccountTabId
  className?: string
}

export const ACCOUNT_NAV_ITEMS = [
  { label: 'My Account', href: '/profile', Icon: User, id: 'account' as const },
  { label: 'Orders', href: '/orders', Icon: Package, id: 'orders' as const },
  { label: 'Wishlist', href: '/wishlist', Icon: Heart, id: 'wishlist' as const },
  { label: 'Addresses', href: '/addresses', Icon: MapPin, id: 'addresses' as const },
  { label: 'Account Settings', href: '/settings', Icon: Settings, id: 'settings' as const },
]

export default function AccountSidebar({ activeTab, className = '' }: AccountSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const showToast = useUIStore((s) => s.showToast)

  // Determine active tab from prop or automatically from pathname
  const currentTab: AccountTabId =
    activeTab ||
    (() => {
      if (!pathname) return 'account'
      if (pathname.startsWith('/orders')) return 'orders'
      if (pathname.startsWith('/wishlist') || pathname.startsWith('/favorites')) return 'wishlist'
      if (pathname.startsWith('/addresses')) return 'addresses'
      if (pathname.startsWith('/settings')) return 'settings'
      if (pathname.startsWith('/profile')) return 'account'
      return 'account'
    })()

  const handleLogout = () => {
    logout()
    showToast('Signed out successfully')
    router.push('/login')
  }

  return (
    <aside
      className={`w-[230px] shrink-0 max-[860px]:w-full ${className}`.trim()}
      aria-label="Account Navigation"
    >
      <nav className="flex flex-col gap-1 sticky top-[96px] max-[860px]:static max-[860px]:flex-row max-[860px]:overflow-x-auto max-[860px]:pb-2.5 max-[860px]:border-b max-[860px]:border-black/8 scrollbar-none">
        {ACCOUNT_NAV_ITEMS.map(({ label, href, Icon, id }) => {
          const isActive = currentTab === id
          return (
            <Link
              key={id}
              href={href}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-[14px] text-[13.5px] transition-colors whitespace-nowrap w-full max-[860px]:w-auto shrink-0 ${
                isActive
                  ? 'font-bold text-[#111111] bg-[#e8e6e1]'
                  : 'font-medium text-[#555555] hover:text-[#111111] hover:bg-black/4'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 stroke-[1.8] transition-colors ${
                  isActive ? 'text-[#111111]' : 'text-[#555555] group-hover:text-[#111111]'
                }`}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          )
        })}

        <div className="my-3.5 h-px bg-black/8 mx-2 max-[860px]:hidden" />

        <button
          type="button"
          onClick={handleLogout}
          className="group flex items-center gap-3.5 px-4 py-3 rounded-[14px] text-[13.5px] font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-colors text-left cursor-pointer whitespace-nowrap w-full max-[860px]:w-auto shrink-0"
        >
          <LogOut
            className="w-[18px] h-[18px] shrink-0 stroke-[1.8] text-red-600 group-hover:text-red-700 transition-colors"
            aria-hidden="true"
          />
          <span>Log Out</span>
        </button>
      </nav>
    </aside>
  )
}
