import type { Metadata } from 'next'
import CheckoutClient from '@/app/checkout/CheckoutClient'

export const metadata: Metadata = {
  title: 'Secure Bag Checkout — TEESGARAGE',
  description: 'Complete your TEESGARAGE multi-item bag order with verified 256-bit encrypted Razorpay checkout.'
}

export default function BagCheckoutPage() {
  return <CheckoutClient mode={{ type: 'bag' }} checkoutUrl="/bag/checkout" />
}
