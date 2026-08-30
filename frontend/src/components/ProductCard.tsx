'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/constants'
import { useCartStore, useUIStore } from '@/lib/store'

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const selectedSize = useUIStore((state) => state.selectedSize)
  const openOverlay = useUIStore((state) => state.openOverlay)
  const showToast = useUIStore((state) => state.showToast)

  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useUIStore.persist.rehydrate()
  }, [])

  function handleQuickAdd() {
    addItem(product.id, selectedSize)
    showToast(`Added ${product.name} (Size ${selectedSize}) to your bag`)
    openOverlay('cart')
  }

  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`} className="product-image">
        <Image src={product.img} alt={product.name} width={600} height={750} loading="lazy" />
        {product.badge ? <span className="badge">{product.badge}</span> : null}
      </Link>
      <button className="quick-add" type="button" onClick={handleQuickAdd}>
        + Quick add
      </button>
      <div className="product-meta">
        <div>
          <Link href={`/product/${product.id}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>
            {product.fit} fit · {product.wash}
          </p>
        </div>
        <strong>{product.price}</strong>
      </div>
    </article>
  )
}
