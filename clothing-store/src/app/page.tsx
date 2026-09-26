import { Suspense } from 'react'
import { getProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import CatalogFilterClient from './CatalogFilterClient'

export default async function StorefrontPage() {
  const products = await getProducts()

  return (
    <div>
      {/* Hero Header */}
      <section className="catalog-hero">
        <div className="container catalog-hero-inner">
          <span className="catalog-hero-badge">Curated Collection 2026</span>
          <h1 className="catalog-hero-title">
            Engineered For The Contemporary Silhouette
          </h1>
          <p className="catalog-hero-subtitle">
            Substantial 260 GSM combed cottons, boxy cuts, dropped shoulders, and durable custom hardware. Built to wear every day.
          </p>
        </div>
      </section>

      {/* Catalog & Filter Grid */}
      <div className="container">
        <Suspense fallback={<div>Loading catalog...</div>}>
          <CatalogFilterClient initialProducts={products} />
        </Suspense>
      </div>
    </div>
  )
}
