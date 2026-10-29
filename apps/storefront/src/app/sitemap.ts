import type { MetadataRoute } from 'next'
import { getProducts, getProductSlug } from '@/lib/products'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teesgarage.in'
  const currentDate = new Date()

  // 1. Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${siteUrl}/bag`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6
    },
    {
      url: `${siteUrl}/wishlist`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6
    },
    {
      url: `${siteUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7
    }
  ]

  // 2. Category routes
  const categories = [
    'all',
    'stripes',
    'fullsleeve',
    'drsleeve',
    'printed-tees',
    'ringer-tees',
    'henley',
    'waffle',
    'trackpants',
    'sweatpants',
    'sale'
  ]

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/shop/${cat}`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 0.85
  }))

  // 3. Product PDP routes
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const products = await getProducts()
    productRoutes = products.map((product) => ({
      url: `${siteUrl}/${getProductSlug(product)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8
    }))
  } catch {
    // Graceful fallback if catalog query fails
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
