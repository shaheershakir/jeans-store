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
  'group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-[#fbfbfa] p-2 pb-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-black/[0.08] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]'

const cardImageClass =
  'absolute inset-0 h-full w-full object-cover transition-opacity duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]'

const dotClass = (active: boolean) =>
  `rounded-full transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
    active ? 'h-1.5 w-1.5 scale-[1.15] bg-white' : 'h-[5px] w-[5px] bg-white/55'
  }`

const swatchClass =
  'h-3.5 w-3.5 cursor-pointer rounded-full border-0 p-0 outline-none transition-[transform,box-shadow] duration-150 hover:scale-[1.15]'

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
    const mainCol = product.color || 'Washed Black'
    const altCol =
      mainCol.toLowerCase().includes('black') || mainCol.toLowerCase().includes('charcoal')
        ? 'Ash'
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
      : product.color || 'Washed Black / Ash')

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
      className={cardClass}
      onMouseEnter={() => secondaryImg && setActiveImageIdx(1)}
      onMouseLeave={() => setActiveImageIdx(0)}
    >
      {/* ── 1. Image Container with Badge, Heart & Dots ── */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#eeede7]">
        {/* Top-Left Circular Favorite Button */}
        <button
          type="button"
          className={`absolute left-2.5 top-2.5 z-10 flex h-9 w-9 cursor-pointer touch-manipulation items-center justify-center rounded-full border-0 bg-white p-0 text-[#18181b] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-[transform,background] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.08] hover:bg-white active:scale-[0.92] ${
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
            className={`h-[17px] w-[17px] transition-[transform,stroke,fill] duration-200 ${
              favAnimate ? 'animate-heart-pop-icon' : ''
            }`}
            fill={mounted && isFavorite ? '#e11d48' : 'none'}
            stroke={mounted && isFavorite ? '#e11d48' : '#18181b'}
            strokeWidth={mounted && isFavorite ? 2 : 1.75}
          />
        </button>

        {/* Top-Right Bold Black Badge */}
        {badgeText && (
          <span
            className="absolute right-2.5 top-2.5 z-10 rounded-md bg-[#09090b] px-[9px] py-1 font-brand text-[10.5px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
            aria-label={`Badge: ${badgeText}`}
          >
            {badgeText}
          </span>
        )}

        <Link
          href={getProductUrl(product)}
          className="relative block w-full"
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

      {/* ── 2. Product Information Section ── */}
      <div className="flex flex-1 flex-col px-1.5 pb-0.5 pt-3.5 max-[640px]:px-1 max-[640px]:pb-0.5 max-[640px]:pt-2.5">
        {/* Overline / Fit Tag */}
        <div className="mb-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8e8e93]">
          {fitText}
        </div>

        {/* Product Title */}
        <Link
          href={getProductUrl(product)}
          className="text-inherit no-underline"
          onClick={handleCardClick}
        >
          <h3
            className="mb-2 line-clamp-2 min-h-[2.5em] overflow-hidden text-ellipsis whitespace-nowrap font-brand text-[17px] font-bold leading-[1.28] tracking-[-0.015em] text-[#111827] transition-colors duration-150 hover:text-black max-[640px]:mb-1 max-[640px]:text-[14.5px]"
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>

        {/* Price & Color Swatches Row */}
        <div className="mb-0.5 flex items-center justify-between">
          <span className="font-brand text-[21px] font-bold leading-none tracking-[-0.02em] text-[#111827] tabular-nums max-[640px]:text-[17px]">
            {product.price}
          </span>

          {/* Interactive Swatches on the Right */}
          <div className="flex items-center gap-[7px]" role="group" aria-label="Color choices">
            {swatches.map((swatch, idx) => (
              <button
                key={swatch.name}
                type="button"
                className={`${swatchClass} ${
                  activeColorIdx === idx ? 'shadow-[0_0_0_1.5px_#fff,0_0_0_3px_#111]' : ''
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

        {/* Color / Wash Label */}
        <p className="mb-3.5 truncate font-ui text-[12.5px] font-medium text-[#71717a] max-[640px]:mb-2.5 max-[640px]:text-[11.5px]">
          {colorWashLabel}
        </p>

        {/* ── 3. Full-Width "ADD TO BAG →" Action Button ── */}
        <button
          type="button"
          className={`group/btn relative mt-auto flex h-11 w-full cursor-pointer touch-manipulation items-center justify-center rounded-[10px] border-0 px-4 font-brand text-[12.5px] font-semibold uppercase tracking-[0.02em] text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] enabled:hover:-translate-y-px enabled:hover:bg-[#27272a] enabled:hover:shadow-[0_4px_14px_rgba(0,0,0,0.16)] enabled:active:scale-[0.97] enabled:active:translate-y-0 enabled:active:bg-black disabled:cursor-not-allowed disabled:bg-[#e4e4e7] disabled:text-[#a1a1aa] disabled:shadow-none max-[640px]:h-10 max-[640px]:px-3 ${
            isAdded ? 'bg-[#166534]' : 'bg-[#111]'
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
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span className="font-brand text-[12.5px] font-bold uppercase tracking-[0.08em] text-white max-[640px]:text-[11px] max-[640px]:tracking-[0.05em]">
                ADDED
              </span>
            </div>
          ) : (
            <div className="relative flex w-full items-center justify-center">
              <div className="inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 stroke-[2]" />
                <span className="font-brand text-[12.5px] font-bold uppercase tracking-[0.08em] text-white max-[640px]:text-[11px] max-[640px]:tracking-[0.05em]">
                  ADD TO BAG
                </span>
              </div>
              <ArrowRight className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[2] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-[3px]" />
            </div>
          )}
        </button>
      </div>
    </article>
  )
}
