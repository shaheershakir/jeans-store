import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { verifyAdminAuth } from '../middleware/auth.js'
import { calculateShipping, getShippingRates, saveShippingRates, shippingRatesSchema } from '../services/shipping.js'

export const shippingRouter = Router()

const quoteSchema = z.object({
  state: z.string().trim().min(1).max(100),
  weightGrams: z.number().int().positive().max(1_000_000)
})

shippingRouter.get('/api/shipping/rates', async (_req: Request, res: Response) => {
  try {
    res.json({ rates: await getShippingRates() })
  } catch {
    res.status(503).json({ error: 'Shipping rates are temporarily unavailable.' })
  }
})

shippingRouter.post('/api/shipping/quote', async (req: Request, res: Response) => {
  const parsed = quoteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'A delivery state and shipment weight are required.' })
    return
  }
  try {
    const rates = await getShippingRates()
    res.json({ shipping: calculateShipping(parsed.data.weightGrams, parsed.data.state, rates) })
  } catch {
    res.status(503).json({ error: 'A delivery quote is temporarily unavailable.' })
  }
})

shippingRouter.put('/api/admin/shipping/rates', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = shippingRatesSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter valid paid delivery rates for Kerala and the rest of India.' })
    return
  }
  try {
    await saveShippingRates(parsed.data)
    res.json({ rates: parsed.data })
  } catch {
    res.status(503).json({ error: 'Could not save delivery rates.' })
  }
})
