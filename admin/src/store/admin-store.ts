'use client'

import { create } from 'zustand'
import { persist, type PersistOptions } from 'zustand/middleware'
import { createDbState, DATA_VERSION, DEFAULT_NAVIGATION_ITEMS, DEFAULT_HOMEPAGE_CONFIG } from '@/data/seed'
import { nextPaymentOnTransition, transitionError, computeTotals } from '@/lib/order-machine'
import type {
  AdminUser,
  AppNotification,
  AuditLogEntry,
  Banner,
  Category,
  Collection,
  Color,
  Coupon,
  Customer,
  DbState,
  Fit,
  FulfillmentStatus,
  Gender,
  Material,
  NavigationItem,
  NavItemType,
  HomepageConfig,
  HomepageSectionType,
  Order,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductStatus,
  Promotion,
  Refund,
  RefundStatus,
  ReturnRequest,
  ReturnStatus,
  Review,
  ReviewStatus,
  Rise,
  Role,
  ShippingZone,
  SizeChart,
  StockStatus,
  StoreSettings,
  Variant,
  Wash,
} from '@/lib/types'
import { WAIST_SIZES } from '@/lib/constants'
import { uid, clamp } from '@/lib/utils'
import { roleById } from '@/lib/permissions'
import { generateBaseSku, generateProductScopedSku } from '@/lib/sku'

/** Shape accepted by saveProduct — create (no id) or update (with id). */
export interface VariantInput {
  id?: number
  size: number | string
  color: Color | string
  sku: string
  price: number
  stock: number

  reorderPoint: number
  weight: number
  barcode: string
  status?: 'Active' | 'Inactive'
}

export interface ProductInput {
  id?: number
  name: string
  slug: string
  sku: string
  description: string
  brand: string
  categoryId: number
  collectionId: number
  fit: Fit
  gender: Gender
  rise: Rise
  material: Material
  wash: Wash
  inseam: number
  price: number
  compareAtPrice: number | null
  costPrice: number
  taxRate: number
  status: ProductStatus
  featured: boolean
  image: string
  images: { url: string; alt: string }[]
  variants: VariantInput[]
}

export interface Session {
  userId: number
  userName: string
  userEmail: string
  roleId: number
  roleName: string
  permissions: string[]
}

/** A validation failure raised by store mutations. */
export class StoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoreError'
  }
}

const emptyDb = (): DbState => createDbState()

