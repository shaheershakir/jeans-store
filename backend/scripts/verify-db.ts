import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { getDatabaseUrl, ensureSslMode, maskDatabaseUrl } from '../src/db/index.js'

async function verifyDatabase() {
  const rawUrl = getDatabaseUrl()

  if (!rawUrl) {
    console.error('❌ Verification Error: DATABASE_URL environment variable is missing.')
    console.error('Set DATABASE_URL to verify database connectivity.')
    process.exit(1)
  }

  const databaseUrl = ensureSslMode(rawUrl)
  const masked = maskDatabaseUrl(databaseUrl)

  console.log('====================================================')
  console.log('🔍 Neon PostgreSQL Connectivity & Health Check')
  console.log('====================================================')
  console.log(`Target:     ${masked}`)
  console.log(`SSL Mode:   Enforced (TLS encrypted)`)

  try {
    const sql = neon(databaseUrl)

    // Execute standard read-only verification query
    const result = await sql`
      SELECT
        current_database() AS database_name,
        current_timestamp AS server_time;
    `

    const row = result[0] as { database_name: string; server_time: string }
    console.log(`Connected:  YES (HTTP serverless query mode)`)
    console.log(`Database:   ${row.database_name}`)
    console.log(`Timestamp:  ${row.server_time}`)

    // Query public tables and row counts (read-only)
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `

    console.log(`\n📋 Schema Status (public tables: ${tables.length}):`)
    for (const t of tables) {
      const name = (t as { table_name: string }).table_name
      console.log(`   - ${name}`)
    }

    console.log('====================================================')
    console.log('✅ Read-only database verification passed successfully.')
    console.log('====================================================')
  } catch (err: unknown) {
    console.error('\n❌ Database verification failed!')
    const message = err instanceof Error ? err.message : String(err)
    const sanitized = message.replace(/:\/\/[^:]+:[^@]+@/, '://[user]:****@')
    console.error(`Error: ${sanitized}`)
    process.exit(1)
  }
}

void verifyDatabase()
