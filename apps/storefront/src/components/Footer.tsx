'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useUIStore } from '@/lib/store'

export default function Footer() {
  const openOverlay = useUIStore((state) => state.openOverlay)

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-block">
          <Link href="/" aria-label="TEESGARAGE home">
            <Image src="/teesgarage_logo.svg" alt="TEESGARAGE" width={160} height={48} />
          </Link>
          <p>Heavyweight tees and everyday bottomwear.</p>
          <button type="button" className="footer-search-trigger" onClick={() => openOverlay('search')}>
            Search the store
          </button>
        </div>

        <nav className="footer-shop-nav" aria-label="Shop categories">
          <div className="footer-col">
            <h3 className="footer-heading">T-SHIRTS</h3>
            <ul className="footer-list">
              {[
                ['Stripes', 'stripes'],
                ['Fullsleeve', 'fullsleeve'],
                ['Drsleeve', 'drsleeve'],
                ['Printed tees', 'printed-tees'],
                ['Ringer tees', 'ringer-tees'],
                ['Henley', 'henley']
              ].map(([label, slug]) => (
                <li key={slug}><Link href={`/shop/${slug}`}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h3 className="footer-heading">BOTTOMS</h3>
            <ul className="footer-list">
              <li><Link href="/shop/trackpants">Trackpants</Link></li>
              <li><Link href="/shop/sweatpants">Sweatpants</Link></li>
              <li><Link href="/shop">All products</Link></li>
            </ul>
          </div>
        </nav>

        <div className="footer-col footer-support">
          <h3 className="footer-heading">CUSTOMER CARE</h3>
          <ul className="footer-list">
            <li><a href="mailto:concierge@teesgarage.in">concierge@teesgarage.in</a></li>
            <li><Link href="/orders">Order tracking</Link></li>
            <li><Link href="/checkout">Checkout</Link></li>
            <li><span>7-day doorstep exchanges</span></li>
            <li><span>Free shipping above ₹1,499</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <span>© {new Date().getFullYear()} TEESGARAGE</span>
        <span>Made for everyday wear</span>
      </div>
    </footer>
  )
}
