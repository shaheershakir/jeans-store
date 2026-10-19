import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../src/db/index.js'
import {
  orders as ordersTable,
  users as usersTable,
  productVariants as productVariantsTable,
  orderItems as orderItemsTable,
  orderEvents as orderEventsTable
} from '../src/db/schema.js'
import { keyFromUrl } from '@jeans-store/shared'

interface BackfillSummary {
  mode: 'DRY-RUN' | 'APPLIED'
  totalOrdersScanned: number
  userIdsLinked: number
  orderItemsOrdersMigrated: number
  totalOrderItemsInserted: number
  orderEventsOrdersMigrated: number
  totalOrderEventsInserted: number
  alreadyHadItemsSkipped: number
  alreadyHadEventsSkipped: number
  errorsCount: number
}

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(`\n======================================================`)
  console.log(`Starting Orders Normalization Backfill (Phase 3)`)
  console.log(`Execution Mode: ${isApply ? 'APPLY (writing to database)' : 'DRY-RUN (read-only, pass --apply to commit)'}`)
  console.log(`======================================================\n`)

  if (!isDatabaseConfigured() || !db) {
    console.error('Database connection is not configured. DATABASE_URL must be set to run this script.')
    process.exit(1)
  }

  const summary: BackfillSummary = {
    mode: isApply ? 'APPLIED' : 'DRY-RUN',
    totalOrdersScanned: 0,
    userIdsLinked: 0,
    orderItemsOrdersMigrated: 0,
    totalOrderItemsInserted: 0,
    orderEventsOrdersMigrated: 0,
    totalOrderEventsInserted: 0,
    alreadyHadItemsSkipped: 0,
    alreadyHadEventsSkipped: 0,
    errorsCount: 0
  }

  try {
    const allOrders = await db.select().from(ordersTable)
    summary.totalOrdersScanned = allOrders.length

    // 1. Preload users for fast email matching
    const allUsers = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable)
    const emailToUserId = new Map<string, number>()
    for (const u of allUsers) {
      emailToUserId.set(u.email.toLowerCase().trim(), u.id)
    }

    // 2. Preload product variants for matching variantId and sku
    const allVariants = await db.select().from(productVariantsTable)

    // 3. Check existing order_items and order_events
    const existingItems = await db.select({ orderId: orderItemsTable.orderId }).from(orderItemsTable)
    const ordersWithItems = new Set(existingItems.map((r) => r.orderId))

    const existingEvents = await db.select({ orderId: orderEventsTable.orderId }).from(orderEventsTable)
    const ordersWithEvents = new Set(existingEvents.map((r) => r.orderId))

    for (const order of allOrders) {
      // A. Backfill user_id from email matching
      if (!order.userId) {
        const cleanEmail = order.customerEmail.toLowerCase().trim()
        const matchedUserId = emailToUserId.get(cleanEmail)
        if (matchedUserId) {
          if (isApply) {
            await db.update(ordersTable).set({ userId: matchedUserId }).where(eq(ordersTable.id, order.id))
          }
          summary.userIdsLinked++
        }
      }

      // B. Backfill order_items from legacy items JSONB
      if (ordersWithItems.has(order.id)) {
        summary.alreadyHadItemsSkipped++
      } else {
        const rawItems = Array.isArray(order.items) ? (order.items as any[]) : []
        if (rawItems.length > 0) {
          const itemRowsToInsert: Array<{
            orderId: number
            productId: number | null
            variantId: number | null
            sku: string | null
            name: string
            fit: string | null
            size: string
            color: string | null
            unitPrice: number
            quantity: number
            imageKey: string | null
            imageUrl: string | null
          }> = []

          for (const rawItem of rawItems) {
            const productId = typeof rawItem.id === 'number' ? rawItem.id : null

            // Try to match variant
            let matchedVariant = rawItem.variantId
              ? allVariants.find((v) => v.id === rawItem.variantId)
              : undefined

            if (!matchedVariant && productId) {
              matchedVariant = allVariants.find(
                (v) => v.productId === productId && String(v.size) === String(rawItem.size)
              )
            }

            const variantId = matchedVariant?.id ?? (rawItem.variantId || null)
            const sku = rawItem.sku || matchedVariant?.sku || null
            const name = rawItem.name || `Product #${productId ?? order.id}`
            const fit = rawItem.fit || null
            const size = String(rawItem.size || 'M')
            const color = rawItem.color || matchedVariant?.color || null
            const unitPrice =
              typeof rawItem.priceNum === 'number'
                ? rawItem.priceNum
                : parseInt(String(rawItem.price || '0').replace(/\D/g, ''), 10) || 0
            const quantity =
              typeof rawItem.quantity === 'number' && rawItem.quantity > 0 ? rawItem.quantity : 1

            const imageKey = rawItem.img ? keyFromUrl(rawItem.img) : null
            const imageUrl =
              !imageKey && rawItem.img && rawItem.img.startsWith('http') ? rawItem.img : null

            itemRowsToInsert.push({
              orderId: order.id,
              productId,
              variantId,
              sku,
              name,
              fit,
              size,
              color,
              unitPrice,
              quantity,
              imageKey,
              imageUrl
            })
          }

          if (itemRowsToInsert.length > 0) {
            if (isApply) {
              await db.insert(orderItemsTable).values(itemRowsToInsert)
            }
            summary.orderItemsOrdersMigrated++
            summary.totalOrderItemsInserted += itemRowsToInsert.length
          }
        }
      }

      // C. Backfill order_events from legacy events and adminNotes JSONB
      if (ordersWithEvents.has(order.id)) {
        summary.alreadyHadEventsSkipped++
      } else {
        const eventRowsToInsert: Array<{
          orderId: number
          kind: string
          status: string | null
          note: string | null
          isInternal: boolean
          actor: string | null
          createdAt: Date
        }> = []

        const rawEvents = Array.isArray(order.events) ? (order.events as any[]) : []
        for (const ev of rawEvents) {
          eventRowsToInsert.push({
            orderId: order.id,
            kind: 'status',
            status: ev.status || order.status,
            note: ev.note || 'Status update',
            isInternal: false,
            actor: ev.by || 'System',
            createdAt: ev.at ? new Date(ev.at) : order.createdAt
          })
        }

        if (eventRowsToInsert.length === 0) {
          // If no events recorded, synthesize initial placement event
          eventRowsToInsert.push({
            orderId: order.id,
            kind: 'status',
            status: order.status,
            note: 'Customer order placed',
            isInternal: false,
            actor: 'System',
            createdAt: order.createdAt
          })
        }

        const rawNotes = Array.isArray(order.adminNotes) ? (order.adminNotes as any[]) : []
        for (const note of rawNotes) {
          eventRowsToInsert.push({
            orderId: order.id,
            kind: 'note',
            status: null,
            note: note.text || '',
            isInternal: note.internal ?? true,
            actor: note.by || 'Admin',
            createdAt: note.at ? new Date(note.at) : order.createdAt
          })
        }

        if (eventRowsToInsert.length > 0) {
          if (isApply) {
            await db.insert(orderEventsTable).values(eventRowsToInsert)
          }
          summary.orderEventsOrdersMigrated++
          summary.totalOrderEventsInserted += eventRowsToInsert.length
        }
      }
    }

    console.log(`\n======================================================`)
    console.log(`Orders Normalization Backfill Complete Summary (${summary.mode})`)
    console.log(`======================================================`)
    console.log(`Total Orders Scanned:          ${summary.totalOrdersScanned}`)
    console.log(`User IDs Linked to Orders:     ${summary.userIdsLinked}`)
    console.log(`Orders Backfilled to Items:    ${summary.orderItemsOrdersMigrated}`)
    console.log(`Total Order Items Inserted:    ${summary.totalOrderItemsInserted}`)
    console.log(`Orders Backfilled to Events:   ${summary.orderEventsOrdersMigrated}`)
    console.log(`Total Order Events Inserted:   ${summary.totalOrderEventsInserted}`)
    console.log(`Orders Already Had Items:      ${summary.alreadyHadItemsSkipped}`)
    console.log(`Orders Already Had Events:     ${summary.alreadyHadEventsSkipped}`)
    console.log(`Errors Encountered:            ${summary.errorsCount}`)
    console.log(`======================================================\n`)

    if (!isApply) {
      console.log(`ℹ️ This was a DRY-RUN. No changes were committed to the database.`)
      console.log(`   To apply these changes, re-run with:`)
      console.log(`   npm --workspace=apps/api run db:backfill-orders -- --apply\n`)
    }
  } catch (err) {
    console.error('Fatal error during order backfill:', err)
    process.exit(1)
  }
}

void main()
