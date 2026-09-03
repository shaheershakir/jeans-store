import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/products'
import ProductDetail from './ProductDetail'

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ id: String(product.id) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(Number(id))
  if (!product) {
    return { title: 'Not found — INFIT' }
  }
  return {
    title: `${product.name} — INFIT`,
    description: product.desc
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(Number(id))
  if (!product) {
    notFound()
  }
  return <ProductDetail product={product} />
}
