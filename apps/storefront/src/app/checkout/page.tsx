import type { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'Secure Checkout — TEESGARAGE',
  description: 'Complete your TEESGARAGE order with verified 256-bit encrypted Razorpay checkout.'
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
