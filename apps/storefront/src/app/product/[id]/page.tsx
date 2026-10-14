import { notFound, redirect } from 'next/navigation'
import { getProduct, getProductSlug } from '@/lib/products'

export default async function ProductRedirectPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(Number(id))
  if (!product) {
    notFound()
  }
  redirect(`/${getProductSlug(product)}`)
}
