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

    // Reject states older than 10 minutes
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

async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string | null> {
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

interface FacebookPage {
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

async function subscribePageToWebhook(
  pageId: string,
  pageToken: string
): Promise<boolean> {
  const url = new URL(`${META_GRAPH_BASE}/${pageId}/subscribed_apps`);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: pageToken,
      subscribed_fields: ['leadgen'],
    }),
  });
  return res.ok;
}

/**
 * GET /api/integrations/meta/callback
 * Meta OAuth callback. Exchanges code for token, subscribes page, stores config.
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

  // 1. Exchange code for short-lived user token
  const shortToken = await exchangeCodeForToken(code, redirectUri);
  if (!shortToken) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=token_exchange_failed`);
  }

  // 2. Upgrade to long-lived token (~60 days)
  const longToken = await getLongLivedToken(shortToken);
  const userToken = longToken || shortToken;

  // 3. Get pages the user manages
  const pages = await getPages(userToken);
  if (!pages.length) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=no_pages`);
  }

  // 4. For now use the first page. If multiple pages exist, store all and let user pick later.
  // TODO: multi-page selection UI
  const page = pages[0];

  // 5. Subscribe page to leadgen webhook
  await subscribePageToWebhook(page.id, page.access_token);

  // 6. Store per-org in integration_settings
  const supabase = createAdminSupabaseClient();

  // Check if a row already exists for this org+provider
  const { data: existing } = await supabase
    .from('integration_settings')
    .select('id')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  const config = {
    organization_id: orgId,
    page_id: page.id,
    page_name: page.name,
    access_token: page.access_token,
    user_access_token: userToken,
    connected_at: new Date().toISOString(),
    // Long-lived tokens expire in ~60 days
    expires_at: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (existing) {
    await supabase
      .from('integration_settings')
      .update({ config, is_active: true })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('integration_settings')
      .insert({ provider: 'meta_leads', config, is_active: true });
  }

  return NextResponse.redirect(`${dashboardUrl}&meta_connected=1`);
}
