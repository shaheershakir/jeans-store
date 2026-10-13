const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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'
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'clothing-store-511300'

export interface GoogleUserPayload {
  sub: string
  email: string
  name: string
  picture?: string
  emailVerified: boolean
}

export function getGoogleClientId(): string {
  return GOOGLE_CLIENT_ID
}

export function getGoogleProjectId(): string {
  return GOOGLE_PROJECT_ID
}

/**
 * Builds the standard Google OAuth 2.0 Authorization Code flow URL.
 */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'select_account')
  if (state) {
    url.searchParams.set('state', state)
  }
  return url.toString()
}

/**
 * Verifies a Google ID Token (e.g. from Google Identity Services One Tap or GIS button).
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserPayload> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Google ID token')
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    signal: AbortSignal.timeout(6000)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error((errorData as any)?.error_description || 'Invalid or expired Google ID Token')
  }

  const data = (await res.json()) as any

  // Audience verification: token must have been issued for this application
  if (data.aud !== GOOGLE_CLIENT_ID) {
    throw new Error(`Google ID token audience mismatch: expected ${GOOGLE_CLIENT_ID}, received ${data.aud}`)
  }

  // Expiration check
  const now = Math.floor(Date.now() / 1000)
  if (data.exp && Number(data.exp) < now) {
    throw new Error('Google ID token has expired')
  }

  if (!data.email) {
    throw new Error('No verified email found in Google ID token')
  }

  return {
    sub: data.sub || data.user_id,
    email: data.email.toLowerCase(),
    name: data.name || data.email.split('@')[0],
    picture: data.picture,
    emailVerified: data.email_verified === 'true' || data.email_verified === true
  }
}

/**
 * Exchanges a Google OAuth 2.0 authorization code for tokens and extracts verified user info.
 */
export async function exchangeGoogleAuthCode(
  code: string,
  redirectUri: string
): Promise<GoogleUserPayload> {
  if (!code || typeof code !== 'string') {
    throw new Error('Missing authorization code')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }),
    signal: AbortSignal.timeout(8000)
  })

  if (!tokenRes.ok) {
    const errorData = await tokenRes.json().catch(() => ({}))
    const desc =
      (errorData as any)?.error_description ||
      (errorData as any)?.error ||
      `Token exchange failed with HTTP ${tokenRes.status}`
    throw new Error(`Google OAuth code exchange failed: ${desc}`)
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string
    id_token?: string
    expires_in?: number
    token_type?: string
  }

  // 1. If id_token is returned, verify it
  if (tokens.id_token) {
    try {
      return await verifyGoogleIdToken(tokens.id_token)
    } catch {
      // Fallback to userinfo API using access_token if id_token verification encounters any issue
    }
  }

  // 2. Fallback to Google userinfo endpoint if access_token is available
  if (tokens.access_token) {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      },
      signal: AbortSignal.timeout(6000)
    })

    if (userRes.ok) {
      const userInfo = (await userRes.json()) as any
      if (userInfo.email) {
        return {
          sub: userInfo.sub,
          email: userInfo.email.toLowerCase(),
          name: userInfo.name || userInfo.email.split('@')[0],
          picture: userInfo.picture,
          emailVerified: Boolean(userInfo.email_verified)
        }
      }
    }
  }

  throw new Error('Failed to retrieve user profile from Google tokens')
}
