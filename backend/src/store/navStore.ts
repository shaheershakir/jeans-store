import { asc, eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { navigationItems as navTable, type DbNavigationItem } from '../db/schema.js'
import type { NavigationItem, NavItemType } from '../schemas/navigation.js'

export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'nav-1',
    label: 'All Styles',
    href: '/shop',
    type: 'category',
    targetValue: 'all',
    order: 0,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-2',
    label: 'Denim',
    href: '/shop/jeans',
    type: 'category',
    targetValue: 'jeans',
    order: 1,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-3',
    label: 'Tops & T-Shirts',
    href: '/shop/tops',
    type: 'category',
    targetValue: 'tops',
    order: 2,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-4',
    label: 'Shirts',
    href: '/shop/shirts',
    type: 'category',
    targetValue: 'shirts',
    order: 3,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-5',
    label: 'Hoodies',
    href: '/shop/hoodies',
    type: 'category',
    targetValue: 'hoodies',
    order: 4,
    isActive: true,
    openInNewTab: false
  },
  {
    id: 'nav-6',
    label: 'Accessories',
    href: '/shop/accessories',
    type: 'category',
    targetValue: 'hats',
    order: 5,
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
    order: row.order,
    isActive: Boolean(row.isActive),
    openInNewTab: Boolean(row.openInNewTab)
  }
}

class NavigationStore {
  private memoryItems: NavigationItem[] = DEFAULT_NAV_ITEMS.map((item) => ({ ...item }))

  async list(includeInactive = false): Promise<NavigationItem[]> {
    if (isDatabaseConfigured() && db) {
      const rows = await db.select().from(navTable).orderBy(asc(navTable.order))
      const items = rows.map(toNavigationItem)
      if (items.length > 0) {
        return includeInactive ? items : items.filter((item) => item.isActive)
      }
    }

    const items = [...this.memoryItems].sort((a, b) => a.order - b.order)
    return includeInactive ? items : items.filter((item) => item.isActive)
  }

  async getById(id: string): Promise<NavigationItem | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(navTable).where(eq(navTable.id, id))
      return row ? toNavigationItem(row) : undefined
    }
    return this.memoryItems.find((item) => item.id === id)
  }

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
            order: item.order,
            isActive: item.isActive,
            openInNewTab: item.openInNewTab
          }))
        )
      }
    }

    this.memoryItems = indexed.map((item) => ({ ...item }))
    return this.memoryItems
  }

  async resetToDefaults(): Promise<NavigationItem[]> {
    return this.bulkSave(DEFAULT_NAV_ITEMS)
  }
}

export const navigationStore = new NavigationStore()
