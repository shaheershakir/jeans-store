import { pgTable, serial, text, integer, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fit: varchar('fit', { length: 50 }).notNull(),
  price: varchar('price', { length: 50 }).notNull(),
  priceNum: integer('price_num').notNull(),
  img: text('img').notNull(),
  img2: text('img2').notNull(),
  badge: varchar('badge', { length: 50 }),
  desc: text('desc').notNull(),
  wash: varchar('wash', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
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
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  handoffType: varchar('handoff_type', { length: 50 }).default('whatsapp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type DbProduct = typeof products.$inferSelect
export type DbNewProduct = typeof products.$inferInsert
export type DbOrder = typeof orders.$inferSelect
export type DbNewOrder = typeof orders.$inferInsert
