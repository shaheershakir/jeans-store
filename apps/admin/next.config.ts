import path from 'node:path'
import type { NextConfig } from 'next'

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
  experimental: {
    optimizePackageImports: ['lucide-react'],
    cpus: 1,
  },
}

export default nextConfig