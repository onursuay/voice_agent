import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_GRAPH_VERSION = 'v23.0';

/**
 * GET /api/integrations/meta/check-subscription
 * Checks if the page is subscribed to our app's webhooks (live Meta API call).
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return NextResponse.json({ error: 'No org' }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: integration } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .maybeSingle();

  if (!integration?.config) {
    return NextResponse.json({ error: 'No Meta integration' }, { status: 404 });
  }

  const config = integration.config as Record<string, unknown>;
  const pageId = config.page_id as string;
  const pageToken = config.access_token as string;

  // Check current subscriptions via Authorization header (not URL params)
  const subRes = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${pageToken}` },
      cache: 'no-store',
    }
  );
  const subBody = await subRes.json();

  // Also check page info
  const appRes = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/me`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${pageToken}` },
      cache: 'no-store',
    }
  );
  const appBody = await appRes.json();

  return NextResponse.json({
    page_id: pageId,
    page_token_length: pageToken?.length ?? 0,
    subscribed_apps: subBody,
    page_info: appBody,
  });
}
