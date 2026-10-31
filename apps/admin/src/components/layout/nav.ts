import {
  BarChart3,
  Building2,
  Compass,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Layers,
  MessageSquareQuote,
  Package,
  Ruler,
  ScrollText,
  ShoppingCart,
  TicketPercent,
  Truck,
  UserRound,
  Users,
  Warehouse,
  Banknote,
  LayoutTemplate,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Permission } from '@/lib/permissions'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  perm?: Permission
  exact?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
  perm?: Permission
}

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard, perm: 'dashboard.read', exact: true }] },

  {
    label: 'Catalog',
    perm: 'products.read',
    items: [
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Categories', href: '/catalog/categories', icon: FolderTree },
      { label: 'Collections', href: '/catalog/collections', icon: Layers },
      { label: 'Size & Fit', href: '/size-fit', icon: Ruler },
    ],
  },

  { items: [{ label: 'Inventory', href: '/inventory', icon: Warehouse, perm: 'inventory.read' }] },

  {
    label: 'Orders',
    perm: 'orders.read',
    items: [
      { label: 'All Orders', href: '/orders', icon: ShoppingCart },
      { label: 'Refunds', href: '/refunds', icon: Banknote },
    ],
  },

  { items: [{ label: 'Customers', href: '/customers', icon: Users, perm: 'customers.read' }] },

  {
    label: 'Marketing',
    perm: 'marketing.read',
    items: [
      { label: 'Coupons', href: '/marketing/coupons', icon: TicketPercent },
    ],
  },

  { items: [{ label: 'Shipping', href: '/shipping', icon: Truck, perm: 'shipping.read' }] },
  { items: [{ label: 'Payments', href: '/payments', icon: CreditCard, perm: 'payments.read' }] },
  { items: [{ label: 'Reviews', href: '/reviews', icon: MessageSquareQuote, perm: 'reviews.read' }] },
  { items: [{ label: 'Analytics', href: '/analytics', icon: BarChart3, perm: 'analytics.read' }] },

  {
    label: 'Settings',
    perm: 'settings.read',
    items: [
      { label: 'Store Settings', href: '/settings/store', icon: Building2, perm: 'settings.read' },
      { label: 'Homepage Layout', href: '/settings/homepage', icon: LayoutTemplate, perm: 'settings.read' },
      { label: 'Storefront Navigation', href: '/settings/navigation', icon: Compass, perm: 'settings.read' },
      { label: 'Audit Logs', href: '/settings/audit', icon: ScrollText, perm: 'audit.read' },
    ],
  },
]

/** Flat list used for guards and breadcrumbs. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

export function permissionForPath(pathname: string): Permission | null {
  const item = ALL_NAV_ITEMS.find(
    (n) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + '/'))
  )
  return item?.perm ?? null
}

export { UserRound }
