import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || (isProd ? 'warn' : 'info')

export const logger = isProd
  ? pino({ level: logLevel })
  : pino({
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    })
