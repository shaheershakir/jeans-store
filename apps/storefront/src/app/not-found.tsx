import Link from 'next/link'
import { ArrowRight, ShoppingBag, Home } from 'lucide-react'

export default function NotFound() {
  const featuredCategories = [
    { name: 'Stripes', href: '/shop/stripes' },
    { name: 'Full Sleeve', href: '/shop/fullsleeve' },
    { name: 'Printed Tees', href: '/shop/printed-tees' },
    { name: 'Sweatpants', href: '/shop/sweatpants' },
    { name: 'Trackpants', href: '/shop/trackpants' },
  ]

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-[#FAF9F6] px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-white text-xs font-mono font-medium tracking-widest text-neutral-600 uppercase mb-6 shadow-xs">
          <span>Error 404</span>
          <span className="text-neutral-300">•</span>
          <span>Catalog Miss</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-3">
          Apparel Piece Not Found
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8 max-w-md mx-auto">
          The product silhouette or archive page you requested could not be located. It may have been archived, restocked under a new link, or moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold tracking-wide hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore All Pieces</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold tracking-wide hover:border-neutral-900 transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        <div className="pt-8 border-t border-neutral-200">
          <p className="text-xs font-mono tracking-wider uppercase text-neutral-500 mb-4">
            Popular Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {featuredCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors shadow-xs"
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-3 h-3 text-neutral-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
