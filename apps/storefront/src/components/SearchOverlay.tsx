'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore, useUIStore } from '@/lib/store'
import { searchProducts } from '@/lib/utils'

const QUICK_TAGS = ['Baggy', 'Straight', 'Indigo', 'Raw Denim', 'Wide', 'Black']

export default function SearchOverlay() {
  const overlay = useUIStore((state) => state.overlay)
  const closeOverlay = useUIStore((state) => state.closeOverlay)
  const selectedSize = useUIStore((state) => state.selectedSize)
  const addItem = useCartStore((state) => state.addItem)
  const showToast = useUIStore((state) => state.showToast)
  const [query, setQuery] = useState('')

  useEffect(() => {
    void useUIStore.persist.rehydrate()
    void useCartStore.persist.rehydrate()
  }, [])

  const open = overlay === 'search'
  const results = searchProducts(query)

  return (
    <div
      className={`search-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div className="search-modal" role="dialog" aria-modal="true" aria-label="Search catalog">
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
                <Link href={`/product/${p.id}`} onClick={closeOverlay}>
                  <Image src={p.img} alt={p.name} width={90} height={112} className="search-item-img" />
                </Link>
                <div className="search-item-info">
                  <Link href={`/product/${p.id}`} onClick={closeOverlay}>
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
      </div>
    </div>
  )
}
