'use client'

import { useEffect } from 'react'
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
  // Find complementary products: if current is bottomwear, recommend t-shirts.
  // If current is t-shirt, recommend bottomwear or complementary t-shirt styles.
  const isBottomwear =
    currentProduct.category === 'trackpants' || currentProduct.category === 'sweatpants'
  const relatedList: Product[] = PRODUCTS.filter((p) => {
    if (p.id === currentProduct.id) return false
    if (isBottomwear) {
      return p.category !== 'trackpants' && p.category !== 'sweatpants'
    }
    return (
      p.category === 'trackpants' ||
      p.category === 'sweatpants' ||
      p.category !== currentProduct.category
    )
  }).slice(0, 4)

  useEffect(() => {
    if (relatedList.length > 0) {
      trackEvent('product_list_viewed', {
        list_id: 'related_products',
        list_name: 'Complete the Fit',
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
  }, [currentProduct.id])

  return (
    <section
      className="border-t border-black/[0.08] bg-[#fafaf8] px-[4%] py-[72px]"
      aria-labelledby="related-heading"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-1 block font-ui text-[11px] font-bold tracking-[0.08em] text-[#6b7280]">
              CURATED PAIRINGS // COMPLETE THE SILHOUETTE
            </span>
            <h2
              id="related-heading"
              className="m-0 font-brand text-[clamp(24px,3vw,32px)] font-bold tracking-[-0.035em] text-ink"
            >
              Complete the Fit
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center font-brand text-[13.5px] font-semibold text-ink no-underline transition-opacity hover:opacity-70"
          >
            <span>Explore All Garments</span>
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-6 max-[1024px]:grid-cols-2 max-[600px]:gap-x-2.5 max-[600px]:gap-y-3.5">
          {relatedList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
