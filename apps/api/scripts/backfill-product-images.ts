import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../src/db/index.js'
import { products as productsTable, productImages as productImagesTable } from '../src/db/schema.js'
import { keyFromUrl } from '@jeans-store/shared'

interface BackfillSummary {
  mode: 'DRY-RUN' | 'APPLIED'
  totalProductsScanned: number
  alreadyHadImagesSkipped: number
  productsMigrated: number
  storageKeysCount: number
  externalUrlsCount: number
  skippedDataUrls: number
  errorsCount: number
}

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(`\n======================================================`)
  console.log(`Starting Product Images Backfill`)
  console.log(`Execution Mode: ${isApply ? 'APPLY (writing to database)' : 'DRY-RUN (read-only, pass --apply to commit)'}`)
  console.log(`======================================================\n`)

  if (!isDatabaseConfigured() || !db) {
    console.error('Database connection is not configured. DATABASE_URL must be set to run this script.')
    process.exit(1)
  }

  const summary: BackfillSummary = {
    mode: isApply ? 'APPLIED' : 'DRY-RUN',
    totalProductsScanned: 0,
    alreadyHadImagesSkipped: 0,
    productsMigrated: 0,
    storageKeysCount: 0,
    externalUrlsCount: 0,
    skippedDataUrls: 0,
    errorsCount: 0
  }

  try {
    const allProducts = await db.select().from(productsTable)
    summary.totalProductsScanned = allProducts.length

    const existingImages = await db
      .select({ productId: productImagesTable.productId })
      .from(productImagesTable)
    const productsWithImages = new Set(existingImages.map((row) => row.productId))

    for (const prod of allProducts) {
      if (productsWithImages.has(prod.id)) {
        summary.alreadyHadImagesSkipped++
        continue
      }

      // Collect URLs from legacy columns: img, img2, images
      const rawUrls: string[] = []
      if (prod.img) rawUrls.push(prod.img)
      if (prod.img2 && prod.img2 !== prod.img) rawUrls.push(prod.img2)
      if (Array.isArray(prod.images)) {
        for (const item of prod.images) {
          if (typeof item === 'string' && item && !rawUrls.includes(item)) {
            rawUrls.push(item)
          }
        }
      }

      const rowsToInsert: Array<{
        productId: number
        storageKey: string | null
        externalUrl: string | null
        position: number
      }> = []

      let position = 0
      for (const rawUrl of rawUrls) {
        const trimmed = rawUrl.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('data:')) {
          summary.skippedDataUrls++
          console.warn(`[Product ${prod.id}] Skipped base64 data: URL`)
          continue
        }

        const key = keyFromUrl(trimmed)
        if (key) {
          summary.storageKeysCount++
          rowsToInsert.push({
            productId: prod.id,
            storageKey: key,
            externalUrl: null,
            position: position++
          })
        } else if (/^https?:\/\//i.test(trimmed)) {
          summary.externalUrlsCount++
          rowsToInsert.push({
            productId: prod.id,
            storageKey: null,
            externalUrl: trimmed,
            position: position++
          })
        } else {
          summary.errorsCount++
          console.error(`[Product ${prod.id}] Unrecognized image format: "${trimmed}"`)
        }
      }

      if (rowsToInsert.length > 0) {
        if (isApply) {
          for (const row of rowsToInsert) {
            await db.insert(productImagesTable).values(row)
          }
        }
        summary.productsMigrated++
      }
    }

    console.log(`\n======================================================`)
    console.log(`Backfill Summary:`)
    console.log(`- Mode:                          ${summary.mode}`)
    console.log(`- Total products scanned:        ${summary.totalProductsScanned}`)
    console.log(`- Already migrated (skipped):    ${summary.alreadyHadImagesSkipped}`)
    console.log(`- Products backfilled:           ${summary.productsMigrated}`)
    console.log(`- Storage keys mapped:           ${summary.storageKeysCount}`)
    console.log(`- External URLs mapped:          ${summary.externalUrlsCount}`)
    console.log(`- Skipped data: URLs:            ${summary.skippedDataUrls}`)
    console.log(`- Format errors:                 ${summary.errorsCount}`)
    console.log(`======================================================\n`)

    if (!isApply) {
      console.log(`To apply these changes to the database, run:`)
      console.log(`  npx tsx scripts/backfill-product-images.ts --apply\n`)
    }
  } catch (err) {
    console.error('Error during product images backfill:', err)
    process.exit(1)
  }
}

main()
