import 'dotenv/config'
import { db, isDatabaseConfigured } from '../src/db/index.js'
import { productImages as productImagesTable } from '@jeans-store/db'
import { getStorage } from '../src/services/storage.js'
import { sql } from 'drizzle-orm'

interface PruneSummary {
  mode: 'DRY-RUN' | 'APPLIED'
  totalObjectsScanned: number
  referencedKeysCount: number
  tooRecentCount: number
  orphansIdentified: number
  deletedCount: number
  errorsCount: number
}

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(`\n======================================================`)
  console.log(`Starting Orphan Images Prune`)
  console.log(`Execution Mode: ${isApply ? 'APPLY (deleting orphan objects)' : 'DRY-RUN (read-only, pass --apply to delete)'}`)
  console.log(`======================================================\n`)

  const storage = getStorage()
  const referencedKeys = new Set<string>()

  if (isDatabaseConfigured() && db) {
    try {
      const activeProductKeys = await db
        .select({ key: productImagesTable.storageKey })
        .from(productImagesTable)
      for (const row of activeProductKeys) {
        if (row.key) referencedKeys.add(row.key)
      }
    } catch (err) {
      console.warn('Could not read product_images table (table may not exist yet):', err)
    }

    try {
      // If order_items table exists (Phase 3 onwards), include snapshot image_key values
      const orderItemKeysResult = await db.execute<{ image_key: string | null }>(
        sql`SELECT image_key FROM order_items WHERE image_key IS NOT NULL`
      )
      const rows = (orderItemKeysResult as any)?.rows || orderItemKeysResult || []
      for (const row of rows) {
        if (row?.image_key) referencedKeys.add(row.image_key)
      }
    } catch {
      // order_items table does not exist in Phase 1 / 2; safely ignored
    }
  } else {
    console.warn('Warning: Database not configured. Proceeding with caution (referenced keys set will be empty).')
  }

  const summary: PruneSummary = {
    mode: isApply ? 'APPLIED' : 'DRY-RUN',
    totalObjectsScanned: 0,
    referencedKeysCount: referencedKeys.size,
    tooRecentCount: 0,
    orphansIdentified: 0,
    deletedCount: 0,
    errorsCount: 0
  }

  const now = Date.now()
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

  try {
    for await (const item of storage.list('products/')) {
      summary.totalObjectsScanned++

      if (referencedKeys.has(item.key)) {
        continue
      }

      const ageMs = now - item.updatedAt.getTime()
      if (ageMs < TWENTY_FOUR_HOURS_MS) {
        summary.tooRecentCount++
        continue
      }

      // Orphan older than 24 hours
      summary.orphansIdentified++
      console.log(`Found orphan object: ${item.key} (Age: ${(ageMs / (1000 * 60 * 60)).toFixed(1)}h)`)

      if (isApply) {
        try {
          await storage.delete(item.key)
          summary.deletedCount++
          console.log(`Deleted orphan: ${item.key}`)
        } catch (delErr) {
          summary.errorsCount++
          console.error(`Failed to delete orphan ${item.key}:`, delErr)
        }
      }
    }

    console.log(`\n======================================================`)
    console.log(`Prune Summary:`)
    console.log(`- Mode:                          ${summary.mode}`)
    console.log(`- Total objects under products/: ${summary.totalObjectsScanned}`)
    console.log(`- Active referenced keys:        ${summary.referencedKeysCount}`)
    console.log(`- Skipped (< 24h old):           ${summary.tooRecentCount}`)
    console.log(`- Orphans identified:            ${summary.orphansIdentified}`)
    console.log(`- Deleted:                       ${summary.deletedCount}`)
    console.log(`- Errors:                        ${summary.errorsCount}`)
    console.log(`======================================================\n`)

    if (!isApply && summary.orphansIdentified > 0) {
      console.log(`To delete these orphan objects, run:`)
      console.log(`  npx tsx scripts/prune-orphan-images.ts --apply\n`)
    }
  } catch (err) {
    console.error('Error during orphan image pruning:', err)
    process.exit(1)
  }
}

main()
