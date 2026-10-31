import 'dotenv/config'
import { getDatabaseUrl, maskDatabaseUrl, pool } from '../src/db/index.js'

async function verifyDatabase() {
  const rawUrl = getDatabaseUrl()

  if (!rawUrl || !pool) {
    console.error('DATABASE_URL is missing. Set it in apps/api/.env.')
    process.exit(1)
  }

  console.log('PostgreSQL connectivity check')
  console.log(`Target: ${maskDatabaseUrl(rawUrl)}`)

  try {
    const { rows: [database] } = await pool.query(`
      SELECT current_database() AS database_name, current_timestamp AS server_time
    `)
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log(`Connected: YES (${database.database_name})`)
    console.log(`Server time: ${database.server_time}`)
    console.log(`Public tables count: ${tables.length}`)

    const { rows: categoriesHierarchy } = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.sort_order,
        c.parent_id,
        p.name AS parent_name
      FROM categories c
      LEFT JOIN categories p ON p.id = c.parent_id
      ORDER BY COALESCE(c.parent_id, c.id), c.parent_id NULLS FIRST, c.sort_order
    `)
    console.log('\nCategories Hierarchy in Database:')
    console.table(categoriesHierarchy)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

void verifyDatabase()
