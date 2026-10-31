import 'dotenv/config'
import { validateApiEnv } from '@jeans-store/validators'
import { buildApp } from './app.js'
import { db, isDatabaseConfigured } from './db/index.js'
import type { DbExecutor } from './db/types.js'
import { expireReservations } from './services/inventory.js'
import { logger } from './lib/logger.js'

const PORT = Number(process.env.PORT ?? 4000)
const HOST = process.env.HOST ?? '0.0.0.0'

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
]

const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : DEFAULT_ALLOWED_ORIGINS

const app = buildApp({ corsOrigin: CORS_ORIGIN })

// Validate environment on startup
validateApiEnv(process.env)

const server = app.listen(PORT, HOST, () => {
  logger.info({ host: HOST, port: PORT }, 'TEESGARAGE backend listening')
})

// Release abandoned checkout holds even when no new checkout arrives. The
// sweeper uses FOR UPDATE SKIP LOCKED, so running it from several instances is
// safe.
let expiryTimer: NodeJS.Timeout | undefined
if (isDatabaseConfigured() && db) {
  const database = db
  const sweep = async () => {
    try {
      const expired = await database.transaction(async (tx) => {
        const executor = tx as unknown as DbExecutor
        return expireReservations(executor, 100)
      })
      if (expired > 0) logger.info({ expired }, 'Released expired inventory reservations')
    } catch (err) {
      logger.warn({ err }, 'Inventory reservation expiry sweep failed')
    }
  }
  void sweep()
  expiryTimer = setInterval(sweep, 60_000)
  expiryTimer.unref()
}

server.on('error', (err) => {
  logger.error({ err }, 'Server error encountered')
  process.exit(1)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info(`${signal} received — shutting down`)
    if (expiryTimer) clearInterval(expiryTimer)
    server.close(() => {
      process.exit(0)
    })
  })
}
