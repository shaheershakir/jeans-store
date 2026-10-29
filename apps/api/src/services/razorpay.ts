import crypto from 'node:crypto'
import { logger } from '../lib/logger.js'

export interface RazorpayOrderOptions {
  amount: number // in paise (e.g. 10000 = ₹100.00)
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: 'created' | 'attempted' | 'paid'
  created_at: number
}

export interface PaymentVerificationParams {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Service to handle Razorpay payment gateway integration,
 * order creation, signature verification, and webhooks.
 */
export class RazorpayService {
  public getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID?.trim() || ''
  }

  public getKeySecret(): string {
    return process.env.RAZORPAY_KEY_SECRET?.trim() || ''
  }

  public getStatus() {
    const keyId = this.getKeyId()
    const keySecret = this.getKeySecret()
    return {
      enabled: Boolean(keyId && keySecret),
      keyId: keyId ? `${keyId.substring(0, 8)}...` : undefined
    }
  }

  /**
   * Creates an order with Razorpay in paise.
   */
  public async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse> {
    const { amount, currency = 'INR', receipt, notes = {} } = options
    const keyId = this.getKeyId()
    const keySecret = this.getKeySecret()

    if (!keyId || !keySecret) throw new Error('Razorpay is not configured.')

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({ status: response.status, errorText }, 'Razorpay order creation failed')
      throw new Error(`Razorpay API error: ${response.status} - ${errorText}`)
    }

    return (await response.json()) as RazorpayOrderResponse
  }

  /**
   * Verifies the HMAC SHA256 signature returned by Razorpay Checkout using constant-time comparison.
   */
  public verifyPaymentSignature(params: PaymentVerificationParams): boolean {
    const keySecret = this.getKeySecret()
    if (!keySecret) {
      logger.error('RAZORPAY_KEY_SECRET is not configured; cannot verify payment signature')
      return false
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex')

    const received = Buffer.from(razorpay_signature, 'utf8')
    const expected = Buffer.from(expectedSignature, 'utf8')
    return received.length === expected.length && crypto.timingSafeEqual(received, expected)
  }

  public async fetchOrder(orderId: string): Promise<RazorpayOrderResponse> {
    return this.fetchResource<RazorpayOrderResponse>(`orders/${encodeURIComponent(orderId)}`)
  }

  public async fetchPayment(paymentId: string): Promise<{ order_id: string; amount: number; status: string }> {
    return this.fetchResource<{ order_id: string; amount: number; status: string }>(`payments/${encodeURIComponent(paymentId)}`)
  }

  private async fetchResource<T>(path: string): Promise<T> {
    const keyId = this.getKeyId()
    const keySecret = this.getKeySecret()
    if (!keyId || !keySecret) throw new Error('Razorpay is not configured.')
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` },
      signal: AbortSignal.timeout(8000)
    })
    if (!response.ok) throw new Error('Razorpay verification lookup failed.')
    return (await response.json()) as T
  }

  /**
   * Verifies a Razorpay Webhook signature against raw body payload using constant-time comparison.
   */
  public verifyWebhookSignature(body: string, receivedSignature: string, webhookSecret: string): boolean {
    if (!webhookSecret || !receivedSignature || !body) return false
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    const received = Buffer.from(receivedSignature, 'utf8')
    const expected = Buffer.from(expectedSignature, 'utf8')
    return received.length === expected.length && crypto.timingSafeEqual(received, expected)
  }
}

export const razorpayService = new RazorpayService()
