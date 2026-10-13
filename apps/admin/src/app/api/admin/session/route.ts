import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SESSION_COOKIE = 'teesgarage_admin_session'
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function POST(request: Request) {
  try {
    const upstream = await fetch(`${API_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
      cache: 'no-store'
    })
    const payload = (await upstream.json().catch(() => ({}))) as {
      error?: string
      token?: string
      expiresIn?: number
      user?: { id: number; name: string; email: string; role: string }
    }
    if (!upstream.ok || !payload.token || !payload.user) {
      return NextResponse.json({ error: payload.error || 'Sign-in failed.' }, { status: upstream.status || 502 })
    }

    const response = NextResponse.json({ user: payload.user })
    response.cookies.set(SESSION_COOKIE, payload.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: payload.expiresIn || 60 * 60 * 8
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Admin service is unavailable. Try again shortly.' }, { status: 502 })
  }
}

export async function GET() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ error: 'Signed out.' }, { status: 401 })

  try {
    const upstream = await fetch(`${API_URL}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
    const payload = await upstream.json().catch(() => ({}))
    const response = NextResponse.json(payload, { status: upstream.status })
    if (upstream.status === 401) response.cookies.delete(SESSION_COOKIE)
    return response
  } catch {
    return NextResponse.json({ error: 'Admin service is unavailable.' }, { status: 502 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
