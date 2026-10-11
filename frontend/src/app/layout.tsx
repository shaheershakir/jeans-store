import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SearchOverlay from '@/components/SearchOverlay'
import Toast from '@/components/Toast'
import OnboardingModal from '@/components/OnboardingModal'
import { getNavigationItems } from '@/lib/navigation'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://teesgarage.in'),
  title: 'TEESGARAGE — Heavyweight T-Shirts & Premium Bottomwear',
  description:
    'Heavyweight combed cotton tees, drop shoulders, stripes, henleys, trackpants & sweatpants built for everyday wear. Free shipping above ₹999.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/icon.svg'
  },
  openGraph: {
    title: 'TEESGARAGE — Heavyweight T-Shirts & Premium Bottomwear',
    description:
      'Heavyweight combed cotton tees, drop shoulders, stripes, henleys, trackpants & sweatpants built for everyday wear. Free shipping above ₹999.',
    url: 'https://teesgarage.in',
    siteName: 'TEESGARAGE',
    locale: 'en_IN',
    type: 'website'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
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
        <OnboardingModal />
        <noscript>
          <Link href="/">TEESGARAGE</Link>
        </noscript>
      </body>
    </html>
  )
}
