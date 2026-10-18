'use client'

import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useCartStore, useUIStore } from '@/lib/store'
import { searchProducts } from '@/lib/utils'
import { getProductUrl } from '@/lib/products'

const QUICK_TAGS = ['Stripes', 'Printed tees', 'Henley', 'Oversized', 'Trackpants', 'Black']

export default function SearchOverlay() {
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const selectedSize = useUIStore((state) => state.selectedSize)
  const addItem = useCartStore((state) => state.addItem)
  const showToast = useUIStore((state) => state.showToast)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  const open = overlay === 'search'
  const results = searchProducts(query)

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeOverlay()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOverlay])

  return (
    <div
      className={`search-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div className="search-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label="Search catalog">
        <div className="search-header">
          <div className="search-input-wrap">
            <span className="search-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder="SEARCH BY FIT, STYLE, OR WASH..."
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              ✕
            </button>
          </div>
          <button className="modal-close" type="button" aria-label="Close search" onClick={closeOverlay}>
            ✕
          </button>
        </div>
        <div className="search-quick-tags">
          <span className="tag-label">POPULAR:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`search-tag${query.toLowerCase() === tag.toLowerCase() ? ' active' : ''}`}
              onClick={() => setQuery(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="search-results-meta">
          <span>CATALOG EXPLORER</span>
          <b>{results.length} STYLES FOUND</b>
        </div>
        <div className="search-results-grid">
          {results.length === 0 ? (
            <div className="search-empty">No styles match “{query}”. Try a fit, wash, or price.</div>
          ) : (
            results.map((p) => (
              <div className="search-item" key={p.id}>
                <Link href={getProductUrl(p)} onClick={closeOverlay}>
                  <Image src={p.img} alt={p.name} width={90} height={112} className="search-item-img" />
                </Link>
                <div className="search-item-info">
                  <Link href={getProductUrl(p)} onClick={closeOverlay}>
                    <h4>{p.name}</h4>
                  </Link>
                  <p>
                    {p.fit} fit · {p.wash}
                  </p>
                  <strong>{p.price}</strong>
                </div>
                <button
                  className="search-item-add"
                  type="button"
                  onClick={() => {
                    addItem(p.id, selectedSize)
                    showToast(`Added ${p.name} (Size ${selectedSize}) to your bag`)
                  }}
                >
                  + Add
                </button>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', background: 'var(--bone, #f8f8f6)', display: 'flex', justifyContent: 'center' }}>
          <Link
            href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'}
            onClick={closeOverlay}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--ink, #0c0e12)',
              textDecoration: 'none'
            }}
          >
            <span>Open Dedicated Search Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
