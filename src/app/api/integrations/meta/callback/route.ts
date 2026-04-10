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

  let pageNum = 0;
  while (nextUrl) {
    pageNum++;
    const res = await fetch(nextUrl);
    const body = await res.json() as {
      data?: FacebookPage[];
      paging?: { cursors?: { after?: string }; next?: string };
      error?: { message: string; code: number };
    };
    console.log(`[Meta getPages] page=${pageNum} status=${res.status} count=${body.data?.length ?? 0} hasNext=${!!body.paging?.next} error=${body.error?.message ?? 'none'}`);
    if (!res.ok || body.error) break;
    if (body.data) allPages.push(...body.data);
    nextUrl = body.paging?.next ?? null;
  }

  console.log(`[Meta getPages] TOTAL pages fetched: ${allPages.length}`);
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

  // Upsert pending session — delete any existing record first (provider is UNIQUE)
  await supabase
    .from('integration_settings')
    .delete()
    .eq('provider', 'meta_oauth_pending');

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
