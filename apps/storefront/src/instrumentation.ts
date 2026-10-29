import * as Sentry from '@sentry/nextjs'
import { validateStorefrontEnv } from '@jeans-store/validators'

export async function register() {
  validateStorefrontEnv(process.env)

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
