import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '../db/index.js'
import { users as usersTable, type DbUser } from '../db/schema.js'
import { hashPassword } from '../services/cloudIam.js'

export interface CreateUserInput {
  name: string
  email: string
  password?: string
  uid?: string
  provider?: string
}

class UserStore {
  private memoryUsers: DbUser[] = []

  async create(input: CreateUserInput): Promise<DbUser> {
    const cleanEmail = input.email.trim().toLowerCase()
    const uid = input.uid || `iam-user-${crypto.randomUUID()}`
    const passwordHash = input.password ? hashPassword(input.password) : null
    const provider = input.provider || 'cloud-iam'

    if (isDatabaseConfigured() && db) {
      const [row] = await db
        .insert(usersTable)
        .values({
          uid,
          email: cleanEmail,
          name: input.name.trim(),
          passwordHash,
          provider
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
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.memoryUsers.push(newUser)
    return newUser
  }

  async findByEmail(email: string): Promise<DbUser | undefined> {
    const clean = email.trim().toLowerCase()
    if (isDatabaseConfigured() && db) {
      const [row] = await db.select().from(usersTable).where(eq(usersTable.email, clean))
      return row
    }
    return this.memoryUsers.find((u) => u.email === clean)
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
}

export const userStore = new UserStore()
