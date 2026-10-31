import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getProductSlug } from '@/lib/products'
import CheckoutClient from '@/app/checkout/CheckoutClient'

const RESERVED_SLUGS = new Set([
  'api',
  'auth',
  'checkout',
  'favorites',
  'login',
  'orders',
  'preferences',
  'product',
  'profile',
  'register',
  'shop',
  'bag'
])

interface ProductCheckoutProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ size?: string; color?: string; qty?: string }>
}

export async function generateMetadata({ params }: ProductCheckoutProps): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) {
    return { title: 'Not found — TEESGARAGE' }
  }
  const product = await getProductBySlug(slug)
  if (!product) {
    return { title: 'Checkout — TEESGARAGE' }
  }
  return {
    title: `Checkout: ${product.name} — TEESGARAGE`,
    description: `Complete your direct order for ${product.name} with verified 256-bit encrypted Razorpay checkout.`
  }
}

export default async function ProductDirectCheckoutPage({ params, searchParams }: ProductCheckoutProps) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const product = await getProductBySlug(slug)
  if (!product) {
    notFound()
  }

  const initialSize = resolvedSearchParams.size
  const initialColor = resolvedSearchParams.color
  const parsedQty = resolvedSearchParams.qty ? parseInt(resolvedSearchParams.qty, 10) : 1
  const initialQty = isNaN(parsedQty) || parsedQty < 1 ? 1 : parsedQty

  return (
    <CheckoutClient
      mode={{
        type: 'product',
        product,
        initialSize,
        initialColor,
        initialQty
      }}
      checkoutUrl={`/${getProductSlug(product)}/checkout`}
    />
  )
}
