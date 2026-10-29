import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 px-4 text-white">
      <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-xl p-8 shadow-xl text-center">
        <div className="inline-block px-3 py-1 rounded-full border border-neutral-700 bg-neutral-900 text-xs font-mono font-medium tracking-wider text-neutral-400 uppercase mb-4">
          404 Not Found
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Admin Section Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
          The operations module or record view you requested does not exist or has been relocated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-100 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
