import type { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'Order Checkout — INFIT',
  description: 'Complete your INFIT denim order with direct WhatsApp concierge or email confirmation.'
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
