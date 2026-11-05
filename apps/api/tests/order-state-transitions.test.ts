import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { orderStore } from '../src/store/orderStore.js'
import { productStore } from '../src/store/productStore.js'

describe('Order State Transitions & Auto-Confirmation', () => {
  const app = buildApp({ enableLogging: false })
  const adminKey = process.env.ADMIN_API_KEY || 'local_dev_admin_key'
  let testProductId: string
  let testVariantId: number
  let testSku: string

  before(async () => {
    const timestamp = Date.now()
    const product = await productStore.create({
      categoryId: 1,
      slug: `state-test-tee-${timestamp}`,
      name: `State Test Tee ${timestamp}`,
      description: 'Heavyweight cotton graphic tee',
      price: 1299,
      weightGrams: 350,
      status: 'active',
      isFreeSize: false,
      trackInventory: true,
      continueSelling: false,
      variants: [
        {
          size: 'L',
          color: 'Black',
          stock: 25,
          status: 'Active'
        }
      ]
    })
    testProductId = product.id
    testVariantId = product.variants[0].id!
    testSku = product.variants[0].sku!
  })

  test('Order creation automatically transitions from Placed to Confirmed after stock check', async () => {
    const timestamp = Date.now()
    const orderNumber = `TGE-STATE-${timestamp}`

    const order = await orderStore.create({
      orderNumber,
      store: 'teesgarage',
      customerName: 'Aarav Patel',
      customerPhone: '9876543210',
      customerEmail: `aarav-${timestamp}@teesgarage.in`,
      address: '42 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      items: [
        {
          id: testProductId,
          variantId: testVariantId,
          name: 'State Test Tee',
          size: 'L',
          priceNum: 1299,
          price: '₹1,299',
          sku: testSku,
          quantity: 2,
          lineTotal: 2598,
          discountAmount: 0,
          variantLabel: 'Black / L',
          isFreeSize: false
        }
      ],
      subtotal: 2598,
      discountTotal: 0,
      shipping: 100,
      total: 2698,
      handoffType: 'cod'
    })

    assert.ok(order.id)
    assert.equal(order.orderNumber, orderNumber)
    // Automatic transition to Confirmed
    assert.equal(order.status, 'Confirmed')

    // Events trace includes Placed then Confirmed
    const statusEvents = order.events.filter((e) => e.status === 'Placed' || e.status === 'Confirmed')
    assert.ok(statusEvents.length >= 2, 'Should record both Placed and Confirmed events')
    assert.equal(statusEvents[0].status, 'Placed')
    assert.equal(statusEvents[0].note, 'Customer order placed')
    assert.equal(statusEvents[1].status, 'Confirmed')
    assert.equal(statusEvents[1].note, 'Stock verified and confirmed automatically')
  })

  test('Admin transitions from Confirmed to Shipped requires carrier and tracking number', async () => {
    const timestamp = Date.now()
    const orderNumber = `TGE-SHIP-${timestamp}`

    const order = await orderStore.create({
      orderNumber,
      customerName: 'Rohan Joshi',
      customerPhone: '9876543211',
      customerEmail: `rohan-${timestamp}@teesgarage.in`,
      address: '10 Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400020',
      items: [
        {
          id: testProductId,
          variantId: testVariantId,
          name: 'State Test Tee',
          size: 'L',
          priceNum: 1299,
          price: '₹1,299',
          sku: testSku,
          quantity: 1,
          lineTotal: 1299,
          discountAmount: 0,
          variantLabel: 'Black / L',
          isFreeSize: false
        }
      ],
      subtotal: 1299,
      discountTotal: 0,
      shipping: 100,
      total: 1399,
      handoffType: 'cod'
    })

    // Attempt to ship without carrier/tracking should be rejected with 400
    const failRes = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('x-admin-key', adminKey)
      .send({ status: 'Shipped' })

    assert.equal(failRes.status, 400)
    assert.match(failRes.body.error, /carrier and tracking number/i)

    // Ship with carrier & tracking
    const shipRes = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('x-admin-key', adminKey)
      .send({
        status: 'Shipped',
        carrier: 'Delhivery',
        trackingNumber: `DEL-${timestamp}`
      })

    assert.equal(shipRes.status, 200)
    assert.equal(shipRes.body.order.status, 'Shipped')
    assert.equal(shipRes.body.order.carrier, 'Delhivery')
    assert.equal(shipRes.body.order.trackingNumber, `DEL-${timestamp}`)

    // Transition from Shipped to Delivered
    const deliverRes = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('x-admin-key', adminKey)
      .send({ status: 'Delivered' })

    assert.equal(deliverRes.status, 200)
    assert.equal(deliverRes.body.order.status, 'Delivered')
    assert.ok(deliverRes.body.order.deliveredAt)
  })

  test('Invalid order transitions are rejected with 409 conflict', async () => {
    const timestamp = Date.now()
    const orderNumber = `TGE-INV-${timestamp}`

    const order = await orderStore.create({
      orderNumber,
      customerName: 'Kavita Nair',
      customerPhone: '9876543212',
      customerEmail: `kavita-${timestamp}@teesgarage.in`,
      address: '15 Palayam',
      city: 'Kozhikode',
      state: 'Kerala',
      pincode: '673001',
      items: [
        {
          id: testProductId,
          variantId: testVariantId,
          name: 'State Test Tee',
          size: 'L',
          priceNum: 1299,
          price: '₹1,299',
          sku: testSku,
          quantity: 1,
          lineTotal: 1299,
          discountAmount: 0,
          variantLabel: 'Black / L',
          isFreeSize: false
        }
      ],
      subtotal: 1299,
      discountTotal: 0,
      shipping: 0,
      total: 1299,
      handoffType: 'cod'
    })

    // Currently Confirmed: cannot jump directly to Delivered
    const invalidRes = await request(app)
      .patch(`/api/orders/${order.id}`)
      .set('x-admin-key', adminKey)
      .send({ status: 'Delivered' })

    assert.equal(invalidRes.status, 409)
    assert.match(invalidRes.body.error, /cannot move from Confirmed to Delivered/i)
  })
})
