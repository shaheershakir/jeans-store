import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, getDatabaseUrl, maskDatabaseUrl, pool } from '../src/db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const rawUrl = getDatabaseUrl()

  if (!rawUrl) {
    console.error('❌ Migration Error: DATABASE_URL environment variable is missing.')
    console.error('Set DATABASE_URL in apps/api/.env before running migrations.')
    process.exit(1)
  }

  const masked = maskDatabaseUrl(rawUrl)
  console.log(`🚀 Starting database migration...`)
  console.log(`📍 Target Database: ${masked}`)
  try {
    if (!db || !pool) throw new Error('Database client is not configured.')

    const migrationsFolder = path.resolve(__dirname, '../../../packages/db/drizzle')
    console.log(`📂 Applying migrations from: ${migrationsFolder}`)

    await migrate(db, { migrationsFolder })

    console.log('✅ Migrations applied successfully!')

    // Quick verification of created tables
    const { rows: tables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    console.log(`📋 Public tables now present (${tables.length}):`)
    for (const t of tables) {
      console.log(`   - ${(t as { table_name: string }).table_name}`)
    }
  } catch (err: unknown) {
    console.error('❌ Migration failed with error:')
    const message = err instanceof Error ? err.message : String(err)
    const sanitized = message.replace(/:\/\/[^:]+:[^@]+@/, '://[user]:****@')
    console.error(`   ${sanitized}`)
    process.exit(1)
  } finally {
    await pool?.end()
  }
}

void runMigrations()
