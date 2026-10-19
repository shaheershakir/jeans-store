import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminState, saveAdminState, _resetMemoryStateForTesting } from '../src/store/adminStateStore.js'

test('Admin State Store Non-Destructive Persistence (Phase 4)', async (t) => {
  t.beforeEach(() => {
    _resetMemoryStateForTesting()
  })

  await t.test('preserves audit logs across multiple saveAdminState invocations', async () => {
    // Initial save with an audit log entry and a coupon
    await saveAdminState({
      auditLog: [
        { id: 1, action: 'product.create', userName: 'Admin User', detail: 'Created Jeans product' }
      ],
      coupons: [
        { id: 101, code: 'WELCOME10', type: 'percentage', value: 10, minOrderValue: 500 }
      ]
    })

    let state = await getAdminState()
    assert.equal((state.auditLog as any[])?.length, 1)
    assert.equal((state.auditLog as any[])[0].id, 1)
    assert.equal((state.coupons as any[])?.length, 1)

    // Second save adds a new audit log entry and updates the coupon value
    await saveAdminState({
      auditLog: [
        { id: 2, action: 'coupon.update', userName: 'Admin User', detail: 'Updated WELCOME10' }
      ],
      coupons: [
        { id: 101, code: 'WELCOME10', type: 'percentage', value: 15, minOrderValue: 600 }
      ]
    })

    state = await getAdminState()
    const logs = state.auditLog as any[]
    assert.equal(logs.length, 2, 'Preexisting audit log should not be wiped out on subsequent saves')
    assert.ok(logs.some((l) => l.id === 1 && l.action === 'product.create'))
    assert.ok(logs.some((l) => l.id === 2 && l.action === 'coupon.update'))

    const coupons = state.coupons as any[]
    assert.equal(coupons.length, 1, 'Coupon should be updated, not duplicated')
    assert.equal(coupons[0].value, 15)
  })

  await t.test('preserves inventory movements and product reviews across saves', async () => {
    await saveAdminState({
      inventoryMovements: [
        { id: 501, productId: 10, variantId: 20, type: 'PURCHASE', delta: 50, before: 0, after: 50 }
      ],
      reviews: [
        { id: 301, productId: 10, rating: 5, content: 'Great quality fabric!' }
      ]
    })

    let state = await getAdminState()
    assert.equal((state.inventoryMovements as any[])?.length, 1)
    assert.equal((state.reviews as any[])?.length, 1)

    // Save with another movement
    await saveAdminState({
      inventoryMovements: [
        { id: 502, productId: 10, variantId: 20, type: 'SALE', delta: -2, before: 50, after: 48 }
      ]
    })

    state = await getAdminState()
    const movements = state.inventoryMovements as any[]
    assert.equal(movements.length, 2, 'Previous inventory movements must be preserved')
    assert.ok(movements.some((m) => m.id === 501))
    assert.ok(movements.some((m) => m.id === 502))

    const reviews = state.reviews as any[]
    assert.equal(reviews.length, 1, 'Product reviews should remain untouched when saving other admin data')
  })

  await t.test('merges operational entities correctly on ID conflict', async () => {
    await saveAdminState({
      collections: [
        { id: 1, name: 'Summer 2026', slug: 'summer-2026', status: 'Active' },
        { id: 2, name: 'Denim Core', slug: 'denim-core', status: 'Active' }
      ]
    })

    // Update collection 1, add collection 3
    await saveAdminState({
      collections: [
        { id: 1, name: 'Summer 2026 (Updated)', slug: 'summer-2026', status: 'Inactive' },
        { id: 3, name: 'Winter Drop', slug: 'winter-drop', status: 'Active' }
      ]
    })

    const state = await getAdminState()
    const collections = state.collections as any[]
    assert.equal(collections.length, 3)
    const col1 = collections.find((c) => c.id === 1)
    assert.equal(col1.name, 'Summer 2026 (Updated)')
    assert.equal(col1.status, 'Inactive')
    assert.ok(collections.some((c) => c.id === 2))
    assert.ok(collections.some((c) => c.id === 3))
  })
})
