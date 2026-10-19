import { pool, isDatabaseConfigured } from '../src/db/index.js'

async function main() {
  if (!pool || !isDatabaseConfigured()) {
    console.log('Database is not configured. Set DATABASE_URL in apps/api/.env.')
    return
  }

  const { rows: variants } = await pool.query(`
    SELECT
      pv.id,
      pv.product_id,
      p.name,
      c.slug AS category,
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
  `)
  console.log('Sample variants in database:')
  console.table(variants)

  const { rows: count } = await pool.query('SELECT count(*) FROM product_variants')
  console.log('Total variants in database:', count[0]?.count ?? 0)
  await pool.end()
}

main().catch(async (error: unknown) => {
  console.error(error)
  await pool?.end()
  process.exitCode = 1
})
