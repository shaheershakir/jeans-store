'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore, useFavoriteStore } from '@/lib/store'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const isFavorite = useFavoriteStore((state) => state.isFavorite(product.id))

  const [mounted, setMounted] = useState<boolean>(false)
  const [isAdded, setIsAdded] = useState<boolean>(false)
  const [favAnimate, setFavAnimate] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Default size is first size or '32'
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : '32'
    addItem(product.id, defaultSize)
    setIsAdded(true)
    showToast(`Added ${product.name} to bag`)

    setTimeout(() => {
      setIsAdded(false)
    }, 1500)

    openOverlay('cart')
  }

  function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    toggleFavorite(product.id)
    setFavAnimate(true)
    setTimeout(() => setFavAnimate(false), 400)

    const nextState = !isFavorite
    showToast(nextState ? `Saved ${product.name} to favorites` : `Removed from favorites`)
  }

  const rating = (4.3 + ((product.id * 13) % 6) / 10).toFixed(1)
  const ratingCount = Math.round(150 + ((product.id * 317) % 850))
  const originalPriceNum = Math.round(product.priceNum * 1.38)
  const discountPct = Math.round(((originalPriceNum - product.priceNum) / originalPriceNum) * 100)

  return (
    <article className="product-card">
      <div className="product-image-container">
        {/* Top-Left Love/Favourite Icon Button */}
        <button
          type="button"
          className={`product-fav-btn ${mounted && isFavorite ? 'active' : ''} ${favAnimate ? 'pop' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={mounted && isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          title={mounted && isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`fav-heart-icon ${mounted && isFavorite ? 'filled' : ''}`}
            fill={mounted && isFavorite ? '#e11d48' : 'none'}
            stroke={mounted && isFavorite ? '#e11d48' : 'currentColor'}
          />
        </button>

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
          </div>
          {product.badge && <span className="product-badge top-right">{product.badge}</span>}
          <div className="product-rating-pill">
            <span className="rating-score">{rating} ★</span>
            <span className="rating-divider">|</span>
            <span className="rating-reviews">{ratingCount}</span>
          </div>
        </Link>
      </div>

      <div className="product-info-wrap">
        <div className="product-brand-name">{product.store && product.store.toLowerCase() === 'jean-store' ? 'JEAN-STORE' : 'TEESGARAGE'}</div>

        <Link href={`/product/${product.id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        <div className="product-price-row">
          <span className="product-price">{product.price}</span>
          <span className="product-orig-price">₹{originalPriceNum.toLocaleString('en-IN')}</span>
          <span className="product-discount">({discountPct}% OFF)</span>
        </div>

        <p className="product-wash-label">{product.wash || product.desc.slice(0, 50) + '...'}</p>

        {/* Full Width Clean Add to Bag Button (Sizes removed from card per request) */}
        <button
          type="button"
          className={`card-add-btn ${isAdded ? 'added' : ''}`}
          onClick={handleAddToCart}
          aria-label={`Add ${product.name} to bag`}
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
              <span>Add to Bag</span>
            </>
          )}
        </button>
      </div>
    </article>
  )
}
