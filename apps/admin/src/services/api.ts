/**
 * Service layer — HTTP API client and boundary the UI talks to.
 */

const LATENCY = 150

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
  const proxiedPath = path.startsWith('/api/') ? `/api/admin/proxy${path}` : `/api/admin/proxy/api/${path.replace(/^\/+/, '')}`
  const res = await fetch(proxiedPath, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store'
  })

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) errorMsg = body.error
    } catch {
      // Ignore JSON parse failure on error body
    }
    if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    throw new Error(errorMsg)
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json() as Promise<T>
}
