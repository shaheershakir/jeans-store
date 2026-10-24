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
      className={`fixed inset-0 z-[70] flex items-start justify-center bg-[rgba(12,14,18,0.65)] px-4 py-[60px] backdrop-blur-[6px] transition-opacity duration-[250ms] ease-[ease] max-[640px]:items-end max-[640px]:p-0 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeOverlay()
      }}
    >
      <div
        className="w-full max-w-[680px] overflow-hidden rounded-[10px] border border-line bg-paper shadow-drawer max-[640px]:flex max-[640px]:h-[90dvh] max-[640px]:max-w-full max-[640px]:flex-col max-[640px]:rounded-t-[16px] max-[640px]:rounded-b-none"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search catalog"
      >
        <div className="flex items-center gap-3 border-b border-b-line px-5 py-4 max-[640px]:px-4 max-[640px]:py-3.5">
          <div className="flex flex-1 items-center gap-2.5">
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
              className="flex-1 border-0 text-[13px] font-medium leading-[normal] tracking-[0.02em] outline-none max-[640px]:text-[16px]"
            />
            <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery('')}>
              ✕
            </button>
          </div>
          <button className="modal-close" type="button" aria-label="Close search" onClick={closeOverlay}>
            ✕
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-b-line bg-bone px-5 py-2.5">
          <span className="tag-label">POPULAR:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`cursor-pointer whitespace-nowrap rounded-[16px] border border-line bg-paper px-2.5 py-1 text-[10px] font-medium uppercase leading-[normal] hover:border-ink ${
                query.toLowerCase() === tag.toLowerCase() ? 'active' : ''
              }`}
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
        <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto px-5 py-[18px] max-[640px]:max-h-none max-[640px]:flex-1 max-[640px]:grid-cols-1 max-[640px]:gap-2.5 max-[640px]:px-4 max-[640px]:py-3.5">
          {results.length === 0 ? (
            <div className="search-empty">No styles match “{query}”. Try a fit, wash, or price.</div>
          ) : (
            results.map((p) => (
              <div className="flex items-center gap-3 rounded-[3px] border border-line p-2 max-[640px]:px-3 max-[640px]:py-2.5" key={p.id}>
                <Link href={getProductUrl(p)} onClick={closeOverlay}>
                  <Image src={p.img} alt={p.name} width={90} height={112} className="h-[68px] w-[54px] rounded-[2px] object-cover max-[640px]:h-[75px] max-[640px]:w-[60px]" />
                </Link>
                <div className="search-item-info">
                  <Link href={getProductUrl(p)} onClick={closeOverlay}>
                    <h4 className="mb-0.5 font-brand text-[12px] font-semibold leading-[normal] max-[640px]:text-[13px]">{p.name}</h4>
                  </Link>
                  <p className="font-ui text-[11px] font-medium leading-[normal] text-ink-muted [font-feature-settings:'tnum']">
                    {p.color || p.category || 'Standard'}
                  </p>
                  <strong>{p.price}</strong>
                </div>
                <button
                  className="ml-auto cursor-pointer rounded-[3px] border-0 bg-ink px-2.5 py-1.5 font-brand text-[10px] font-semibold leading-[normal] text-paper max-[640px]:min-h-[34px] max-[640px]:px-3.5 max-[640px]:py-1.5 max-[640px]:text-[11px]"
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
        <div className="flex justify-center border-t border-t-line bg-bone px-5 py-3">
          <Link
            href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'}
            onClick={closeOverlay}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink no-underline"
          >
            <span>Open Dedicated Search Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
