'use client'

import Link from 'next/link'
import { useUIStore } from '@/lib/store'

export default function Footer() {
  const openOverlay = useUIStore((state) => state.openOverlay)

  return (
    <footer className="site-footer">
      <div className="footer-links-grid">
        <div className="footer-col">
          <h3 className="footer-heading">DIRECT LINKS</h3>
          <ul className="footer-list">
            <li>
              <button type="button" className="footer-search-trigger" onClick={() => openOverlay('search')}>
                Search Catalog
              </button>
            </li>
            <li>
              <Link href="/">All Silhouettes</Link>
            </li>
            <li>
              <Link href="/checkout">Order Checkout</Link>
            </li>
            <li>
              <a href="mailto:concierge@infit.in">Direct Studio Support</a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">STORE POLICIES</h3>
          <ul className="footer-list">
            <li>
              <span>7-Day Doorstep Exchanges</span>
            </li>
            <li>
              <span>Free Shipping Above ₹1,499</span>
            </li>
            <li>
              <span>Cash on Delivery Available</span>
            </li>
            <li>
              <span>24h Dispatch from Mumbai</span>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">STUDIO &amp; CONTACT</h3>
          <ul className="footer-list">
            <li>
              <a href="mailto:concierge@infit.in">concierge@infit.in</a>
            </li>
            <li>
              <span>Monday to Saturday, 10:00 to 19:00 IST</span>
            </li>
            <li>
              <span>Mumbai, Maharashtra</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <span>© 2026 INFIT® CLOTHING. ALL RIGHTS RESERVED.</span>
        <span>DENIM CRAFTED FOR THE REAL WORLD</span>
      </div>
    </footer>
  )
}
