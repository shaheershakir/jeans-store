'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore } from '@/lib/store'

interface StickyPdpBarProps {
  product: Product
  selectedSize: string
  onSizeChange: (size: string) => void
  onAddToCart: () => void
  isAdded: boolean
}

export default function StickyPdpBar({
  product,
  selectedSize,
  onSizeChange,
  onAddToCart,
  isAdded,
}: StickyPdpBarProps) {
  const [visible, setVisible] = useState(false)
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['28', '30', '32', '34', '36', '38']
  const isNumeric = sizes.every((s) => /^\d+$/.test(s))

  useEffect(() => {
    const handleScroll = () => {
      // Trigger when user scrolls down beyond ~480px (past buy box)
      const scrolledPast = window.scrollY > 480
      setVisible(scrolledPast)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <aside
      className={`apple-sticky-bar ${visible ? 'visible' : ''}`}
      aria-hidden={!visible}
      aria-label="Quick order bar"
    >
      <div className="apple-sticky-inner">
        {/* Left: Product Media & Meta */}
        <div className="apple-sticky-product">
          <div className="apple-sticky-thumb">
            <Image
              src={product.img}
              alt={product.name}
              width={48}
              height={60}
              className="apple-sticky-img"
            />
          </div>
          <div className="apple-sticky-info">
            <h4 className="apple-sticky-title">{product.name}</h4>
            <p className="apple-sticky-meta">
              <span className="apple-sticky-price">{product.price}</span>
              <span className="apple-sticky-dot">·</span>
              <span className="apple-sticky-wash">{product.wash || 'Original'}</span>
            </p>
          </div>
        </div>

        {/* Right: Size Switcher & Quick Add */}
        <div className="apple-sticky-actions">
          <div className="apple-sticky-size-pill-group">
            <span className="apple-sticky-size-label">
              {isNumeric ? 'Waist' : 'Size'}:
            </span>
            <div className="apple-sticky-sizes">
              {sizes.slice(0, 6).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`apple-sticky-size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => onSizeChange(size)}
                  aria-label={`Select size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={`apple-sticky-buy-btn ${isAdded ? 'added' : ''}`}
            onClick={onAddToCart}
            aria-label={`Add ${product.name} size ${selectedSize} to bag`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 mr-1.5 stroke-[2]" />
                <span>Add to Bag — {isNumeric ? `${selectedSize}"` : selectedSize}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
