import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getProductBySlug, getProducts, getProductSlug } from '@/lib/products'
import ProductDetail from '@/app/product/[id]/ProductDetail'

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'bag',
  'category',
  'checkout',
  'favorites',
  'login',
  'onboarding',
  'orders',
  'preferences',
  'product',
  'profile',
  'register',
  'shop',
  'wishlist'
])

export async function generateStaticParams() {
  const products = await getProducts()
  return products.slice(0, 24).map((product) => ({
    slug: getProductSlug(product)
  }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) {
    return { title: 'Not found — TEESGARAGE' }
  }
  const product = await getProductBySlug(slug)
  if (!product) {
    return { title: 'Not found — TEESGARAGE' }
  }
  return {
    title: `${product.name} — TEESGARAGE`,
    description: product.desc
  }
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) {
    notFound()
  }

  let product = await getProductBySlug(slug)
  if (!product && (slug === 'thermal-waffle-knit-tee' || slug === 'thermal-waffle-knit-fullsleeve-tee')) {
    product = await getProductBySlug('thermal-waffle-knit-fullsleeve')
  }
  if (!product) {
    notFound()
  }

  // Canonical redirect if accessed via numeric id
  const canonicalSlug = getProductSlug(product)
  if (slug !== canonicalSlug && slug === String(product.id)) {
    redirect(`/${canonicalSlug}`)
  }

  return <ProductDetail product={product} />
}
