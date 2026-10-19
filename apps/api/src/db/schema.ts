import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  varchar,
  boolean,
  uniqueIndex,
  index,
  check,
  type AnyPgColumn
} from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  parentId: integer('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    store: varchar('store', { length: 50 }).default('teesgarage').notNull(),
    category: varchar('category', { length: 50 }).default('printed-tees').notNull(),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'restrict' }),
    slug: varchar('slug', { length: 160 }).unique(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    attributes: jsonb('attributes').$type<Record<string, unknown>>().notNull().default({}),
    name: varchar('name', { length: 255 }).notNull(),
    fit: varchar('fit', { length: 50 }),
    price: varchar('price', { length: 50 }).notNull(),
    priceNum: integer('price_num').notNull(),
    img: text('img').notNull(),
    img2: text('img2').notNull(),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    badge: varchar('badge', { length: 50 }),
    desc: text('desc').notNull(),
    wash: varchar('wash', { length: 100 }),
    sizes: jsonb('sizes'),
    adminData: jsonb('admin_data').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('products_store_status_category_idx').on(t.store, t.status, t.categoryId),
    uniqueIndex('products_slug_idx').on(t.slug),
    check('products_status_check', sql.raw("status IN ('draft', 'active', 'archived')"))
  ]
)

export const productImages = pgTable(
  'product_images',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    color: varchar('color', { length: 50 }),
    storageKey: text('storage_key'),
    externalUrl: text('external_url'),
    alt: varchar('alt', { length: 255 }),
    mimeType: varchar('mime_type', { length: 50 }),
    width: integer('width'),
    height: integer('height'),
    sizeBytes: integer('size_bytes'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('product_images_product_pos_idx').on(t.productId, t.position),
    uniqueIndex('product_images_storage_key_idx').on(t.storageKey),
    check(
      'product_images_source_check',
      sql.raw('(storage_key IS NOT NULL AND external_url IS NULL) OR (storage_key IS NULL AND external_url IS NOT NULL)')
    ),
    check('product_images_position_check', sql.raw('position >= 0'))
  ]
)

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: varchar('uid', { length: 128 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: text('password_hash'),
    provider: varchar('provider', { length: 50 }).default('cloud-iam').notNull(),
    googleSub: varchar('google_sub', { length: 255 }).unique(),
    onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    uniqueIndex('users_lower_email_idx').on(sql`lower(${t.email})`)
  ]
)

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references((): AnyPgColumn => users.id, { onDelete: 'set null' }),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    store: varchar('store', { length: 50 }).default('teesgarage').notNull(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    address: text('address').notNull(),
    apartment: varchar('apartment', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    pincode: varchar('pincode', { length: 20 }).notNull(),
    notes: text('notes'),
    items: jsonb('items').notNull(),
    subtotal: integer('subtotal').notNull(),
    shipping: integer('shipping').notNull(),
    total: integer('total').notNull(),
    status: varchar('status', { length: 50 }).default('Pending').notNull(),
    paymentStatus: varchar('payment_status', { length: 50 }).default('Pending').notNull(),
    handoffType: varchar('handoff_type', { length: 50 }).default('whatsapp').notNull(),
    razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
    razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
    carrier: varchar('carrier', { length: 100 }),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    adminNotes: jsonb('admin_notes').$type<Array<{ id: string; text: string; at: string; by: string; internal: boolean }>>().notNull().default([]),
    events: jsonb('events').$type<Array<{ id: string; status: string; note: string; at: string; by: string }>>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('orders_user_created_idx').on(t.userId, t.createdAt),
    index('orders_lower_email_idx').on(sql`lower(${t.customerEmail})`),
    index('orders_status_created_idx').on(t.status, t.createdAt),
    check(
      'orders_status_check',
      sql.raw("status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')")
    ),
    check(
      'orders_payment_status_check',
      sql.raw("payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')")
    ),
    check(
      'orders_handoff_type_check',
      sql.raw("handoff_type IN ('whatsapp', 'email', 'razorpay', 'cod')")
    )
  ]
)

