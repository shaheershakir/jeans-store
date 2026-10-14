import type { Metadata } from 'next'
import BagClient from './BagClient'

export const metadata: Metadata = {
  title: 'Shopping Bag — TEESGARAGE',
  description: 'Review your selected garments, calculate live delivery charges, and proceed to secure Razorpay checkout.'
}

export default function BagPage() {
  return <BagClient />
}
