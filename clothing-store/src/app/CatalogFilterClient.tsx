'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ClothingProduct } from '@/lib/types'
import ProductCard from '@/components/ProductCard'

const CATEGORIES = [
  { id: 'all', label: 'All Silhouettes' },
  { id: 't-shirts', label: 'Heavyweight Tees' },
  { id: 'shirts', label: 'Shirts & Overshirts' },
  { id: 'hoodies', label: 'French Terry Hoodies' },
  { id: 'hats', label: 'Headwear' }
]

export default function CatalogFilterClient({
  initialProducts
}: {
  initialProducts: ClothingProduct[]
}) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const [activeCategory, setActiveCategory] = useState(initialCategory)

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return initialProducts
    return initialProducts.filter((p) => p.category === activeCategory)
  }, [initialProducts, activeCategory])

  return (
    <>
      <div className="catalog-filter-bar">
        <div className="filter-pills-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="catalog-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}
