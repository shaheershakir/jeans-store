import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProducts } from '@/lib/products'
import ShopClient from '../ShopClient'

interface Props {
  params: Promise<{ category: string }>
}

const SLUG_TO_CONFIG: Record<
  string,
  { category: string; fit?: string; title: string; desc: string }
> = {
  all: {
    category: 'all',
    title: 'All Garments',
    desc: 'The complete INFIT archive. Heavyweight fabrics, honest washes, and cuts that last.',
  },
  jeans: {
    category: 'jeans',
    title: 'Denim Collection',
    desc: 'Rigid selvedge and premium washed denim crafted for lifetime wear.',
  },
  denim: {
    category: 'jeans',
    title: 'Denim Collection',
    desc: 'Rigid selvedge and premium washed denim crafted for lifetime wear.',
  },
  tops: {
    category: 'tops',
    title: 'Tops & T-Shirts',
    desc: 'Heavyweight combed cotton tees, vintage washes, and streetwear cuts.',
  },
  't-shirts': {
    category: 'tops',
    title: 'Tops & T-Shirts',
    desc: 'Heavyweight combed cotton tees, vintage washes, and streetwear cuts.',
  },
  shirts: {
    category: 'shirts',
    title: 'Shirts & Overshirts',
    desc: 'Tailored Oxfords, heavy cotton canvas shackets, and utility layers.',
  },
  hoodies: {
    category: 'hoodies',
    title: 'Hoodies & Sweatshirts',
    desc: '450 GSM organic French terry and custom double-needle fleece.',
  },
  accessories: {
    category: 'hats',
    title: 'Accessories & Headwear',
    desc: 'Curated 6-panel twill dad caps, water-resistant bucket hats, and daily essentials.',
  },
  hats: {
    category: 'hats',
    title: 'Accessories & Headwear',
    desc: 'Curated 6-panel twill dad caps, water-resistant bucket hats, and daily essentials.',
  },
  sale: {
    category: 'sale',
    title: 'Sale & Archive Drop',
    desc: 'Special edition archive pieces, limited runs, and seasonal markdowns.',
  },
  straight: {
    category: 'jeans',
    fit: 'Straight',
    title: 'Straight Leg Denim',
    desc: 'Structured mid-weight denim with a balanced straight leg from hip to ankle.',
  },
  baggy: {
    category: 'jeans',
    fit: 'Baggy',
    title: 'Baggy Fit Denim',
    desc: 'Generous volume through thigh and knee with authentic vintage fades.',
  },
  wide: {
    category: 'jeans',
    fit: 'Wide',
    title: 'Wide Leg Denim',
    desc: 'Dramatic drape cut from heavy Japanese-style ring-spun cotton denim.',
  },
  relaxed: {
    category: 'jeans',
    fit: 'Relaxed',
    title: 'Relaxed Fit Denim',
    desc: 'Easy-wearing comfortable seat with clean stacking over footwear.',
  },
  bootcut: {
    category: 'jeans',
    fit: 'Bootcut',
    title: 'Bootcut Denim',
    desc: 'Fitted through the hip with a subtle flare below the knee for an elongated profile.',
  },
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_CONFIG).map((category) => ({ category }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const config = SLUG_TO_CONFIG[category.toLowerCase()]
  if (!config) return { title: 'Not Found — INFIT' }
  return {
    title: `${config.title} — INFIT`,
    description: config.desc,
  }
}

export default async function ShopCategoryPage({ params }: Props) {
  const { category } = await params
  const config = SLUG_TO_CONFIG[category.toLowerCase()]
  if (!config) notFound()

  const products = await getProducts()

  return (
    <ShopClient
      initialProducts={products}
      category={config.category}
      initialFit={config.fit}
      title={config.title}
      description={config.desc}
      slug={category.toLowerCase()}
    />
  )
}
