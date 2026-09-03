import type { Metadata } from 'next'
import { getProducts } from '@/lib/products'
import CollectionClient from './CollectionClient'

export const metadata: Metadata = {
  title: 'INFIT — Denim for the real world',
  description:
    'All denim. Weighty jeans in Straight, Baggy, Wide, Relaxed, and Bootcut fits. Free shipping above ₹1,499.'
}

export default async function HomePage() {
  const products = await getProducts()
  return <CollectionClient initialProducts={products} />
}
