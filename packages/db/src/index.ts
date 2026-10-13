import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'
import 'dotenv/config'

export * from './schema.js'

/**
 * Safely extracts the database connection URL from runtime environment variables.
 * Compatible with Node.js, Cloud Run, Render, and Fastly Compute edge environments.
 */
export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim()
  if (url) return url

  // Fastly Compute environment lookup fallback if running in Compute runtime
  try {
    // @ts-ignore
    if (typeof fastly !== 'undefined' && fastly?.env?.get) {
      // @ts-ignore
      const val = fastly.env.get('DATABASE_URL')
      if (val) return val.trim()
    }
  } catch {
    // Ignore runtime lookup errors outside Compute environment
  }

  return undefined
}

/**
 * Normalizes a connection string to enforce SSL encryption (sslmode=require)
 * as mandated by Neon PostgreSQL infrastructure.
 */
export function ensureSslMode(connectionString: string): string {
  if (!connectionString.includes('sslmode=')) {
    const separator = connectionString.includes('?') ? '&' : '?'
    return `${connectionString}${separator}sslmode=require`
  }
  return connectionString
}

/**
 * Masks database credentials for safe logging and status reporting.
 * Completely strips username, password, and sensitive query tokens.
 */
export function maskDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '(not configured)'
  try {
    const parsed = new URL(rawUrl)
    return `${parsed.protocol}//${parsed.username ? '[user]' : ''}:****@${parsed.host}${parsed.pathname}`
  } catch {
    return '[malformed or masked database url]'
  }
}

const rawUrl = getDatabaseUrl()
const databaseUrl = rawUrl ? ensureSslMode(rawUrl) : undefined

export const sql: NeonQueryFunction<boolean, boolean> | null = databaseUrl
  ? neon(databaseUrl)
  : null

export const db: NeonHttpDatabase<typeof schema> | null = sql
  ? drizzle(sql, { schema })
  : null

export function isDatabaseConfigured(): boolean {
  return Boolean(db)
}

export function getDatabaseClient(): NeonHttpDatabase<typeof schema> {
  if (!db) {
    throw new Error('Database is not configured. DATABASE_URL environment variable is missing or invalid.')
  }
  return db
}
