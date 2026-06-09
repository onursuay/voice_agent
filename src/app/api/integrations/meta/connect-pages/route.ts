import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildMetaState } from '@/lib/meta/oauth-state';

/**
 * GET /api/integrations/meta/connect-pages
 * Page-level OAuth, triggered from "Sayfa Bağla" on the dashboard AFTER the account
 * is connected. Meta shows its page chooser here (this is the only place pages are
 * granted). On callback the granted pages are auto-subscribed to the leadgen webhook
 * — there is no second in-app page selection step.
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

  const state = buildMetaState(membership.organization_id, 'pages');
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/integrations/meta/callback`;

  const oauthUrl = new URL('https://www.facebook.com/dialog/oauth');
  oauthUrl.searchParams.set('client_id', appId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  // Page-level scopes only. Meta shows the page chooser here. leads_retrieval +
  // pages_manage_ads cover lead form retrieval; pages_manage_metadata is needed to
  // subscribe pages to the leadgen webhook.
  oauthUrl.searchParams.set('scope', 'pages_show_list,leads_retrieval,pages_manage_metadata,pages_read_engagement,pages_manage_ads');
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.redirect(oauthUrl.toString());
}
