'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useUIStore } from '@/lib/store'

const POLICIES = ['Terms & Condition', 'Privacy Policy', 'Refund Policy', 'Shipping Policy', 'Returns & Exchanges']

export default function Footer() {
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)

  useEffect(() => {
    void useUIStore.persist.rehydrate()
  }, [])

  return (
    <footer className="site-footer">
      <div className="footer-links-grid">
        <div className="footer-col">
          <h3 className="footer-heading">QUICK LINKS</h3>
          <ul className="footer-list">
            <li>
              <button type="button" className="footer-search-trigger" onClick={() => openOverlay('search')}>
                Search
              </button>
            </li>
            <li>
              <Link href="/">Shop</Link>
            </li>
            <li>
              <button
                type="button"
                className="footer-contact-trigger"
                onClick={() => showToast('Contact us at hello@infit.in')}
              >
                Contact us
              </button>
            </li>
            <li>
              <button
                type="button"
                className="footer-track-trigger"
                onClick={() => showToast('Order tracking is coming soon')}
              >
                Track your order
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">POLICIES</h3>
          <ul className="footer-list">
            {POLICIES.map((policy) => (
              <li key={policy}>
                <button type="button" className="footer-policy-link" onClick={() => showToast(`${policy} — coming soon`)}>
                  {policy}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col footer-social-col">
          <div className="social-links">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener"
              className="social-circle"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener"
              className="social-circle"
              aria-label="YouTube"
              title="YouTube"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener"
              className="social-circle"
              aria-label="Pinterest"
              title="Pinterest"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <span>© 2026 INFIT® CLOTHING. ALL RIGHTS RESERVED.</span>
        <span>DENIM CRAFTED FOR THE REAL WORLD</span>
      </div>
    </footer>
  )
}
