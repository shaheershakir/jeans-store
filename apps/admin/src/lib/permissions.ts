/**
 * RBAC model. Permission keys map to sidebar visibility and route guards.
 */

export type Permission =
  | 'dashboard.read'
  | 'products.read'
  | 'products.write'
  | 'inventory.read'
  | 'inventory.write'
  | 'orders.read'
  | 'orders.write'
  | 'customers.read'
  | 'customers.write'
  | 'marketing.read'
  | 'marketing.write'
  | 'shipping.read'
  | 'shipping.write'
  | 'payments.read'
  | 'payments.write'
  | 'reviews.read'
  | 'reviews.write'
  | 'analytics.read'
  | 'ai.use'
  | 'settings.read'
  | 'settings.write'
  | 'admin.read'
  | 'admin.write'
  | 'audit.read'

export interface RoleDef {
  id: number
  name: string
  description: string
  permissions: Permission[]
}

const ALL: Permission[] = [
  'dashboard.read',
  'products.read',
  'products.write',
  'inventory.read',
  'inventory.write',
  'orders.read',
  'orders.write',
  'customers.read',
  'customers.write',
  'marketing.read',
  'marketing.write',
  'shipping.read',
  'shipping.write',
  'payments.read',
  'payments.write',
  'reviews.read',
  'reviews.write',
  'analytics.read',
  'ai.use',
  'settings.read',
  'settings.write',
  'admin.read',
  'admin.write',
  'audit.read',
]

export const ROLE_DEFS: RoleDef[] = [
  {
    id: 1,
    name: 'Super Admin',
    description: 'Full access to every module, including admin users and roles.',
    permissions: ALL,
  },
  {
    id: 2,
    name: 'Admin',
    description: 'Operates every module but cannot manage admin users or roles.',
    permissions: ALL.filter((p) => p !== 'admin.write'),
  },
  {
    id: 3,
    name: 'Product Manager',
    description: 'Owns the catalog: products, categories, collections, size & fit.',
    permissions: [
      'dashboard.read',
      'products.read',
      'products.write',
      'inventory.read',
      'analytics.read',
      'ai.use',
      'settings.read',
    ],
  },
  {
    id: 4,
    name: 'Inventory Manager',
    description: 'Manages stock levels, adjustments, purchases and alerts.',
    permissions: [
      'dashboard.read',
      'products.read',
      'inventory.read',
      'inventory.write',
      'analytics.read',
      'ai.use',
      'settings.read',
    ],
  },
  {
    id: 5,
    name: 'Order Manager',
    description: 'Processes orders, returns, refunds, shipping and payments.',
    permissions: [
      'dashboard.read',
      'orders.read',
      'orders.write',
      'customers.read',
      'shipping.read',
      'shipping.write',
      'payments.read',
      'analytics.read',
      'ai.use',
      'settings.read',
    ],
  },
  {
    id: 6,
    name: 'Marketing Manager',
    description: 'Owns coupons, promotions, banners and review moderation.',
    permissions: [
      'dashboard.read',
      'products.read',
      'marketing.read',
      'marketing.write',
      'reviews.read',
      'reviews.write',
      'analytics.read',
      'ai.use',
      'settings.read',
    ],
  },
  {
    id: 7,
    name: 'Support Agent',
    description: 'Answers customer queries and moderates reviews.',
    permissions: [
      'dashboard.read',
      'customers.read',
      'orders.read',
      'orders.write',
      'reviews.read',
      'reviews.write',
      'ai.use',
    ],
  },
]

export const roleById = (id: number): RoleDef | undefined => ROLE_DEFS.find((r) => r.id === id)

export function can(permissions: string[], permission: Permission): boolean {
  return permissions.includes(permission)
}