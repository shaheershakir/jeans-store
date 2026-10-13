import { Router, type Request, type Response } from 'express'
import { navigationStore } from '../store/navStore.js'
import { bulkUpdateNavigationSchema } from '../schemas/navigation.js'
import { verifyAdminAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const navigationRouter = Router()

// Public: List navigation items for storefront (or all items for admin with ?all=true)
navigationRouter.get('/api/navigation', async (req: Request, res: Response) => {
  const { all, fresh } = (req.query || {}) as { all?: string; fresh?: string }
  const includeInactive = all === 'true' || all === '1'
  const forceRefresh = fresh === 'true' || fresh === '1'

  try {
    const items = await navigationStore.list(includeInactive, forceRefresh)
    res.json({ count: items.length, navigation: items })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch navigation items')
    res.status(500).json({ error: 'Failed to retrieve navigation items' })
  }
})

// Admin: Bulk update navigation items (reorder, update, create, delete)
navigationRouter.put('/api/navigation', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = bulkUpdateNavigationSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid navigation payload',
      details: parsed.error.issues
    })
    return
  }

  try {
    const items = await navigationStore.bulkSave(parsed.data.navigation)
    res.json({ success: true, count: items.length, navigation: items })
  } catch (err) {
    logger.error({ err }, 'Failed to save navigation items')
    res.status(500).json({ error: 'Failed to update navigation items' })
  }
})

// Admin: Reset navigation items to default seed
navigationRouter.post('/api/navigation/reset', verifyAdminAuth, async (_req: Request, res: Response) => {
  try {
    const items = await navigationStore.resetToDefaults()
    res.json({ success: true, count: items.length, navigation: items })
  } catch (err) {
    logger.error({ err }, 'Failed to reset navigation items')
    res.status(500).json({ error: 'Failed to reset navigation items' })
  }
})
