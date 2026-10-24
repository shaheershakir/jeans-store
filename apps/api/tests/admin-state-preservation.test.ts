import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminState, saveAdminState, _resetMemoryStateForTesting } from '../src/store/adminStateStore.js'

test('Admin State Store Non-Destructive Persistence (Phase 4)', async (t) => {
  t.beforeEach(() => {
    _resetMemoryStateForTesting()
  })

  await t.test('preserves audit logs across multiple saveAdminState invocations', async () => {
    const stamp = Date.now()
    const firstAuditId = 700_000_000 + (stamp % 100_000_000)
    const secondAuditId = firstAuditId + 1
    const couponId = 800_000_000 + (stamp % 100_000_000)
    const couponCode = `welcome${couponId}`

    // Initial save with an audit log entry and a coupon
    await saveAdminState({
      auditLog: [
        { id: firstAuditId, action: 'product.create', userName: 'Admin User', detail: 'Created Jeans product' }
      ],
      coupons: [
        { id: couponId, code: couponCode, type: 'percentage', value: 10, minOrderValue: 500 }
      ]
    })

    let state = await getAdminState()
    let logs = state.auditLog as any[]
    assert.ok(logs.some((log) => log.id === firstAuditId && log.action === 'product.create'))
    let coupons = (state.coupons as any[]).filter((coupon) => coupon.id === couponId)
    assert.equal(coupons.length, 1)
    assert.equal(coupons[0].code, couponCode)

    // Second save adds a new audit log entry and updates the coupon value
    await saveAdminState({
      auditLog: [
        { id: secondAuditId, action: 'coupon.update', userName: 'Admin User', detail: 'Updated welcome coupon' }
      ],
      coupons: [
        { id: couponId, code: couponCode, type: 'percentage', value: 15, minOrderValue: 600 }
      ]
    })

    state = await getAdminState()
    logs = state.auditLog as any[]
    assert.ok(logs.some((log) => log.id === firstAuditId), 'Preexisting audit log should not be wiped out')
    assert.ok(logs.some((log) => log.id === secondAuditId), 'New audit log should be appended')

    coupons = (state.coupons as any[]).filter((coupon) => coupon.id === couponId)
    assert.equal(coupons.length, 1, 'Coupon should be updated, not duplicated')
    assert.equal(coupons[0].value, 15)
  })

  await t.test('preserves inventory movements and product reviews across saves', async () => {
    const stamp = Date.now()
    const firstMovementId = 710_000_000 + (stamp % 100_000_000)
    const secondMovementId = firstMovementId + 1
    const reviewId = 810_000_000 + (stamp % 100_000_000)
    const productId = '00000000-0000-4000-8000-000000000010'

    await saveAdminState({
      inventoryMovements: [
        { id: firstMovementId, productId, type: 'PURCHASE', delta: 50, before: 0, after: 50 }
      ],
      reviews: [
        {
          id: reviewId,
          productId,
          rating: 5,
          content: 'Great quality fabric!',
          reviewerName: 'Test Customer'
        }
      ]
    })

    let state = await getAdminState()
    let movements = state.inventoryMovements as any[]
    assert.ok(movements.some((movement) => movement.id === firstMovementId))
    let reviews = (state.reviews as any[]).filter((review) => review.id === reviewId)
    assert.equal(reviews.length, 1)

    // Save with another movement
    await saveAdminState({
      inventoryMovements: [
        { id: secondMovementId, productId, type: 'SALE', delta: -2, before: 50, after: 48 }
      ]
    })

    state = await getAdminState()
    movements = state.inventoryMovements as any[]
    assert.ok(movements.some((movement) => movement.id === firstMovementId), 'Previous movements must be preserved')
    assert.ok(movements.some((movement) => movement.id === secondMovementId), 'New movement should be appended')

    reviews = (state.reviews as any[]).filter((review) => review.id === reviewId)
    assert.equal(reviews.length, 1, 'Product reviews should remain untouched when saving other admin data')
  })

  await t.test('merges operational entities correctly on ID conflict', async () => {
    const stamp = Date.now()
    const firstCollectionId = 900_000_000 + (stamp % 100_000_000)
    const secondCollectionId = firstCollectionId + 1
    const thirdCollectionId = firstCollectionId + 2
    const slugPrefix = `collection-${stamp}`

    await saveAdminState({
      collections: [
        { id: firstCollectionId, name: 'Summer 2026', slug: `${slugPrefix}-summer`, status: 'Active' },
        { id: secondCollectionId, name: 'Denim Core', slug: `${slugPrefix}-denim`, status: 'Active' }
      ]
    })

    // Update the first collection, add a third
    await saveAdminState({
      collections: [
        { id: firstCollectionId, name: 'Summer 2026 (Updated)', slug: `${slugPrefix}-summer`, status: 'Inactive' },
        { id: thirdCollectionId, name: 'Winter Drop', slug: `${slugPrefix}-winter`, status: 'Active' }
      ]
    })

    const state = await getAdminState()
    const collections = (state.collections as any[]).filter((collection) =>
      [firstCollectionId, secondCollectionId, thirdCollectionId].includes(collection.id)
    )
    assert.equal(collections.length, 3)
    const first = collections.find((collection) => collection.id === firstCollectionId)
    assert.equal(first.name, 'Summer 2026 (Updated)')
    assert.equal(first.status, 'Inactive')
    assert.ok(collections.some((collection) => collection.id === secondCollectionId))
    assert.ok(collections.some((collection) => collection.id === thirdCollectionId))
  })
})
