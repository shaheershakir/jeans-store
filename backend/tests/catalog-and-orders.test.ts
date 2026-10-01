import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildApp } from '../src/app.js'

describe('Catalog & Orders Unified Brand Seams', () => {
  const app = buildApp({ logger: false })

  test('GET /api/products returns all catalog items across categories', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products'
    })

    assert.equal(res.statusCode, 200)
    const data = JSON.parse(res.body)
    assert.ok(data.products.length >= 16, `Expected at least 16 products, got ${data.products.length}`)

    // Verify both denim and apparel items exist
    const hasJeans = data.products.some((p: any) => p.category === 'jeans')
    const hasHoodies = data.products.some((p: any) => p.category === 'hoodies')
    const hasTees = data.products.some((p: any) => p.category === 't-shirts')
    assert.ok(hasJeans, 'Should include jeans products')
    assert.ok(hasHoodies, 'Should include hoodies products')
    assert.ok(hasTees, 'Should include t-shirts products')
  })

  test('GET /api/products?category=hoodies filters specifically by category', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products?category=hoodies'
    })

    assert.equal(res.statusCode, 200)
    const data = JSON.parse(res.body)
    assert.ok(data.products.length > 0)
    assert.ok(data.products.every((p: any) => p.category === 'hoodies'))
  })

  test('POST /api/orders accepts order with line items containing sizes and store: infit', async () => {
    const orderPayload = {
      orderNumber: `TEST-ORD-${Date.now()}`,
      store: 'infit',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      customerEmail: 'aarav@example.com',
      address: '42 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      items: [
        {
          id: 0,
          name: 'Classic Straight Indigo',
          fit: 'Straight',
          size: '32',
          price: '₹1,699',
          priceNum: 1699,
          quantity: 1
        },
        {
          id: 12,
          name: 'Heavy French Terry Pullover Hoodie',
          size: 'L',
          price: '₹2,499',
          priceNum: 2499,
          quantity: 1
        }
      ],
      subtotal: 4198,
      shipping: 0,
      total: 4198,
      handoffType: 'whatsapp'
    }

    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: orderPayload
    })

    assert.equal(res.statusCode, 201, `Failed with ${res.body}`)
    const data = JSON.parse(res.body)
    assert.equal(data.order.orderNumber, orderPayload.orderNumber)
    assert.equal(data.order.items.length, 2)
    assert.equal(data.order.items[1].size, 'L')
  })
})
