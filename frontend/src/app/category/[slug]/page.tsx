import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

const SLUGS = [
  'jeans',
  'denim',
  'tops',
  't-shirts',
  'shirts',
  'hoodies',
  'hats',
  'accessories',
  'all',
  'sale',
  'straight',
  'baggy',
  'wide',
  'relaxed',
  'bootcut',
]

export async function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  redirect(`/shop/${slug}`)
}
