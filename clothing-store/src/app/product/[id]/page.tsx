import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/products'
import ProductDetail from './ProductDetail'

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ id: String(product.id) }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(Number(id))
  if (!product) {
    return { title: 'Product Not Found — FIT CHECK' }
  }
  return {
    title: `${product.name} — FIT CHECK`,
    description: product.sellingPoint || product.desc,
    openGraph: {
      title: `${product.name} | FIT CHECK`,
      description: product.sellingPoint,
      images: [{ url: product.img }]
    }
  }
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(Number(id))

  if (!product) {
    notFound()
  }

  const allProducts = await getProducts()
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4)

  return <ProductDetail product={product} relatedProducts={relatedProducts} />
}
