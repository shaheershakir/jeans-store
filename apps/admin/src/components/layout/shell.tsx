'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from './app-sidebar'
import { Header } from './header'
import { useDataReady, useRequireAuth } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/context/theme-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { AdminStateSync } from './admin-state-sync'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  const [mounted, setMounted] = React.useState(false)
  const isAuth = useRequireAuth(isLoginPage)
  const isReady = useDataReady()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (isLoginPage) {
    return (
      <ThemeProvider defaultTheme="system">
        <div className="min-h-screen bg-background text-foreground">{children}</div>
      </ThemeProvider>
    )
  }

  // Initial SSR & hydration placeholder
  if (!mounted || !isAuth || !isReady) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <div className="hidden h-full w-64 border-r border-border bg-sidebar p-4 lg:block space-y-4">
          <Skeleton className="h-9 w-36 rounded-md" />
          <div className="space-y-2 pt-6">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
            <Skeleton className="h-9 w-64 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
          <div className="p-6 space-y-6">
            <Skeleton className="h-10 w-48 rounded-md" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider defaultTheme="system">
      <LayoutProvider>
        <SearchProvider>
          <SidebarProvider>
            <AppSidebar />
            <AdminStateSync />
            <SidebarInset className="overflow-x-hidden min-h-screen flex flex-col">
              <Header />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </SearchProvider>
      </LayoutProvider>
    </ThemeProvider>
  )
}
