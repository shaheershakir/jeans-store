/**
 * Service layer — the boundary the UI talks to.
 *
 * Every mutation goes through an async service function that simulates
 * network latency before applying the change to the persisted store.
 * When `backend/` ships a real HTTP API, only these functions change:
 * swap the store calls for `fetch()` calls.
 */

const LATENCY = 260

export function simulateLatency(ms = LATENCY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}