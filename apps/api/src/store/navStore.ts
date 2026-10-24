import { asc, eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { navigationItems as navTable, type DbNavigationItem } from '@jeans-store/db'
import type { NavigationItem, NavItemType } from '../schemas/navigation.js'

export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'nav-1',
    label: 'Stripes',
    href: '/shop/stripes',
    type: 'category',
    targetValue: 'stripes',
    order: 0,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-2',
    label: 'Fullsleeve',
    href: '/shop/fullsleeve',
    type: 'category',
    targetValue: 'fullsleeve',
    order: 1,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-3',
    label: 'Drsleeve',
    href: '/shop/drsleeve',
    type: 'category',
    targetValue: 'drsleeve',
    order: 2,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-4',
    label: 'Printed tees',
    href: '/shop/printed-tees',
    type: 'category',
    targetValue: 'printed-tees',
    order: 3,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-5',
    label: 'Ringer tees',
    href: '/shop/ringer-tees',
    type: 'category',
    targetValue: 'ringer-tees',
    order: 4,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-6',
    label: 'Henley',
    href: '/shop/henley',
    type: 'category',
    targetValue: 'henley',
    order: 5,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-7',
    label: 'Waffle',
    href: '/shop/waffle',
    type: 'category',
    targetValue: 'waffle',
    order: 6,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-8',
    label: 'Trackpants',
    href: '/shop/trackpants',
    type: 'category',
    targetValue: 'trackpants',
    order: 7,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-9',
    label: 'Sweatpants',
    href: '/shop/sweatpants',
    type: 'category',
    targetValue: 'sweatpants',
    order: 8,
    isActive: true,
    openInNewTab: false
  }
]

function toNavigationItem(row: DbNavigationItem): NavigationItem {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    type: (row.type as NavItemType) || 'custom',
    targetValue: row.targetValue ?? undefined,
    badge: row.badge ?? undefined,
    order: row.sortOrder,
    isActive: Boolean(row.isActive),
    openInNewTab: Boolean(row.openInNewTab)
  }
}

class NavigationStore {
  private memoryItems: NavigationItem[] = DEFAULT_NAV_ITEMS.map((item) => ({ ...item }))
  private cachedDbItems: NavigationItem[] | null = null
  private lastFetchedAt = 0
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes TTL fallback

  /**
   * Retrieves navigation items from cache or database.
   * If cache is fresh, returns instantly without performing any DB query.
   */
  async list(includeInactive = false, forceRefresh = false): Promise<NavigationItem[]> {
    const now = Date.now()
    const isCacheExpired = now - this.lastFetchedAt > this.CACHE_TTL_MS

    if (isDatabaseConfigured() && db && (!this.cachedDbItems || isCacheExpired || forceRefresh)) {
      try {
        const rows = await db.select().from(navTable).orderBy(asc(navTable.sortOrder))
        if (rows.length > 0) {
          this.cachedDbItems = rows.map(toNavigationItem)
          this.lastFetchedAt = now
        } else {
          // If the DB table is empty on first boot, initialize with defaults
          const seeded = await this.bulkSave(DEFAULT_NAV_ITEMS)
          return includeInactive ? seeded : seeded.filter((item) => item.isActive)
        }
      } catch (err) {
        console.error('[NavigationStore] Failed to query database, serving fallback cache/memory items:', err)
      }
    }

    const items = this.cachedDbItems ?? this.memoryItems
    const sorted = [...items].sort((a, b) => a.order - b.order)
    return includeInactive ? sorted : sorted.filter((item) => item.isActive)
  }

  async getById(id: string): Promise<NavigationItem | undefined> {
    const items = await this.list(true)
    return items.find((item) => item.id === id)
  }

  /**
   * Saves updated navigation items to the database and refreshes the cache immediately.
   */
  async bulkSave(items: NavigationItem[]): Promise<NavigationItem[]> {
    // Re-index orders cleanly
    const indexed = items.map((item, index) => ({
      ...item,
      order: index
    }))

    if (isDatabaseConfigured() && db) {
      // Clear and re-populate for atomic reorder & sync
      await db.delete(navTable)
      if (indexed.length > 0) {
        await db.insert(navTable).values(
          indexed.map((item) => ({
            id: item.id,
            label: item.label,
            href: item.href,
            type: item.type,
            targetValue: item.targetValue ?? null,
            badge: item.badge ?? null,
            sortOrder: item.order,
            isActive: item.isActive,
            openInNewTab: item.openInNewTab
          }))
        )
      }
    }

    const cloned = indexed.map((item) => ({ ...item }))
    this.cachedDbItems = cloned
    this.memoryItems = cloned
    this.lastFetchedAt = Date.now()
    return this.cachedDbItems
  }

  async resetToDefaults(): Promise<NavigationItem[]> {
    return this.bulkSave(DEFAULT_NAV_ITEMS)
  }

  invalidateCache(): void {
    this.cachedDbItems = null
    this.lastFetchedAt = 0
  }
}

export const navigationStore = new NavigationStore()
