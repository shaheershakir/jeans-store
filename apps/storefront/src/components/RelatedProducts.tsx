'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { PRODUCTS } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { trackEvent } from '@/lib/analytics'
import { getProductSlug } from '@/lib/products'

interface RelatedProductsProps {
  currentProduct: Product
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const isBottomwear =
    currentProduct.category === 'trackpants' || currentProduct.category === 'sweatpants'

  const relatedList: Product[] = useMemo(() => {
    // If viewing Thermal Waffle Knit Tee, match reference mockup:
    // 1: Heavy Combed Cotton Tee, 2: Good Days Ahead Tee, 3: Classic Stripe Tee, 4: Essential Sweatpants
    const isWaffle =
      currentProduct.name.toLowerCase().includes('thermal waffle') ||
      currentProduct.id === 3 ||
      currentProduct.id === 4

    if (isWaffle) {
      const p1 = PRODUCTS.find((p) => p.name === 'Heavy Combed Cotton Tee') || {
        id: 4,
        store: 'teesgarage',
        category: 'fullsleeve',
        name: 'Heavy Combed Cotton Tee',
        fit: 'Relaxed',
        price: '₹1,299',
        priceNum: 1299,
        img: '/mock-assets/pdp/like_high_1.png',
        img2: '/mock-assets/pdp/like_high_1.png',
        images: ['/mock-assets/pdp/like_high_1.png'],
        color: 'White',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true
      }
      const p2 = PRODUCTS.find((p) => p.name === 'Good Days Ahead Tee') || {
        id: 9,
        store: 'teesgarage',
        category: 'printed-tees',
        name: 'Good Days Ahead Tee',
        fit: 'Oversized',
        price: '₹1,249',
        priceNum: 1249,
        img: '/mock-assets/pdp/like_high_2.png',
        img2: '/mock-assets/pdp/like_high_2.png',
        images: ['/mock-assets/pdp/like_high_2.png'],
        color: 'Green',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true
      }
      const p3 = PRODUCTS.find((p) => p.name === 'Classic Stripe Tee') || {
        id: 0,
        store: 'teesgarage',
        category: 'stripes',
        name: 'Classic Stripe Tee',
        fit: 'Boxy',
        price: '₹1,199',
        priceNum: 1199,
        img: '/mock-assets/pdp/like_high_3.png',
        img2: '/mock-assets/pdp/like_high_3.png',
        images: ['/mock-assets/pdp/like_high_3.png'],
        color: 'White',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true
      }
      const p4 = PRODUCTS.find((p) => p.name === 'Essential Sweatpants') || {
        id: 22,
        store: 'teesgarage',
        category: 'sweatpants',
        name: 'Essential Sweatpants',
        fit: 'Regular',
        price: '₹1,699',
        priceNum: 1699,
        img: '/mock-assets/pdp/like_high_4.png',
        img2: '/mock-assets/pdp/like_high_4.png',
        images: ['/mock-assets/pdp/like_high_4.png'],
        color: 'Grey',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true
      }
      return [
        { ...p1, id: 9001 },
        { ...p2, id: 9002 },
        { ...p3, id: 9003 },
        { ...p4, id: 9004 }
      ] as Product[]
    }

    if (isBottomwear) {
      return PRODUCTS.filter((p) => p.id !== currentProduct.id && p.category !== 'trackpants' && p.category !== 'sweatpants').slice(0, 4)
    }
    return PRODUCTS.filter((p) => p.id !== currentProduct.id && (p.category === 'sweatpants' || p.category === 'trackpants' || p.category !== currentProduct.category)).slice(0, 4)
  }, [currentProduct.id, currentProduct.name, isBottomwear])

  useEffect(() => {
    if (relatedList.length > 0) {
      trackEvent('product_list_viewed', {
        list_id: 'related_products',
        list_name: 'You may also like',
        products: relatedList.map((p, idx) => ({
          product_id: p.id,
          product_name: p.name,
          product_slug: getProductSlug(p),
          category: p.category,
          price: p.priceNum,
          position: idx + 1
        }))
      })
    }
  }, [currentProduct.id, relatedList])

  return (
    <section
      className="border-t border-gray-100 bg-[#fafaf8] px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      aria-labelledby="related-heading"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h2
            id="related-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950"
          >
            You may also like
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-gray-950 no-underline hover:opacity-75 transition-opacity"
          >
            <span>View all</span>
            <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {relatedList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
