'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { SIZES } from '@/lib/constants'
import { useCartStore, useUIStore } from '@/lib/store'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const globalSelectedSize = useUIStore((state) => state.selectedSize)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)

  const availableSizes = product.sizes && product.sizes.length > 0 ? product.sizes : SIZES
  const isNumeric = availableSizes.every((s) => /^\d+$/.test(s))

  const [cardSize, setCardSize] = useState<string>(() => {
    if (globalSelectedSize && availableSizes.includes(globalSelectedSize)) {
      return globalSelectedSize
    }
    return availableSizes[0] || '32'
  })
  const [isAdded, setIsAdded] = useState<boolean>(false)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  useEffect(() => {
    if (globalSelectedSize && availableSizes.includes(globalSelectedSize)) {
      setCardSize(globalSelectedSize)
    }
  }, [globalSelectedSize, availableSizes])

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    addItem(product.id, cardSize)
    setIsAdded(true)
    showToast(`Added ${product.name} (${isNumeric ? `Waist ${cardSize}"` : `Size ${cardSize}`}) to bag`)

    setTimeout(() => {
      setIsAdded(false)
    }, 1500)

    openOverlay('cart')
  }

  return (
    <article className="product-card">
      <div className="product-image-container">
        <Link href={`/product/${product.id}`} className="product-image-link" aria-label={product.name}>
          <div className="image-wrapper">
            <Image
              src={product.img}
              alt={product.name}
              width={600}
              height={780}
              className="primary-img"
              loading="lazy"
            />
            {product.img2 && (
              <Image
                src={product.img2}
                alt={`${product.name} alt view`}
                width={600}
                height={780}
                className="secondary-img"
                loading="lazy"
              />
            )}
          </div>
          {product.badge && <span className="product-badge">{product.badge}</span>}
        </Link>
      </div>

      <div className="product-info-wrap">
        <div className="product-header-row">
          <span className="product-fit-tag">{product.fit ? `${product.fit} fit` : (product.category || 'Apparel')}</span>
          <span className="product-price">{product.price}</span>
        </div>

        <Link href={`/product/${product.id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        <p className="product-wash-label">{product.wash || product.desc.slice(0, 50) + '...'}</p>

        {/* Inline Size Picker */}
        <div className="card-size-selector">
          <span className="size-guide-mini-label">{isNumeric ? 'Waist:' : 'Size:'}</span>
          <div className="card-size-pills">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`card-size-btn ${cardSize === size ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCardSize(size)
                }}
                aria-label={`Select size ${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Full Width Add to Bag Button */}
        <button
          type="button"
          className={`card-add-btn ${isAdded ? 'added' : ''}`}
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} size ${cardSize} to bag`}
        >
          {isAdded ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Added to Bag</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Add to Bag — {isNumeric ? `${cardSize}"` : cardSize}</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
