import crypto from 'node:crypto'

export interface AdminSessionClaims {
  email: string
  name: string
  role: 'admin'
  iat: number
  exp: number
}

const SESSION_SECONDS = 60 * 60 * 8

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET?.trim()
  if (!value || value.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters.')
  }
  return value
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function createAdminSession(email: string, name: string): { token: string; expiresIn: number } {
  const now = Math.floor(Date.now() / 1000)
  const head = encode({ alg: 'HS256', typ: 'JWT' })
  const body = encode({ email, name, role: 'admin', iat: now, exp: now + SESSION_SECONDS })
  const signature = crypto.createHmac('sha256', secret()).update(`${head}.${body}`).digest('base64url')
  return { token: `${head}.${body}.${signature}`, expiresIn: SESSION_SECONDS }
}

export function verifyAdminSession(token: string): AdminSessionClaims | null {
  try {
    const key = secret()
    const [head, body, signature] = token.split('.')
    if (!head || !body || !signature) return null
    const expected = crypto.createHmac('sha256', key).update(`${head}.${body}`).digest()
    const received = Buffer.from(signature, 'base64url')
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null

    const header = JSON.parse(Buffer.from(head, 'base64url').toString('utf8')) as { alg?: string }
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSessionClaims
    if (header.alg !== 'HS256' || claims.role !== 'admin' || !claims.email || !claims.exp) return null
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null
    if (claims.email.toLowerCase() !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) return null
    return claims
  } catch {
    return null
  }
}

export function adminSessionDuration(): number {
  return SESSION_SECONDS
}
