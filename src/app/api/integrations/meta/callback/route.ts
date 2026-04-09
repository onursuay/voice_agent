import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const META_GRAPH_BASE = 'https://graph.facebook.com/v19.0';

function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [orgId, timestamp, receivedSig] = parts;

    if (Date.now() - parseInt(timestamp, 10) > 10 * 60 * 1000) return null;

    const payload = `${orgId}:${timestamp}`;
    const expectedSig = createHmac('sha256', process.env.META_APP_SECRET || '')
      .update(payload)
      .digest('hex')
      .slice(0, 16);

    if (expectedSig !== receivedSig) return null;
    return orgId;
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string | null> {
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set('client_id', process.env.META_APP_ID!);
  url.searchParams.set('client_secret', process.env.META_APP_SECRET!);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token || null;
}

async function getLongLivedToken(shortToken: string): Promise<string | null> {
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', process.env.META_APP_ID!);
  url.searchParams.set('client_secret', process.env.META_APP_SECRET!);
  url.searchParams.set('fb_exchange_token', shortToken);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token || null;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

async function getPages(userToken: string): Promise<FacebookPage[]> {
  const url = new URL(`${META_GRAPH_BASE}/me/accounts`);
  url.searchParams.set('access_token', userToken);
  url.searchParams.set('fields', 'id,name,access_token');

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json() as { data?: FacebookPage[] };
  return data.data || [];
}

// Sign pending session data and store in cookie
function buildPendingCookie(orgId: string, userToken: string, pages: FacebookPage[]): string {
  const payload = JSON.stringify({ orgId, userToken, pages, ts: Date.now() });
  const sig = createHmac('sha256', process.env.META_APP_SECRET || '')
    .update(payload)
    .digest('hex')
    .slice(0, 24);
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url');
}

/**
 * GET /api/integrations/meta/callback
 * Exchanges code for token, fetches pages, redirects to page selection UI.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  const dashboardUrl = `${request.nextUrl.origin}/dashboard/settings?tab=integrations`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=${encodeURIComponent(error || 'cancelled')}`);
  }

  const orgId = verifyState(state);
  if (!orgId) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=invalid_state`);
  }

  const redirectUri = `${request.nextUrl.origin}/api/integrations/meta/callback`;

  const shortToken = await exchangeCodeForToken(code, redirectUri);
  if (!shortToken) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=token_exchange_failed`);
  }

  const longToken = await getLongLivedToken(shortToken);
  const userToken = longToken || shortToken;

  const pages = await getPages(userToken);
  if (!pages.length) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=no_pages`);
  }

  // If only 1 page, skip selection and go straight to save
  if (pages.length === 1) {
    const selectUrl = new URL(`${request.nextUrl.origin}/api/integrations/meta/select-page`);
    selectUrl.searchParams.set('org_id', orgId);
    selectUrl.searchParams.set('page_id', pages[0].id);

    // Store pending data in cookie for select-page to read
    const cookie = buildPendingCookie(orgId, userToken, pages);
    const response = NextResponse.redirect(selectUrl.toString());
    response.cookies.set('meta_pending', cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    return response;
  }

  // Multiple pages → redirect to selection UI
  const cookie = buildPendingCookie(orgId, userToken, pages);
  const selectUrl = `${request.nextUrl.origin}/dashboard/meta-select`;

  const response = NextResponse.redirect(selectUrl);
  response.cookies.set('meta_pending', cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
  return response;
}
