import { Pool } from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'
import 'dotenv/config'

export * from './schema.js'

export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim()
  return url || undefined
}

/** Masks credentials before a connection URL is written to logs. */
export function maskDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '(not configured)'
  try {
    const parsed = new URL(rawUrl)
    return `${parsed.protocol}//${parsed.username ? '[user]' : ''}:****@${parsed.host}${parsed.pathname}`
  } catch {
    return '[malformed or masked database url]'
  }
}

const databaseUrl = getDatabaseUrl()

export const pool: Pool | null = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
    })
  : null

export const db: NodePgDatabase<typeof schema> | null = pool ? drizzle(pool, { schema }) : null

export function isDatabaseConfigured(): boolean {
  return Boolean(pool)
}

export function getDatabaseClient(): NodePgDatabase<typeof schema> {
  if (!db) {
    throw new Error('Database is not configured. Set DATABASE_URL in apps/api/.env.')
  }
  return db
}
