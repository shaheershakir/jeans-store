'use client'

import Link from 'next/link'
import { STORE_NAME } from '@/lib/constants'
import { useUIStore } from '@/lib/store'

export default function Footer() {
  const showToast = useUIStore((state) => state.showToast)
  const openSizeGuide = useUIStore((state) => state.openSizeGuide)

  function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    showToast('Thank you for joining our Studio Dispatch.')
    const form = e.currentTarget
    form.reset()
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <span className="footer-brand-title">{STORE_NAME}</span>
            <p className="footer-desc">
              Contemporary silhouettes, heavyweight knit engineering, and zero compromise fabrications. Milled and crafted ethically in India.
            </p>
          </div>

          {/* Catalog Col */}
          <div>
            <h4 className="footer-col-title">Collection</h4>
            <ul className="footer-links-list">
              <li><Link href="/" className="footer-link">All Essentials</Link></li>
              <li><Link href="/?category=t-shirts" className="footer-link">Heavyweight T-Shirts</Link></li>
              <li><Link href="/?category=shirts" className="footer-link">Shirts &amp; Overshirts</Link></li>
              <li><Link href="/?category=hoodies" className="footer-link">French Terry Hoodies</Link></li>
              <li><Link href="/?category=hats" className="footer-link">Headwear &amp; Caps</Link></li>
            </ul>
          </div>

          {/* Customer Care Col */}
          <div>
            <h4 className="footer-col-title">Fit &amp; Care</h4>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link"
                  onClick={openSizeGuide}
                  style={{ textAlign: 'left' }}
                >
                  Interactive Size Chart
                </button>
              </li>
              <li><span className="footer-link">7-Day Doorstep Exchanges</span></li>
              <li><span className="footer-link">Free Express Shipping &gt; ₹999</span></li>
              <li><span className="footer-link">Cotton Care Instructions</span></li>
              <li><span className="footer-link">Ethical Mill Sourcing</span></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div>
            <h4 className="footer-col-title">Studio Dispatch</h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
              Subscribe for early access to limited heavyweight fabric drops and private sample releases.
            </p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="newsletter-input"
                aria-label="Email for newsletter"
              />
              <button type="submit" className="newsletter-btn">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} {STORE_NAME} Atelier. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Shipping Policy</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
