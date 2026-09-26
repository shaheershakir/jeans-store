import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import SizeGuideModal from '@/components/SizeGuideModal'
import Toast from '@/components/Toast'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export const metadata: Metadata = {
  title: 'FIT CHECK — Heavyweight Essentials & Contemporary Silhouettes',
  description:
    'Mobile-first contemporary clothing atelier specializing in 260 GSM heavyweight tees, relaxed Oxford shirts, and structured French terry hoodies.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
        <SizeGuideModal />
        <Toast />
      </body>
    </html>
  )
}
