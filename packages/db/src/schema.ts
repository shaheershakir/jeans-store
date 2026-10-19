import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  text,
  integer,
  smallint,
  real,
  timestamp,
  jsonb,
  varchar,
  boolean,
  uniqueIndex,
  index,
  primaryKey,
  check,
  type AnyPgColumn
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}

/* ────────────────────────────────────────────────────────────────────────────
 * Identity & access
 * ──────────────────────────────────────────────────────────────────────────── */

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
    ...timestamps
  },
  (t) => [uniqueIndex('users_lower_email_idx').on(sql`lower(${t.email})`)]
)

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    permissions: text('permissions').array().notNull().default(sql`'{}'::text[]`),
    ...timestamps
  },
  (t) => [uniqueIndex('roles_name_lower_idx').on(sql`lower(${t.name})`)]
)

export const adminUsers = pgTable(
  'admin_users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    roleId: integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 20 }).default('Active').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    uniqueIndex('admin_users_lower_email_idx').on(sql`lower(${t.email})`),
    check('admin_users_status_check', sql.raw("status IN ('Active', 'Inactive')"))
  ]
)

/* ────────────────────────────────────────────────────────────────────────────
 * Catalog
 * ──────────────────────────────────────────────────────────────────────────── */

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 60 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    parentId: integer('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps
  },
  (t) => [index('categories_parent_sort_idx').on(t.parentId, t.sortOrder)]
)

export const collections = pgTable(
  'collections',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    status: varchar('status', { length: 20 }).default('Active').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps
  },
  (t) => [check('collections_status_check', sql.raw("status IN ('Active', 'Inactive')"))]
)

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    collectionId: integer('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    slug: varchar('slug', { length: 160 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 20 }).default('draft').notNull(),
    price: integer('price').notNull(),
    compareAtPrice: integer('compare_at_price'),
    costPrice: integer('cost_price'),
    taxRate: integer('tax_rate').default(0).notNull(),
    hsnCode: varchar('hsn_code', { length: 12 }),
    badge: varchar('badge', { length: 50 }),
    isFeatured: boolean('is_featured').default(false).notNull(),
    weightGrams: integer('weight_grams').notNull(),
    ratingAverage: real('rating_average').default(0).notNull(),
    reviewCount: integer('review_count').default(0).notNull(),
    careInstructions: text('care_instructions'),
    ...timestamps
  },
  (t) => [
    index('products_category_status_idx').on(t.categoryId, t.status),
    index('products_collection_idx').on(t.collectionId),
    index('products_status_created_idx').on(t.status, t.createdAt),
    check('products_status_check', sql.raw("status IN ('draft', 'active', 'archived')")),
    check('products_price_check', sql.raw('price >= 0')),
    check('products_weight_check', sql.raw('weight_grams > 0')),
    check('products_rating_check', sql.raw('rating_average >= 0 AND rating_average <= 5'))
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
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    uniqueIndex('product_images_product_position_idx').on(t.productId, t.position),
    uniqueIndex('product_images_storage_key_idx').on(t.storageKey),
    check(
      'product_images_source_check',
      sql.raw('(storage_key IS NOT NULL AND external_url IS NULL) OR (storage_key IS NULL AND external_url IS NOT NULL)')
    ),
    check('product_images_position_check', sql.raw('position >= 0'))
  ]
)

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
    price: integer('price'),
    stock: integer('stock').default(0).notNull(),
    reserved: integer('reserved').default(0).notNull(),
    reorderPoint: integer('reorder_point').default(5).notNull(),
    weightGrams: integer('weight_grams'),
    barcode: varchar('barcode', { length: 100 }),
    status: varchar('status', { length: 20 }).default('Active').notNull(),
    ...timestamps
  },
  (t) => [
    uniqueIndex('product_variants_product_color_size_idx').on(t.productId, t.color, t.size),
    uniqueIndex('product_variants_barcode_idx').on(t.barcode),
    index('product_variants_product_idx').on(t.productId),
    check('product_variants_stock_check', sql.raw('stock >= 0')),
    check('product_variants_reserved_check', sql.raw('reserved >= 0')),
    check('product_variants_reserved_lte_stock_check', sql.raw('reserved <= stock')),
    check('product_variants_price_check', sql.raw('price IS NULL OR price >= 0')),
    check('product_variants_weight_check', sql.raw('weight_grams IS NULL OR weight_grams > 0')),
    check('product_variants_status_check', sql.raw("status IN ('Active', 'Inactive')"))
  ]
)

