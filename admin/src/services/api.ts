/**
 * Service layer — HTTP API client and boundary the UI talks to.
 */

const LATENCY = 150

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin.replace(':3001', ':4000') : 'http://localhost:4000')

export const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || ''

export function simulateLatency(ms = LATENCY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (ADMIN_API_KEY && !headers.has('x-api-key')) {
    headers.set('x-api-key', ADMIN_API_KEY)
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers
  })

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) errorMsg = body.error
    } catch {
      // Ignore JSON parse failure on error body
    }
    throw new Error(errorMsg)
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json() as Promise<T>
}