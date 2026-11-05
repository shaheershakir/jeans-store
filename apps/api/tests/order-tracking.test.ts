import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { orderStore } from '../src/store/orderStore.js'
import { productStore } from '../src/store/productStore.js'

describe('Order Tracking Visibility & Endpoints', () => {
  const app = buildApp({ enableLogging: false })
  const adminKey = process.env.ADMIN_API_KEY || 'local_dev_admin_key'
  let testProductId: string
  let testVariantId: number
  let testSku: string
  let testOrderNumber: string
  const customerEmail = `track-test-${Date.now()}@teesgarage.in`
  const customerPhone = '9876543210'

  before(async () => {
    const timestamp = Date.now()
    const product = await productStore.create({
      categoryId: 1,
      slug: `track-tee-${timestamp}`,
      name: `Track Test Tee ${timestamp}`,
      description: 'Heavyweight graphic tee for tracking tests',
      price: 1499,
      weightGrams: 350,
      status: 'active',
      isFreeSize: false,
      trackInventory: true,
      continueSelling: false,
      variants: [
        {
          size: 'M',
          color: 'Navy',
          stock: 20,
          status: 'Active'
        }
      ]
    })
    testProductId = product.id
    testVariantId = product.variants[0].id!
    testSku = product.variants[0].sku!

    testOrderNumber = `TG-TRACK-${timestamp}`
    const order = await orderStore.create({
      orderNumber: testOrderNumber,
      store: 'teesgarage',
      customerName: 'Karan Sharma',
      customerPhone,
      customerEmail,
      address: '10 Indiranagar 100ft Rd',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      items: [
        {
          id: testProductId,
          variantId: testVariantId,
          name: 'Track Test Tee',
          size: 'M',
          priceNum: 1499,
          price: '₹1,499',
          sku: testSku,
          quantity: 1,
          lineTotal: 1499,
          discountAmount: 0,
          variantLabel: 'Navy / M',
          isFreeSize: false
        }
      ],
      subtotal: 1499,
      shipping: 0,
      total: 1499,
      paymentMethod: 'online',
      paymentId: `pay_test_${timestamp}`
    })

    // Advance order to shipped with carrier and trackingNumber via admin patch
    await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('x-admin-key', adminKey)
      .send({
        status: 'Shipped',
        carrier: 'Delhivery',
        trackingNumber: 'DEL123456789IN',
        notes: 'Dispatched via Delhivery Express'
      })
  })

  test('GET /api/orders/track/:orderNumber returns 404 for non-existent order', async () => {
    const res = await request(app).get('/api/orders/track/TG-NONEXISTENT-999')
    assert.equal(res.status, 404)
    assert.match(res.body.error, /Order not found/i)
  })

  test('GET /api/orders/track/:orderNumber returns 403 when unauthenticated without phone/email', async () => {
    const res = await request(app).get(`/api/orders/track/${testOrderNumber}`)
    assert.equal(res.status, 403)
    assert.match(res.body.error, /provide the phone number or email/i)
  })

  test('GET /api/orders/track/:orderNumber succeeds when phone query is provided', async () => {
    const res = await request(app)
      .get(`/api/orders/track/${testOrderNumber}?phone=${customerPhone}`)
    assert.equal(res.status, 200)
    assert.ok(res.body.order)
    assert.equal(res.body.order.orderNumber, testOrderNumber)
    assert.equal(res.body.order.status.toLowerCase(), 'shipped')
    assert.equal(res.body.order.carrier, 'Delhivery')
    assert.equal(res.body.order.trackingNumber, 'DEL123456789IN')
    assert.ok(Array.isArray(res.body.order.events))
    assert.ok(res.body.order.events.length >= 2)
  })

  test('GET /api/orders/track/:orderNumber succeeds when email query is provided', async () => {
    const res = await request(app)
      .get(`/api/orders/track/${testOrderNumber}?email=${encodeURIComponent(customerEmail)}`)
    assert.equal(res.status, 200)
    assert.ok(res.body.order)
    assert.equal(res.body.order.orderNumber, testOrderNumber)
    assert.equal(res.body.order.carrier, 'Delhivery')
    assert.equal(res.body.order.city, 'Bengaluru')
    assert.equal(res.body.order.items.length, 1)
  })

  test('GET /api/orders/track/:orderNumber succeeds with admin API key', async () => {
    const res = await request(app)
      .get(`/api/orders/track/${testOrderNumber}`)
      .set('x-admin-key', adminKey)
    assert.equal(res.status, 200)
    assert.equal(res.body.order.orderNumber, testOrderNumber)
  })

  test('GET /api/orders/confirmation/:orderNumber also returns events and carrier info', async () => {
    const res = await request(app)
      .get(`/api/orders/confirmation/${testOrderNumber}`)
      .set('x-admin-key', adminKey)
    assert.equal(res.status, 200)
    assert.equal(res.body.order.carrier, 'Delhivery')
    assert.equal(res.body.order.trackingNumber, 'DEL123456789IN')
    assert.ok(Array.isArray(res.body.order.events))
  })
})
