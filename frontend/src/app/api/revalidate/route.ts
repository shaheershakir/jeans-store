import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get('x-revalidate-secret')
  const secretQuery = request.nextUrl.searchParams.get('secret')
  const secret = secretHeader ?? secretQuery

  const expectedSecret = process.env.REVALIDATION_SECRET

  // If a secret is configured in the environment, enforce it
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid revalidation secret' }, { status: 401 })
  }

  let tag = 'products'
  try {
    const body = (await request.json()) as { tag?: string; path?: string }
    if (body.tag) tag = body.tag
    if (body.path) revalidatePath(body.path)
  } catch {
    // Body is optional
  }

  revalidateTag(tag)
  revalidatePath('/')
  revalidatePath('/checkout')

  return NextResponse.json({
    revalidated: true,
    tag,
    timestamp: Date.now()
  })
}
