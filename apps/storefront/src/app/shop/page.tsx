import type { Metadata } from 'next'
import { getProducts } from '@/lib/products'
import ShopClient from './ShopClient'

export const metadata: Metadata = {
  title: 'Shop All Garments — TEESGARAGE',
  description:
    'Explore the TEESGARAGE collection: stripes, tees, Henleys, trackpants, and sweatpants.',
}

interface ShopPageProps {
  searchParams?: Promise<{
    category?: string | string[]
    fit?: string
    q?: string
  }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const products = await getProducts()
  const params = searchParams ? await searchParams : {}

  let initialCategories: string[] = []
  if (params.category) {
    if (Array.isArray(params.category)) {
      initialCategories = params.category
        .flatMap((c) => c.split(','))
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    } else {
      initialCategories = params.category
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
    }
  }

  return (
    <ShopClient
      initialProducts={products}
      category="all"
      initialCategories={initialCategories}
      title="All Garments"
      description="Explore the complete TEESGARAGE archive. Heavyweight tees, everyday tops, structured shirts, trackpants, and sweatpants."
      slug="all"
    />
  )
}
