import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { verifyAdminAuth } from '../middleware/auth.js'
import { getAdminState, saveAdminState } from '../store/adminStateStore.js'

export const adminStateRouter = Router()

const stateKeys = new Set([
  'collections', 'returns', 'refunds', 'coupons', 'promotions', 'banners', 'reviews',
  'sizeCharts', 'shipments', 'inventoryMovements', 'auditLog', 'notifications', 'settings', 'roles'
])

const stateSchema = z.record(z.string(), z.unknown()).superRefine((data, context) => {
  for (const key of Object.keys(data)) {
    if (!stateKeys.has(key)) context.addIssue({ code: 'custom', message: `Unsupported admin data field: ${key}`, path: [key] })
  }
})

adminStateRouter.get('/api/admin/state', verifyAdminAuth, async (_req: Request, res: Response) => {
  try {
    res.json({ state: await getAdminState() })
  } catch {
    res.status(503).json({ error: 'Admin operational data is unavailable.' })
  }
})

adminStateRouter.put('/api/admin/state', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = stateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid admin operational data.' })
    return
  }
  try {
    await saveAdminState(parsed.data)
    res.json({ success: true })
  } catch {
    res.status(503).json({ error: 'Could not save admin operational data.' })
  }
})
