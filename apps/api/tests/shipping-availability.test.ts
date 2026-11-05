import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from '../src/app.js'
import { saveShippingRates } from '../src/services/shipping.js'

describe('Shipping Availability & Pincode Checker API', () => {
  const app = buildApp({ enableLogging: false })
  const adminKey = process.env.ADMIN_API_KEY || 'local_dev_admin_key'

  // Reset rates back to default after tests
  after(async () => {
    await saveShippingRates({
      dispatchDaysMin: 1,
      dispatchDaysMax: 2,
      kerala: {
        baseWeightGrams: 500,
        baseCharge: 60,
        additionalWeightGrams: 500,
        additionalCharge: 20,
        estimatedDaysMin: 2,
        estimatedDaysMax: 2,
        exactDeliveryDate: ''
      },
      restOfIndia: {
        baseWeightGrams: 500,
        baseCharge: 90,
        additionalWeightGrams: 500,
        additionalCharge: 30,
        estimatedDaysMin: 5,
        estimatedDaysMax: 7,
        exactDeliveryDate: ''
      }
    })
  })

  test('GET /api/shipping/check rejects missing or invalid pincode', async () => {
    const resNoPin = await request(app).get('/api/shipping/check')
    assert.equal(resNoPin.status, 400)
    assert.ok(resNoPin.body.error)

    const resInvalidPin = await request(app).get('/api/shipping/check?pincode=123')
    assert.equal(resInvalidPin.status, 400)
    assert.ok(resInvalidPin.body.error)

    const resAlphaPin = await request(app).get('/api/shipping/check?pincode=ABC123')
    assert.equal(resAlphaPin.status, 400)
    assert.ok(resAlphaPin.body.error)
  })

  test('GET /api/shipping/check returns correct estimates for Kerala pincode (682001)', async () => {
    const res = await request(app).get('/api/shipping/check?pincode=682001')
    assert.equal(res.status, 200)
    const info = res.body
    assert.equal(info.pincode, '682001')
    assert.equal(info.serviceable, true)
    assert.equal(info.isKerala, true)
    assert.equal(info.state, 'Kerala')
    assert.equal(info.dispatchDaysMin, 1)
    assert.equal(info.dispatchDaysMax, 2)
    assert.match(info.dispatchText, /Typically dispatched in 1–2 days/)
    assert.ok(info.dispatchDateRange, 'Should provide dispatch date range')
    assert.equal(info.estimatedDaysMin, 2)
    assert.equal(info.estimatedDaysMax, 2)
    assert.match(info.deliveryText, /2 days in Kerala/)
    assert.ok(info.estimatedDeliveryRange, 'Should provide estimated delivery date range')
    assert.equal(info.baseCharge, 60)
  })

  test('GET /api/shipping/check returns correct estimates for Outside Kerala pincode (560001)', async () => {
    const res = await request(app).get('/api/shipping/check?pincode=560001')
    assert.equal(res.status, 200)
    const info = res.body
    assert.equal(info.pincode, '560001')
    assert.equal(info.serviceable, true)
    assert.equal(info.isKerala, false)
    assert.equal(info.state, 'Outside Kerala')
    assert.equal(info.dispatchDaysMin, 1)
    assert.equal(info.dispatchDaysMax, 2)
    assert.match(info.dispatchText, /Typically dispatched in 1–2 days/)
    assert.equal(info.estimatedDaysMin, 5)
    assert.equal(info.estimatedDaysMax, 7)
    assert.match(info.deliveryText, /5–7 days outside Kerala/)
    assert.ok(info.estimatedDeliveryRange, 'Should provide estimated delivery date range')
    assert.equal(info.baseCharge, 90)
  })

  test('GET /api/shipping/rates includes dispatch timeline parameters', async () => {
    const res = await request(app).get('/api/shipping/rates')
    assert.equal(res.status, 200)
    assert.equal(typeof res.body.rates.dispatchDaysMin, 'number')
    assert.equal(typeof res.body.rates.dispatchDaysMax, 'number')
    assert.equal(res.body.rates.dispatchDaysMin, 1)
    assert.equal(res.body.rates.dispatchDaysMax, 2)
    assert.equal(res.body.rates.kerala.estimatedDaysMin, 2)
    assert.equal(res.body.rates.kerala.estimatedDaysMax, 2)
    assert.equal(res.body.rates.restOfIndia.estimatedDaysMin, 5)
    assert.equal(res.body.rates.restOfIndia.estimatedDaysMax, 7)
  })

  test('Admin PUT /api/admin/shipping/rates updates dispatch timeline and live check reflects it', async () => {
    // 1. Unauthorized attempt
    const unauthRes = await request(app)
      .put('/api/admin/shipping/rates')
      .send({
        dispatchDaysMin: 2,
        dispatchDaysMax: 3,
        kerala: {
          baseWeightGrams: 500,
          baseCharge: 70,
          additionalWeightGrams: 500,
          additionalCharge: 25,
          estimatedDaysMin: 3,
          estimatedDaysMax: 3
        },
        restOfIndia: {
          baseWeightGrams: 500,
          baseCharge: 100,
          additionalWeightGrams: 500,
          additionalCharge: 35,
          estimatedDaysMin: 6,
          estimatedDaysMax: 8
        }
      })
    assert.equal(unauthRes.status, 401)

    // 2. Authorized admin update
    const updateRes = await request(app)
      .put('/api/admin/shipping/rates')
      .set('x-admin-key', adminKey)
      .send({
        dispatchDaysMin: 2,
        dispatchDaysMax: 4,
        kerala: {
          baseWeightGrams: 500,
          baseCharge: 65,
          additionalWeightGrams: 500,
          additionalCharge: 20,
          estimatedDaysMin: 3,
          estimatedDaysMax: 4
        },
        restOfIndia: {
          baseWeightGrams: 500,
          baseCharge: 95,
          additionalWeightGrams: 500,
          additionalCharge: 30,
          estimatedDaysMin: 6,
          estimatedDaysMax: 9
        }
      })
    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.body.rates.dispatchDaysMin, 2)
    assert.equal(updateRes.body.rates.dispatchDaysMax, 4)

    // 3. Check live endpoint reflects updated admin rates
    const checkKerala = await request(app).get('/api/shipping/check?pincode=682001')
    assert.equal(checkKerala.status, 200)
    assert.match(checkKerala.body.dispatchText, /Typically dispatched in 2–4 days/)
    assert.match(checkKerala.body.deliveryText, /3–4 days in Kerala/)
    assert.equal(checkKerala.body.baseCharge, 65)

    const checkRoI = await request(app).get('/api/shipping/check?pincode=110001')
    assert.equal(checkRoI.status, 200)
    assert.match(checkRoI.body.dispatchText, /Typically dispatched in 2–4 days/)
    assert.match(checkRoI.body.deliveryText, /6–9 days outside Kerala/)
    assert.equal(checkRoI.body.baseCharge, 95)
  })
})
