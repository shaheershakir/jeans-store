import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProducts } from '@/lib/products'
import { CATEGORY_FILTERS } from '@/lib/constants'
import CategoryClient from './CategoryClient'

interface Props {
  params: Promise<{ slug: string }>
}

const SLUG_TO_CATEGORY: Record<string, string> = {
  jeans: 'jeans',
  denim: 'jeans',
  tops: 'tops',
  't-shirts': 'tops',
  shirts: 'shirts',
  hoodies: 'hoodies',
  hats: 'hats',
  accessories: 'hats',
  all: 'all',
}

const CATEGORY_TITLES: Record<string, string> = {
  jeans: 'Denim',
  tops: 'Tops & T-Shirts',
  shirts: 'Shirts',
  hoodies: 'Hoodies & Sweatshirts',
  hats: 'Accessories',
  all: 'All Garments',
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_CATEGORY).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = SLUG_TO_CATEGORY[slug]
  if (!cat) return { title: 'Not Found — INFIT' }
  const title = CATEGORY_TITLES[cat] ?? 'Shop'
  return {
    title: `${title} — INFIT`,
    description: `Shop INFIT ${title.toLowerCase()}. Heavyweight fabrics, honest washes, and cuts that last.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const cat = SLUG_TO_CATEGORY[slug]
  if (!cat) notFound()

  const products = await getProducts()
  const title = CATEGORY_TITLES[cat] ?? 'Shop'

  return <CategoryClient products={products} category={cat} title={title} />
}
