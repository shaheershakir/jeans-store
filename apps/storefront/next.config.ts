import path from 'node:path'
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

function getAssetRemotePattern(): { protocol: 'http' | 'https'; hostname: string; port?: string } | null {
  const raw = process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.ASSET_BASE_URL
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {})
    }
  } catch {
    return null
  }
}

const extraPattern = getAssetRemotePattern()
const remotePatterns: Array<{ protocol: 'http' | 'https'; hostname: string; port?: string }> = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
  {
    protocol: 'https',
    hostname: 'storage.googleapis.com',
  },
]
if (extraPattern && !remotePatterns.some((p) => p.hostname === extraPattern.hostname)) {
  remotePatterns.push(extraPattern)
}

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@jeans-store/shared', '@jeans-store/validators'],
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ]
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs']
    }
    return config
  },
}

export default withSentryConfig(nextConfig, {
  org: 'self-t5i',
  project: 'teesgarage-storefront',
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
