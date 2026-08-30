import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PRODUCTS } from '@/lib/constants'
import { getProductById } from '@/lib/utils'
import ProductDetail from './ProductDetail'

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: String(product.id) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = getProductById(Number(id))
  if (!product) {
    return { title: 'Not found' }
  }
  return { title: product.name, description: product.desc }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = getProductById(Number(id))
  if (!product) {
    notFound()
  }
  return <ProductDetail product={product} />
}
