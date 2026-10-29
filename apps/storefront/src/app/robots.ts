import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://teesgarage.in'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/checkout/*',
          '/api/*',
          '/admin',
          '/admin/*',
          '/auth/*',
          '/order-confirmation'
        ]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  }
}
