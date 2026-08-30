'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useDataReady, useRequireAuth } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/primitives'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  const [mounted, setMounted] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [collapsed, setCollapsed] = React.useState(false)

  const isAuth = useRequireAuth(isLoginPage)
  const isReady = useDataReady()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoginPage) {
    return <div className="min-h-screen bg-canvas text-ink">{children}</div>
  }

  // During SSR and initial client hydration, render consistent placeholder skeleton
  if (!mounted || !isAuth || !isReady) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-canvas">
        <div className="hidden h-full w-64 border-r border-line bg-surface p-4 lg:block space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2 pt-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="h-14 border-b border-line bg-surface px-6 flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-48" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      {/* Desktop Sidebar */}
      <div className="hidden h-full lg:block shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
