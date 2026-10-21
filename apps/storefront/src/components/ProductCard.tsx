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

const cardClass =
  'group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 sm:p-2.5 pb-2.5 sm:pb-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-gray-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]'

const cardImageClass =
  'absolute inset-0 h-full w-full object-cover transition-opacity duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]'

const dotClass = (active: boolean) =>
  `rounded-full transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
    active ? 'h-1.5 w-1.5 scale-[1.15] bg-white' : 'h-[5px] w-[5px] bg-white/55'
  }`

const swatchClass =
  'h-4 w-4 sm:h-5 sm:w-5 cursor-pointer rounded-full border border-black/10 p-0 outline-none transition-transform duration-150 hover:scale-110'

interface ProductCardProps {
  product: Product
  selectedSize?: string
}

export default function ProductCard({ product, selectedSize }: ProductCardProps) {
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
  const secondaryImg = useMemo(() => {
    if (product.img2 && product.img2 !== product.img) return product.img2
    if (product.images && product.images.length > 1 && product.images[1] !== product.img) {
      return product.images[1]
    }
    return null
  }, [product])

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
        hex:
          idx === 0
            ? COLOR_HEX[name.toLowerCase()] || '#171717'
            : COLOR_HEX[name.toLowerCase()] || '#85878b'
      }))
    }
    const mainCol = product.color || 'Black'
    const altCol =
      mainCol.toLowerCase().includes('black') || mainCol.toLowerCase().includes('charcoal')
        ? 'Grey'
        : 'Black'
    return [
      { name: mainCol, hex: COLOR_HEX[mainCol.toLowerCase()] || '#171717' },
      { name: altCol, hex: COLOR_HEX[altCol.toLowerCase()] || '#85878b' }
    ]
  }, [product])

  const activeColor = swatches[activeColorIdx]?.name || product.color || 'Standard'
  const colorWashLabel =
    product.wash ||
    (swatches.length > 1
      ? `${swatches[0].name} / ${swatches[1].name}`
      : product.color || 'Pitch Black')

  const displaySize =
    selectedSize ||
    (availableSizes.includes('L') ? 'L' : availableSizes[0] || 'L')

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

    // Multiple sizes: prompt user to choose their size
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

  const badgeText = product.badge

  return (
    <article
      className={cardClass}
      onMouseEnter={() => secondaryImg && setActiveImageIdx(1)}
      onMouseLeave={() => setActiveImageIdx(0)}
    >
      {/* ── 1. Image Container with Badge, Heart & Indicator ── */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100">
        {/* Top-Left Circular Favorite Button */}
        <button
          type="button"
          className={`absolute left-2 top-2 sm:left-2.5 sm:top-2.5 z-10 flex h-7.5 w-7.5 sm:h-9 sm:w-9 cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 bg-white p-0 text-black shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-transform duration-200 hover:scale-105 active:scale-95 ${
            favAnimate ? 'animate-heart-pop' : ''
          }`}
          onClick={handleFavoriteClick}
          aria-label={
            mounted && isFavorite
              ? `Remove ${product.name} from favorites`
              : `Add ${product.name} to favorites`
          }
          title={mounted && isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-[transform,stroke,fill] duration-200 ${
              favAnimate ? 'animate-heart-pop-icon' : ''
            }`}
            fill={mounted && isFavorite ? '#ef4444' : 'none'}
            stroke={mounted && isFavorite ? '#ef4444' : '#111827'}
            strokeWidth={mounted && isFavorite ? 2 : 1.75}
          />
        </button>

        {/* Top-Right Black Pill Badge */}
        {badgeText && (
          <span
            className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-10 rounded-full bg-black px-2 py-0.5 sm:px-3 sm:py-1 font-brand text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
            aria-label={`Badge: ${badgeText}`}
          >
            {badgeText}
          </span>
        )}

        <Link
          href={getProductUrl(product)}
          className="absolute inset-0 block h-full w-full"
          aria-label={product.name}
          onClick={handleCardClick}
        >
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={product.img}
              alt={product.name}
              width={600}
              height={800}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 24vw"
              className={`${cardImageClass} ${activeImageIdx === 0 ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
            {secondaryImg && (
              <Image
                src={secondaryImg}
                alt={`${product.name} alternate view`}
                width={600}
                height={800}
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 24vw"
                className={`${cardImageClass} pointer-events-none ${
                  activeImageIdx === 1 ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            )}
          </div>
        </Link>

        {/* Bottom-Left Carousel Indicator — only when multiple images exist */}
        {secondaryImg && (
          <div
            className="pointer-events-none absolute bottom-2.5 left-3 z-10 flex items-center gap-[5px] [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.35))]"
            aria-hidden="true"
          >
            <span className={dotClass(activeImageIdx === 0)} />
            <span className={dotClass(activeImageIdx === 1)} />
          </div>
        )}
      </div>

      {/* ── 2. Product Information Section (No Fit Overline) ── */}
      <div className="flex flex-1 flex-col pt-2.5 sm:pt-3">
        {/* Product Title */}
        <Link
          href={getProductUrl(product)}
          className="text-inherit no-underline"
          onClick={handleCardClick}
        >
          <h3
            className="line-clamp-1 font-brand text-[13px] sm:text-[14px] lg:text-[15px] font-bold text-gray-900 transition-colors duration-150 hover:text-black"
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>

        {/* Subtitle: Color/Wash · Size */}
        <p className="mt-0.5 sm:mt-1 truncate font-ui text-[11px] sm:text-xs font-normal text-gray-500">
          {colorWashLabel} &middot; {displaySize}
        </p>

        {/* Price & Color Swatches Row */}
        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-1">
          <span className="font-brand text-sm sm:text-base lg:text-[17px] font-bold text-gray-900 tabular-nums">
            {product.price}
          </span>

          {/* Swatches on the Right */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" role="group" aria-label="Color choices">
            {swatches.map((swatch, idx) => (
              <button
                key={swatch.name}
                type="button"
                className={`${swatchClass} ${
                  activeColorIdx === idx ? 'ring-2 ring-black ring-offset-1' : ''
                }`}
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

        {/* ── 3. Full-Width "ADD TO BAG →" Action Button ── */}
        <button
          type="button"
          className={`group/btn relative mt-2.5 sm:mt-3.5 flex h-9 sm:h-10 lg:h-11 w-full cursor-pointer touch-manipulation items-center justify-center rounded-xl border-0 px-2 sm:px-3 lg:px-4 font-brand text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all duration-200 hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
            isAdded ? 'bg-emerald-700' : 'bg-black'
          }`}
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
            <div className="relative flex w-full items-center justify-center">
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />
                <span>ADDED</span>
              </div>
            </div>
          ) : (
            <div className="relative flex w-full items-center justify-center">
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2]" />
                <span>ADD TO BAG</span>
              </div>
              <ArrowRight className="absolute right-0 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 stroke-[2] transition-transform duration-200 group-hover/btn:translate-x-0.5" />
            </div>
          )}
        </button>
      </div>
    </article>
  )
}
