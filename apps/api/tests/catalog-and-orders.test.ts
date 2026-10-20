import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { razorpayService } from '../src/services/razorpay.js'
import { productStore } from '../src/store/productStore.js'
import type { Product, Variant } from '../src/schemas/product.js'

async function pickSellableProducts(count: number) {
  const products = await productStore.list()
  const picks: Array<{ product: Product; variant: Variant }> = []

  for (const product of products) {
    if (product.isFreeSize) continue
    const variant = product.variants?.find(
      (candidate) => candidate.status === 'Active' && candidate.stock - candidate.reserved >= 1
    )
    if (!variant) continue
    picks.push({ product, variant })
    if (picks.length === count) return picks
  }

  throw new Error(`Expected ${count} sellable products in the catalog, found ${picks.length}`)
}

async function quoteCart(app: ReturnType<typeof buildApp>, items: Array<{ id: number; variantId: number; size: string; quantity: number }>) {
  const res = await request(app).post('/api/orders/quote').send({
    state: 'Maharashtra',
    pincode: '400050',
    items
  })
  assert.equal(res.status, 200, `Quote failed with ${JSON.stringify(res.body)}`)
  return res.body as { subtotal: number; shipping: number; total: number; weightGrams: number }
}

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
    const picks = await pickSellableProducts(2)
    const items = picks.map(({ product, variant }) => ({
      id: product.id,
      variantId: variant.id,
      name: product.name,
      size: String(variant.size),
      quantity: 1
    }))
    const quote = await quoteCart(app, items)

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
      items,
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      total: quote.total,
      handoffType: 'cod'
    }

    const res = await request(app)
      .post('/api/orders')
      .send(orderPayload)

    assert.equal(res.status, 201, `Failed with ${JSON.stringify(res.body)}`)
    const data = res.body
    assert.equal(data.order.orderNumber, orderPayload.orderNumber)
    assert.equal(data.order.items.length, 2)
    assert.equal(data.order.items[1].size, items[1].size)
  })

  test('GET /api/orders/razorpay/config returns live key id', async () => {
    const res = await request(app).get('/api/orders/razorpay/config')
    assert.equal(res.status, 200)
    assert.equal(res.body.enabled, true)
    assert.ok(res.body.keyId.startsWith('rzp_test_'), 'Should return razorpay test key id')
  })

  test('POST /api/orders/razorpay/create-order generates razorpay order', async () => {
    const [{ product, variant }] = await pickSellableProducts(1)
    const payload = {
      currency: 'INR',
      orderNumber: `RZP-TEST-${Date.now()}`,
      state: 'Kerala',
      pincode: '682001',
      items: [
        {
          id: product.id,
          variantId: variant.id,
          size: String(variant.size),
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
    const suffix = Date.now()
    const fakeOrderId = `order_test_${suffix}`
    const fakePaymentId = `pay_test_${suffix}`
    const expectedSig = crypto.default
      .createHmac('sha256', keySecret)
      .update(`${fakeOrderId}|${fakePaymentId}`)
      .digest('hex')

    const [{ product, variant }] = await pickSellableProducts(1)
    const items = [
      {
        id: product.id,
        variantId: variant.id,
        name: product.name,
        size: String(variant.size),
        quantity: 1
      }
    ]
    const quote = await quoteCart(app, items)

    const orderPayload = {
      orderNumber: `ORD-RZP-${suffix}`,
      store: 'teesgarage',
      customerName: 'Kabir Mehta',
      customerPhone: '9820144521',
      customerEmail: 'kabir@teesgarage.in',
      address: '14 Lotus Court, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      items,
      subtotal: quote.subtotal,
      shipping: quote.shipping,
      total: quote.total,
      handoffType: 'razorpay'
    }

    const origFetchOrder = razorpayService.fetchOrder.bind(razorpayService)
    const origFetchPayment = razorpayService.fetchPayment.bind(razorpayService)
    razorpayService.fetchOrder = async () => ({
      id: fakeOrderId,
      entity: 'order',
      amount: Math.round(quote.total * 100),
      amount_paid: Math.round(quote.total * 100),
      amount_due: 0,
      currency: 'INR',
      receipt: orderPayload.orderNumber,
      status: 'paid',
      created_at: Date.now()
    })
    razorpayService.fetchPayment = async () => ({
      order_id: fakeOrderId,
      amount: Math.round(quote.total * 100),
      status: 'captured'
    })

    try {
      const payload = {
        razorpay_order_id: fakeOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: expectedSig,
        order: orderPayload
      }

      const res = await request(app)
        .post('/api/orders/razorpay/verify')
        .send(payload)

      assert.ok([200, 201].includes(res.status), `Failed with ${JSON.stringify(res.body)}`)
      assert.equal(res.body.success, true)
      assert.equal(res.body.order.status, 'Confirmed')
      assert.equal(res.body.order.paymentStatus, 'Paid')
      assert.equal(res.body.paymentId, fakePaymentId)

      const committedOrderNumber = res.body.order.orderNumber

      // A retried verification (network drop, page reload, duplicate handler
      // call) must return the committed order instead of creating a duplicate
      // or failing on the stock this order already consumed.
      const retry = await request(app)
        .post('/api/orders/razorpay/verify')
        .send(payload)

      assert.equal(retry.status, 200, `Retry failed with ${JSON.stringify(retry.body)}`)
      assert.equal(retry.body.success, true)
      assert.equal(retry.body.idempotent, true)
      assert.equal(retry.body.paymentId, fakePaymentId)
      assert.equal(retry.body.order.orderNumber, committedOrderNumber)
    } finally {
      razorpayService.fetchOrder = origFetchOrder
      razorpayService.fetchPayment = origFetchPayment
    }
  })
})

