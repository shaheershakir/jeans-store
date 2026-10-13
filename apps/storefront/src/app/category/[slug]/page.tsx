import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

const SLUGS = [
  'all',
  'stripes',
  'fullsleeve',
  'drsleeve',
  'printed-tees',
  'ringer-tees',
  'henley',
  'trackpants',
  'sweatpants',
  'sale',
]

export async function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }))
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  redirect(`/shop/${slug}`)
}
