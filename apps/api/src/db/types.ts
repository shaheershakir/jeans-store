import type { db } from './index.js'

/** The configured Drizzle database client. */
export type DatabaseClient = NonNullable<typeof db>

/** A Drizzle transaction callback client. */
export type TransactionClient = Parameters<Parameters<DatabaseClient['transaction']>[0]>[0]

/**
 * Code that must run inside the same transaction as the caller accepts either
 * the pool-backed client or a transaction. Structural typing keeps the service
 * layer usable from both without unsafe casts.
 */
export type DbExecutor = Pick<DatabaseClient, 'select' | 'insert' | 'update' | 'delete' | 'execute'>
