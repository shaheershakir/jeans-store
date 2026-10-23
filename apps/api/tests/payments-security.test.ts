import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { razorpayService } from '../src/services/razorpay.js'

const WEBHOOK_SECRET = 'whsec_test_only'
const KEY_SECRET = 'keysecret_test_only'

function hmac(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

describe('Razorpay signature verification', () => {
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET
  const previousWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  before(() => {
    process.env.RAZORPAY_KEY_SECRET = KEY_SECRET
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET
  })

  after(() => {
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret
    if (previousWebhookSecret === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET
    else process.env.RAZORPAY_WEBHOOK_SECRET = previousWebhookSecret
  })

  test('accepts only the exact HMAC of the raw webhook body', () => {
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } })
    const signature = hmac(WEBHOOK_SECRET, body)

    assert.equal(razorpayService.verifyWebhookSignature(body, signature, WEBHOOK_SECRET), true)
    assert.equal(razorpayService.verifyWebhookSignature(body, hmac(WEBHOOK_SECRET, `${body} `), WEBHOOK_SECRET), false)
    assert.equal(razorpayService.verifyWebhookSignature(body, signature, 'wrong-secret'), false)
    assert.equal(razorpayService.verifyWebhookSignature(`${body} `, signature, WEBHOOK_SECRET), false)
  })

  test('rejects missing or malformed webhook signatures without throwing', () => {
    const body = '{"event":"payment.failed"}'

    assert.equal(razorpayService.verifyWebhookSignature(body, '', WEBHOOK_SECRET), false)
    assert.equal(razorpayService.verifyWebhookSignature(body, 'not-a-hex-signature', WEBHOOK_SECRET), false)
    assert.equal(razorpayService.verifyWebhookSignature(body, hmac(WEBHOOK_SECRET, body), ''), false)
  })

  test('verifies checkout payments over the order|payment string', () => {
    const razorpay_order_id = 'order_test123'
    const razorpay_payment_id = 'pay_test456'
    const valid = hmac(KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`)

    assert.equal(
      razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: valid
      }),
      true
    )
    assert.equal(
      razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id: 'pay_other',
        razorpay_signature: valid
      }),
      false
    )
  })
})
