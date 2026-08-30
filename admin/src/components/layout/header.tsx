'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  User,
  Users,
  X,
} from 'lucide-react'
import { useAdminStore } from '@/store/admin-store'
import { useSession } from '@/hooks/use-data'
import { logout } from '@/services/auth'
import { Avatar, Badge, Input } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const router = useRouter()
  const session = useSession()
  const notifications = useAdminStore((s) => s.data.notifications)
  const markNotificationsRead = useAdminStore((s) => s.markNotificationsRead)
  const products = useAdminStore((s) => s.data.products)
  const orders = useAdminStore((s) => s.data.orders)
  const customers = useAdminStore((s) => s.data.customers)

  const [showNotifications, setShowNotifications] = React.useState(false)
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [showSearch, setShowSearch] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Filter search results
  const searchResults = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { products: [], orders: [], customers: [] }

    const matchingProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.fit.toLowerCase().includes(q)
      )
      .slice(0, 4)

    const matchingOrders = orders
      .filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          o.shippingAddress?.city?.toLowerCase().includes(q)
      )
      .slice(0, 4)

    const matchingCustomers = customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
      .slice(0, 4)

    return {
      products: matchingProducts,
      orders: matchingOrders,
      customers: matchingCustomers,
    }
  }, [query, products, orders, customers])

  const hasResults =
    searchResults.products.length > 0 ||
    searchResults.orders.length > 0 ||
    searchResults.customers.length > 0

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-subtle lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="text"
              placeholder="Search products, orders, customers..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              className="pl-9 pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && query.trim() !== '' && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSearch(false)}
              />
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-pop">
                {!hasResults ? (
                  <p className="py-4 text-center text-xs text-ink-3">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.products.length > 0 && (
                      <div>
                        <p className="px-2 pb-1 text-[11px] font-semibold text-ink-4 uppercase tracking-wider">
                          Products
                        </p>
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.id}`}
                            onClick={() => {
                              setShowSearch(false)
                              setQuery('')
                            }}
                            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-surface-subtle"
                          >
                            <Package className="h-3.5 w-3.5 text-ink-3" />
                            <span className="font-medium text-ink truncate">{p.name}</span>
                            <span className="ml-auto text-[11px] text-ink-3">{p.sku}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.orders.length > 0 && (
                      <div>
                        <p className="px-2 pb-1 text-[11px] font-semibold text-ink-4 uppercase tracking-wider">
                          Orders
                        </p>
                        {searchResults.orders.map((o) => (
                          <Link
                            key={o.id}
                            href={`/orders/${o.id}`}
                            onClick={() => {
                              setShowSearch(false)
                              setQuery('')
                            }}
                            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-surface-subtle"
                          >
                            <ShoppingCart className="h-3.5 w-3.5 text-ink-3" />
                            <span className="font-medium text-ink">{o.number}</span>
                            <span className="ml-auto text-[11px] text-ink-3">₹{o.total.toLocaleString('en-IN')}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {searchResults.customers.length > 0 && (
                      <div>
                        <p className="px-2 pb-1 text-[11px] font-semibold text-ink-4 uppercase tracking-wider">
                          Customers
                        </p>
                        {searchResults.customers.map((c) => (
                          <Link
                            key={c.id}
                            href={`/customers/${c.id}`}
                            onClick={() => {
                              setShowSearch(false)
                              setQuery('')
                            }}
                            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs hover:bg-surface-subtle"
                          >
                            <Users className="h-3.5 w-3.5 text-ink-3" />
                            <span className="font-medium text-ink">{c.name}</span>
                            <span className="ml-auto text-[11px] text-ink-3">{c.email}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-ink-2 hover:bg-surface-subtle hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-line bg-surface p-3 shadow-pop">
                <div className="flex items-center justify-between border-b border-divider pb-2 mb-2">
                  <span className="text-xs font-semibold text-ink">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markNotificationsRead}
                      className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-ink-3">No notifications</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'rounded-md p-2 text-xs',
                          !n.read ? 'bg-primary-soft/50' : 'bg-surface-subtle'
                        )}
                      >
                        <p className="font-medium text-ink">{n.title}</p>
                        <p className="mt-0.5 text-[11px] text-ink-2">{n.body}</p>
                        <p className="mt-1 text-[10px] text-ink-3">
                          {new Date(n.at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-subtle"
          >
            <Avatar name={session?.userName ?? 'Admin'} size="sm" />
            <span className="hidden text-xs font-medium text-ink sm:inline">
              {session?.userName ?? 'Admin'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-line bg-surface p-1 shadow-pop">
                <div className="px-3 py-2 border-b border-divider mb-1">
                  <p className="text-xs font-semibold text-ink">{session?.userName}</p>
                  <p className="text-[11px] text-ink-3">{session?.userEmail}</p>
                  <Badge tone="primary" className="mt-1">
                    {session?.roleName}
                  </Badge>
                </div>
                <Link
                  href="/settings/store"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-ink hover:bg-surface-subtle"
                >
                  <User className="h-3.5 w-3.5 text-ink-3" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-danger hover:bg-danger-soft"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
