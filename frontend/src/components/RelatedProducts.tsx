'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/constants'
import { PRODUCTS } from '@/lib/constants'
import { useCartStore, useUIStore } from '@/lib/store'
import { useState } from 'react'
import { ShoppingBag, ArrowRight } from 'lucide-react'

interface RelatedProductsProps {
  currentProduct: Product
}

export default function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)

  // Find complementary products: if current is jeans, recommend tops/hoodies/shirts.
  // If current is tops, recommend jeans.
  const relatedList: Product[] = PRODUCTS.filter((p) => {
    if (p.id === currentProduct.id) return false
    if (currentProduct.category === 'jeans') {
      return p.category !== 'jeans' || p.fit !== currentProduct.fit
    }
    return p.category === 'jeans' || p.id !== currentProduct.id
  }).slice(0, 4)

  const [addedId, setAddedId] = useState<number | null>(null)

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const size = p.sizes?.[0] || '32'
    addItem(p.id, size)
    setAddedId(p.id)
    showToast(`Added ${p.name} (Size ${size}) to bag`)
    setTimeout(() => setAddedId(null), 1500)
    openOverlay('cart')
  }

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
            <div key={product.id} className="apple-related-card">
              <Link href={`/product/${product.id}`} className="apple-related-img-link">
                <div className="apple-related-img-wrap">
                  <Image
                    src={product.img}
                    alt={product.name}
                    width={400}
                    height={520}
                    className="apple-related-img"
                    loading="lazy"
                  />
                  {product.badge && (
                    <span className="apple-badge-tag">{product.badge}</span>
                  )}
                </div>
              </Link>

              <div className="apple-related-details">
                <span className="apple-related-category">
                  {product.fit ? `${product.fit} DENIM` : (product.category || 'ESSENTIAL').toUpperCase()}
                </span>
                <Link href={`/product/${product.id}`} className="apple-related-name-link">
                  <h3 className="apple-related-name">{product.name}</h3>
                </Link>
                <div className="apple-related-price-row">
                  <span className="apple-related-price">{product.price}</span>
                  <span className="apple-related-wash">{product.wash || 'Standard'}</span>
                </div>

                <button
                  type="button"
                  className={`apple-quick-add-btn ${addedId === product.id ? 'added' : ''}`}
                  onClick={(e) => handleQuickAdd(product, e)}
                  aria-label={`Quick add ${product.name} to bag`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                  <span>{addedId === product.id ? 'Added to Bag' : 'Quick Add'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