function nextId(list: { id: number }[]): number {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function nowIso(): string {
  return new Date().toISOString()
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface AdminState {
  data: DbState
  session: Session | null
  hydrated: boolean
  ready: boolean

  setHydrated: () => void
  setReady: () => void

  login: (user: AdminUser) => void
  logout: () => void

  log: (action: string, entity: string, entityId: string, detail: string) => void
  pushNotification: (n: Omit<AppNotification, 'id' | 'read' | 'at'>) => void
  markNotificationsRead: () => void

  saveProduct: (input: ProductInput) => Product
  deleteProduct: (id: number) => void
  setProductStatus: (id: number, status: ProductStatus) => void
  bulkSetProductsStatus: (ids: number[], status: ProductStatus) => void
  bulkDeleteProducts: (ids: number[]) => void
  saveCategory: (c: Omit<Category, 'id' | 'slug'> & { id?: number }) => Category
  deleteCategory: (id: number) => void
  saveCollection: (c: Omit<Collection, 'id' | 'slug' | 'description'> & { id?: number; description?: string }) => Collection
  deleteCollection: (id: number) => void
  saveSizeChart: (chart: SizeChart) => void

  adjustStock: (variantId: number, delta: number, reason: string, reference?: string) => void
  bulkAdjustStock: (adjustments: { variantId: number; delta: number; reason: string }[]) => void

  transitionOrder: (orderId: number, to: FulfillmentStatus) => void
  setOrderPaymentStatus: (orderId: number, status: PaymentStatus) => void
  addOrderNote: (orderId: number, text: string, internal?: boolean) => void
  setOrderTracking: (orderId: number, carrier: string, trackingNumber: string) => void
  createOrder: (input: {
    customerId: number
    items: { variantId: number; quantity: number }[]
    paymentMethod: PaymentMethod
    discount: number
  }) => Order

  createReturn: (orderId: number, reason: string, details: string) => ReturnRequest
  transitionReturn: (returnId: number, to: ReturnStatus) => void
  createRefund: (input: { orderId: number; returnId?: number; amount: number; reason: string; method: PaymentMethod }) => Refund
  processRefund: (refundId: number, fail?: boolean) => void
  cancelReturn: (returnId: number) => void

  saveCoupon: (c: Coupon) => void
  deleteCoupon: (id: number) => void
  toggleCoupon: (id: number) => void
  savePromotion: (p: Promotion) => void
  deletePromotion: (id: number) => void
  saveBanner: (b: Banner) => void
  deleteBanner: (id: number) => void

  setReviewStatus: (id: number, status: ReviewStatus) => void
  respondToReview: (id: number, text: string) => void

  saveAdminUser: (u: AdminUser) => void
  deleteAdminUser: (id: number) => void
  setAdminUserStatus: (id: number, status: 'Active' | 'Inactive') => void
  saveRole: (r: Role) => void
  saveShippingZone: (z: ShippingZone) => void
  deleteShippingMethod: (methodId: number) => void
  updateSettings: (patch: Partial<StoreSettings>) => void

  saveNavigationItem: (item: Partial<NavigationItem> & { label: string; href: string }) => NavigationItem
  deleteNavigationItem: (id: string) => void
  reorderNavigationItems: (items: NavigationItem[]) => void
  toggleNavigationItem: (id: string) => void
  resetNavigationToDefault: () => void
  setNavigation: (items: NavigationItem[]) => void

  setHomepageConfig: (config: HomepageConfig) => void
  updateHomepageSection: <K extends keyof HomepageConfig>(section: K, value: HomepageConfig[K]) => void
  reorderHomepageSections: (order: HomepageSectionType[]) => void
  toggleHomepageSection: (section: HomepageSectionType) => void
  resetHomepageConfig: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => {
      /** Attach current user to an audit entry. */
      const actor = (action: string, entity: string, entityId: string, detail: string): AuditLogEntry => {
        const session = get().session
        return {
          id: nextId(get().data.auditLog),
          userId: session?.userId ?? 0,
          userName: session?.userName ?? 'System',
          action,
          entity,
          entityId,
          detail,
          at: nowIso(),
        }
      }

      const actorName = (): string => get().session?.userName ?? 'System'

      const cloneProducts = (): Product[] =>
        get().data.products.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) }))

      const reserveForOrder = (items: Order['items']) => {
        const products = cloneProducts()
        for (const item of items) {
          const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId)
          if (variant) variant.reserved += Math.min(item.quantity, Math.max(0, variant.stock))
        }
        set({ data: { ...get().data, products } })
      }

      const releaseReservation = (items: Order['items']) => {
        const products = cloneProducts()
        for (const item of items) {
          const variant = products.find((p) => p.id === item.productId)?.variants.find((v) => v.id === item.variantId)
          if (variant && variant.reserved > 0) {
            variant.reserved = Math.max(0, variant.reserved - item.quantity)
          }
        }
        set({ data: { ...get().data, products } })
      }

      /** Deducts sold stock and records SALE movements. */
      const deductStock = (items: Order['items'], orderNumber: string) => {
        const products = cloneProducts()
        const movements = [...get().data.inventoryMovements]
        let movId = nextId(movements)
        for (const item of items) {
          const product = products.find((p) => p.id === item.productId)
          const variant = product?.variants.find((v) => v.id === item.variantId)
          if (!variant) continue
          const deduct = Math.min(item.quantity, variant.stock)
          variant.stock -= deduct
          variant.reserved = Math.max(0, variant.reserved - item.quantity)
          movements.push({
            id: movId++,
            productId: product!.id,
            variantId: variant.id,
            sku: variant.sku,
            type: 'SALE',
            delta: -deduct,
            before: variant.stock + deduct,
            after: variant.stock,
            reason: `Order ${orderNumber}`,
            reference: orderNumber,
            userId: get().session?.userId ?? null,
            userName: actorName(),
            createdAt: nowIso(),
          })
        }
        set({ data: { ...get().data, products, inventoryMovements: movements } })
      }

      /** Returns returned items to stock. */
      const restockItems = (items: Order['items'], reference: string) => {
        const products = cloneProducts()
        const movements = [...get().data.inventoryMovements]
        let movId = nextId(movements)
        for (const item of items) {
          const product = products.find((p) => p.id === item.productId)
          const variant = product?.variants.find((v) => v.id === item.variantId)
          if (!variant) continue
          variant.stock += item.quantity
          movements.push({
            id: movId++,
            productId: product!.id,
            variantId: variant.id,
            sku: variant.sku,
            type: 'RETURN',
            delta: item.quantity,
            before: variant.stock - item.quantity,
            after: variant.stock,
            reason: reference,
            reference,
            userId: get().session?.userId ?? null,
            userName: actorName(),
            createdAt: nowIso(),
          })
        }
        set({ data: { ...get().data, products, inventoryMovements: movements } })
      }

      return {
        data: emptyDb(),
        session: null,
        hydrated: false,
        ready: false,

        setHydrated: () => set({ hydrated: true }),
        setReady: () => set({ ready: true }),

        login: (user) => {
          const role = roleById(user.roleId)
          if (!role) throw new StoreError('Role not found')
          if (user.status !== 'Active') throw new StoreError('This admin account is inactive.')
          set({
            session: {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              roleId: role.id,
              roleName: role.name,
              permissions: [...role.permissions],
            },
            data: {
              ...get().data,
              adminUsers: get().data.adminUsers.map((u) => (u.id === user.id ? { ...u, lastLoginAt: nowIso() } : u)),
            },
          })
        },
        logout: () => set({ session: null }),

        log: (action, entity, entityId, detail) =>
          set({ data: { ...get().data, auditLog: [...get().data.auditLog, actor(action, entity, entityId, detail)] } }),

        pushNotification: (n) =>
          set({
            data: {
              ...get().data,
              notifications: [
                { ...n, id: nextId(get().data.notifications), read: false, at: nowIso() },
                ...get().data.notifications,
              ],
            },
          }),
        markNotificationsRead: () =>
          set({
            data: {
              ...get().data,
              notifications: get().data.notifications.map((n) => ({ ...n, read: true })),
            },
          }),

        updateSettings: (patch) => {
          set({ data: { ...get().data, settings: { ...get().data.settings, ...patch } } })
          get().log('Updated settings', 'Store', get().data.settings.storeName, `Updated ${Object.keys(patch).join(', ')}`)
        },

        saveProduct: (input) => {
          const { products, categories } = get().data
          const categorySlug = categories.find((c) => c.id === input.categoryId)?.slug || 'printed-tees'

          // Prevent duplicate variants for the same product
          const seenCombos = new Set<string>()
          for (const v of input.variants) {
            const comboKey = `${String(v.color).toLowerCase()}__${String(v.size).toUpperCase()}`
            if (seenCombos.has(comboKey)) {
              throw new StoreError(
                `Duplicate variant: A variant with color "${v.color}" and size "${v.size}" already exists on this product.`
              )
            }
            seenCombos.add(comboKey)
          }

          const skus = new Set<string>()
          for (const p of products) {
            if (p.id === input.id) continue
            skus.add(p.sku.toUpperCase())
            for (const v of p.variants) skus.add(v.sku.toUpperCase())
          }
          if (input.variants.some((v) => v.stock < 0)) throw new StoreError('Stock cannot be negative.')
          if (input.price <= 0) throw new StoreError('Price must be greater than zero.')
          if (input.compareAtPrice != null && input.compareAtPrice <= input.price) {
            throw new StoreError('Compare-at price must be higher than the selling price.')
          }
          if (skus.has(input.sku.toUpperCase())) {
            throw new StoreError(`SKU ${input.sku} already exists on another product.`)
          }

          if (input.id != null) {
            const existing = products.find((p) => p.id === input.id)
            if (!existing) throw new StoreError('Product not found.')
            let variantId = nextId(existing.variants)

            const variants: Variant[] = input.variants.map((v) => {
              if (v.id != null) {
                // Preserve existing variant SKU
                const ev = existing.variants.find((x) => x.id === v.id)
                const preservedSku = v.sku?.trim() ? v.sku.trim().toUpperCase() : (ev?.sku || v.sku)
                return {
                  ...v,
                  id: v.id,
                  productId: existing.id,
                  sku: preservedSku,
                  status: v.status ?? 'Active',
                } as Variant
              }

              // Newly added variant to existing product
              const resolvedSku = v.sku?.trim()
                ? v.sku.trim().toUpperCase()
                : generateBaseSku({
                    category: categorySlug,
                    productType: input.fit,
                    color: String(v.color),
                    size: v.size,
                    productId: existing.id,
                  })

              return {
                id: variantId++,
                productId: existing.id,
                size: v.size,
                color: v.color,
                sku: resolvedSku,
                price: v.price,
                stock: v.stock,
                reserved: 0,
                reorderPoint: v.reorderPoint,
                weight: v.weight,
                barcode: v.barcode || `890${Math.floor(10000000000 + Math.random() * 89999999999)}`,
                status: v.status ?? 'Active',
              }
            })

            const updated: Product = {
              ...existing,
              ...input,
              id: existing.id,
              updatedAt: nowIso(),
              images: input.images.map((im, idx) => ({
                id: existing.images[idx]?.id ?? nextId(existing.images),
                url: im.url,
                alt: im.alt,
                order: idx,
              })),
              variants,
            }
            set({ data: { ...get().data, products: products.map((p) => (p.id === existing.id ? updated : p)) } })
            get().log('Updated product', 'Product', updated.name, `Saved ${updated.name} with ${variants.length} variants`)
            return updated
          }

          const id = nextId(products)
          let variantId = nextId(products.flatMap((p) => p.variants))
          const variants: Variant[] = input.variants.map((v) => {
            const resolvedSku = v.sku?.trim()
              ? v.sku.trim().toUpperCase()
              : generateBaseSku({
                  category: categorySlug,
                  productType: input.fit,
                  color: String(v.color),
                  size: v.size,
                  productId: id,
                })

            return {
              id: variantId++,
              productId: id,
              size: v.size,
              color: v.color,
              sku: resolvedSku,
              price: v.price,
              stock: v.stock,
              reserved: 0,
              reorderPoint: v.reorderPoint,
              weight: v.weight,
              barcode: v.barcode || `890${Math.floor(10000000000 + Math.random() * 89999999999)}`,
              status: v.status ?? 'Active',
            }
          })

          const created: Product = {
            id,
            name: input.name,
            slug: input.slug,
            sku: input.sku,
            description: input.description,
            brand: input.brand,
            categoryId: input.categoryId,
            collectionId: input.collectionId,
            fit: input.fit,
            gender: input.gender,
            rise: input.rise,
            material: input.material,
            wash: input.wash,
            inseam: input.inseam,
            price: input.price,
            compareAtPrice: input.compareAtPrice,
            costPrice: input.costPrice,
            taxRate: input.taxRate,
            status: input.status,
            featured: input.featured,
            views: 0,
            wishlists: 0,
            image: input.image,
            images: input.images.map((im, idx) => ({ id: idx + 1, url: im.url, alt: im.alt, order: idx })),
            variants,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          set({ data: { ...get().data, products: [...products, created] } })
          get().log('Created product', 'Product', created.name, `Added ${created.name} with ${variants.length} variants`)
          return created
        },

        deleteProduct: (id) => {
          const product = get().data.products.find((p) => p.id === id)
          if (!product) throw new StoreError('Product not found.')
          set({ data: { ...get().data, products: get().data.products.filter((p) => p.id !== id) } })
          get().log('Deleted product', 'Product', product.name, `Removed ${product.name}`)
        },

        setProductStatus: (id, status) => {
          const product = get().data.products.find((p) => p.id === id)
          if (!product) throw new StoreError('Product not found.')
          set({
            data: {
              ...get().data,
              products: get().data.products.map((p) => (p.id === id ? { ...p, status, updatedAt: nowIso() } : p)),
            },
          })
          get().log(`Set product status to ${status}`, 'Product', product.name, `${product.name} → ${status}`)
        },

        bulkSetProductsStatus: (ids, status) => {
          set({
            data: {
              ...get().data,
              products: get().data.products.map((p) =>
                ids.includes(p.id) ? { ...p, status, updatedAt: nowIso() } : p
              ),
            },
          })
          get().log(`Bulk status → ${status}`, 'Product', ids.join(','), `Changed status of ${ids.length} products`)
        },

        bulkDeleteProducts: (ids) => {
          set({
            data: { ...get().data, products: get().data.products.filter((p) => !ids.includes(p.id)) },
          })
          get().log('Bulk delete', 'Product', ids.join(','), `Deleted ${ids.length} products`)
        },

        saveCategory: (c) => {
          if (c.id != null) {
            const id = c.id
            const updated: Category = {
              id,
              name: c.name,
              slug: slugFromName(c.name),
              description: c.description,
              parentId: c.parentId ?? null,
            }
            set({
              data: {
                ...get().data,
                categories: get().data.categories.map((x) => (x.id === id ? updated : x)),
              },
            })
            get().log('Updated category', 'Category', updated.name, `Saved category ${updated.name}`)
            return updated
          }
          const id = nextId(get().data.categories)
          const created: Category = {
            id,
            name: c.name,
            slug: slugFromName(c.name),
            description: c.description,
            parentId: c.parentId ?? null,
          }
          set({ data: { ...get().data, categories: [...get().data.categories, created] } })
          get().log('Created category', 'Category', created.name, `Added category ${created.name}`)
          return created
        },

        deleteCategory: (id) => {
          set({ data: { ...get().data, categories: get().data.categories.filter((c) => c.id !== id) } })
          get().log('Deleted category', 'Category', String(id), 'Removed category')
        },

        saveCollection: (c) => {
          if (c.id != null) {
            const id = c.id
            const updated: Collection = {
              id,
              name: c.name,
              slug: slugFromName(c.name),
              description: c.description ?? '',
              status: c.status,
            }
            set({
              data: { ...get().data, collections: get().data.collections.map((x) => (x.id === id ? updated : x)) },
            })
            get().log('Updated collection', 'Collection', updated.name, `Saved collection ${updated.name}`)
            return updated
          }
          const id = nextId(get().data.collections)
          const created: Collection = {
            id,
            name: c.name,
            slug: slugFromName(c.name),
            description: c.description ?? '',
            status: c.status,
          }
          set({ data: { ...get().data, collections: [...get().data.collections, created] } })
          get().log('Created collection', 'Collection', created.name, `Added collection ${created.name}`)
          return created
        },

        deleteCollection: (id) => {
          set({ data: { ...get().data, collections: get().data.collections.filter((c) => c.id !== id) } })
          get().log('Deleted collection', 'Collection', String(id), 'Removed collection')
        },

        saveSizeChart: (chart) => {
          const others = get().data.sizeCharts.filter((c) => c.fit !== chart.fit)
          set({ data: { ...get().data, sizeCharts: [...others, chart] } })
          get().log('Updated size chart', 'Size & Fit', chart.fit, `Saved the ${chart.fit} size chart`)
        },

        adjustStock: (variantId, delta, reason, reference) => {
          if (delta === 0) throw new StoreError('Stock change cannot be zero.')
          const products = cloneProducts()
          const movements = [...get().data.inventoryMovements]
          let target: { product: Product; variant: Variant } | null = null
          for (const p of products) {
            const v = p.variants.find((x) => x.id === variantId)
            if (v) {
              target = { product: p, variant: v }
              break
            }
          }
          if (!target) throw new StoreError('Variant not found.')
          const before = target.variant.stock
          if (before + delta < 0) {
            throw new StoreError(
              `Cannot remove ${Math.abs(delta)} units — only ${before} unit${before === 1 ? '' : 's'} in stock.`
            )
          }
          target.variant.stock = before + delta
          target.variant.reserved = Math.min(target.variant.reserved, target.variant.stock)
          movements.push({
            id: nextId(movements),
            productId: target.product.id,
            variantId: target.variant.id,
            sku: target.variant.sku,
            type: delta > 0 ? 'PURCHASE' : 'ADJUSTMENT',
            delta,
            before,
            after: before + delta,
            reason: reason || 'Manual adjustment',
            reference: reference ?? `ADJ-${Date.now().toString(36).toUpperCase()}`,
            userId: get().session?.userId ?? null,
            userName: actorName(),
            createdAt: nowIso(),
          })
          set({ data: { ...get().data, products, inventoryMovements: movements } })
          get().log(
            'Adjusted stock',
            'Variant',
            target.variant.sku,
            `SKU ${target.variant.sku}: ${before} → ${before + delta} (${reason})`
          )
          if (before + delta <= target.variant.reorderPoint) {
            get().pushNotification({
              type: 'low-stock',
              title: 'Low stock alert',
              body: `${target.product.name} — W${target.variant.size} ${target.variant.color} is now ${target.variant.stock} units.`,
            })
          }
        },

        bulkAdjustStock: (adjustments) => {
          for (const a of adjustments) get().adjustStock(a.variantId, a.delta, a.reason)
        },

        transitionOrder: (orderId, to) => {
          const orders = get().data.orders.map((o) => ({
            ...o,
            timeline: [...o.timeline],
            notes: [...o.notes],
            items: [...o.items],
          }))
          const order = orders.find((o) => o.id === orderId)
          if (!order) throw new StoreError('Order not found.')
          const guard = transitionError(order.fulfillmentStatus, to)
          if (guard) throw new StoreError(guard)
          const from = order.fulfillmentStatus
          order.fulfillmentStatus = to
          const paidSync = nextPaymentOnTransition(to, order.paymentStatus, order.paymentMethod)
          if (paidSync) order.paymentStatus = paidSync
          order.updatedAt = nowIso()
          if (to === 'Shipped') {
            if (!order.carrier) order.carrier = 'Delhivery'
            if (!order.trackingNumber) {
              order.trackingNumber = `IN${String(1000000 + orderId * 137).slice(-9)}${Math.floor(10 + Math.random() * 89)}`
            }
            order.shippedAt = nowIso()
            releaseReservation(order.items)
            deductStock(order.items, order.number)
          }
          if (to === 'Delivered') order.deliveredAt = nowIso()
          if (to === 'Cancelled') releaseReservation(order.items)
          if (to === 'Returned') restockItems(order.items, `Return for ${order.number}`)
          order.timeline.push({
            id: nextId(order.timeline),
            status: to,
            note: to === 'Shipped' ? `Handed to ${order.carrier}` : '',
            at: nowIso(),
            by: actorName(),
          })
          set({ data: { ...get().data, orders } })
          get().log('Order transition', 'Order', order.number, `${order.number}: ${from} → ${to}`)
          get().pushNotification({
            type: 'order',
            title: `Order ${to}`,
            body: `${order.number} is now ${to}.`,
          })
        },

        setOrderPaymentStatus: (orderId, status) => {
          const orders = get().data.orders.map((o) => ({ ...o }))
          const order = orders.find((o) => o.id === orderId)
          if (!order) throw new StoreError('Order not found.')
          if (order.paymentStatus === 'Refunded') throw new StoreError('Cannot change payment on a refunded order.')
          order.paymentStatus = status
          if (status === 'Paid' && !order.transactionId) {
            order.transactionId = `TXN${Date.now().toString(36).toUpperCase()}`
          }
          order.timeline.push({
            id: nextId(order.timeline),
            status: 'Payment updated',
            note: `Payment marked ${status}`,
            at: nowIso(),
            by: actorName(),
          })
          set({ data: { ...get().data, orders } })
          get().log('Updated payment status', 'Order', order.number, `${order.number} payment → ${status}`)
        },

        addOrderNote: (orderId, text, internal = false) => {
          if (!text.trim()) throw new StoreError('Note cannot be empty.')
          const orders = get().data.orders.map((o) => ({ ...o, notes: [...o.notes] }))
          const order = orders.find((o) => o.id === orderId)
          if (!order) throw new StoreError('Order not found.')
          order.notes.push({ id: nextId(order.notes), text, at: nowIso(), by: actorName(), internal })
          set({ data: { ...get().data, orders } })
          get().log('Added note', 'Order', order.number, `Note on ${order.number}: ${text.slice(0, 60)}`)
        },

        setOrderTracking: (orderId, carrier, trackingNumber) => {
          if (!carrier.trim() || !trackingNumber.trim()) throw new StoreError('Carrier and tracking are required.')
          const orders = get().data.orders.map((o) => ({ ...o }))
          const order = orders.find((o) => o.id === orderId)
          if (!order) throw new StoreError('Order not found.')
          order.carrier = carrier
          order.trackingNumber = trackingNumber
          order.timeline.push({
            id: nextId(order.timeline),
            status: 'Tracking added',
            note: `${carrier} — ${trackingNumber}`,
            at: nowIso(),
            by: actorName(),
          })
          set({ data: { ...get().data, orders } })
          get().log('Added tracking', 'Order', order.number, `${order.number} tracking ${carrier} ${trackingNumber}`)
        },

        createOrder: (input) => {
          const customer = get().data.customers.find((c) => c.id === input.customerId)
          if (!customer) throw new StoreError('Customer not found.')
          if (input.items.length === 0) throw new StoreError('Add at least one item.')
          const allVariants = get().data.products.flatMap((p) => p.variants)
          const items: Order['items'] = input.items.map((it, idx) => {
            const variant = allVariants.find((v) => v.id === it.variantId)
            const product = get().data.products.find((p) => p.variants.some((v) => v.id === it.variantId))
            if (!variant || !product) throw new StoreError('Variant not found.')
            if (it.quantity < 1) throw new StoreError('Quantity must be at least 1.')
            return {
              id: idx + 1,
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              variantLabel: `${variant.size}W · ${variant.color}`,
              sku: variant.sku,
              quantity: it.quantity,
              price: variant.price,
              total: variant.price * it.quantity,
            }
          })
          const subtotal = items.reduce((sum, i) => sum + i.total, 0)
          const discount = Math.min(input.discount, subtotal)
          const { shippingFee, tax, total } = computeTotals(subtotal, discount, get().data.settings.freeShippingThreshold)
          const id = nextId(get().data.orders)
          let maxSeq = 2000
          for (const o of get().data.orders) {
            const m = /^([A-Z]+)-(\d+)$/.exec(o.number)
            if (m) maxSeq = Math.max(maxSeq, parseInt(m[2], 10))
          }
          const order: Order = {
            id,
            number: `IN-${maxSeq + 1}`,
            customerId: customer.id,
            items,
            subtotal,
            discount,
            shippingFee,
            tax,
            total,
            paymentMethod: input.paymentMethod,
            paymentStatus: 'Pending',
            transactionId: null,
            fulfillmentStatus: 'Pending',
            shippingAddress: customer.addresses[0],
            carrier: null,
            trackingNumber: null,
            shippedAt: null,
            deliveredAt: null,
            timeline: [
              {
                id: 1,
                status: 'Order placed',
                note: 'Created manually by operations',
                at: nowIso(),
                by: actorName(),
              },
            ],
            notes: [],
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          reserveForOrder(items)
          set({ data: { ...get().data, orders: [...get().data.orders, order] } })
          get().log('Created order', 'Order', order.number, `Created ${order.number} for ${customer.name}`)
          return order
        },

        createReturn: (orderId, reason, details) => {
          const order = get().data.orders.find((o) => o.id === orderId)
          if (!order) throw new StoreError('Order not found.')
          if (order.fulfillmentStatus !== 'Delivered') {
            throw new StoreError('Only delivered orders can be returned.')
          }
          const existing = get().data.returns.find((r) => r.orderId === orderId && r.status !== 'Rejected')
          if (existing) throw new StoreError('A return already exists for this order.')
          if (!reason.trim()) throw new StoreError('Please choose a return reason.')
          const id = nextId(get().data.returns)
          let maxSeq = 400
          for (const r of get().data.returns) {
            const m = /^RTN-(\d+)$/.exec(r.number)
            if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10))
          }
          const ret: ReturnRequest = {
            id,
            number: `RTN-${maxSeq + 1}`,
            orderId,
            customerId: order.customerId,
            items: order.items,
            reason,
            details,
            status: 'Requested',
            amount: order.total,
            requestedAt: nowIso(),
            updatedAt: nowIso(),
          }
          set({ data: { ...get().data, returns: [...get().data.returns, ret] } })
          get().log('Created return', 'Return', ret.number, `${ret.number} for ${order.number} — ${reason}`)
          return ret
        },

        transitionReturn: (returnId, to) => {
          const returns = get().data.returns.map((r) => ({ ...r, items: [...r.items] }))
          const ret = returns.find((r) => r.id === returnId)
          if (!ret) throw new StoreError('Return not found.')
          const machine: Partial<Record<ReturnStatus, ReturnStatus[]>> = {
            Requested: ['Approved', 'Rejected'],
            Approved: ['Pickup Scheduled', 'Rejected'],
            'Pickup Scheduled': ['Received'],
            Received: ['Refunded'],
          }
          const allowed = machine[ret.status] ?? []
          if (!allowed.includes(to)) {
            throw new StoreError(`Return cannot move from “${ret.status}” to “${to}”.`)
          }
          ret.status = to
          ret.updatedAt = nowIso()
          const orders = get().data.orders.map((o) => ({ ...o, timeline: [...o.timeline] }))
          const order = orders.find((o) => o.id === ret.orderId)

          if (to === 'Received' && order) {
            order.fulfillmentStatus = 'Returned'
            restockItems(ret.items, ret.number)
          }
          if (to === 'Refunded') {
            const id = nextId(get().data.refunds)
            const refund: Refund = {
              id,
              number: `RF-${500 + id}`,
              orderId: ret.orderId,
              returnId: ret.id,
              customerId: ret.customerId,
              amount: ret.amount,
              reason: `Return ${ret.number} — ${ret.reason}`,
              method: order?.paymentMethod === 'COD' ? 'UPI' : order?.paymentMethod ?? 'UPI',
              status: 'Pending',
              createdAt: nowIso(),
              processedAt: null,
            }
            set({ data: { ...get().data, returns, refunds: [...get().data.refunds, refund] } })
            get().log('Refund created for return', 'Refund', refund.number, `${refund.number} for ${ret.number} — ₹${refund.amount}`)
            return
          }
          if (order) {
            order.timeline.push({
              id: nextId(order.timeline),
              status: `Return ${to}`,
              note: `${ret.number} ${to.toLowerCase()}`,
              at: nowIso(),
              by: actorName(),
            })
          }
          set({ data: { ...get().data, returns, orders } })
          get().log('Return transition', 'Return', ret.number, `${ret.number}: → ${to}`)
        },

        createRefund: (input) => {
          const order = get().data.orders.find((o) => o.id === input.orderId)
          if (!order) throw new StoreError('Order not found.')
          if (input.amount <= 0) throw new StoreError('Refund amount must be positive.')
          if (input.amount > order.total) throw new StoreError('Refund cannot exceed the order total.')
          if (order.paymentStatus === 'Refunded') throw new StoreError('This order has already been refunded.')
          const id = nextId(get().data.refunds)
          const refund: Refund = {
            id,
            number: `RF-${500 + id}`,
            orderId: order.id,
            returnId: input.returnId ?? null,
            customerId: order.customerId,
            amount: input.amount,
            reason: input.reason || 'Manual refund',
            method: input.method,
            status: 'Pending',
            createdAt: nowIso(),
            processedAt: null,
          }
          set({ data: { ...get().data, refunds: [...get().data.refunds, refund] } })
          get().log('Created refund', 'Refund', refund.number, `${refund.number} — ₹${refund.amount} on ${order.number}`)
          return refund
        },

        processRefund: (refundId, fail = false) => {
          const refunds = get().data.refunds.map((r) => ({ ...r }))
          const refund = refunds.find((r) => r.id === refundId)
          if (!refund) throw new StoreError('Refund not found.')
          if (refund.status === 'Processed') throw new StoreError('Refund already processed.')
          refund.status = fail ? 'Failed' : 'Processed'
          refund.processedAt = fail ? null : nowIso()
          const orders = get().data.orders.map((o) => ({ ...o, timeline: [...o.timeline] }))
          const order = orders.find((o) => o.id === refund.orderId)
          const relatedReturn = get().data.returns.find((r) => r.id === refund.returnId)

          if (!fail && order) {
            order.paymentStatus = 'Refunded'
            if (order.fulfillmentStatus === 'Returned' || order.fulfillmentStatus === 'Cancelled') {
              order.fulfillmentStatus = 'Refunded'
            }
            order.timeline.push({
              id: nextId(order.timeline),
              status: 'Refund processed',
              note: `${refund.number} — ₹${refund.amount} to customer`,
              at: nowIso(),
              by: actorName(),
            })
          }
          const returns = relatedReturn
            ? get().data.returns.map((r) =>
                r.id === relatedReturn.id && !fail ? { ...r, status: 'Completed' as const } : r
              )
            : get().data.returns
          set({ data: { ...get().data, refunds, orders, returns } })
          get().log(fail ? 'Refund failed' : 'Refund processed', 'Refund', refund.number, `${refund.number} — ₹${refund.amount}`)
        },

        cancelReturn: (returnId) => {
          const returns = get().data.returns.map((r) => ({ ...r }))
          const ret = returns.find((r) => r.id === returnId)
          if (!ret) throw new StoreError('Return not found.')
          if (ret.status === 'Completed' || ret.status === 'Refunded') {
            throw new StoreError('Return is already past the cancelling stage.')
          }
          ret.status = 'Rejected'
          ret.updatedAt = nowIso()
          set({ data: { ...get().data, returns } })
          get().log('Rejected return', 'Return', ret.number, `${ret.number} rejected`)
        },

        saveCoupon: (c) => {
          const dup = get().data.coupons.find((x) => x.id !== c.id && x.code.toUpperCase() === c.code.toUpperCase())
          if (dup) throw new StoreError(`Coupon code ${c.code} already exists.`)
          if (c.value <= 0) throw new StoreError('Discount value must be positive.')
          const isNew = !get().data.coupons.some((x) => x.id === c.id)
          const coupons = isNew
            ? [...get().data.coupons, c]
            : get().data.coupons.map((x) => (x.id === c.id ? c : x))
          set({ data: { ...get().data, coupons } })
          get().log(isNew ? 'Created coupon' : 'Updated coupon', 'Coupon', c.code, `${c.code} (${c.type} ${c.value})`)
        },

        deleteCoupon: (id) => {
          const c = get().data.coupons.find((x) => x.id === id)
          if (!c) throw new StoreError('Coupon not found.')
          set({ data: { ...get().data, coupons: get().data.coupons.filter((x) => x.id !== id) } })
          get().log('Deleted coupon', 'Coupon', c.code, `Removed ${c.code}`)
        },

        toggleCoupon: (id) => {
          const c = get().data.coupons.find((x) => x.id === id)
          if (!c) throw new StoreError('Coupon not found.')
          set({
            data: {
              ...get().data,
              coupons: get().data.coupons.map((x) => (x.id === id ? { ...x, isActive: !x.isActive } : x)),
            },
          })
          get().log(c.isActive ? 'Deactivated coupon' : 'Activated coupon', 'Coupon', c.code, `${c.code} → ${c.isActive ? 'inactive' : 'active'}`)
        },

        savePromotion: (p) => {
          const isNew = !get().data.promotions.some((x) => x.id === p.id)
          const promotions = isNew
            ? [...get().data.promotions, p]
            : get().data.promotions.map((x) => (x.id === p.id ? p : x))
          set({ data: { ...get().data, promotions } })
          get().log(isNew ? 'Created promotion' : 'Updated promotion', 'Promotion', p.title, p.title)
        },

        deletePromotion: (id) => {
          set({ data: { ...get().data, promotions: get().data.promotions.filter((x) => x.id !== id) } })
          get().log('Deleted promotion', 'Promotion', String(id), 'Removed promotion')
        },

        saveBanner: (b) => {
          const isNew = !get().data.banners.some((x) => x.id === b.id)
          const banners = isNew
            ? [...get().data.banners, b]
            : get().data.banners.map((x) => (x.id === b.id ? b : x))
          set({ data: { ...get().data, banners } })
          get().log(isNew ? 'Created banner' : 'Updated banner', 'Banner', b.title, b.title)
        },

        deleteBanner: (id) => {
          set({ data: { ...get().data, banners: get().data.banners.filter((x) => x.id !== id) } })
          get().log('Deleted banner', 'Banner', String(id), 'Removed banner')
        },

        setReviewStatus: (id, status) => {
          const review = get().data.reviews.find((r) => r.id === id)
          if (!review) throw new StoreError('Review not found.')
          set({
            data: {
              ...get().data,
              reviews: get().data.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
            },
          })
          get().log(`Review → ${status}`, 'Review', `#${id}`, `Review #${id} ${status.toLowerCase()}`)
        },

        respondToReview: (id, text) => {
          if (!text.trim()) throw new StoreError('Response cannot be empty.')
          set({
            data: {
              ...get().data,
              reviews: get().data.reviews.map((r) =>
                r.id === id ? { ...r, response: text, respondedAt: nowIso() } : r
              ),
            },
          })
          get().log('Replied to review', 'Review', `#${id}`, `Posted merchant response on review #${id}`)
        },

        saveAdminUser: (u) => {
          const existing = get().data.adminUsers.find(
            (x) => x.id !== u.id && x.email.toLowerCase() === u.email.toLowerCase()
          )
          if (existing) throw new StoreError(`A user with email ${u.email} already exists.`)
          const isNew = !get().data.adminUsers.some((x) => x.id === u.id)
          const users = isNew
            ? [...get().data.adminUsers, u]
            : get().data.adminUsers.map((x) => (x.id === u.id ? u : x))
          set({ data: { ...get().data, adminUsers: users } })
          get().log(isNew ? 'Created admin user' : 'Updated admin user', 'Admin User', u.name, `${u.name} — role ${u.roleId}`)
        },

        deleteAdminUser: (id) => {
          if (get().session?.userId === id) throw new StoreError('You cannot delete your own account.')
          const u = get().data.adminUsers.find((x) => x.id === id)
          set({ data: { ...get().data, adminUsers: get().data.adminUsers.filter((x) => x.id !== id) } })
          get().log('Deleted admin user', 'Admin User', u?.name ?? String(id), `Removed ${u?.name ?? id}`)
        },

        setAdminUserStatus: (id, status) => {
          if (get().session?.userId === id && status === 'Inactive') {
            throw new StoreError('You cannot deactivate your own account.')
          }
          const u = get().data.adminUsers.find((x) => x.id === id)
          set({
            data: {
              ...get().data,
              adminUsers: get().data.adminUsers.map((x) => (x.id === id ? { ...x, status } : x)),
            },
          })
          get().log('Changed admin status', 'Admin User', u?.name ?? '', `${u?.name} → ${status}`)
        },

        saveRole: (r) => {
          set({
            data: { ...get().data, roles: get().data.roles.map((x) => (x.id === r.id ? r : x)) },
          })
          const role = get().data.roles.find((x) => x.id === r.id)
          const session = get().session
          if (session && role && session.roleId === r.id) {
            set({ session: { ...session, roleName: role.name, permissions: [...role.permissions] } })
          }
          get().log('Updated role', 'Role', r.name, `Saved permissions for ${r.name}`)
        },

        saveShippingZone: (z) => {
          const isNew = !get().data.shippingZones.some((x) => x.id === z.id)
          const zones = isNew
            ? [...get().data.shippingZones, z]
            : get().data.shippingZones.map((x) => (x.id === z.id ? z : x))
          set({ data: { ...get().data, shippingZones: zones } })
          get().log(isNew ? 'Created shipping zone' : 'Updated shipping zone', 'Shipping', z.name, `Saved zone ${z.name}`)
        },

        deleteShippingMethod: (methodId) => {
          const zones = get().data.shippingZones.map((z) => ({
            ...z,
            methods: z.methods.filter((m) => m.id !== methodId),
          }))
          set({ data: { ...get().data, shippingZones: zones } })
          get().log('Deleted shipping method', 'Shipping', String(methodId), 'Removed shipping method')
        },

        saveNavigationItem: (input) => {
          const items = get().data.navigation ? [...get().data.navigation] : []
          const isNew = !input.id || !items.some((x) => x.id === input.id)
          const id = input.id || `nav-${Date.now()}`
          const order = input.order ?? (isNew ? items.length : (items.find((x) => x.id === id)?.order ?? 0))

          const fullItem: NavigationItem = {
            id,
            label: input.label.trim(),
            href: input.href.trim(),
            type: input.type || 'custom',
            targetValue: input.targetValue?.trim() || undefined,
            badge: input.badge?.trim() || undefined,
            order,
            isActive: input.isActive ?? true,
            openInNewTab: input.openInNewTab ?? false,
          }

          const updated = isNew
            ? [...items, fullItem]
            : items.map((x) => (x.id === id ? fullItem : x))

          updated.sort((a, b) => a.order - b.order)
          const indexed = updated.map((it, idx) => ({ ...it, order: idx }))

          set({ data: { ...get().data, navigation: indexed } })
          get().log(
            isNew ? 'Created nav item' : 'Updated nav item',
            'Navigation',
            fullItem.label,
            `${fullItem.label} (${fullItem.type})`
          )
          return fullItem
        },

        deleteNavigationItem: (id) => {
          const items = (get().data.navigation || []).filter((x) => x.id !== id)
          const indexed = items.map((it, idx) => ({ ...it, order: idx }))
          set({ data: { ...get().data, navigation: indexed } })
          get().log('Deleted nav item', 'Navigation', id, `Removed nav item ${id}`)
        },

        reorderNavigationItems: (items) => {
          const indexed = items.map((it, idx) => ({ ...it, order: idx }))
          set({ data: { ...get().data, navigation: indexed } })
          get().log('Reordered navigation', 'Navigation', 'Storefront', `Reordered ${items.length} navigation links`)
        },

        toggleNavigationItem: (id) => {
          const items = (get().data.navigation || []).map((x) =>
            x.id === id ? { ...x, isActive: !x.isActive } : x
          )
          set({ data: { ...get().data, navigation: items } })
          const item = items.find((x) => x.id === id)
          get().log('Toggled nav item', 'Navigation', item?.label ?? id, `Active: ${item?.isActive}`)
        },

        resetNavigationToDefault: () => {
          set({ data: { ...get().data, navigation: DEFAULT_NAVIGATION_ITEMS.map((item) => ({ ...item })) } })
          get().log('Reset navigation', 'Navigation', 'Storefront', 'Reset navigation to default silhouettes')
        },

        setNavigation: (items) => {
          const indexed = items.map((it, idx) => ({ ...it, order: idx }))
          set({ data: { ...get().data, navigation: indexed } })
        },

        setHomepageConfig: (config) => {
          set({ data: { ...get().data, homepage: config } })
          get().log('Updated homepage config', 'Storefront', 'Homepage', 'Updated homepage layout and content')
        },

        updateHomepageSection: (section, value) => {
          const current = get().data.homepage || DEFAULT_HOMEPAGE_CONFIG
          const updated = { ...current, [section]: value }
          set({ data: { ...get().data, homepage: updated } })
          get().log('Updated homepage section', 'Storefront', String(section), `Updated section ${String(section)}`)
        },

        reorderHomepageSections: (order) => {
          const current = get().data.homepage || DEFAULT_HOMEPAGE_CONFIG
          const updated = { ...current, sectionsOrder: order }
          set({ data: { ...get().data, homepage: updated } })
          get().log('Reordered homepage sections', 'Storefront', 'Homepage', `Order: ${order.join(', ')}`)
        },

        toggleHomepageSection: (section) => {
          const current = get().data.homepage || DEFAULT_HOMEPAGE_CONFIG
          const enabledMap = { ...current.sectionsEnabled }
          enabledMap[section] = !enabledMap[section]
          const updated = { ...current, sectionsEnabled: enabledMap }
          set({ data: { ...get().data, homepage: updated } })
          get().log('Toggled homepage section', 'Storefront', section, `Enabled: ${enabledMap[section]}`)
        },

        resetHomepageConfig: () => {
          set({ data: { ...get().data, homepage: JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_CONFIG)) } })
          get().log('Reset homepage config', 'Storefront', 'Homepage', 'Reset homepage layout to factory defaults')
        },
      }
    },
    {
      name: 'infit-admin',
      version: 4,
      partialize: (s) => ({ data: s.data, session: s.session }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AdminState> | undefined
        if (!p?.data || p.data.version !== DATA_VERSION) {
          // Seed data is stale — rebuild the dataset from scratch.
          return { ...current, data: createDbState() }
        }
        const nav = Array.isArray(p.data.navigation) && p.data.navigation.length > 0
          ? p.data.navigation
          : createDbState().navigation
        const hp = p.data.homepage && Array.isArray(p.data.homepage.sectionsOrder)
          ? p.data.homepage
          : createDbState().homepage
        return { ...current, data: { ...p.data, navigation: nav, homepage: hp }, session: p.session ?? null }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    } satisfies PersistOptions<AdminState, { data: DbState; session: Session | null }>
  )
)