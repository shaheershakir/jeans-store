import type { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'Order Checkout — TEESGARAGE',
  description: 'Complete your TEESGARAGE order with direct WhatsApp concierge or email confirmation.'
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
