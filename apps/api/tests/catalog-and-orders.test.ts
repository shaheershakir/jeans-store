import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { razorpayService } from '../src/services/razorpay.js'

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

  test('POST /api/orders accepts order with line items containing sizes and store: teesgarage', async () => {
    const orderPayload = {
      orderNumber: `TEST-ORD-${Date.now()}`,
      store: 'teesgarage',
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
          name: 'Classic Breton Heavyweight Striped Tee',
          fit: 'Regular',
          size: 'M',
          price: '₹1,299',
          priceNum: 1299,
          quantity: 1
        },
        {
          id: 12,
          name: 'Oversized Streetwear Drsleeve Tee',
          size: 'L',
          price: '₹1,499',
          priceNum: 1499,
          quantity: 1
        }
      ],
      subtotal: 2798,
      shipping: 0,
      total: 2798,
      handoffType: 'cod'
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

  test('GET /api/orders/razorpay/config returns live key id', async () => {
    const res = await request(app).get('/api/orders/razorpay/config')
    assert.equal(res.status, 200)
    assert.equal(res.body.enabled, true)
    assert.ok(res.body.keyId.startsWith('rzp_test_'), 'Should return razorpay test key id')
  })

  test('POST /api/orders/razorpay/create-order generates razorpay order', async () => {
    const payload = {
      currency: 'INR',
      orderNumber: `RZP-TEST-${Date.now()}`,
      state: 'Kerala',
      items: [
        {
          id: 0,
          size: 'M',
          quantity: 1
        }
      ],
      customerName: 'Kabir Mehta',
      customerEmail: 'kabir@teesgarage.in'
    }

    const res = await request(app)
      .post('/api/orders/razorpay/create-order')
      .send(payload)

    assert.equal(res.status, 201, `Failed with ${JSON.stringify(res.body)}`)
    assert.ok(res.body.razorpayOrderId)
    assert.ok(res.body.amount > 0)
    assert.equal(res.body.currency, 'INR')
  })

  test('POST /api/orders/razorpay/verify validates signature and commits order', async () => {
    const crypto = await import('node:crypto')
    const keySecret = razorpayService.getKeySecret()
    const fakeOrderId = 'order_test_12345'
    const fakePaymentId = 'pay_test_98765'
    const expectedSig = crypto.default
      .createHmac('sha256', keySecret)
      .update(`${fakeOrderId}|${fakePaymentId}`)
      .digest('hex')

    const orderPayload = {
      orderNumber: `ORD-RZP-${Date.now()}`,
      store: 'teesgarage',
      customerName: 'Kabir Mehta',
      customerPhone: '9820144521',
      customerEmail: 'kabir@teesgarage.in',
      address: '14 Lotus Court, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      items: [
        {
          id: 1,
          name: 'Vintage Skate Micro-Stripe Tee',
          fit: 'Regular',
          size: 'M',
          price: '₹1,249',
          priceNum: 1249,
          quantity: 1
        }
      ],
      subtotal: 1249,
      shipping: 90,
      total: 1339,
      handoffType: 'razorpay'
    }

    const origFetchOrder = razorpayService.fetchOrder.bind(razorpayService)
    const origFetchPayment = razorpayService.fetchPayment.bind(razorpayService)
    razorpayService.fetchOrder = async () => ({
      id: fakeOrderId,
      entity: 'order',
      amount: 133900,
      amount_paid: 133900,
      amount_due: 0,
      currency: 'INR',
      receipt: orderPayload.orderNumber,
      status: 'paid',
      created_at: Date.now()
    })
    razorpayService.fetchPayment = async () => ({
      order_id: fakeOrderId,
      amount: 133900,
      status: 'captured'
    })

    try {
      const res = await request(app)
        .post('/api/orders/razorpay/verify')
        .send({
          razorpay_order_id: fakeOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: expectedSig,
          order: orderPayload
        })

      assert.equal(res.status, 201, `Failed with ${JSON.stringify(res.body)}`)
      assert.equal(res.body.success, true)
      assert.equal(res.body.order.status, 'Confirmed')
      assert.equal(res.body.order.paymentStatus, 'Paid')
      assert.equal(res.body.paymentId, fakePaymentId)
    } finally {
      razorpayService.fetchOrder = origFetchOrder
      razorpayService.fetchPayment = origFetchPayment
    }
  })
})

