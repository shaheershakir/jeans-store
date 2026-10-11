import type { Metadata } from 'next'
import { getProducts } from '@/lib/products'
import { getHomepageConfig } from '@/lib/homepage'
import HomepageClient from '@/components/HomepageClient'

export const metadata: Metadata = {
  title: 'TEESGARAGE — T-Shirts & Bottomwear',
  description:
    'Heavyweight tees, drop shoulders, stripes, henleys, trackpants & sweatpants built for everyday wear. Free shipping above ₹999.',
}

export default async function HomePage() {
  const [products, homepageConfig] = await Promise.all([
    getProducts(),
    getHomepageConfig()
  ])

  return <HomepageClient products={products} config={homepageConfig} />
}
