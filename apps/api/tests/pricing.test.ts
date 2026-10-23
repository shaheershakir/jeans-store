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
  productId: 1,
  variantId: 11,
  name: 'Classic Stripe Tee',
  size: 'M',
  quantity: 2,
  unitPrice: 999,
  weightGrams: 220,
  taxRate: 0.05
}

const trouser: PricedLineInput = {
  productId: 2,
  variantId: 22,
  name: 'Relaxed Trackpant',
  size: 'L',
  quantity: 1,
  unitPrice: 1499,
  weightGrams: 450,
  taxRate: 0.12
}

describe('Server-side pricing contract', () => {
  test('derives every money field from unit price and quantity', () => {
    const pricing = calculatePricing([tee, trouser], { shipping: 79 })

    assert.equal(pricing.subtotal, 999 * 2 + 1499)
    assert.equal(pricing.lines[0].lineTotal, 1998)
    assert.equal(pricing.lines[1].lineTotal, 1499)
    assert.equal(pricing.taxTotal, Math.round(1998 * 0.05) + Math.round(1499 * 0.12))
    assert.equal(pricing.total, pricing.subtotal - pricing.discountTotal + pricing.shipping + pricing.taxTotal)
    assert.equal(pricing.weightGrams, 220 * 2 + 450)
    assert.ok(reconcileOrderTotal(pricing))
  })

  test('ignores a tampered browser total because it is never an input', () => {
    const tamperedOrder = {
      subtotal: 999,
      discountTotal: 0,
      shipping: 0,
      taxTotal: 0,
      total: 1,
      items: [{ ...tee, unitPrice: 1, lineTotal: 1 }]
    }

    const priced = calculatePricing([tee], { shipping: 49 })

    assert.notEqual(priced.total, tamperedOrder.total)
    assert.equal(priced.lines[0].unitPrice, 999)
    assert.equal(priced.total, 1998 + 49 + Math.round(1998 * 0.05))
    assert.equal(reconcileOrderTotal(tamperedOrder), false, 'tampered snapshots fail the invariant')
  })

  test('allocates an order discount proportionally and sums exactly', () => {
    const lines = buildPricedLines([tee, trouser])
    const discounted = allocateDiscount(lines, 350)

    const allocated = discounted.reduce((sum, line) => sum + line.discountAmount, 0)
    assert.equal(allocated, 350)
    for (const line of discounted) {
      assert.equal(line.taxableAmount, line.lineTotal - line.discountAmount)
      assert.equal(line.taxAmount, Math.round(line.taxableAmount * line.taxRate))
      assert.ok(line.discountAmount >= 0)
      assert.ok(line.discountAmount <= line.lineTotal)
    }
  })

  test('never discounts more than the cart is worth', () => {
    const pricing = calculatePricing([tee], { discount: 1_000_000 })

    assert.equal(pricing.discountTotal, 1998)
    assert.equal(pricing.lines[0].taxableAmount, 0)
    assert.equal(pricing.lines[0].taxAmount, 0)
    assert.equal(pricing.total, pricing.shipping)
  })

  test('treats negative discount and shipping as zero', () => {
    const pricing = calculatePricing([tee], { discount: -500, shipping: -79 })

    assert.equal(pricing.discountTotal, 0)
    assert.equal(pricing.shipping, 0)
    assert.equal(pricing.total, 1998 + Math.round(1998 * 0.05))
  })

  test('normalizes both fractional and legacy percentage tax rates', () => {
    const fractional = calculatePricing([{ ...tee, quantity: 1, taxRate: 0.05 }])
    const legacyPercentage = calculatePricing([{ ...tee, quantity: 1, taxRate: 5 }])
    const outOfRange = calculatePricing([{ ...tee, quantity: 1, taxRate: 500 }])

    assert.equal(fractional.lines[0].taxAmount, 50)
    assert.equal(legacyPercentage.lines[0].taxAmount, 50)
    assert.equal(outOfRange.lines[0].taxAmount, 999, 'rates above 100% are clamped to 100%')
  })

  test('keeps all persisted money as integer rupees', () => {
    const pricing = calculatePricing([{ ...tee, unitPrice: 100.6, quantity: 3, taxRate: 0.075 }])

    assert.ok(Number.isInteger(pricing.lines[0].unitPrice))
    assert.ok(Number.isInteger(pricing.lines[0].lineTotal))
    assert.ok(Number.isInteger(pricing.taxTotal))
    assert.ok(Number.isInteger(pricing.total))
  })

  test('an empty cart prices to zero without throwing', () => {
    const pricing = calculatePricing([])
    assert.deepEqual(
      { subtotal: pricing.subtotal, tax: pricing.taxTotal, total: pricing.total, weight: pricing.weightGrams },
      { subtotal: 0, tax: 0, total: 0, weight: 0 }
    )
  })

  test('reconciliation rejects a snapshot whose total drifted', () => {
    assert.equal(
      reconcileOrderTotal({ subtotal: 1998, discountTotal: 100, shipping: 49, taxTotal: 95, total: 2042 }),
      true
    )
    assert.equal(
      reconcileOrderTotal({ subtotal: 1998, discountTotal: 100, shipping: 49, taxTotal: 95, total: 2000 }),
      false
    )
  })
})
