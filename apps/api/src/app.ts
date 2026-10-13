import express, { type Application, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { logger } from './lib/logger.js'
import { productRouter } from './routes/products.js'
import { orderRouter } from './routes/orders.js'
import { authRouter } from './routes/auth.js'
import { navigationRouter } from './routes/navigation.js'
import { homepageRouter } from './routes/homepage.js'
import { adminAuthRouter } from './routes/adminAuth.js'
import { uploadRouter } from './routes/uploads.js'
import { shippingRouter } from './routes/shipping.js'

export interface BuildAppOptions {
  corsOrigin?: string | string[] | boolean
  enableLogging?: boolean
}

export function buildApp(options: BuildAppOptions = {}): Application {
  const app: Application = express()

  // Trust first proxy hop (Google Front End / Cloud Run reverse proxy)
  app.set('trust proxy', 1)

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  )

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        const ip = req.ip || req.socket.remoteAddress || ''
        return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost'
      }
    })
  )

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true)

        // In development/test environments, allow any localhost or 127.0.0.1 port
        if (process.env.NODE_ENV !== 'production') {
          if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true)
          }
        }

        const allowed = options.corsOrigin ?? true
        if (allowed === true || allowed === '*') {
          return callback(null, true)
        }

        if (Array.isArray(allowed)) {
          if (allowed.includes('*') || allowed.includes(origin)) {
            return callback(null, true)
          }
        } else if (typeof allowed === 'string' && allowed === origin) {
          return callback(null, true)
        }

        return callback(null, false)
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      credentials: true
    })
  )

  // Body Parsing
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // HTTP Request Logging
  if (options.enableLogging !== false) {
    app.use(pinoHttp({ logger }))
  }

  // Health check for Cloud Run / load balancers
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  })

  // API Routes
  app.use(productRouter)
  app.use(orderRouter)
  app.use(authRouter)
  app.use(adminAuthRouter)
  app.use(uploadRouter)
  app.use(shippingRouter)
  app.use(navigationRouter)
  app.use(homepageRouter)

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' })
  })

  // Global Error Handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err, path: req.path }, 'Unhandled request error')
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
