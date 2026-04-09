import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { FacebookPage } from '@/app/api/integrations/meta/callback/route';

interface PendingSession {
  orgId: string;
  userToken: string;
  pages: FacebookPage[];
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
    // Reject if older than 10 minutes
    if (Date.now() - session.ts > 10 * 60 * 1000) return null;
    return session;
  } catch {
    return null;
  }
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
 * Reads pending cookie, saves chosen page to integration_settings.
 */
export async function GET(request: NextRequest) {
  const dashboardUrl = `${request.nextUrl.origin}/dashboard/settings?tab=integrations`;

  const cookieValue = request.cookies.get('meta_pending')?.value;
  if (!cookieValue) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=session_expired`);
  }

  const session = readPendingCookie(cookieValue);
  if (!session) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=session_expired`);
  }

  const orgId = request.nextUrl.searchParams.get('org_id');
  const pageId = request.nextUrl.searchParams.get('page_id');

  if (orgId !== session.orgId) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=invalid_session`);
  }

  const page = session.pages.find((p) => p.id === pageId);
  if (!page) {
    return NextResponse.redirect(`${dashboardUrl}&meta_error=invalid_page`);
  }

  // Subscribe the selected page to leadgen webhook
  await subscribePageToWebhook(page.id, page.access_token);

  // Save to integration_settings
  const supabase = createAdminSupabaseClient();

  const { data: existing } = await supabase
    .from('integration_settings')
    .select('id')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', session.orgId)
    .maybeSingle();

  const config = {
    organization_id: session.orgId,
    page_id: page.id,
    page_name: page.name,
    access_token: page.access_token,
    user_access_token: session.userToken,
    connected_at: new Date().toISOString(),
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

  // Clear the pending cookie
  const response = NextResponse.redirect(`${dashboardUrl}&meta_connected=1`);
  response.cookies.delete('meta_pending');
  return response;
}
