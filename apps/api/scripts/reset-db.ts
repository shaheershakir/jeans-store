import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, getDatabaseUrl, maskDatabaseUrl, pool } from '../src/db/index.js'
import { seedIfEmpty } from '../src/db/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`)
  process.exit(1)
}

function takeBackup(databaseUrl: string): string {
  const folder = path.resolve(__dirname, '../backups')
  fs.mkdirSync(folder, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(folder, `teesgarage-${stamp}.dump`)

  console.log(`📦 Taking a pg_dump backup → ${file}`)
  const result = spawnSync(
    'pg_dump',
    ['--format=custom', '--no-owner', '--no-privileges', '--file', file, databaseUrl],
    { stdio: 'inherit' }
  )

  if (result.error || result.status !== 0) {
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      fail(
        'pg_dump was not found. Install the PostgreSQL client tools or re-run with SKIP_DB_BACKUP=yes after backing up the database.'
      )
    }
    fail('pg_dump failed. The database was NOT reset. Fix the backup step or back up the database first.')
  }

  return file
}

async function resetDatabase(): Promise<void> {
  if (process.env.CONFIRM_DB_RESET !== 'yes') {
    console.log(`
TEESGARAGE database reset

This permanently drops the public and drizzle schemas, applies all database
migrations, and seeds the source catalog.

Nothing has been changed. To continue:

  CONFIRM_DB_RESET=yes npm run db:reset --workspace=@jeans-store/api

Optional environment variables:
  SKIP_DB_BACKUP=yes   Skip pg_dump (only after taking a separate backup)
  SKIP_SEED=yes        Apply the schema without seeding the catalog

Target database: ${maskDatabaseUrl(getDatabaseUrl())}
`)
    return
  }

  const rawUrl = getDatabaseUrl()
  if (!rawUrl) fail('DATABASE_URL is not configured. Set it in apps/api/.env or the shell environment.')

  console.log(`\n⚠️  Resetting database: ${maskDatabaseUrl(rawUrl)}`)

  if (process.env.SKIP_DB_BACKUP !== 'yes') {
    takeBackup(rawUrl)
  } else {
    console.log('⚠️  SKIP_DB_BACKUP=yes — skipping pg_dump.')
  }

  if (!db || !pool) fail('Database client is not configured.')

  console.log('🧨 Dropping public and drizzle schemas...')
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE')
  await pool.query('CREATE SCHEMA public')
  await pool.query('GRANT ALL ON SCHEMA public TO public')
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')

  console.log('🚀 Applying database migrations...')
  const migrationsFolder = path.resolve(__dirname, '../../../packages/db/drizzle')
  await migrate(db, { migrationsFolder })

  if (process.env.SKIP_SEED !== 'yes') {
    console.log('🌱 Seeding catalog, settings, roles, shipping, homepage and navigation...')
    const seeded = await seedIfEmpty()
    if (!seeded) {
      console.log('ℹ️  Seed skipped (database already has products).')
    }
  } else {
    console.log('⚠️  SKIP_SEED=yes — schema reset without seeding.')
  }

  const { rows: tables } = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)
  console.log(`\n✅ Reset complete. Public tables (${tables.length}):`)
  for (const table of tables) {
    console.log(`   - ${(table as { table_name: string }).table_name}`)
  }
  await pool.end()
}

resetDatabase().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message.replace(/:\/\/[^:]+:[^@]+@/, '://[user]:****@'))
  process.exit(1)
})
