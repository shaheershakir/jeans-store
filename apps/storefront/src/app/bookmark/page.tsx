import type { Metadata } from 'next'
import BookmarkClient from './BookmarkClient'

export const metadata: Metadata = {
  title: 'Bookmarks — TEESGARAGE',
  description: 'Your saved pieces and curated apparel collection.'
}

export default function BookmarkPage() {
  return <BookmarkClient />
}
