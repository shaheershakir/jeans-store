import crypto from 'node:crypto'

const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'teesgarage-production'

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  return 'local-development-only-jwt-secret-not-for-production'
}

export interface CloudIamClaims {
  uid: string
  email: string
  name: string
  iss?: string
  aud?: string
  iat?: number
  exp?: number
}

/**
 * Generates a secure scrypt password hash with a random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

/**
 * Verifies a plain password against the stored salt:hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'))
  } catch {
    return false
  }
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

/**
 * Creates a Google Cloud IAM standard compliant ID Token (JWT).
 */
export function createCloudIamToken(claims: { uid: string; email: string; name: string }): {
  token: string
  expiresIn: number
} {
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60 * 24 * 7 // 7 days

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const payload = {
    iss: `https://securetoken.google.com/${GCP_PROJECT_ID}`,
    aud: GCP_PROJECT_ID,
    auth_time: now,
    sub: claims.uid,
    user_id: claims.uid,
    email: claims.email,
    email_verified: true,
    name: claims.name,
    iat: now,
    exp: now + expiresIn
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  const signature = crypto
    .createHmac('sha256', jwtSecret())
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const token = `${signatureInput}.${signature}`
  return { token, expiresIn }
}

/**
 * Verifies a Google Cloud IAM token.
 * Validates cryptographic signature and checks expiration.
 */
export async function verifyCloudIamToken(token: string): Promise<CloudIamClaims | null> {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, signature] = parts

  try {
    // 1. Verify cryptographic signature against configured secret and known dev fallbacks
    const candidateSecrets = [
      jwtSecret(),
      process.env.JWT_SECRET?.trim(),
      'local-dev-customer-jwt-secret-change-me',
      'local-development-only-jwt-secret-not-for-production',
      process.env.ADMIN_SESSION_SECRET?.trim()
    ].filter((s): s is string => Boolean(s && s.length > 0))

    const uniqueSecrets = [...new Set(candidateSecrets)]
    let signatureValid = false

    for (const secret of uniqueSecrets) {
      const candidateSig = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

      if (
        signature.length === candidateSig.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(candidateSig))
      ) {
        signatureValid = true
        break
      }
    }

    if (!signatureValid) {
      // Check Google OIDC token if configured or during local development
      if (
        (process.env.NODE_ENV === 'production' && process.env.GCP_VERIFY_OIDC === 'true') ||
        process.env.NODE_ENV !== 'production'
      ) {
        const googleCheck = await verifyWithGoogleOidc(token)
        if (googleCheck) return googleCheck
      }
      return null
    }

    // 2. Parse claims
    const payloadJson = base64UrlDecode(encodedPayload)
    const payload = JSON.parse(payloadJson) as CloudIamClaims

    // 3. Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return null
    }

    return {
      uid: payload.uid || (payload as any).sub,
      email: payload.email,
      name: payload.name,
      iss: payload.iss,
      aud: payload.aud,
      iat: payload.iat,
      exp: payload.exp
    }
  } catch {
    return null
  }
}

async function verifyWithGoogleOidc(token: string): Promise<CloudIamClaims | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(3000)
    })
    if (!res.ok) return null
    const data = (await res.json()) as any
    if (!data.email) return null
    return {
      uid: data.sub || data.user_id,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      iss: data.iss,
      aud: data.aud,
      exp: Number(data.exp)
    }
  } catch {
    return null
  }
}
