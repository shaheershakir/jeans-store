'use client'

import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { PRODUCTS } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'

interface RelatedProductsProps {
  currentProduct: Product
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  // Find complementary products: if current is bottomwear, recommend t-shirts.
  // If current is t-shirt, recommend bottomwear or complementary t-shirt styles.
  const isBottomwear = currentProduct.category === 'trackpants' || currentProduct.category === 'sweatpants'
  const relatedList: Product[] = PRODUCTS.filter((p) => {
    if (p.id === currentProduct.id) return false
    if (isBottomwear) {
      return p.category !== 'trackpants' && p.category !== 'sweatpants'
    }
    return p.category === 'trackpants' || p.category === 'sweatpants' || p.category !== currentProduct.category
  }).slice(0, 4)

  return (
    <section className="apple-related-section" aria-labelledby="related-heading">
      <div className="apple-related-container">
        <div className="apple-related-header">
          <div>
            <span className="apple-related-eyebrow">CURATED PAIRINGS // COMPLETE THE SILHOUETTE</span>
            <h2 id="related-heading" className="apple-related-title">
              Complete the Fit
            </h2>
          </div>
          <Link href="/shop" className="apple-related-view-all">
            <span>Explore All Garments</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        <div className="apple-related-grid">
          {relatedList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
