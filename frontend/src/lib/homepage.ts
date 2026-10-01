import type { HomepageConfig } from './constants'
import { DEFAULT_HOMEPAGE_CONFIG } from './constants'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
const isDev = process.env.NODE_ENV !== 'production'

/**
 * Fetch live storefront homepage layout and content configured via the admin dashboard,
 * with Next.js tag cache revalidation and fallback to bundled default snapshot.
 */
export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${BACKEND_URL}/api/homepage`, {
      signal: controller.signal,
      cache: isDev ? 'no-store' : 'default',
      next: isDev ? undefined : { tags: ['homepage'], revalidate: 10 }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return DEFAULT_HOMEPAGE_CONFIG
    }

    const data = (await res.json()) as { success?: boolean; config?: HomepageConfig }
    if (data?.config && Array.isArray(data.config.sectionsOrder)) {
      return data.config
    }

    return DEFAULT_HOMEPAGE_CONFIG
  } catch {
    return DEFAULT_HOMEPAGE_CONFIG
  }
}
