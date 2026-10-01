import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { homepageStore } from '../store/homepageStore.js'
import { updateHomepageConfigSchema } from '../schemas/homepage.js'

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

export async function homepageRoutes(app: FastifyInstance): Promise<void> {
  // Public: Get current homepage layout configuration
  app.get('/api/homepage', async (request, reply) => {
    try {
      const config = await homepageStore.get()
      return reply.send({ success: true, config })
    } catch (err) {
      app.log.error({ err }, 'Failed to fetch homepage layout config')
      return reply.status(500).send({ error: 'Failed to retrieve homepage layout config' })
    }
  })

  // Admin: Update entire homepage layout configuration (sections order, visibility, and section content)
  app.put('/api/homepage', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    const parsed = updateHomepageConfigSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid homepage layout configuration payload',
        details: parsed.error.issues
      })
    }

    try {
      const updated = await homepageStore.save(parsed.data.config)
      return reply.send({ success: true, config: updated })
    } catch (err) {
      app.log.error({ err }, 'Failed to save homepage layout config')
      return reply.status(500).send({ error: 'Failed to save homepage layout configuration' })
    }
  })

  // Admin: Reset homepage layout configuration to factory defaults
  app.post('/api/homepage/reset', async (request, reply) => {
    if (!verifyAdminAuth(request, reply)) return

    try {
      const config = await homepageStore.resetToDefaults()
      return reply.send({ success: true, config })
    } catch (err) {
      app.log.error({ err }, 'Failed to reset homepage layout config')
      return reply.status(500).send({ error: 'Failed to reset homepage layout config' })
    }
  })
}
