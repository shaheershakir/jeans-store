import crypto from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { verifyAdminAuth } from '../middleware/auth.js'
import { razorpayService } from '../services/razorpay.js'
import { processRazorpayWebhook } from '../services/payments.js'
import { RefundError, createRefund, updateRefundStatus } from '../services/refunds.js'
import { logger } from '../lib/logger.js'

export const paymentsRouter = Router()

type RawBodyRequest = Request & { rawBody?: Buffer }

/**
 * Razorpay webhooks. The raw request body is verified before any payload is
 * trusted. Every event is persisted under a unique provider event id, so
 * duplicate and out-of-order deliveries cannot repeat side effects.
 */
paymentsRouter.post('/api/payments/razorpay/webhook', async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
  if (!secret) {
    logger.error('RAZORPAY_WEBHOOK_SECRET is not configured; rejecting webhook')
    res.status(503).json({ error: 'Webhook processing is not configured.' })
    return
  }

  const rawBody = (req as RawBodyRequest).rawBody
  const signature = req.header('x-razorpay-signature')?.trim()
  if (!rawBody || !signature) {
    res.status(400).json({ error: 'Missing webhook body or signature.' })
    return
  }

  if (!razorpayService.verifyWebhookSignature(rawBody.toString('utf8'), signature, secret)) {
    logger.warn({ ip: req.ip }, 'Razorpay webhook signature verification failed')
    res.status(400).json({ error: 'Invalid webhook signature.' })
    return
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>
  } catch {
    res.status(400).json({ error: 'Invalid webhook payload.' })
    return
  }

  const eventType =
    req.header('x-razorpay-event')?.trim() || (typeof payload.event === 'string' ? payload.event : 'unknown')
  const eventId =
    req.header('x-razorpay-event-id')?.trim() ||
    (typeof payload.id === 'string' && payload.id.length > 0
      ? payload.id
      : crypto.createHash('sha256').update(rawBody).digest('hex'))

  try {
    const result = await processRazorpayWebhook(payload, { eventId, eventType })
    // Failed events are retried by Razorpay. Processed, ignored and unmatched
    // events are terminal for delivery purposes and remain queryable.
    const statusCode = result.status === 'Failed' ? 500 : 200
    res.status(statusCode).json({
      received: true,
      duplicate: result.duplicate,
      status: result.status,
      message: result.message
    })
  } catch (error) {
    logger.error({ err: error, eventId, eventType }, 'Razorpay webhook processing failed')
    res.status(500).json({ error: 'Webhook processing failed.' })
  }
})

const createRefundSchema = z.object({
  orderId: z.number().int().positive(),
  amount: z.number().int().positive(),
  reason: z.string().trim().max(2000).optional(),
  method: z.string().trim().min(1).max(40).optional(),
  returnId: z.number().int().positive().nullable().optional(),
  gatewayRefundId: z.string().trim().min(1).max(120).nullable().optional(),
  idempotencyKey: z.string().trim().min(1).max(160).nullable().optional()
})

paymentsRouter.post('/api/refunds', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = createRefundSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a valid refund amount and order.', details: z.treeifyError(parsed.error) })
    return
  }
  try {
    const author = process.env.ADMIN_NAME || process.env.ADMIN_EMAIL || 'Administrator'
    const refund = await createRefund({ ...parsed.data, actorName: author })
    res.status(201).json({ refund })
  } catch (error) {
    if (error instanceof RefundError) {
      res.status(error.statusCode).json({ error: error.message })
      return
    }
    logger.error({ err: error, orderId: parsed.data.orderId }, 'Failed to create refund')
    res.status(500).json({ error: 'Could not create the refund.' })
  }
})

const updateRefundSchema = z.object({
  status: z.enum(['Processed', 'Failed']),
  failureReason: z.string().trim().max(2000).optional()
})

paymentsRouter.patch('/api/refunds/:id', verifyAdminAuth, async (req: Request, res: Response) => {
  const refundId = Number(req.params.id)
  const parsed = updateRefundSchema.safeParse(req.body)
  if (!Number.isInteger(refundId) || refundId < 1 || !parsed.success) {
    res.status(400).json({ error: 'Enter a valid refund id and status.' })
    return
  }
  try {
    const author = process.env.ADMIN_NAME || process.env.ADMIN_EMAIL || 'Administrator'
    const refund = await updateRefundStatus({
      refundId,
      status: parsed.data.status,
      failureReason: parsed.data.failureReason,
      actorName: author
    })
    res.json({ refund })
  } catch (error) {
    if (error instanceof RefundError) {
      res.status(error.statusCode).json({ error: error.message })
      return
    }
    logger.error({ err: error, refundId }, 'Failed to update refund')
    res.status(500).json({ error: 'Could not update the refund.' })
  }
})
