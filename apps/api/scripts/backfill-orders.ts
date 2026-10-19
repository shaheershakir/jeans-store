import 'dotenv/config'
import { count, eq, isNull } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../src/db/index.js'
import { orderEvents, orderItems, orders, payments } from '../src/db/schema.js'

/**
 * Post-baseline order integrity check.
 *
 * The legacy JSONB `orders.items/events/admin_notes` columns no longer exist.
 * This script replaces the old backfill with a read-only verification that
 * every order has normalized items, at least one event, and a payment record.
 */
async function main() {
  if (!isDatabaseConfigured() || !db) {
    console.error('Database connection is not configured. Set DATABASE_URL first.')
    process.exit(1)
  }

  const [total] = await db.select({ value: count() }).from(orders)
  const missingItems = await db
    .select({ id: orders.id, number: orders.orderNumber })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(isNull(orderItems.id))
  const missingEvents = await db
    .select({ id: orders.id, number: orders.orderNumber })
    .from(orders)
    .leftJoin(orderEvents, eq(orderEvents.orderId, orders.id))
    .where(isNull(orderEvents.id))
  const missingPayments = await db
    .select({ id: orders.id, number: orders.orderNumber })
    .from(orders)
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(isNull(payments.id))

  console.log(`\nOrder integrity check`)
  console.log(`- Orders:                 ${total?.value ?? 0}`)
  console.log(`- Orders without items:   ${missingItems.length}`)
  console.log(`- Orders without events:  ${missingEvents.length}`)
  console.log(`- Orders without payment: ${missingPayments.length}`)

  for (const order of [...missingItems, ...missingEvents, ...missingPayments]) {
    console.log(`  ⚠️  ${order.number} (id ${order.id})`)
  }

  if (missingItems.length + missingEvents.length + missingPayments.length > 0) {
    console.error('\nOrder integrity check failed.')
    process.exit(1)
  }

  console.log('\n✅ Every order has normalized items, events and a payment record.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
