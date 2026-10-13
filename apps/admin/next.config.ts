import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@jeans-store/shared', '@jeans-store/validators'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig