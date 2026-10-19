import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  schema: '../../packages/db/src/schema.ts',
  out: '../../packages/db/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://jeans_store:jeans_store@localhost:5432/jeans_store'
  }
})
