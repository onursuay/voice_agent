import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FacebookPage } from '@/app/api/integrations/meta/callback/route';

interface PendingConfig {
  organization_id: string;
  userToken: string;
  pages: FacebookPage[];
  ts: number;
}

async function subscribePageToWebhook(pageId: string, pageToken: string): Promise<boolean> {
  const url = new URL(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: pageToken, subscribed_fields: ['leadgen'] }),
  });
  return res.ok;
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
    return NextResponse.redirect(`${dashboardUrl}&meta_error=not_authenticated`);
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=no_org`);
  }

  const orgId = request.nextUrl.searchParams.get('org_id');
  const pageId = request.nextUrl.searchParams.get('page_id');

  // Verify the org_id matches the authenticated user
  if (orgId !== membership.organization_id) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=invalid_session`);
  }

  // Read pending session from DB
  const { data: pendingRow } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_oauth_pending')
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  if (!pendingRow?.config) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=session_expired`);
  }

  const session = pendingRow.config as PendingConfig;

  if (Date.now() - session.ts > 10 * 60 * 1000) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=session_expired`);
  }

  const page = session.pages.find((p) => p.id === pageId);
  if (!page) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=invalid_page`);
  }

  // Subscribe the selected page to leadgen webhook
  await subscribePageToWebhook(page.id, page.access_token);

  // Save to integration_settings (final)
  const { data: existing } = await admin
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
    user_access_token: session.userToken,
    connected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
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

  return NextResponse.redirect(`${dashboardUrl}&meta_connected=1`);
}
