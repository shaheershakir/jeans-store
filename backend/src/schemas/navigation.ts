import { z } from 'zod'

export const NAV_ITEM_TYPES = ['fit', 'category', 'custom'] as const
export type NavItemType = (typeof NAV_ITEM_TYPES)[number]

export const navigationItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  type: z.enum(NAV_ITEM_TYPES).default('custom'),
  targetValue: z.string().optional(),
  badge: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  openInNewTab: z.boolean().default(false)
})

export const bulkUpdateNavigationSchema = z.object({
  navigation: z.array(navigationItemSchema)
})

export type NavigationItem = z.infer<typeof navigationItemSchema>
export type BulkUpdateNavigationInput = z.infer<typeof bulkUpdateNavigationSchema>
