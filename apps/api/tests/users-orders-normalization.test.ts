import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { userStore } from '../src/store/userStore.js'
import { orderStore } from '../src/store/orderStore.js'
import { createCloudIamToken } from '../src/services/cloudIam.js'
import type { CalculatedOrder } from '../src/schemas/order.js'

describe('Phase 3: Users and Orders Normalization & Schema V2', () => {
  const app = buildApp({ enableLogging: false })

  describe('User Store & Auth Endpoints', () => {
    test('userStore supports googleSub and onboardingCompletedAt', async () => {
      const email = `test-user-${Date.now()}@example.com`
      const googleSub = `googlesub-${Date.now()}`

      const created = await userStore.create({
        name: 'Alex Rivera',
        email,
        googleSub,
        provider: 'google'
      })

      assert.equal(created.email, email.toLowerCase())
      assert.equal(created.googleSub, googleSub)
      assert.equal(created.onboardingCompletedAt, null)

      // Query by google sub
      const foundByGoogle = await userStore.findByGoogleSub(googleSub)
      assert.ok(foundByGoogle)
      assert.equal(foundByGoogle.id, created.id)

      // Complete onboarding
      const completed = await userStore.completeOnboarding(created.id)
      assert.ok(completed)
      assert.ok(completed.onboardingCompletedAt instanceof Date)
    })

    test('POST /api/auth/onboarding/complete requires auth and marks onboarding complete', async () => {
      // 1. Without auth -> 401
      const unauthRes = await request(app).post('/api/auth/onboarding/complete')
      assert.equal(unauthRes.status, 401)

      // 2. Register user & authenticate
      const email = `onboarding-${Date.now()}@example.com`
      const user = await userStore.create({
        name: 'Jordan Lee',
        email,
        provider: 'cloud-iam'
      })

      const { token } = createCloudIamToken({
        uid: user.uid,
        email: user.email,
        name: user.name
      })

      // 3. Mark complete
      const res = await request(app)
        .post('/api/auth/onboarding/complete')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.onboardingCompleted, true)
      assert.equal(res.body.user.onboardingCompleted, true)

      // 4. Verify /api/auth/me also reflects onboardingCompleted: true
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(meRes.status, 200)
      assert.equal(meRes.body.user.onboardingCompleted, true)
    })
  })

  describe('Order Store Normalization & Dual-Write', () => {
    test('orderStore.create stores order, dual-writes items and events, and reconstructs legacy shapes', async () => {
      const orderNumber = `TEST-ORD-V2-${Date.now()}`
      const testInput: CalculatedOrder = {
        orderNumber,
        store: 'teesgarage',
        customerName: 'Samira Khan',
        customerPhone: '9876543210',
        customerEmail: 'samira@example.com',
        address: '12 Marina Heights',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001',
        handoffType: 'cod',
        subtotal: 1998,
        shipping: 50,
        total: 2048,
        items: [
          {
            id: 1,
            variantId: 10,
            name: 'Classic Breton Striped Tee',
            fit: 'Regular',
            size: 'M',
            price: '₹999',
            priceNum: 999,
            sku: 'TEE-STR-REG-BLK-M',
            quantity: 2,
            img: 'https://storage.googleapis.com/test-bucket/products/breton-1.jpg'
          }
        ]
      }

      const created = await orderStore.create(testInput)

      assert.ok(created.id)
      assert.equal(created.orderNumber, orderNumber)
      assert.equal(created.status, 'Pending')
      assert.equal(created.paymentStatus, 'Pending')
      assert.equal(created.items.length, 1)

      // Legacy item shape check
      const lineItem = created.items[0]
      assert.equal(lineItem.id, 1)
      assert.equal(lineItem.name, 'Classic Breton Striped Tee')
      assert.equal(lineItem.size, 'M')
      assert.equal(lineItem.priceNum, 999)
      assert.equal(lineItem.quantity, 2)
      assert.ok(lineItem.price.includes('999'))

      // Initial placement event in events array
      assert.ok(created.events.length >= 1)
      assert.equal(created.events[0].status, 'Pending')
      assert.equal(created.events[0].note, 'Customer order placed')

      // Fetch by ID
      const fetchedById = await orderStore.getById(created.id)
      assert.ok(fetchedById)
      assert.equal(fetchedById.orderNumber, orderNumber)
      assert.equal(fetchedById.items.length, 1)
      assert.equal(fetchedById.items[0].sku, 'TEE-STR-REG-BLK-M')

      // Fetch by Order Number
      const fetchedByNumber = await orderStore.getByOrderNumber(orderNumber)
      assert.ok(fetchedByNumber)
      assert.equal(fetchedByNumber.id, created.id)

      // Update status via admin
      const updated = await orderStore.updateAdmin(created.id, { status: 'Shipped', trackingNumber: 'TRK12345' }, 'AdminUser')
      assert.ok(updated)
      assert.equal(updated.status, 'Shipped')
      assert.equal(updated.trackingNumber, 'TRK12345')
      assert.ok(updated.events.some((e) => e.status === 'Shipped'))

      // Add admin note
      const noted = await orderStore.addAdminNote(created.id, 'Customer requested morning delivery', 'SupportStaff')
      assert.ok(noted)
      assert.ok(noted.adminNotes.some((n) => n.text === 'Customer requested morning delivery'))
    })

    test('orderStore links userId for authenticated orders and queries by userId', async () => {
      const email = `buyer-${Date.now()}@example.com`
      const buyer = await userStore.create({
        name: 'Priya Sharma',
        email,
        provider: 'cloud-iam'
      })

      const orderNumber = `USER-ORD-${Date.now()}`
      const orderInput: CalculatedOrder & { userId?: number } = {
        userId: buyer.id,
        orderNumber,
        store: 'teesgarage',
        customerName: 'Priya Sharma',
        customerPhone: '9876543211',
        customerEmail: email,
        address: '55 Park Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        handoffType: 'cod',
        subtotal: 1199,
        shipping: 0,
        total: 1199,
        items: [
          {
            id: 2,
            variantId: 21,
            name: 'Fullsleeve Ribbed Tee',
            size: 'S',
            price: '₹1,199',
            priceNum: 1199,
            quantity: 1
          }
        ]
      }

      const created = await orderStore.create(orderInput)
      assert.equal(created.userId, buyer.id)

      // List by user ID
      const userOrders = await orderStore.listByUserId(buyer.id, email)
      assert.ok(userOrders.some((o) => o.orderNumber === orderNumber))

      // List by customer email (fallback compatibility)
      const emailOrders = await orderStore.listByCustomerEmail(email)
      assert.ok(emailOrders.some((o) => o.orderNumber === orderNumber))
    })

    test('GET /api/orders/mine uses userId and returns customer order history', async () => {
      const email = `history-${Date.now()}@example.com`
      const user = await userStore.create({
        name: 'Dev Buyer',
        email,
        provider: 'cloud-iam'
      })

      const orderNumber = `MINE-ORD-${Date.now()}`
      await orderStore.create({
        userId: user.id,
        orderNumber,
        store: 'teesgarage',
        customerName: 'Dev Buyer',
        customerPhone: '9876543212',
        customerEmail: email,
        address: '88 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        handoffType: 'cod',
        subtotal: 899,
        shipping: 0,
        total: 899,
        items: [
          {
            id: 3,
            variantId: 30,
            name: 'Ringer Graphic Tee',
            size: 'L',
            price: '₹899',
            priceNum: 899,
            quantity: 1
          }
        ]
      })

      const { token } = createCloudIamToken({
        uid: user.uid,
        email: user.email,
        name: user.name
      })

      const res = await request(app)
        .get('/api/orders/mine')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 200)
      assert.ok(res.body.count >= 1)
      const found = res.body.orders.find((o: any) => o.orderNumber === orderNumber)
      assert.ok(found, 'Should find customer order in history')
      assert.equal(found.orderNumber, orderNumber)
      assert.equal(found.items.length, 1)
    })
  })
})
