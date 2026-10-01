import type { NavigationItem } from './constants'
import { DEFAULT_NAV_LINKS } from './constants'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Fetch live storefront navigation items configured via the admin dashboard,
 * with Next.js tag cache revalidation and fallback to bundled default links.
 */
export async function getNavigationItems(): Promise<NavigationItem[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${BACKEND_URL}/api/navigation`, {
      signal: controller.signal,
      cache: isDev ? 'no-store' : 'default',
      next: isDev ? undefined : { tags: ['navigation'], revalidate: 10 }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return DEFAULT_NAV_LINKS
    }

    const data = (await res.json()) as { navigation?: NavigationItem[] }
    if (Array.isArray(data?.navigation) && data.navigation.length > 0) {
      return data.navigation
    }

    return DEFAULT_NAV_LINKS
  } catch {
    return DEFAULT_NAV_LINKS
  }
}
