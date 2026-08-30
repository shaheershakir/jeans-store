'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_GROUPS } from './nav'
import { useAdminStore } from '@/store/admin-store'
import { useSession } from '@/hooks/use-data'

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-divider px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
        I
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-ink">INFIT Admin</p>
          <p className="text-[11px] leading-tight text-ink-3">Jeans commerce ops</p>
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  collapsed = false,
  mobile = false,
  onClose,
}: {
  collapsed?: boolean
  mobile?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const session = useSession()

  const hasPerm = (perm?: string) => {
    if (!perm) return true
    if (!session) return false
    return session.permissions.includes(perm)
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r border-line bg-surface',
        collapsed && !mobile && 'w-[68px]',
        mobile && 'w-72'
      )}
    >
      <div className="flex items-center justify-between">
        <Brand collapsed={collapsed && !mobile} />
        {mobile && (
          <button onClick={onClose} className="mr-3 rounded-lg p-1.5 text-ink-3 hover:bg-surface-subtle" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {NAV_GROUPS.map((group, gi) => {
          if (!hasPerm(group.perm)) return null
          const items = group.items.filter((item) => hasPerm(item.perm))
          if (items.length === 0) return null
          return (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-4">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.href, item.exact)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={mobile ? onClose : undefined}
                        title={item.label}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                          collapsed && !mobile && 'justify-center px-0',
                          active
                            ? 'bg-primary-soft text-primary'
                            : 'text-ink-2 hover:bg-surface-subtle hover:text-ink'
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className={cn('h-[17px] w-[17px] shrink-0', active ? 'text-primary' : 'text-ink-3')} />
                        {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-divider px-4 py-3">
        <p className="text-[11px] leading-snug text-ink-4">
          {session?.roleName ?? 'Not signed in'}
          <br />
          {session?.userName ? `Signed in as ${session.userName}` : 'v0.1.0'}
        </p>
      </div>
    </div>
  )
}