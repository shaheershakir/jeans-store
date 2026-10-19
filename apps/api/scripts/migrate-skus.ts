import 'dotenv/config'
import { count, eq, isNull, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../src/db/index.js'
import { products, productVariants } from '../src/db/schema.js'

/**
 * Post-baseline SKU/variant integrity check.
 *
 * The baseline creates `product_variants`, its unique indexes and the SKU
 * conventions. The old migration script is no longer needed; this verifies
 * that every product has variants and that every SKU is unique.
 */
async function main() {
  if (!isDatabaseConfigured() || !db) {
    console.error('Database connection is not configured. Set DATABASE_URL first.')
    process.exit(1)
  }

  const [productCount] = await db.select({ value: count() }).from(products)
  const [variantCount] = await db.select({ value: count() }).from(productVariants)

  const productsWithoutVariants = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .where(isNull(productVariants.id))

  const duplicateSkus = await db
    .select({ sku: productVariants.sku, total: count() })
    .from(productVariants)
    .groupBy(productVariants.sku)
    .having(sql`count(*) > 1`)

  const emptySkus = await db
    .select({ id: productVariants.id, productId: productVariants.productId })
    .from(productVariants)
    .where(sql`trim(${productVariants.sku}) = ''`)

  console.log(`\nSKU / variant integrity check`)
  console.log(`- Products:                 ${productCount?.value ?? 0}`)
  console.log(`- Variants:                 ${variantCount?.value ?? 0}`)
  console.log(`- Products without variants:${productsWithoutVariants.length}`)
  console.log(`- Duplicate SKUs:           ${duplicateSkus.length}`)
  console.log(`- Empty SKUs:               ${emptySkus.length}`)

  for (const product of productsWithoutVariants) {
    console.log(`  ⚠️  ${product.name} (id ${product.id}) has no variants`)
  }
  for (const duplicate of duplicateSkus) {
    console.log(`  ⚠️  ${duplicate.sku} appears ${duplicate.total} times`)
  }
  for (const variant of emptySkus) {
    console.log(`  ⚠️  Variant ${variant.id} (product ${variant.productId}) has an empty SKU`)
  }

  if (
    productsWithoutVariants.length > 0 ||
    duplicateSkus.length > 0 ||
    emptySkus.length > 0
  ) {
    console.error('\nSKU / variant integrity check failed. Re-run the catalog seed or fix the listed rows.')
    process.exit(1)
  }

  console.log('\n✅ Every product has variants and every SKU is unique and non-empty.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
