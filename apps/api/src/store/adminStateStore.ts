import { eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { adminState } from '../db/schema.js'

const STORE_ID = 'teesgarage'
let memoryState: Record<string, unknown> = {}

export async function getAdminState(): Promise<Record<string, unknown>> {
  if (isDatabaseConfigured() && db) {
    const [row] = await db.select({ data: adminState.data }).from(adminState).where(eq(adminState.id, STORE_ID))
    return row?.data ?? {}
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Admin state database is not configured.')
  return structuredClone(memoryState)
}

export async function saveAdminState(data: Record<string, unknown>): Promise<void> {
  if (isDatabaseConfigured() && db) {
    await db
      .insert(adminState)
      .values({ id: STORE_ID, data, updatedAt: new Date() })
      .onConflictDoUpdate({ target: adminState.id, set: { data, updatedAt: new Date() } })
    return
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Admin state database is not configured.')
  memoryState = structuredClone(data)
}
