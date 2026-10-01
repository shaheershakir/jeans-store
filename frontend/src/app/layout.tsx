import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SearchOverlay from '@/components/SearchOverlay'
import Toast from '@/components/Toast'
import { getNavigationItems } from '@/lib/navigation'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://infit.in'),
  title: 'INFIT — Denim for the real world',
  description:
    'Weighty denim, honest washes, and fits that get better with every wear. Free shipping above ₹1,499.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/icon.svg'
  },
  openGraph: {
    title: 'INFIT — Denim for the real world',
    description:
      'Weighty denim, honest washes, and fits that get better with every wear. Free shipping above ₹1,499.',
    url: 'https://infit.in',
    siteName: 'INFIT',
    locale: 'en_IN',
    type: 'website'
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const navItems = await getNavigationItems()

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main className="site-shell">
          <Header initialNavItems={navItems} />
          {children}
          <Footer />
        </main>
        <CartDrawer />
        <SearchOverlay />
        <Toast />
        <noscript>
          <Link href="/">INFIT</Link>
        </noscript>
      </body>
    </html>
  )
}
