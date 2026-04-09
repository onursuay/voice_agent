import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

interface PendingSession {
  orgId: string;
  userToken: string;
  pages: { id: string; name: string }[];
  ts: number;
}

function readPendingCookie(cookieValue: string): PendingSession | null {
  try {
    const { payload, sig } = JSON.parse(Buffer.from(cookieValue, 'base64url').toString('utf-8'));
    const expectedSig = createHmac('sha256', process.env.META_APP_SECRET || '')
      .update(payload)
      .digest('hex')
      .slice(0, 24);
    if (sig !== expectedSig) return null;

    const session = JSON.parse(payload) as PendingSession;
    if (Date.now() - session.ts > 10 * 60 * 1000) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * GET /api/integrations/meta/pending-pages
 * Returns page list from the pending OAuth cookie (no tokens exposed).
 */
export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get('meta_pending')?.value;
  if (!cookieValue) {
    return NextResponse.json({ error: 'session_expired', reason: 'no_cookie' }, { status: 401 });
  }

  const session = readPendingCookie(cookieValue);
  if (!session) {
    return NextResponse.json({ error: 'session_expired', reason: 'invalid_or_expired' }, { status: 401 });
  }

  // Return only id + name, never expose tokens to frontend
  return NextResponse.json({
    orgId: session.orgId,
    pages: session.pages.map((p) => ({ id: p.id, name: p.name })),
  });
}
