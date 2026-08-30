import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { productRoutes } from './routes/products.js'

export interface BuildAppOptions {
  corsOrigin?: string | true
  logger?: boolean
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger:
      options.logger ?? {
        level: 'info',
        transport: {
          target: 'pino-pretty'
        }
      }
  })

  void app.register(cors, {
    origin: options.corsOrigin ?? true
  })

  app.get('/health', async () => ({ status: 'ok' }))

  void app.register(productRoutes)

  return app
}
