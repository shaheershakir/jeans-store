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
    desc: 'The complete TEESGARAGE archive. Heavyweight tees, drop shoulders, trackpants and sweatpants built to last.',
  },
  stripes: {
    category: 'stripes',
    title: 'Stripes Collection',
    desc: 'Classic Breton, micro-stripes, and yarn-dyed horizontal block striped heavyweight tees.',
  },
  fullsleeve: {
    category: 'fullsleeve',
    title: 'Fullsleeve Tees',
    desc: 'Thermal honeycomb waffle knits, 260 GSM combed cotton, and raglan full sleeve tees.',
  },
  drsleeve: {
    category: 'drsleeve',
    title: 'Drop Sleeve Tees',
    desc: 'Elbow-length drop shoulder cuts, boxy streetwear proportions, and raw edge hems.',
  },
  'printed-tees': {
    category: 'printed-tees',
    title: 'Printed Tees',
    desc: 'Distressed automotive garage typography, cyberpunk prints, and archival botanical tees.',
  },
  'ringer-tees': {
    category: 'ringer-tees',
    title: 'Ringer Tees',
    desc: '70s retro contrast ribbing, collegiate varsity accents, and vintage athletic styling.',
  },
  henley: {
    category: 'henley',
    title: 'Henley Tees',
    desc: 'Multi-button plackets, textured slub cotton, and mineral washed rugged thermal henleys.',
  },
  waffle: {
    category: 'waffle',
    title: 'Waffle Collection',
    desc: 'Thermal honeycomb waffle knits, textured micro-weave long sleeves, and breathable layering tees.',
  },
  trackpants: {
    category: 'trackpants',
    title: 'Trackpants',
    desc: 'Urban cargo trackpants, side-piping retro joggers, and baggy nylon streetwear shells.',
  },
  sweatpants: {
    category: 'sweatpants',
    title: 'Sweatpants',
    desc: '450 GSM ultra-heavy French terry, sun-faded fleece, and open-hem stacking sweatpants.',
  },
  sale: {
    category: 'sale',
    title: 'Archive Drops & Sale',
    desc: 'Special edition archive releases, limited edition runs, and seasonal markdowns.',
  },
}

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_CONFIG).map((category) => ({ category }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const config = SLUG_TO_CONFIG[category.toLowerCase()]
  if (!config) return { title: 'Not Found — TEESGARAGE' }
  return {
    title: `${config.title} — TEESGARAGE`,
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