export const sizeCharts = pgTable('size_charts', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .unique()
    .references(() => categories.id, { onDelete: 'cascade' }),
  description: text('description'),
  ...timestamps
})

export const sizeChartMeasurements = pgTable(
  'size_chart_measurements',
  {
    id: serial('id').primaryKey(),
    sizeChartId: integer('size_chart_id')
      .notNull()
      .references(() => sizeCharts.id, { onDelete: 'cascade' }),
    size: varchar('size', { length: 20 }).notNull(),
    chest: real('chest'),
    waist: real('waist'),
    hip: real('hip'),
    inseam: real('inseam'),
    thigh: real('thigh'),
    length: real('length'),
    shoulder: real('shoulder')
  },
  (t) => [uniqueIndex('size_chart_measurements_chart_size_idx').on(t.sizeChartId, t.size)]
)

/* ────────────────────────────────────────────────────────────────────────────
 * Customers
 * ──────────────────────────────────────────────────────────────────────────── */

export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    ...timestamps
  },
  (t) => [uniqueIndex('customers_lower_email_idx').on(sql`lower(${t.email})`)]
)

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 30 }).default('Home').notNull(),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    pincode: varchar('pincode', { length: 20 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    isDefault: boolean('is_default').default(false).notNull(),
    ...timestamps
  },
  (t) => [
    index('customer_addresses_customer_idx').on(t.customerId),
    uniqueIndex('customer_addresses_one_default_idx')
      .on(t.customerId)
      .where(sql`is_default = true`),
    check('customer_addresses_label_check', sql.raw("label IN ('Home', 'Work', 'Other')"))
  ]
)

/* ────────────────────────────────────────────────────────────────────────────
 * Marketing
 * ──────────────────────────────────────────────────────────────────────────── */

export const coupons = pgTable(
  'coupons',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 60 }).notNull().unique(),
    description: text('description'),
    type: varchar('type', { length: 20 }).notNull(),
    value: integer('value').notNull(),
    minOrderValue: integer('min_order_value').default(0).notNull(),
    maxDiscount: integer('max_discount'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    usageLimit: integer('usage_limit'),
    perCustomerLimit: integer('per_customer_limit').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps
  },
  (t) => [
    uniqueIndex('coupons_code_lower_idx').on(sql`lower(${t.code})`),
    check('coupons_type_check', sql.raw("type IN ('percentage', 'fixed')")),
    check('coupons_value_check', sql.raw('value > 0'))
  ]
)

export const couponProducts = pgTable(
  'coupon_products',
  {
    couponId: integer('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' })
  },
  (t) => [primaryKey({ columns: [t.couponId, t.productId] })]
)

export const couponCategories = pgTable(
  'coupon_categories',
  {
    couponId: integer('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' })
  },
  (t) => [primaryKey({ columns: [t.couponId, t.categoryId] })]
)

export const promotions = pgTable(
  'promotions',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    target: varchar('target', { length: 30 }).notNull(),
    targetId: varchar('target_id', { length: 120 }),
    discountType: varchar('discount_type', { length: 20 }).notNull(),
    discountValue: integer('discount_value').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    status: varchar('status', { length: 20 }).default('Scheduled').notNull(),
    ...timestamps
  },
  (t) => [
    check('promotions_target_check', sql.raw("target IN ('Product', 'Category', 'Collection', 'Color')")),
    check('promotions_discount_type_check', sql.raw("discount_type IN ('percentage', 'fixed')")),
    check('promotions_status_check', sql.raw("status IN ('Scheduled', 'Active', 'Ended')"))
  ]
)

export const banners = pgTable(
  'banners',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: text('subtitle'),
    ctaLabel: varchar('cta_label', { length: 120 }),
    link: varchar('link', { length: 255 }),
    imageUrl: text('image_url'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    status: varchar('status', { length: 20 }).default('Scheduled').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    ...timestamps
  },
  (t) => [check('banners_status_check', sql.raw("status IN ('Active', 'Scheduled', 'Ended')"))]
)

