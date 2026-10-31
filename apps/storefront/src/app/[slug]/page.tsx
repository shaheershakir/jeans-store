import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getProductBySlug, getProducts, getProductSlug } from '@/lib/products'
import ProductDetail from '@/app/product/[id]/ProductDetail'

const RESERVED_SLUGS = new Set([
  'api',
  'auth',
  'bag',
  'checkout',
  'favorites',
  'login',
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

  const title = `${product.name} — TEESGARAGE`
  const description =
    product.desc ||
    `Shop ${product.name}. Premium heavyweight combed cotton streetwear with durable construction and tailored fit.`
  const imageUrl = product.img || product.images?.[0] || '/hero-man.jpg'

  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}`
    },
    openGraph: {
      title,
      description,
      url: `/${slug}`,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 1000,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl]
    }
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
