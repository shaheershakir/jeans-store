import crypto from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { users as usersTable, type DbUser } from '@jeans-store/db'
import { hashPassword } from '../services/cloudIam.js'

export interface CreateUserInput {
  name: string
  email: string
  password?: string
  uid?: string
  provider?: string
  googleSub?: string
}

class UserStore {
  private memoryUsers: DbUser[] = []

  async create(input: CreateUserInput): Promise<DbUser> {
    const cleanEmail = input.email.trim().toLowerCase()
    const uid = input.uid || `iam-user-${crypto.randomUUID()}`
    const passwordHash = input.password ? hashPassword(input.password) : null
    const provider = input.provider || 'cloud-iam'
    const googleSub = input.googleSub ?? null

    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .insert(usersTable)
        .values({
          uid,
          email: cleanEmail,
          name: input.name.trim(),
          passwordHash,
          provider,
          googleSub
        })
        .returning()
      return row
    }

    const newUser: DbUser = {
      id: this.memoryUsers.length + 1,
      uid,
      email: cleanEmail,
      name: input.name.trim(),
      passwordHash,
      provider,
      googleSub,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.memoryUsers.push(newUser)
    return newUser
  }

  async findByEmail(email: string): Promise<DbUser | undefined> {
    const clean = email.trim().toLowerCase()
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .select()
        .from(usersTable)
        .where(sql`lower(${usersTable.email}) = ${clean}`)
      return row
    }
    return this.memoryUsers.find((u) => u.email.toLowerCase() === clean)
  }

  async findByUid(uid: string): Promise<DbUser | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(usersTable).where(eq(usersTable.uid, uid))
      return row
    }
    return this.memoryUsers.find((u) => u.uid === uid)
  }

  async findById(id: number): Promise<DbUser | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(usersTable).where(eq(usersTable.id, id))
      return row
    }
    return this.memoryUsers.find((u) => u.id === id)
  }

  async findByGoogleSub(googleSub: string): Promise<DbUser | undefined> {
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(usersTable).where(eq(usersTable.googleSub, googleSub))
      return row
    }
    return this.memoryUsers.find((u) => u.googleSub === googleSub)
  }

  async update(id: number, patch: { name?: string }): Promise<DbUser | undefined> {
    const now = new Date()
    const updateData: Partial<typeof usersTable.$inferInsert> = { updatedAt: now }
    if (patch.name !== undefined) {
      updateData.name = patch.name
    }
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, id))
        .returning()
      return row
    }
    const user = this.memoryUsers.find((u) => u.id === id)
    if (user) {
      if (patch.name !== undefined) {
        user.name = patch.name
      }
      user.updatedAt = now
    }
    return user
  }

  async updateGoogleSub(id: number, googleSub: string): Promise<DbUser | undefined> {
    const now = new Date()
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .update(usersTable)
        .set({ googleSub, updatedAt: now })
        .where(eq(usersTable.id, id))
        .returning()
      return row
    }
    const user = this.memoryUsers.find((u) => u.id === id)
    if (user) {
      user.googleSub = googleSub
      user.updatedAt = now
    }
    return user
  }

  async completeOnboarding(id: number): Promise<DbUser | undefined> {
    const now = new Date()
    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .update(usersTable)
        .set({ updatedAt: now })
        .where(eq(usersTable.id, id))
        .returning()
      return row
    }
    const user = this.memoryUsers.find((u) => u.id === id)
    if (user) {
      user.updatedAt = now
    }
    return user
  }
}

export const userStore = new UserStore()
