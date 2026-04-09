import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [userId, timestamp, receivedSig] = parts;

    if (Date.now() - parseInt(timestamp, 10) > 10 * 60 * 1000) return null;

    const payload = `${userId}:${timestamp}`;
    const expectedSig = createHmac('sha256', process.env.GOOGLE_CLIENT_SECRET || '')
      .update(payload)
      .digest('hex')
      .slice(0, 16);

    if (expectedSig !== receivedSig) return null;
    return userId;
  } catch {
    return null;
  }
}

async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ access_token?: string; refresh_token?: string; expires_in?: number }>;
}

/**
 * GET /api/integrations/google/callback
 * Exchanges authorization code for access token and stores it in a cookie.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  const importUrl = `${request.nextUrl.origin}/dashboard/import`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${importUrl}?google_error=${encodeURIComponent(error || 'cancelled')}`);
  }

  const userId = verifyState(state);
  if (!userId) {
    return NextResponse.redirect(`${importUrl}?google_error=invalid_state`);
  }

  const redirectUri = `${request.nextUrl.origin}/api/integrations/google/callback`;
  const tokens = await exchangeCode(code, redirectUri);

  if (!tokens?.access_token) {
    return NextResponse.redirect(`${importUrl}?google_error=token_exchange_failed`);
  }

  const response = NextResponse.redirect(`${importUrl}?google=connected`);

  // Store access token in short-lived httpOnly cookie
  response.cookies.set('google_sheets_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokens.expires_in || 3600,
    path: '/',
  });

  return response;
}
