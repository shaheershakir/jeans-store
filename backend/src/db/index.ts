import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL

export const sql = databaseUrl ? neon(databaseUrl) : null
export const db = sql ? drizzle(sql, { schema }) : null

export function isDatabaseConfigured(): boolean {
  return Boolean(db)
}
