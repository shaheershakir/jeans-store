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
    console.log(`Public tables (${tables.length}):`)
    for (const table of tables) console.log(`  - ${table.table_name}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

void verifyDatabase()
