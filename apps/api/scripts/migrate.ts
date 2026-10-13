import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { getDatabaseUrl, ensureSslMode, maskDatabaseUrl } from '../src/db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  const rawUrl = getDatabaseUrl()

  if (!rawUrl) {
    console.error('❌ Migration Error: DATABASE_URL environment variable is missing.')
    console.error('Please configure DATABASE_URL for your target branch (test or production) before running migrations.')
    process.exit(1)
  }

  const databaseUrl = ensureSslMode(rawUrl)
  const masked = maskDatabaseUrl(databaseUrl)
  console.log(`🚀 Starting database migration...`)
  console.log(`📍 Target Database: ${masked}`)
  console.log(`🔒 SSL Mode: Enforced (sslmode=require)`)

  try {
    const sqlClient = neon(databaseUrl)
    const db = drizzle(sqlClient)

    const migrationsFolder = path.resolve(__dirname, '../drizzle')
    console.log(`📂 Applying migrations from: ${migrationsFolder}`)

    await migrate(db, { migrationsFolder })

    console.log('✅ Migrations applied successfully!')

    // Quick verification of created tables
    const tables = await sqlClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
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
  }
}

void runMigrations()
