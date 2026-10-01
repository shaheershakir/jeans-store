import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { navigationStore } from '../store/navStore.js'
import { bulkUpdateNavigationSchema } from '../schemas/navigation.js'

function verifyAdminAuth(request: FastifyRequest, reply: FastifyReply): boolean {
  const configuredKey = process.env.ADMIN_API_KEY
  if (configuredKey) {
    const keyHeader = request.headers['x-api-key']
    if (!keyHeader || keyHeader !== configuredKey) {
      void reply.status(401).send({ error: 'Unauthorized: Missing or invalid X-API-Key' })
      return false
    }
  }
  return true
}

export async function navigationRoutes(app: FastifyInstance): Promise<void> {
  // Public: List navigation items for storefront (or all items for admin with ?all=true)
  app.get('/api/navigation', async (request, reply) => {
    const { all } = (request.query || {}) as { all?: string }
    const includeInactive = all === 'true' || all === '1'

    try {
      const items = await navigationStore.list(includeInactive)
      return reply.send({ count: items.length, navigation: items })
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch navigation items')
      return reply.status(500).send({ error: 'Failed to retrieve navigation items' })
    }
  })

  // Admin: Bulk update navigation items (reorder, update, create, delete)
  app.put('/api/navigation', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    const parsed = bulkUpdateNavigationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid navigation payload',
        details: parsed.error.issues
      })
    }

    try {
      const items = await navigationStore.bulkSave(parsed.data.navigation)
      return reply.send({ success: true, count: items.length, navigation: items })
    } catch (err) {
      app.log.error({ err }, 'Failed to save navigation items')
      return reply.status(500).send({ error: 'Failed to update navigation items' })
    }
  })

  // Admin: Reset navigation items to default seed
  app.post('/api/navigation/reset', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    try {
      const items = await navigationStore.resetToDefaults()
      return reply.send({ success: true, count: items.length, navigation: items })
    } catch (err) {
      app.log.error({ err }, 'Failed to reset navigation items')
      return reply.status(500).send({ error: 'Failed to reset navigation items' })
    }
  })
}
