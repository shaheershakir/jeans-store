import type { Metadata } from 'next'
import { getProducts } from '@/lib/products'
import ShopClient from './ShopClient'

export const metadata: Metadata = {
  title: 'Shop All Garments — INFIT',
  description:
    'Explore the complete INFIT archive. Heavyweight denim, everyday tops, structured shirts, hoodies, and accessories.',
}

export default async function ShopPage() {
  const products = await getProducts()
  return (
    <ShopClient
      initialProducts={products}
      category="all"
      title="All Garments"
      description="Explore the complete INFIT archive. Heavyweight denim, everyday tops, structured shirts, hoodies, and accessories."
      slug="all"
    />
  )
}
