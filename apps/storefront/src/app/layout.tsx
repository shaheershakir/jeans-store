import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SearchOverlay from '@/components/SearchOverlay'
import Toast from '@/components/Toast'
import { getNavigationItems } from '@/lib/navigation'
import { PostHogProvider } from '@/lib/analytics'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://teesgarage.in'),
  title: {
    default: 'TEESGARAGE — Heavyweight T-Shirts & Premium Bottomwear',
    template: '%s | TEESGARAGE'
  },
  description:
    'Heavyweight combed cotton tees, henleys, trackpants, and sweatpants made for everyday wear. Delivery is charged by location.',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/icon.svg'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'TEESGARAGE — Heavyweight T-Shirts & Premium Bottomwear',
    description:
      'Heavyweight combed cotton tees, henleys, trackpants, and sweatpants made for everyday wear. Delivery is charged by location.',
    url: 'https://teesgarage.in',
    siteName: 'TEESGARAGE',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/hero-man.jpg',
        width: 1200,
        height: 630,
        alt: 'TEESGARAGE — Heavyweight T-Shirts & Premium Bottomwear'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEESGARAGE — Heavyweight T-Shirts & Premium Bottomwear',
    description:
      'Heavyweight combed cotton tees, henleys, trackpants, and sweatpants made for everyday wear.',
    images: ['/hero-man.jpg']
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
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Playfair+Display:ital,wght@0,500..800;1,500..800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <PostHogProvider>
          <main className="site-shell pb-[calc(60px+env(safe-area-inset-bottom,0px))] md:pb-0">
            <Header initialNavItems={navItems} />
            {children}
            <Footer />
          </main>
          <CartDrawer />
          <SearchOverlay />
          <Toast />
          <noscript>
            <Link href="/">TEESGARAGE</Link>
          </noscript>
        </PostHogProvider>
      </body>
    </html>
  )
}