/* ────────────────────────────────────────────────────────────────────────────
 * Orders, payments & fulfilment
 * ──────────────────────────────────────────────────────────────────────────── */

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 30 }).default('Pending').notNull(),
    paymentStatus: varchar('payment_status', { length: 20 }).default('Pending').notNull(),
    handoffType: varchar('handoff_type', { length: 20 }).default('whatsapp').notNull(),
    customerName: varchar('customer_name', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    address: text('address').notNull(),
    apartment: varchar('apartment', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    pincode: varchar('pincode', { length: 20 }).notNull(),
    notes: text('notes'),
    subtotal: integer('subtotal').notNull(),
    discountTotal: integer('discount_total').default(0).notNull(),
    shipping: integer('shipping').notNull(),
    taxTotal: integer('tax_total').default(0).notNull(),
    total: integer('total').notNull(),
    currency: varchar('currency', { length: 3 }).default('INR').notNull(),
    weightGrams: integer('weight_grams').default(0).notNull(),
    couponId: integer('coupon_id').references(() => coupons.id, { onDelete: 'set null' }),
    ...timestamps
  },
  (t) => [
    index('orders_customer_created_idx').on(t.customerId, t.createdAt),
    index('orders_lower_email_idx').on(sql`lower(${t.customerEmail})`),
    index('orders_status_created_idx').on(t.status, t.createdAt),
    check(
      'orders_status_check',
      sql.raw(
        "status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded')"
      )
    ),
    check(
      'orders_payment_status_check',
      sql.raw("payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')")
    ),
    check('orders_handoff_type_check', sql.raw("handoff_type IN ('whatsapp', 'email', 'razorpay', 'cod')")),
    check('orders_totals_check', sql.raw('subtotal >= 0 AND discount_total >= 0 AND shipping >= 0 AND tax_total >= 0 AND total >= 0')),
    check('orders_weight_check', sql.raw('weight_grams >= 0'))
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
    size: varchar('size', { length: 50 }).notNull(),
    color: varchar('color', { length: 50 }),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: integer('line_total').notNull(),
    weightGrams: integer('weight_grams').default(0).notNull(),
    imageKey: text('image_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_variant_idx').on(t.variantId),
    index('order_items_product_idx').on(t.productId),
    check('order_items_quantity_check', sql.raw('quantity > 0')),
    check('order_items_unit_price_check', sql.raw('unit_price >= 0')),
    check('order_items_line_total_check', sql.raw('line_total >= 0'))
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
    status: varchar('status', { length: 30 }),
    note: text('note'),
    isInternal: boolean('is_internal').default(false).notNull(),
    actorAdminId: integer('actor_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    actorName: varchar('actor_name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('order_events_order_idx').on(t.orderId, t.createdAt),
    check('order_events_kind_check', sql.raw("kind IN ('status', 'note', 'payment', 'shipment', 'return', 'refund')"))
  ]
)

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    method: varchar('method', { length: 40 }).notNull(),
    amount: integer('amount').notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(),
    gateway: varchar('gateway', { length: 40 }).default('razorpay').notNull(),
    gatewayOrderId: varchar('gateway_order_id', { length: 100 }),
    gatewayPaymentId: varchar('gateway_payment_id', { length: 100 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    settledAt: timestamp('settled_at', { withTimezone: true })
  },
  (t) => [
    index('payments_order_idx').on(t.orderId),
    check('payments_amount_check', sql.raw('amount >= 0')),
    check('payments_status_check', sql.raw("status IN ('Pending', 'Paid', 'Failed', 'Refunded')"))
  ]
)

export const shipments = pgTable(
  'shipments',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    carrier: varchar('carrier', { length: 100 }).notNull(),
    trackingNumber: varchar('tracking_number', { length: 120 }).notNull().unique(),
    status: varchar('status', { length: 30 }).default('Pending').notNull(),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    eta: timestamp('eta', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    index('shipments_order_idx').on(t.orderId),
    check(
      'shipments_status_check',
      sql.raw("status IN ('Pending', 'Booked', 'In Transit', 'Delivered', 'Failed', 'RTO')")
    )
  ]
)

export const returnRequests = pgTable(
  'return_requests',
  {
    id: serial('id').primaryKey(),
    number: varchar('number', { length: 50 }).notNull().unique(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: varchar('status', { length: 30 }).default('Requested').notNull(),
    amount: integer('amount').default(0).notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('return_requests_order_idx').on(t.orderId),
    index('return_requests_customer_idx').on(t.customerId),
    check(
      'return_requests_status_check',
      sql.raw(
        "status IN ('Requested', 'Approved', 'Rejected', 'Pickup Scheduled', 'Received', 'Refunded', 'Completed')"
      )
    ),
    check('return_requests_amount_check', sql.raw('amount >= 0'))
  ]
)

export const returnItems = pgTable(
  'return_items',
  {
    id: serial('id').primaryKey(),
    returnId: integer('return_id')
      .notNull()
      .references(() => returnRequests.id, { onDelete: 'cascade' }),
    orderItemId: integer('order_item_id').references(() => orderItems.id, { onDelete: 'set null' }),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    sku: varchar('sku', { length: 100 }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    variantLabel: varchar('variant_label', { length: 120 }),
    unitPrice: integer('unit_price').default(0).notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: integer('line_total').default(0).notNull(),
    reason: text('reason'),
    condition: varchar('condition', { length: 60 })
  },
  (t) => [
    index('return_items_return_idx').on(t.returnId),
    check('return_items_quantity_check', sql.raw('quantity > 0'))
  ]
)

export const refunds = pgTable(
  'refunds',
  {
    id: serial('id').primaryKey(),
    number: varchar('number', { length: 50 }).notNull().unique(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    returnId: integer('return_id').references(() => returnRequests.id, { onDelete: 'set null' }),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    reason: text('reason'),
    method: varchar('method', { length: 40 }).notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(),
    transactionId: varchar('transaction_id', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true })
  },
  (t) => [
    index('refunds_order_idx').on(t.orderId),
    check('refunds_status_check', sql.raw("status IN ('Pending', 'Processed', 'Failed')")),
    check('refunds_amount_check', sql.raw('amount >= 0'))
  ]
)

export const couponRedemptions = pgTable(
  'coupon_redemptions',
  {
    id: serial('id').primaryKey(),
    couponId: integer('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    amount: integer('amount').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [uniqueIndex('coupon_redemptions_coupon_order_idx').on(t.couponId, t.orderId)]
)

/* ────────────────────────────────────────────────────────────────────────────
 * Reviews
 * ──────────────────────────────────────────────────────────────────────────── */

export const productReviews = pgTable(
  'product_reviews',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
    orderItemId: integer('order_item_id').references(() => orderItems.id, { onDelete: 'set null' }).unique(),
    reviewerName: varchar('reviewer_name', { length: 120 }).notNull(),
    reviewerEmail: varchar('reviewer_email', { length: 255 }),
    rating: smallint('rating').notNull(),
    title: varchar('title', { length: 160 }),
    content: text('content').notNull(),
    fitVerdict: varchar('fit_verdict', { length: 30 }),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
    status: varchar('status', { length: 20 }).default('Pending').notNull(),
    merchantResponse: text('merchant_response'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    ...timestamps
  },
  (t) => [
    index('product_reviews_product_status_created_idx').on(t.productId, t.status, t.createdAt),
    index('product_reviews_customer_idx').on(t.customerId),
    check('product_reviews_rating_check', sql.raw('rating BETWEEN 1 AND 5')),
    check('product_reviews_status_check', sql.raw("status IN ('Pending', 'Approved', 'Rejected', 'Hidden')")),
    check(
      'product_reviews_fit_verdict_check',
      sql.raw("fit_verdict IS NULL OR fit_verdict IN ('True to Size', 'Slightly Snug', 'Runs Relaxed')")
    )
  ]
)

export const reviewImages = pgTable(
  'review_images',
  {
    id: serial('id').primaryKey(),
    reviewId: integer('review_id')
      .notNull()
      .references(() => productReviews.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key'),
    externalUrl: text('external_url'),
    alt: varchar('alt', { length: 255 }),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    uniqueIndex('review_images_review_position_idx').on(t.reviewId, t.position),
    check(
      'review_images_source_check',
      sql.raw('(storage_key IS NOT NULL AND external_url IS NULL) OR (storage_key IS NULL AND external_url IS NOT NULL)')
    )
  ]
)


/* ────────────────────────────────────────────────────────────────────────────
 * Operations & configuration
 * ──────────────────────────────────────────────────────────────────────────── */

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: integer('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    sku: varchar('sku', { length: 100 }),
    type: varchar('type', { length: 20 }).notNull(),
    delta: integer('delta').notNull(),
    before: integer('before').notNull(),
    after: integer('after').notNull(),
    reason: text('reason'),
    reference: varchar('reference', { length: 120 }),
    actorAdminId: integer('actor_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    actorName: varchar('actor_name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('inventory_movements_variant_created_idx').on(t.variantId, t.createdAt),
    index('inventory_movements_product_created_idx').on(t.productId, t.createdAt),
    check(
      'inventory_movements_type_check',
      sql.raw("type IN ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'RESERVATION', 'RELEASE')")
    )
  ]
)

export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    actorName: varchar('actor_name', { length: 255 }),
    action: varchar('action', { length: 120 }).notNull(),
    entity: varchar('entity', { length: 80 }),
    entityId: varchar('entity_id', { length: 120 }),
    detail: text('detail'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt)]
)

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index('notifications_admin_read_created_idx').on(t.adminUserId, t.isRead, t.createdAt),
    check(
      'notifications_type_check',
      sql.raw("type IN ('low-stock', 'order', 'payment', 'review', 'system')")
    )
  ]
)

export const storeSettings = pgTable('store_settings', {
  id: varchar('id', { length: 30 }).primaryKey().default('default'),
  storeName: varchar('store_name', { length: 120 }).default('TEESGARAGE').notNull(),
  supportEmail: varchar('support_email', { length: 255 }),
  supportPhone: varchar('support_phone', { length: 50 }),
  address: text('address'),
  currency: varchar('currency', { length: 3 }).default('INR').notNull(),
  taxRate: integer('tax_rate').default(0).notNull(),
  orderPrefix: varchar('order_prefix', { length: 10 }).default('TG').notNull(),
  returnWindowDays: integer('return_window_days').default(7).notNull(),
  cancellationAllowedAfter: varchar('cancellation_allowed_after', { length: 40 }).default('Processing').notNull(),
  defaultShippingMethod: varchar('default_shipping_method', { length: 80 }).default('Standard').notNull(),
  notifyEmail: boolean('notify_email').default(true).notNull(),
  notifyOrderUpdates: boolean('notify_order_updates').default(true).notNull(),
  notifyInventoryAlerts: boolean('notify_inventory_alerts').default(true).notNull(),
  notifyReviewAlerts: boolean('notify_review_alerts').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const homepageSections = pgTable(
  'homepage_sections',
  {
    id: serial('id').primaryKey(),
    type: varchar('type', { length: 40 }).notNull().unique(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps
  },
  (t) => [
    check(
      'homepage_sections_type_check',
      sql.raw(
        "type IN ('announcement', 'hero', 'categories', 'new_arrivals', 'featured_collection', 'best_sellers', 'brand_story', 'looks', 'instagram', 'reviews', 'trust_bar', 'catalog')"
      )
    )
  ]
)

export const navigationItems = pgTable(
  'navigation_items',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    label: varchar('label', { length: 100 }).notNull(),
    href: varchar('href', { length: 255 }).notNull(),
    type: varchar('type', { length: 20 }).default('custom').notNull(),
    targetValue: varchar('target_value', { length: 100 }),
    badge: varchar('badge', { length: 50 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    openInNewTab: boolean('open_in_new_tab').default(false).notNull(),
    ...timestamps
  },
  (t) => [check('navigation_items_type_check', sql.raw("type IN ('category', 'collection', 'custom')"))]
)

export const shippingZones = pgTable('shipping_zones', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps
})

export const shippingZoneRegions = pgTable(
  'shipping_zone_regions',
  {
    zoneId: integer('zone_id')
      .notNull()
      .references(() => shippingZones.id, { onDelete: 'cascade' }),
    region: varchar('region', { length: 100 }).notNull()
  },
  (t) => [primaryKey({ columns: [t.zoneId, t.region] })]
)

export const shippingMethods = pgTable(
  'shipping_methods',
  {
    id: serial('id').primaryKey(),
    zoneId: integer('zone_id')
      .notNull()
      .references(() => shippingZones.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    baseWeightGrams: integer('base_weight_grams').notNull(),
    baseCharge: integer('base_charge').notNull(),
    additionalWeightGrams: integer('additional_weight_grams').notNull(),
    additionalCharge: integer('additional_charge').notNull(),
    estimatedDaysMin: integer('estimated_days_min'),
    estimatedDaysMax: integer('estimated_days_max'),
    exactDeliveryDate: varchar('exact_delivery_date', { length: 40 }),
    codAvailable: boolean('cod_available').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps
  },
  (t) => [
    uniqueIndex('shipping_methods_zone_name_idx').on(t.zoneId, t.name),
    check(
      'shipping_methods_weights_check',
      sql.raw('base_weight_grams > 0 AND base_charge >= 0 AND additional_weight_grams > 0 AND additional_charge >= 0')
    )
  ]
)

/* ────────────────────────────────────────────────────────────────────────────
 * Inferred types
 * ──────────────────────────────────────────────────────────────────────────── */

export type DbUser = typeof users.$inferSelect
export type DbNewUser = typeof users.$inferInsert
export type DbRole = typeof roles.$inferSelect
export type DbNewRole = typeof roles.$inferInsert
export type DbAdminUser = typeof adminUsers.$inferSelect
export type DbNewAdminUser = typeof adminUsers.$inferInsert
export type DbCategory = typeof categories.$inferSelect
export type DbNewCategory = typeof categories.$inferInsert
export type DbCollection = typeof collections.$inferSelect
export type DbNewCollection = typeof collections.$inferInsert
export type DbProduct = typeof products.$inferSelect
export type DbNewProduct = typeof products.$inferInsert
export type DbProductImage = typeof productImages.$inferSelect
export type DbNewProductImage = typeof productImages.$inferInsert
export type DbProductVariant = typeof productVariants.$inferSelect
export type DbNewProductVariant = typeof productVariants.$inferInsert
export type DbProductReview = typeof productReviews.$inferSelect
export type DbNewProductReview = typeof productReviews.$inferInsert
export type DbSizeChart = typeof sizeCharts.$inferSelect
export type DbNewSizeChart = typeof sizeCharts.$inferInsert
export type DbCustomer = typeof customers.$inferSelect
export type DbNewCustomer = typeof customers.$inferInsert
export type DbCustomerAddress = typeof customerAddresses.$inferSelect
export type DbNewCustomerAddress = typeof customerAddresses.$inferInsert
export type DbOrder = typeof orders.$inferSelect
export type DbNewOrder = typeof orders.$inferInsert
export type DbOrderItem = typeof orderItems.$inferSelect
export type DbNewOrderItem = typeof orderItems.$inferInsert
export type DbOrderEvent = typeof orderEvents.$inferSelect
export type DbNewOrderEvent = typeof orderEvents.$inferInsert
export type DbPayment = typeof payments.$inferSelect
export type DbNewPayment = typeof payments.$inferInsert
export type DbShipment = typeof shipments.$inferSelect
export type DbNewShipment = typeof shipments.$inferInsert
export type DbReturnRequest = typeof returnRequests.$inferSelect
export type DbNewReturnRequest = typeof returnRequests.$inferInsert
export type DbReturnItem = typeof returnItems.$inferSelect
export type DbNewReturnItem = typeof returnItems.$inferInsert
export type DbRefund = typeof refunds.$inferSelect
export type DbNewRefund = typeof refunds.$inferInsert
export type DbCoupon = typeof coupons.$inferSelect
export type DbNewCoupon = typeof coupons.$inferInsert
export type DbPromotion = typeof promotions.$inferSelect
export type DbNewPromotion = typeof promotions.$inferInsert
export type DbBanner = typeof banners.$inferSelect
export type DbNewBanner = typeof banners.$inferInsert
export type DbInventoryMovement = typeof inventoryMovements.$inferSelect
export type DbNewInventoryMovement = typeof inventoryMovements.$inferInsert
export type DbAuditLogEntry = typeof auditLog.$inferSelect
export type DbNewAuditLogEntry = typeof auditLog.$inferInsert
export type DbNotification = typeof notifications.$inferSelect
export type DbNewNotification = typeof notifications.$inferInsert
export type DbStoreSettings = typeof storeSettings.$inferSelect
export type DbNewStoreSettings = typeof storeSettings.$inferInsert
export type DbHomepageSection = typeof homepageSections.$inferSelect
export type DbNewHomepageSection = typeof homepageSections.$inferInsert
export type DbNavigationItem = typeof navigationItems.$inferSelect
export type DbNewNavigationItem = typeof navigationItems.$inferInsert
export type DbShippingZone = typeof shippingZones.$inferSelect
export type DbNewShippingZone = typeof shippingZones.$inferInsert
export type DbShippingMethod = typeof shippingMethods.$inferSelect
export type DbNewShippingMethod = typeof shippingMethods.$inferInsert
