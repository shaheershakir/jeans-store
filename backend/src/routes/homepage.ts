import { Router, type Request, type Response } from 'express'
import { homepageStore } from '../store/homepageStore.js'
import { updateHomepageConfigSchema } from '../schemas/homepage.js'
import { verifyAdminAuth } from '../middleware/auth.js'
import { logger } from '../lib/logger.js'

export const homepageRouter = Router()

// Public: Get current homepage layout configuration
homepageRouter.get('/api/homepage', async (_req: Request, res: Response) => {
  try {
    const config = await homepageStore.get()
    res.json({ success: true, config })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch homepage layout config')
    res.status(500).json({ error: 'Failed to retrieve homepage layout config' })
  }
})

// Admin: Update entire homepage layout configuration (sections order, visibility, and section content)
homepageRouter.put('/api/homepage', verifyAdminAuth, async (req: Request, res: Response) => {
  const parsed = updateHomepageConfigSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid homepage layout configuration payload',
      details: parsed.error.issues
    })
    return
  }

  try {
    const updated = await homepageStore.save(parsed.data.config)
    res.json({ success: true, config: updated })
  } catch (err) {
    logger.error({ err }, 'Failed to save homepage layout config')
    res.status(500).json({ error: 'Failed to save homepage layout configuration' })
  }
})

// Admin: Reset homepage layout configuration to factory defaults
homepageRouter.post('/api/homepage/reset', verifyAdminAuth, async (_req: Request, res: Response) => {
  try {
    const config = await homepageStore.resetToDefaults()
    res.json({ success: true, config })
  } catch (err) {
    logger.error({ err }, 'Failed to reset homepage layout config')
    res.status(500).json({ error: 'Failed to reset homepage layout config' })
  }
})
