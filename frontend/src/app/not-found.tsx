import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-badge">404 // MISSING ARCHIVE</span>
        <h1 className="not-found-title">Silhouette not found</h1>
        <p className="not-found-desc">
          The requested pair or archive entry does not exist or has been retired from the collection.
        </p>
        <Link href="/" className="button primary">
          Explore All Silhouettes <i>↗</i>
        </Link>
      </div>
    </main>
  )
}
