import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allocateDiscount,
  buildPricedLines,
  calculatePricing,
  reconcileOrderTotal,
  type PricedLineInput
} from '../src/services/pricing.js'

const tee: PricedLineInput = {
  productId: '00000000-0000-4000-8000-000000000001',
  variantId: 11,
  name: 'Classic Stripe Tee',
  size: 'M',
  quantity: 2,
  unitPrice: 999,
  weightGrams: 220
}

const trouser: PricedLineInput = {
  productId: '00000000-0000-4000-8000-000000000002',
  variantId: 22,
  name: 'Relaxed Trackpant',
  size: 'L',
  quantity: 1,
  unitPrice: 1499,
  weightGrams: 450
}

describe('Server-side pricing contract', () => {
  test('derives every money field from unit price and quantity', () => {
    const pricing = calculatePricing([tee, trouser], { shipping: 79 })

    assert.equal(pricing.subtotal, 999 * 2 + 1499)
    assert.equal(pricing.lines[0].lineTotal, 1998)
    assert.equal(pricing.lines[1].lineTotal, 1499)
    assert.equal(pricing.total, pricing.subtotal - pricing.discountTotal + pricing.shipping)
    assert.equal(pricing.weightGrams, 220 * 2 + 450)
    assert.ok(reconcileOrderTotal(pricing))
  })

  test('ignores a tampered browser total because it is never an input', () => {
    const tamperedOrder = {
      subtotal: 999,
      discountTotal: 0,
      shipping: 0,
      total: 1,
      items: [{ ...tee, unitPrice: 1, lineTotal: 1 }]
    }

    const priced = calculatePricing([tee], { shipping: 49 })

    assert.notEqual(priced.total, tamperedOrder.total)
    assert.equal(priced.lines[0].unitPrice, 999)
    assert.equal(priced.total, 1998 + 49)
    assert.equal(reconcileOrderTotal(tamperedOrder), false, 'tampered snapshots fail the invariant')
  })

  test('allocates an order discount proportionally and sums exactly', () => {
    const lines = buildPricedLines([tee, trouser])
    const discounted = allocateDiscount(lines, 350)

    const allocated = discounted.reduce((sum, line) => sum + line.discountAmount, 0)
    assert.equal(allocated, 350)
    for (const line of discounted) {
      assert.ok(line.discountAmount >= 0)
      assert.ok(line.discountAmount <= line.lineTotal)
    }
  })

  test('never discounts more than the cart is worth', () => {
    const pricing = calculatePricing([tee], { discount: 1_000_000 })

    assert.equal(pricing.discountTotal, 1998)
    assert.equal(pricing.total, pricing.shipping)
  })

  test('treats negative discount and shipping as zero', () => {
    const pricing = calculatePricing([tee], { discount: -500, shipping: -79 })

    assert.equal(pricing.discountTotal, 0)
    assert.equal(pricing.shipping, 0)
    assert.equal(pricing.total, 1998)
  })

  test('keeps all persisted money as integer rupees', () => {
    const pricing = calculatePricing([{ ...tee, unitPrice: 100.6, quantity: 3 }])

    assert.ok(Number.isInteger(pricing.lines[0].unitPrice))
    assert.ok(Number.isInteger(pricing.lines[0].lineTotal))
    assert.ok(Number.isInteger(pricing.total))
  })

  test('an empty cart prices to zero without throwing', () => {
    const pricing = calculatePricing([])
    assert.deepEqual(
      { subtotal: pricing.subtotal, total: pricing.total, weight: pricing.weightGrams },
      { subtotal: 0, total: 0, weight: 0 }
    )
  })

  test('reconciliation rejects a snapshot whose total drifted', () => {
    assert.equal(
      reconcileOrderTotal({ subtotal: 1998, discountTotal: 100, shipping: 49, total: 1947 }),
      true
    )
    assert.equal(
      reconcileOrderTotal({ subtotal: 1998, discountTotal: 100, shipping: 49, total: 2000 }),
      false
    )
  })
})
