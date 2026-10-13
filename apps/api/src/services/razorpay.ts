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
  private keyId: string
  private keySecret: string
  private isConfigured: boolean

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID?.trim() || ''
    this.keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || ''
    this.isConfigured = Boolean(this.keyId && this.keySecret)

    if (!this.isConfigured) {
      logger.warn('Razorpay credentials not fully configured. Running in sandbox / fallback mode.')
    }
  }

  public getStatus() {
    return {
      enabled: this.isConfigured,
      keyId: this.keyId ? `${this.keyId.substring(0, 8)}...` : undefined
    }
  }

  /**
   * Creates an order with Razorpay in paise.
   */
  public async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResponse> {
    const { amount, currency = 'INR', receipt, notes = {} } = options

    if (!this.isConfigured) {
      logger.info({ receipt, amount }, 'Mocking Razorpay order creation')
      return {
        id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        entity: 'order',
        amount,
        amount_paid: 0,
        amount_due: amount,
        currency,
        receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      }
    }

    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')

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
   * Verifies the HMAC SHA256 signature returned by Razorpay Checkout.
   */
  public verifyPaymentSignature(params: PaymentVerificationParams): boolean {
    if (!this.isConfigured) {
      // In sandbox mode without credentials, allow mock verification
      return params.razorpay_signature.startsWith('mock_') || Boolean(params.razorpay_payment_id)
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params
    const body = `${razorpay_order_id}|${razorpay_payment_id}`

    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex')

    return expectedSignature === razorpay_signature
  }

  /**
   * Verifies a Razorpay Webhook signature against raw body payload.
   */
  public verifyWebhookSignature(body: string, receivedSignature: string, webhookSecret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    return expectedSignature === receivedSignature
  }
}

export const razorpayService = new RazorpayService()
