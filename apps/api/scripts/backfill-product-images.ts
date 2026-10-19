import 'dotenv/config'
import { eq, isNull } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../src/db/index.js'
import { productImages, products } from '@jeans-store/db'

/**
 * The legacy `products.img/img2/images` columns were removed by the baseline.
 * This script now verifies that every product has at least one image row in
 * `product_images` instead of backfilling from those columns.
 */
async function main() {
  if (!isDatabaseConfigured() || !db) {
    console.error('Database connection is not configured. Set DATABASE_URL first.')
    process.exit(1)
  }

  const missingImages = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(isNull(productImages.id))

  console.log(`\nProduct image coverage`)
  console.log(`- Products without images: ${missingImages.length}`)

  for (const product of missingImages) {
    console.log(`  ⚠️  ${product.name} (id ${product.id}) has no images`)
  }

  if (missingImages.length > 0) {
    console.error('\nImage coverage check failed. Re-run the catalog seed or add image rows.')
    process.exit(1)
  }

  console.log('\n✅ Every product has at least one image.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
