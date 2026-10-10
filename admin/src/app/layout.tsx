import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastViewport } from '@/components/ui/toast'
import { AdminShell } from '@/components/layout/shell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TEESGARAGE Admin — Jeans Commerce Operations',
  description: 'Admin operations dashboard for TEESGARAGE premium denim store',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased bg-canvas text-ink">
        <AdminShell>{children}</AdminShell>
        <ToastViewport />
      </body>
    </html>
  )
}
