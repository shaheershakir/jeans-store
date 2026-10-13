'use client'

import * as React from 'react'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useAdminStore } from '@/store/admin-store'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
}

export function Header({ className, fixed = true, children, ...props }: HeaderProps) {
  const [offset, setOffset] = React.useState(0)
  const notifications = useAdminStore((s) => s.data.notifications)
  const markNotificationsRead = useAdminStore((s) => s.markNotificationsRead)

  const unreadCount = notifications.filter((n) => !n.read).length

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-40 h-16 w-full border-b border-border bg-background/95 backdrop-blur-sm transition-all',
        fixed && 'sticky top-0',
        offset > 10 ? 'shadow-xs' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div className="flex h-full items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <SidebarTrigger variant="outline" className="h-8 w-8" />
        <Separator orientation="vertical" className="h-6" />

        <div className="flex-1 max-w-md">
          <Search placeholder="Search products, orders, commands..." />
        </div>

        {children}

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markNotificationsRead}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto p-1">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No notifications
                  </p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'rounded-md p-2.5 text-xs transition-colors',
                        !n.read
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <p className="font-semibold text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/75">
                        {new Date(n.at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme switcher */}
          <ThemeSwitch />

          <Separator orientation="vertical" className="h-6" />

          {/* User Profile */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}
