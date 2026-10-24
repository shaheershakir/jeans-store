'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { PRODUCTS } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { trackEvent } from '@/lib/analytics'
import { getProductSlug } from '@/lib/products'

interface RelatedProductsProps {
  currentProduct: Product
  catalog?: Product[]
}

export default function RelatedProducts({ currentProduct, catalog: initialCatalog }: RelatedProductsProps) {
  const [catalog, setCatalog] = useState<Product[]>(initialCatalog || [])

  useEffect(() => {
    if (!initialCatalog || initialCatalog.length === 0) {
      fetch('/api/products')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.products) && data.products.length > 0) {
            setCatalog(data.products)
          } else {
            setCatalog(PRODUCTS)
          }
        })
        .catch(() => setCatalog(PRODUCTS))
    }
  }, [initialCatalog])

  const pool = catalog.length > 0 ? catalog : PRODUCTS

  const relatedList: Product[] = useMemo(() => {
    const isBottomwear =
      currentProduct.category === 'trackpants' || currentProduct.category === 'sweatpants'

    const isWaffle =
      currentProduct.name.toLowerCase().includes('thermal waffle') ||
      String(currentProduct.id) === '3' ||
      String(currentProduct.id) === '4'

    if (isWaffle) {
      const p1 = pool.find((p) => p.name === 'Heavy Combed Cotton Tee')
      const p2 = pool.find((p) => p.name === 'Good Days Ahead Tee')
      const p3 = pool.find((p) => p.name === 'Classic Stripe Tee')
      const p4 = pool.find((p) => p.name === 'Essential Sweatpants')
      const curated = [p1, p2, p3, p4].filter(Boolean) as Product[]
      if (curated.length === 4) {
        return curated
      }
    }

    if (isBottomwear) {
      const tops = pool.filter(
        (p) =>
          String(p.id) !== String(currentProduct.id) &&
          p.category !== 'trackpants' &&
          p.category !== 'sweatpants'
      )
      return tops.slice(0, 4)
    }

    const mixed = pool.filter((p) => String(p.id) !== String(currentProduct.id))
    const bottoms = mixed.filter((p) => p.category === 'sweatpants' || p.category === 'trackpants')
    const otherTops = mixed.filter((p) => p.category !== 'sweatpants' && p.category !== 'trackpants')
    const result = [...bottoms.slice(0, 2), ...otherTops.slice(0, 2)]
    return result.length > 0 ? result : mixed.slice(0, 4)
  }, [currentProduct.id, currentProduct.name, currentProduct.category, pool])

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
