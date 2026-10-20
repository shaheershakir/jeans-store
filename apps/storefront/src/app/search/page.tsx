import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts } from '@/lib/products'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  title: 'Search Catalog — TEESGARAGE',
  description:
    'Search heavyweight combed cotton tees, stripes, henleys, trackpants, and sweatpants on TEESGARAGE.',
}

interface SearchPageProps {
  searchParams?: Promise<{
    q?: string
    category?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const products = await getProducts()
  const params = searchParams ? await searchParams : {}

  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100dvh-120px)] bg-paper pb-[clamp(48px,8vw,96px)]">
          <div className="sticky top-0 z-[35] border-b border-line bg-[rgba(255,255,255,0.96)] pt-[max(8px,env(safe-area-inset-top,0px))]">
            <div className="mx-auto flex max-w-[1240px] items-center gap-2.5 px-4 py-2.5">
              <div className="relative flex flex-1 items-center rounded-full border border-transparent bg-bone opacity-60">
                <span className="flex h-11 w-full items-center py-0 pl-[42px] pr-10 font-ui text-base text-[#888]">
                  Loading search...
                </span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SearchClient initialProducts={products} initialQuery={params.q || ''} />
    </Suspense>
  )
}
