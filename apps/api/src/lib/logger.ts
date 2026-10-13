import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || (isProd ? 'warn' : 'info')

function createLogger() {
  if (isProd) {
    return pino({ level: logLevel })
  }

  try {
    // Only use pino-pretty if available in runtime environment
    return pino({
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    })
  } catch {
    return pino({ level: logLevel })
  }
}

export const logger = createLogger()
