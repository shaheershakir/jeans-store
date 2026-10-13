import { pgTable, serial, text, integer, timestamp, jsonb, varchar, boolean, uniqueIndex } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  store: varchar('store', { length: 50 }).default('teesgarage').notNull(),
  category: varchar('category', { length: 50 }).default('printed-tees').notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
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
  carrier: varchar('carrier', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  adminNotes: jsonb('admin_notes').$type<Array<{ id: string; text: string; at: string; by: string; internal: boolean }>>().notNull().default([]),
  events: jsonb('events').$type<Array<{ id: string; status: string; note: string; at: string; by: string }>>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: varchar('uid', { length: 128 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  provider: varchar('provider', { length: 50 }).default('cloud-iam').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

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
    uniqueIndex('product_variants_product_color_size_idx').on(table.productId, table.color, table.size)
  ]
)

export interface ShippingRate {
  baseWeightGrams: number
  baseCharge: number
  additionalWeightGrams: number
  additionalCharge: number
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

export type DbProduct = typeof products.$inferSelect
export type DbNewProduct = typeof products.$inferInsert
export type DbProductVariant = typeof productVariants.$inferSelect
export type DbNewProductVariant = typeof productVariants.$inferInsert
export type DbOrder = typeof orders.$inferSelect
export type DbNewOrder = typeof orders.$inferInsert
export type DbUser = typeof users.$inferSelect
export type DbNewUser = typeof users.$inferInsert
export type DbNavigationItem = typeof navigationItems.$inferSelect
export type DbNewNavigationItem = typeof navigationItems.$inferInsert

