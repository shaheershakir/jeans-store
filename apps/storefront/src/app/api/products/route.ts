import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Failed to get products in API route:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