export const navigationItems = pgTable('navigation_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  label: varchar('label', { length: 100 }).notNull(),
  href: varchar('href', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('custom').notNull(),
  targetValue: varchar('target_value', { length: 100 }),
  badge: varchar('badge', { length: 50 }),
  order: integer('order').notNull().default(0),
  isActive: boolean('is_active').default(true).notNull(),
  openInNewTab: boolean('open_in_new_tab').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const productVariants = pgTable(
  'product_variants',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    size: varchar('size', { length: 50 }).notNull(),
    color: varchar('color', { length: 50 }).notNull(),
    price: integer('price').notNull(),
    stock: integer('stock').default(0).notNull(),
    reserved: integer('reserved').default(0).notNull(),
    reorderPoint: integer('reorder_point').default(5).notNull(),
    weight: integer('weight').default(250).notNull(),
    barcode: varchar('barcode', { length: 100 }),
    status: varchar('status', { length: 50 }).default('Active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('product_variants_product_color_size_idx').on(table.productId, table.color, table.size),
    check('product_variants_stock_check', sql.raw('stock >= 0')),
    check('product_variants_reserved_check', sql.raw('reserved >= 0')),
    check('product_variants_price_check', sql.raw('price >= 0')),
    check('product_variants_status_check', sql.raw("status IN ('Active', 'Inactive')"))
  ]
)

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    sku: varchar('sku', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    fit: varchar('fit', { length: 50 }),
    size: varchar('size', { length: 50 }).notNull(),
    color: varchar('color', { length: 50 }),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
    imageKey: text('image_key'),
    imageUrl: text('image_url')
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_variant_idx').on(t.variantId),
    check('order_items_quantity_check', sql.raw('quantity > 0'))
  ]
)

export const orderEvents = pgTable(
  'order_events',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 20 }).notNull(),
    status: varchar('status', { length: 50 }),
    note: text('note'),
    isInternal: boolean('is_internal').notNull().default(false),
    actor: varchar('actor', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('order_events_order_idx').on(t.orderId, t.createdAt),
    check('order_events_kind_check', sql.raw("kind IN ('status', 'note')"))
  ]
)

export interface ShippingRate {
  baseWeightGrams: number
  baseCharge: number
  additionalWeightGrams: number
  additionalCharge: number
  estimatedDaysMin?: number
  estimatedDaysMax?: number
  exactDeliveryDate?: string
}

export interface ShippingRates {
  kerala: ShippingRate
  restOfIndia: ShippingRate
}

export const shippingSettings = pgTable('shipping_settings', {
  id: varchar('id', { length: 50 }).primaryKey(),
  rates: jsonb('rates').$type<ShippingRates>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const adminState = pgTable('admin_state', {
  id: varchar('id', { length: 50 }).primaryKey(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type DbCategory = typeof categories.$inferSelect
export type DbNewCategory = typeof categories.$inferInsert
export type DbProduct = typeof products.$inferSelect
export type DbNewProduct = typeof products.$inferInsert
export type DbProductImage = typeof productImages.$inferSelect
export type DbNewProductImage = typeof productImages.$inferInsert
export type DbProductVariant = typeof productVariants.$inferSelect
export type DbNewProductVariant = typeof productVariants.$inferInsert
export type DbOrder = typeof orders.$inferSelect
export type DbNewOrder = typeof orders.$inferInsert
export type DbOrderItem = typeof orderItems.$inferSelect
export type DbNewOrderItem = typeof orderItems.$inferInsert
export type DbOrderEvent = typeof orderEvents.$inferSelect
export type DbNewOrderEvent = typeof orderEvents.$inferInsert
export type DbUser = typeof users.$inferSelect
export type DbNewUser = typeof users.$inferInsert
export type DbNavigationItem = typeof navigationItems.$inferSelect
export type DbNewNavigationItem = typeof navigationItems.$inferInsert
