import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { connectPageForLeads, type FacebookPage } from '@/lib/meta/connect-page';

interface AccountConfig {
  organization_id: string;
  userToken: string;
  pages: FacebookPage[];
  connected_at?: string;
  expires_at?: string;
  ts?: number;
}

/**
 * GET /api/integrations/meta/select-page?org_id=xxx&page_id=xxx
 * Connects a single page (subscribe leadgen webhook + save) and redirects.
 * The primary flow now auto-connects granted pages in the OAuth callback; this
 * stays as a direct single-page connect link.
 */
export async function GET(request: NextRequest) {
  const locale = request.cookies.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'tr';
  const dashboardUrl = `${request.nextUrl.origin}/${locale}/integrations`;
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
  if (!orgId || orgId !== membership.organization_id) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=invalid_session`);
  }

  // Read connected account from DB (persistent)
  const { data: accountRow } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_account')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  if (!accountRow?.config) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=account_not_connected`);
  }

  const session = accountRow.config as AccountConfig;

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=account_expired`);
  }

  const page = session.pages.find((p) => p.id === pageId);
  if (!page) {
    return NextResponse.redirect(`${dashboardUrl}?meta_error=invalid_page`);
  }

  const result = await connectPageForLeads(admin, orgId, page, session.userToken);
  if (!result.success) {
    return NextResponse.redirect(
      `${dashboardUrl}?meta_error=subscription_failed&reason=${encodeURIComponent(result.error || 'unknown')}`
    );
  }

  return NextResponse.redirect(`${dashboardUrl}?meta_connected=1`);
}

/**
 * POST /api/integrations/meta/select-page
 * Body: { org_id, page_id }
 * Same logic as GET but returns JSON.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminSupabaseClient();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'not_authenticated' }, { status: 401 });

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return NextResponse.json({ success: false, error: 'no_org' }, { status: 403 });

  const body = await request.json() as { org_id?: string; page_id?: string };
  const orgId = body.org_id;
  const pageId = body.page_id;

  if (!orgId || !pageId || orgId !== membership.organization_id) {
    return NextResponse.json({ success: false, error: 'invalid_params' }, { status: 400 });
  }

  const { data: accountRow } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_account')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  if (!accountRow?.config) {
    return NextResponse.json({ success: false, error: 'account_not_connected' }, { status: 401 });
  }

  const session = accountRow.config as AccountConfig;
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: 'account_expired' }, { status: 401 });
  }

  const page = session.pages.find((p) => p.id === pageId);
  if (!page) return NextResponse.json({ success: false, error: 'invalid_page' }, { status: 400 });

  const result = await connectPageForLeads(admin, orgId, page, session.userToken);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, page_id: page.id, page_name: page.name });
}
