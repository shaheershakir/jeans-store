'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore, useFavoriteStore } from '@/lib/store'
import { getAvailableProductSizes, getProductUrl, getProductSlug } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const isFavorite = useFavoriteStore((state) => state.isFavorite(product.id))

  const [mounted, setMounted] = useState<boolean>(false)
  const [isAdded, setIsAdded] = useState<boolean>(false)
  const [favAnimate, setFavAnimate] = useState<boolean>(false)
  const [selectedSize, setSelectedSize] = useState('')
  const availableSizes = getAvailableProductSizes(product)
  const chosenSize = availableSizes.includes(selectedSize) ? selectedSize : ''
  const secondaryImg = product.img2 || product.images?.[1] || null

  useEffect(() => {
    setMounted(true)
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const size = availableSizes.length === 1 ? availableSizes[0] : chosenSize
    if (!size) return

    addItem(product.id, size, product)
    setIsAdded(true)
    showToast(`Added ${product.name} to bag`)
    openOverlay('cart')

    trackEvent('product_added_to_cart', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: product.priceNum,
      currency: 'INR',
      fit: product.fit,
      color: product.color,
      size,
      quantity: 1,
      source_location: 'product_card',
      in_stock: true
    })

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

    if (nextState) {
      trackEvent('product_favorited', {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        price: product.priceNum
      })
    } else {
      trackEvent('product_unfavorited', {
        product_id: product.id,
        product_name: product.name
      })
    }
  }

  function handleCardClick() {
    trackEvent('product_card_clicked', {
      product_id: product.id,
      product_name: product.name,
      product_slug: getProductSlug(product),
      category: product.category,
      price: product.priceNum,
      fit: product.fit,
      source_location: 'product_card',
      in_stock: availableSizes.length > 0
    })
  }

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

        <Link
          href={getProductUrl(product)}
          className="product-image-link"
          aria-label={product.name}
          onClick={handleCardClick}
        >
          <div className="image-wrapper">
            <Image
              src={product.img}
              alt={product.name}
              width={600}
              height={800}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 24vw"
              className={`primary-img ${secondaryImg ? 'has-secondary' : ''}`}
              loading="lazy"
            />
            {secondaryImg && (
              <Image
                src={secondaryImg}
                alt={`${product.name} alternate view`}
                width={600}
                height={800}
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 24vw"
                className="secondary-img"
                loading="lazy"
              />
            )}
          </div>
          {product.badge && <span className="product-badge top-right">{product.badge}</span>}
        </Link>
      </div>

      <div className="product-info-wrap">
        <div className="product-brand-name">{product.store && product.store.toLowerCase() === 'jean-store' ? 'JEAN-STORE' : 'TEESGARAGE'}</div>

        <Link
          href={getProductUrl(product)}
          className="product-title-link"
          onClick={handleCardClick}
        >
          <h3 className="product-title">{product.name}</h3>
        </Link>

        <div className="product-price-row">
          <span className="product-price">{product.price}</span>
          {product.fit && <span className="product-fit-tag">{product.fit} fit</span>}
        </div>

        <p className="product-wash-label">{product.wash || product.desc.slice(0, 50) + '...'}</p>

        {availableSizes.length > 1 && (
          <label className="product-size-select-label">
            <span className="sr-only">Choose a size for {product.name}</span>
            <select
              className="product-size-select"
              value={chosenSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              aria-label={`Choose an available size for ${product.name}`}
            >
              <option value="">Choose size</option>
              {availableSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className={`card-add-btn ${isAdded ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={availableSizes.length === 0 || (availableSizes.length > 1 && !chosenSize)}
          aria-label={
            availableSizes.length === 0
              ? `${product.name} is out of stock`
              : availableSizes.length > 1 && !chosenSize
                ? `Choose a size for ${product.name} before adding it to your bag`
                : `Add ${product.name} to bag`
          }
        >
          {availableSizes.length === 0 ? (
            <span>Out of stock</span>
          ) : isAdded ? (
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
