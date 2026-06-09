import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildMetaState } from '@/lib/meta/oauth-state';

/**
 * GET /api/integrations/meta/connect
 * Account-level OAuth: requests ONLY business/BM + ads scopes so Meta's consent
 * screen does NOT show the page chooser. Pages are added later from the dashboard
 * ("Sayfa Bağla" → /api/integrations/meta/connect-pages). Returns after callback.
 */
export async function GET(request: NextRequest) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: 'META_APP_ID or META_APP_SECRET env not set' },
      { status: 500 }
    );
  }

  // Auth check — must be logged in and have an org
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const state = buildState(membership.organization_id);
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/integrations/meta/callback`;

  const oauthUrl = new URL('https://www.facebook.com/dialog/oauth');
  oauthUrl.searchParams.set('client_id', appId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  // ads_read + ads_management are required for CRM stage → Custom Audience sync:
  // reading the originating ad account from the lead's ad id (ads_read) and
  // creating/updating CUSTOMER_LIST audiences + adding/removing users (ads_management).
  oauthUrl.searchParams.set('scope', 'pages_show_list,leads_retrieval,pages_manage_metadata,pages_read_engagement,pages_manage_ads,business_management,ads_read,ads_management');
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.redirect(oauthUrl.toString());
}
