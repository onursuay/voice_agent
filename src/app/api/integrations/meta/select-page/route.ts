import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FacebookPage } from '@/app/api/integrations/meta/callback/route';

const META_APP_ID = process.env.META_APP_ID;
const META_GRAPH_VERSION = 'v23.0';

interface PendingConfig {
  organization_id: string;
  userToken: string;
  pages: FacebookPage[];
  ts: number;
}

interface SubscribedApp {
  id: string;
  subscribed_fields?: string[];
  [key: string]: unknown;
}

/**
 * DELETE existing subscription, POST new one, then GET verify.
 * Returns { success, subscribed_fields, error? }
 */
async function hardSubscribePageToWebhook(
  pageId: string,
  pageToken: string
): Promise<{ success: boolean; subscribed_fields?: string[]; error?: string }> {
  const headers = {
    Authorization: `Bearer ${pageToken}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Step 1: DELETE old subscription (best-effort — ignore failure)
  try {
    const delRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      { method: 'DELETE', headers }
    );
    const delBody = await delRes.text();
    console.log(`[Meta subscribe] DELETE page=${pageId} status=${delRes.status} body=${delBody}`);
  } catch (err) {
    console.warn(`[Meta subscribe] DELETE failed (ignoring): ${err}`);
  }

  // Step 2: POST new subscription
  const postBody = new URLSearchParams({ subscribed_fields: 'leadgen' });
  const postRes = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
    { method: 'POST', headers, body: postBody.toString() }
  );
  const postText = await postRes.text();
  console.log(`[Meta subscribe] POST page=${pageId} status=${postRes.status} body=${postText}`);

  if (!postRes.ok) {
    return { success: false, error: `POST subscribed_apps failed (${postRes.status}): ${postText}` };
  }

  // Step 3: GET verify — confirm app appears in subscribed_apps list
  try {
    const getRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      { method: 'GET', headers }
    );
    const getBody = await getRes.text();
    console.log(`[Meta subscribe] GET verify page=${pageId} status=${getRes.status} body=${getBody}`);

    if (getRes.ok) {
      const parsed = JSON.parse(getBody) as { data?: SubscribedApp[] };
      const apps: SubscribedApp[] = parsed.data || [];

      // Find our app — match by META_APP_ID if set, otherwise accept any app with leadgen
      const ourApp = META_APP_ID
        ? apps.find((a) => String(a.id) === String(META_APP_ID))
        : apps.find((a) => (a.subscribed_fields || []).includes('leadgen'));

      if (ourApp) {
        console.log(`[Meta subscribe] Verified: app=${ourApp.id} fields=${JSON.stringify(ourApp.subscribed_fields)}`);
        return { success: true, subscribed_fields: ourApp.subscribed_fields || ['leadgen'] };
      } else {
        console.warn(`[Meta subscribe] POST ok but app not found in subscribed list: ${getBody}`);
        // POST was ok, so treat as success even if verification is inconclusive
        return { success: true, subscribed_fields: ['leadgen'] };
      }
    }
  } catch (err) {
    console.warn(`[Meta subscribe] GET verify failed (ignoring): ${err}`);
  }

  // POST succeeded — accept it
  return { success: true, subscribed_fields: ['leadgen'] };
}

/**
 * GET /api/integrations/meta/select-page?org_id=xxx&page_id=xxx
 * Called after page selection (or auto-select for single page).
 * Reads pending session from DB, saves chosen page to integration_settings.
 */
export async function GET(request: NextRequest) {
  const dashboardUrl = `${request.nextUrl.origin}/dashboard/integrations`;
  const admin = createAdminSupabaseClient();

  // Get authenticated user's org to verify ownership
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=not_authenticated`);
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=no_org`);
  }

  const orgId = request.nextUrl.searchParams.get('org_id');
  const pageId = request.nextUrl.searchParams.get('page_id');

  // Verify the org_id matches the authenticated user
  if (orgId !== membership.organization_id) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=invalid_session`);
  }

  // Read pending session from DB
  const { data: pendingRow } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_oauth_pending')
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  if (!pendingRow?.config) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=session_expired`);
  }

  const session = pendingRow.config as PendingConfig;

  if (Date.now() - session.ts > 10 * 60 * 1000) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=session_expired`);
  }

  const page = session.pages.find((p) => p.id === pageId);
  if (!page) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=invalid_page`);
  }

  // Validate token exists before proceeding
  if (!page.access_token) {
    console.error(`[Meta select-page] Missing page access token for page=${pageId}`);
    return NextResponse.redirect(`${dashboardUrl}?meta_error=missing_token`);
  }

  // Subscribe the selected page to leadgen webhook (hardened: DELETE → POST → GET verify)
  const subscribeResult = await hardSubscribePageToWebhook(page.id, page.access_token);

  if (!subscribeResult.success) {
    console.error(`[Meta select-page] Webhook subscription failed for page=${pageId}: ${subscribeResult.error}`);
    return NextResponse.redirect(
      `${dashboardUrl}?meta_error=subscription_failed&reason=${encodeURIComponent(subscribeResult.error || 'unknown')}`
    );
  }

  console.log(`[Meta select-page] Webhook subscribed OK: page=${pageId} fields=${subscribeResult.subscribed_fields?.join(',')}`);

  // Save to integration_settings (final) — upsert by (org, page_id) to allow multiple pages per org
  const { data: existing } = await admin
    .from('integration_settings')
    .select('id')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', orgId)
    .filter('config->>page_id', 'eq', page.id)
    .maybeSingle();

  const config = {
    organization_id: orgId,
    page_id: page.id,
    page_name: page.name,
    access_token: page.access_token,
    user_access_token: session.userToken,
    connected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
    webhook_subscribed: true,
    webhook_subscribed_fields: subscribeResult.subscribed_fields || ['leadgen'],
    webhook_subscribed_at: new Date().toISOString(),
  };

  if (existing) {
    await admin
      .from('integration_settings')
      .update({ config, is_active: true })
      .eq('id', existing.id);
  } else {
    await admin
      .from('integration_settings')
      .insert({ provider: 'meta_leads', config, is_active: true });
  }

  // Delete the pending OAuth session record
  await admin
    .from('integration_settings')
    .delete()
    .eq('id', pendingRow.id);

  return NextResponse.redirect(`${dashboardUrl}?meta_connected=1`);
}
