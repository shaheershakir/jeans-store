import { sql } from '../src/db/index.js'

async function main() {
  if (!sql) {
    console.log('No sql client available')
    return
  }
  const variants = await sql`
    SELECT
      pv.id,
      pv.product_id,
      p.name,
      c.slug AS category,
      p.fit,
      pv.sku,
      pv.color,
      pv.size,
      pv.price,
      pv.stock
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN categories c ON c.id = p.category_id
    ORDER BY pv.id ASC
    LIMIT 10
  `
  console.log('Sample Variants from DB:')
  console.table(variants)

  const count = await sql`SELECT count(*) FROM product_variants`
  console.log('Total Variants in DB:', count)
}

main().catch(console.error)
