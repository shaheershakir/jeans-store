import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'

describe('Catalog & Orders Unified Brand Seams', () => {
  const app = buildApp({ enableLogging: false })

  test('GET /api/products returns all catalog items across categories', async () => {
    const res = await request(app).get('/api/products')

    assert.equal(res.status, 200)
    const data = res.body
    assert.ok(data.products.length >= 16, `Expected at least 16 products, got ${data.products.length}`)

    // Verify active categories exist
    const hasStripes = data.products.some((p: any) => p.category === 'stripes')
    const hasFullsleeve = data.products.some((p: any) => p.category === 'fullsleeve')
    const hasPrinted = data.products.some((p: any) => p.category === 'printed-tees')
    assert.ok(hasStripes, 'Should include stripes products')
    assert.ok(hasFullsleeve, 'Should include fullsleeve products')
    assert.ok(hasPrinted, 'Should include printed-tees products')
  })

  test('GET /api/products?category=stripes filters specifically by category', async () => {
    const res = await request(app).get('/api/products?category=stripes')

    assert.equal(res.status, 200)
    const data = res.body
    assert.ok(data.products.length > 0)
    assert.ok(data.products.every((p: any) => p.category === 'stripes'))
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

    const res = await request(app)
      .post('/api/orders')
      .send(orderPayload)

    assert.equal(res.status, 201, `Failed with ${JSON.stringify(res.body)}`)
    const data = res.body
    assert.equal(data.order.orderNumber, orderPayload.orderNumber)
    assert.equal(data.order.items.length, 2)
    assert.equal(data.order.items[1].size, 'L')
  })
})
