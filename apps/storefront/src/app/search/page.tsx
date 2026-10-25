import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts } from '@/lib/products'
import { SearchSkeleton } from '@/components/skeletons/StorefrontSkeletons'
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
    <Suspense fallback={<SearchSkeleton />}>
      <SearchClient
        initialProducts={products}
        initialQuery={params.q || ''}
        initialCategory={params.category || 'all'}
      />
    </Suspense>
  )
}
