import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SearchOverlay from '@/components/SearchOverlay'
import Toast from '@/components/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'INFIT — Denim for the real world',
  description:
    'Weighty denim, honest washes, and fits that get better with every wear. Free shipping above ₹1,499.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main className="site-shell">
          <Header />
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
