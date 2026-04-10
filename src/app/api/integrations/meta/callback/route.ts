import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

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
  const allPages: FacebookPage[] = [];
  let nextUrl: string | null = null;

  const initialUrl = new URL(`${META_GRAPH_BASE}/me/accounts`);
  initialUrl.searchParams.set('access_token', userToken);
  initialUrl.searchParams.set('fields', 'id,name,access_token');
  initialUrl.searchParams.set('limit', '100');
  nextUrl = initialUrl.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) break;
    const data = await res.json() as {
      data?: FacebookPage[];
      paging?: { next?: string };
    };
    if (data.data) allPages.push(...data.data);
    nextUrl = data.paging?.next ?? null;
  }

  return allPages;
}

/**
 * GET /api/integrations/meta/callback
 * Exchanges code for token, fetches pages, stores pending session in DB,
 * then redirects to page selection UI.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  const dashboardUrl = `${request.nextUrl.origin}/dashboard/integrations`;

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

  // Store pending OAuth session in DB (keyed by org_id) instead of a cookie
  const supabase = createAdminSupabaseClient();
  const pendingConfig = {
    organization_id: orgId,
    userToken,
    pages,
    ts: Date.now(),
  };

  // Upsert: delete existing pending record for this org, then insert fresh one
  await supabase
    .from('integration_settings')
    .delete()
    .eq('provider', 'meta_oauth_pending')
    .filter('config->>organization_id', 'eq', orgId);

  await supabase
    .from('integration_settings')
    .insert({ provider: 'meta_oauth_pending', config: pendingConfig, is_active: false });

  // If only 1 page, skip selection and save directly
  if (pages.length === 1) {
    const selectUrl = new URL(`${request.nextUrl.origin}/api/integrations/meta/select-page`);
    selectUrl.searchParams.set('org_id', orgId);
    selectUrl.searchParams.set('page_id', pages[0].id);
    return NextResponse.redirect(selectUrl.toString());
  }

  // Multiple pages → redirect to selection UI
  return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/meta-select`);
}
