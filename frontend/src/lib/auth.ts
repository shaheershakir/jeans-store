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
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function signUp(data: {
  name: string
  email: string
  password: string
}): Promise<AuthSuccessPayload> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Failed to create account. Please check your information.')
  }

  return json as AuthSuccessPayload
}

export async function signIn(data: {
  email: string
  password: string
}): Promise<AuthSuccessPayload> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Invalid email or password.')
  }

  return json as AuthSuccessPayload
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Failed to authenticate session.')
  }

  return json.user as UserProfile
}
