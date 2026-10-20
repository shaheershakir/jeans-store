import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'teesgarage_admin_session'
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const upstreamUrl = `${API_URL}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`
  const cookieJar = await cookies()
  const token = cookieJar.get(SESSION_COOKIE)?.value
  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  const accept = request.headers.get('accept')
  if (contentType) headers.set('content-type', contentType)
  if (accept) headers.set('accept', accept)
  const adminKey = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  } else if (adminKey) {
    headers.set('authorization', `Bearer ${adminKey}`)
    headers.set('x-admin-key', adminKey)
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store'
    })
    const responseHeaders = new Headers()
    const responseType = upstream.headers.get('content-type')
    if (responseType) responseHeaders.set('content-type', responseType)
    responseHeaders.set('cache-control', 'no-store')
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch {
    return NextResponse.json({ error: 'Backend API is unavailable.' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
