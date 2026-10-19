import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  products,
  productVariants,
  categories,
  collections,
  orders,
  orderItems,
  orderEvents,
  coupons,
  customers,
  storeSettings,
  roles,
  productReviews,
  inventoryMovements,
  auditLog,
  notifications,
  shipments,
  returnRequests,
  refunds
} from '@jeans-store/db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../..')

test('Single source of truth in @jeans-store/db (Phase 5)', async (t) => {
  await t.test('packages/db is the sole canonical source of schema and migrations', () => {
    const pkgSchemaPath = path.join(rootDir, 'packages/db/src/schema.ts')
    const apiSchemaPath = path.join(rootDir, 'apps/api/src/db/schema.ts')
    const apiDrizzlePath = path.join(rootDir, 'apps/api/drizzle')

    assert.ok(fs.existsSync(pkgSchemaPath), 'packages/db/src/schema.ts must exist as canonical schema')
    assert.ok(!fs.existsSync(apiSchemaPath), 'apps/api/src/db/schema.ts must be removed to avoid drift')
    assert.ok(!fs.existsSync(apiDrizzlePath), 'apps/api/drizzle must be removed to consolidate migrations')
  })

  await t.test('packages/db/drizzle contains complete canonical migrations', () => {
    const pkgDrizzle = path.join(rootDir, 'packages/db/drizzle')
    assert.ok(fs.existsSync(pkgDrizzle), 'packages/db/drizzle exists')

    const expectedMigrations = [
      '0000_baseline.sql',
      '0001_slim_products.sql',
      '0002_drop_unused.sql',
      '0003_drop_redundant.sql'
    ]

    const sqlFiles = fs.readdirSync(pkgDrizzle).filter((f) => f.endsWith('.sql'))
    for (const expected of expectedMigrations) {
      assert.ok(sqlFiles.includes(expected), `Migration ${expected} must exist in packages/db/drizzle`)
    }

    const journalPath = path.join(pkgDrizzle, 'meta/_journal.json')
    assert.ok(fs.existsSync(journalPath), 'meta/_journal.json must exist in packages/db/drizzle')
  })

  await t.test('@jeans-store/db exports all operational and catalog entities to apps/api', () => {
    assert.ok(products, 'products table exported')
    assert.ok(productVariants, 'productVariants table exported')
    assert.ok(categories, 'categories table exported')
    assert.ok(collections, 'collections table exported')
    assert.ok(orders, 'orders table exported')
    assert.ok(orderItems, 'orderItems table exported')
    assert.ok(orderEvents, 'orderEvents table exported')
    assert.ok(coupons, 'coupons table exported')
    assert.ok(customers, 'customers table exported')
    assert.ok(storeSettings, 'storeSettings table exported')
    assert.ok(roles, 'roles table exported')
    assert.ok(productReviews, 'productReviews table exported')
    assert.ok(inventoryMovements, 'inventoryMovements table exported')
    assert.ok(auditLog, 'auditLog table exported')
    assert.ok(notifications, 'notifications table exported')
    assert.ok(shipments, 'shipments table exported')
    assert.ok(returnRequests, 'returnRequests table exported')
    assert.ok(refunds, 'refunds table exported')
  })
})
