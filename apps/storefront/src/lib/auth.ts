export interface UserProfile {
  id: number
  uid: string
  email: string
  name: string
  provider: string
  createdAt?: string
}

export interface AuthSuccessPayload {
  user: UserProfile
  token: string
  expiresIn?: number
  isNewUser?: boolean
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '777430238035-cl896fklpijq4cqlstm1d6h3s07q63ke.apps.googleusercontent.com'

async function postAuth(
  path: string,
  payload: unknown,
  failureMessage: string
): Promise<AuthSuccessPayload> {
  if (!API_BASE) throw new Error('Customer authentication is not configured for this storefront.')

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {
    throw new Error('Authentication service is unavailable. Please try again shortly.')
  }

  const result = (await response.json().catch(() => ({}))) as AuthSuccessPayload & {
    error?: string
  }
  if (!response.ok) throw new Error(result.error || failureMessage)
  return result
}

export function signUp(data: {
  name: string
  email: string
  password: string
}): Promise<AuthSuccessPayload> {
  return postAuth(
    '/api/auth/register',
    data,
    'Failed to create account. Please check your information.'
  )
}

export function signIn(data: { email: string; password: string }): Promise<AuthSuccessPayload> {
  return postAuth('/api/auth/login', data, 'Invalid email or password.')
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  if (!API_BASE) throw new Error('Customer authentication is not configured for this storefront.')

  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch {
    throw new Error('Authentication service is unavailable. Please try again shortly.')
  }

  const result = (await response.json().catch(() => ({}))) as { user?: UserProfile; error?: string }
  if (!response.ok || !result.user)
    throw new Error(result.error || 'Failed to authenticate session.')
  return result.user
}

export function getGoogleClientId(): string {
  return GOOGLE_CLIENT_ID
}

export function getGoogleOAuthUrl(redirectUri?: string, state?: string): string {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google sign-in is not configured for this storefront.')
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const cleanOrigin = origin.replace(/\/+$/, '')
  const redirect = redirectUri || `${cleanOrigin}/auth/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  url.searchParams.set('redirect_uri', redirect)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'select_account')
  if (state) url.searchParams.set('state', state)
  return url.toString()
}

export function googleAuth(payload: {
  credential?: string
  code?: string
  redirectUri?: string
}): Promise<AuthSuccessPayload> {
  return postAuth(
    '/api/auth/google',
    payload,
    'Failed to authenticate with Google. Please try again.'
  )
}
