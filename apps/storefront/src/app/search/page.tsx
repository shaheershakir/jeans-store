import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts } from '@/lib/products'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: 'Search Catalog — TEESGARAGE',
  description:
    'Search heavyweight combed cotton tees, stripes, henleys, trackpants, and sweatpants on TEESGARAGE.',
}

interface SearchPageProps {
  searchParams?: Promise<{
    q?: string
    category?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const products = await getProducts()
  const params = searchParams ? await searchParams : {}

  return (
    <Suspense
      fallback={
        <div className="search-page-container">
          <div className="search-page-header">
            <div className="search-page-bar-inner">
              <div className="search-form-control" style={{ opacity: 0.6 }}>
                <span className="search-main-input" style={{ display: 'flex', alignItems: 'center', color: '#888' }}>
                  Loading search...
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SearchClient initialProducts={products} initialQuery={params.q || ''} />
    </Suspense>
  )
}
