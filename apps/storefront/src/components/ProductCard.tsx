'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore, useFavoriteStore } from '@/lib/store'
import { getAvailableProductSizes, getProductUrl, getProductSlug } from '@/lib/products'
import { trackEvent } from '@/lib/analytics'

const COLOR_HEX: Record<string, string> = {
  black: '#171717',
  white: '#f5f3ed',
  navy: '#1e3157',
  grey: '#85878b',
  gray: '#85878b',
  ash: '#85878b',
  blue: '#436fa8',
  green: '#3e7558',
  olive: '#747947',
  red: '#a63836',
  beige: '#d8c7a7',
  charcoal: '#414347',
  cream: '#eee9dd',
  ecru: '#eee9dd',
  'washed black': '#1e1e1e',
  'vintage acid black': '#242426'
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)
  const openSizePrompt = useUIStore((state) => state.openSizePrompt)
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite)
  const isFavorite = useFavoriteStore((state) => state.isFavorite(product.id))

  const [mounted, setMounted] = useState<boolean>(false)
  const [isAdded, setIsAdded] = useState<boolean>(false)
  const [favAnimate, setFavAnimate] = useState<boolean>(false)
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0)
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0)

  const availableSizes = useMemo(() => getAvailableProductSizes(product), [product])
  const secondaryImg = product.img2 || product.images?.[1] || null

  useEffect(() => {
    setMounted(true)
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
    void useFavoriteStore.persist.rehydrate()
  }, [])

  // Derive swatches matching the reference design
  const swatches = useMemo(() => {
    if (product.variants?.length) {
      const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)))
      if (uniqueColors.length > 1) {
        return uniqueColors.slice(0, 3).map((col) => ({
          name: col,
          hex: COLOR_HEX[col.toLowerCase()] || '#171717'
        }))
      }
    }
    if (product.color && product.color.includes('/')) {
      const parts = product.color.split('/').map((s) => s.trim())
      return parts.map((name, idx) => ({
        name,
        hex: idx === 0 ? (COLOR_HEX[name.toLowerCase()] || '#171717') : (COLOR_HEX[name.toLowerCase()] || '#85878b')
      }))
    }
    const mainCol = product.color || 'Washed Black'
    const altCol = mainCol.toLowerCase().includes('black') || mainCol.toLowerCase().includes('charcoal') ? 'Ash' : 'Black'
    return [
      { name: mainCol, hex: COLOR_HEX[mainCol.toLowerCase()] || '#171717' },
      { name: altCol, hex: COLOR_HEX[altCol.toLowerCase()] || '#85878b' }
    ]
  }, [product])

  const activeColor = swatches[activeColorIdx]?.name || product.color || 'Standard'
  const colorWashLabel =
    product.wash ||
    (swatches.length > 1 ? `${swatches[0].name} / ${swatches[1].name}` : product.color || 'Washed Black / Ash')

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (availableSizes.length === 0) return

    // If only 1 size exists, add directly
    if (availableSizes.length === 1) {
      const singleSize = availableSizes[0]
      addItem(product.id, singleSize, product, activeColor)
      setIsAdded(true)
      showToast(`Added ${product.name} (${singleSize}) to bag`)
      openOverlay('cart')

      trackEvent('product_added_to_cart', {
        product_id: product.id,
        product_name: product.name,
        product_slug: getProductSlug(product),
        category: product.category,
        price: product.priceNum,
        currency: 'INR',
        fit: product.fit,
        color: activeColor,
        size: singleSize,
        quantity: 1,
        source_location: 'product_card',
        in_stock: true
      })

      setTimeout(() => setIsAdded(false), 1500)
      return
    }

    // Multiple sizes: prompt user in the toast to choose their size!
    openSizePrompt({
      product,
      selectedColor: activeColor,
      availableSizes
    })


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

  const badgeText = product.badge || 'NEW'
  const fitText = product.fit ? `${product.fit.toUpperCase()} FIT` : 'RELAXED FIT'

  return (
    <article
      className="product-card apple-product-card"
      onMouseEnter={() => secondaryImg && setActiveImageIdx(1)}
      onMouseLeave={() => setActiveImageIdx(0)}
    >
      {/* ── 1. Image Container with Badge, Heart & Dots ── */}
      <div className="product-image-container">
        {/* Top-Left Circular Favorite Button */}
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
            stroke={mounted && isFavorite ? '#e11d48' : '#18181b'}
            strokeWidth={mounted && isFavorite ? 2 : 1.75}
          />
        </button>

        {/* Top-Right Bold Black Badge */}
        {badgeText && (
          <span className="product-badge-pill" aria-label={`Badge: ${badgeText}`}>
            {badgeText}
          </span>
        )}

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
              className={`primary-img ${activeImageIdx === 1 ? 'faded' : ''}`}
              loading="lazy"
            />
            {secondaryImg && (
              <Image
                src={secondaryImg}
                alt={`${product.name} alternate view`}
                width={600}
                height={800}
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 24vw"
                className={`secondary-img ${activeImageIdx === 1 ? 'visible' : ''}`}
                loading="lazy"
              />
            )}
          </div>
        </Link>

        {/* Bottom-Left 3-Dot Carousel Indicator */}
        <div className="card-pagination-dots" aria-hidden="true">
          <span className={`dot ${activeImageIdx === 0 ? 'active' : ''}`} />
          <span className={`dot ${activeImageIdx === 1 ? 'active' : ''}`} />
          <span className="dot" />
        </div>
      </div>

      {/* ── 2. Product Information Section ── */}
      <div className="product-info-wrap">
        {/* Overline / Fit Tag */}
        <div className="product-fit-overline">{fitText}</div>

        {/* Product Title */}
        <Link
          href={getProductUrl(product)}
          className="product-title-link"
          onClick={handleCardClick}
        >
          <h3 className="product-title" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {/* Price & Color Swatches Row */}
        <div className="product-price-swatches-row">
          <span className="product-price">{product.price}</span>

          {/* Interactive Swatches on the Right */}
          <div className="product-color-swatches" role="group" aria-label="Color choices">
            {swatches.map((swatch, idx) => (
              <button
                key={swatch.name}
                type="button"
                className={`product-color-swatch-dot ${activeColorIdx === idx ? 'active' : ''}`}
                style={{ backgroundColor: swatch.hex }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveColorIdx(idx)
                }}
                title={swatch.name}
                aria-label={`Select ${swatch.name}`}
              />
            ))}
          </div>
        </div>

        {/* Color / Wash Label */}
        <p className="product-wash-label">{colorWashLabel}</p>

        {/* ── 3. Full-Width "ADD TO BAG →" Action Button ── */}
        <button
          type="button"
          className={`card-add-btn ${isAdded ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={availableSizes.length === 0}
          aria-label={
            availableSizes.length === 0
              ? `${product.name} is out of stock`
              : `Add ${product.name} to bag`
          }
        >
          {availableSizes.length === 0 ? (
            <span>Out of stock</span>
          ) : isAdded ? (
            <div className="card-btn-content">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span className="card-btn-text">ADDED</span>
            </div>
          ) : (
            <div className="card-btn-content">
              <div className="card-btn-center">
                <ShoppingBag className="w-4 h-4 stroke-[2]" />
                <span className="card-btn-text">ADD TO BAG</span>
              </div>
              <ArrowRight className="card-btn-arrow w-4 h-4 stroke-[2]" />
            </div>
          )}
        </button>
      </div>
    </article>
  )
}
