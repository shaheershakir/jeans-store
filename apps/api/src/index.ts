import 'dotenv/config'
import { buildApp } from './app.js'
import { seedIfEmpty } from './db/seed.js'
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

// Run initial seed if database is configured and empty
void seedIfEmpty().catch((err) => {
  logger.warn({ err }, 'Initial database seed check failed')
})

const server = app.listen(PORT, HOST, () => {
  console.log(`✓ TEESGARAGE backend listening at http://${HOST}:${PORT}`)
})

server.on('error', (err) => {
  logger.error({ err }, 'Server error encountered')
  process.exit(1)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info(`${signal} received — shutting down`)
    server.close(() => {
      process.exit(0)
    })
  })
}
