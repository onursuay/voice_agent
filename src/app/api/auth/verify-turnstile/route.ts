import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('x-forwarded-for') ?? undefined,
    }),
  })

  const data = await res.json()
  if (!data.success) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
