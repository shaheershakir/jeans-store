'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MoreHorizontal, Package, ShoppingCart, Users } from 'lucide-react'

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', href: '/', icon: Home },
    { label: 'Orders', href: '/orders', icon: ShoppingCart },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'More', href: '/settings/store', icon: MoreHorizontal },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/90 dark:border-border bg-white/95 dark:bg-card/95 backdrop-blur-md px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-foreground'
              }`}
            >
              <div
                className={`relative flex items-center justify-center ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
