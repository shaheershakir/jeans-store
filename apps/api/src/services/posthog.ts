import { PostHog } from 'posthog-node'
import type { AnalyticsEventMap, AnalyticsEventName } from '@jeans-store/shared'
import { logger } from '../lib/logger.js'

const POSTHOG_KEY = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com'
const isDev = process.env.NODE_ENV === 'development'

let client: PostHog | null = null

if (POSTHOG_KEY) {
  try {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1, // Flush immediately in serverless/container environments
      flushInterval: 0
    })
    logger.info('PostHog server client initialized successfully')
  } catch (err) {
    logger.error({ err }, 'Failed to initialize PostHog server client')
  }
} else if (isDev) {
  logger.info('No POSTHOG_API_KEY provided; PostHog server client running in no-op mode')
}

export function trackServerEvent<E extends AnalyticsEventName>(
  distinctId: string,
  event: E,
  properties: AnalyticsEventMap[E]
): void {
  if (isDev) {
    logger.debug({ event, distinctId, properties }, '[PostHog Server Track]')
  }

  if (!client) return

  try {
    client.capture({
      distinctId: distinctId || 'anonymous_server_user',
      event,
      properties: properties as unknown as Record<string, unknown>
    })
  } catch (err) {
    logger.error({ err, event }, 'Error capturing server-side PostHog event')
  }
}

export async function shutdownPostHog(): Promise<void> {
  if (client) {
    await client.shutdown()
  }
}
