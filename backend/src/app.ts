import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { productRoutes } from './routes/products.js'
import { orderRoutes } from './routes/orders.js'
import { authRoutes } from './routes/auth.js'
import { navigationRoutes } from './routes/navigation.js'

export interface BuildAppOptions {
  corsOrigin?: string | string[] | boolean
  logger?: boolean | Record<string, unknown>
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const isProd = process.env.NODE_ENV === 'production'

  const defaultLogger = isProd
    ? { level: 'info' }
    : {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      }

  const app = Fastify({
    logger: options.logger ?? defaultLogger
  })

  // Security Headers
  void app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })

  // Rate Limiting
  void app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost']
  })

  // CORS
  void app.register(cors, {
    origin: options.corsOrigin ?? true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  })

  // Health check for Cloud Run / load balancers
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }))

  void app.register(productRoutes)
  void app.register(orderRoutes)
  void app.register(authRoutes)
  void app.register(navigationRoutes)

  return app
}
