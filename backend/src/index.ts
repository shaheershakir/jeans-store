import 'dotenv/config'
import { buildApp } from './app.js'
import { seedIfEmpty } from './db/seed.js'

const PORT = Number(process.env.PORT ?? 4000)
const HOST = process.env.HOST ?? '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

const app = buildApp({ corsOrigin: CORS_ORIGIN })

// Run initial seed if database is configured and empty
void seedIfEmpty().catch((err) => {
  app.log.warn({ err }, 'Initial database seed check failed')
})

app
  .listen({ port: PORT, host: HOST })
  .then((address) => {
    app.log.info(`INFIT backend listening at ${address} (CORS origin: ${CORS_ORIGIN})`)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.log.info(`${signal} received — shutting down`)
    void app.close().finally(() => process.exit(0))
  })
}
