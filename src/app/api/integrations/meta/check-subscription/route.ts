import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * GET /api/integrations/meta/check-subscription
 * Checks if the page is subscribed to our app's webhooks.
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

  // Check current subscriptions
  const subRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${encodeURIComponent(pageToken)}`
  );
  const subBody = await subRes.json();

  // Also check app info
  const appRes = await fetch(
    `https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(pageToken)}`
  );
  const appBody = await appRes.json();

  return NextResponse.json({
    page_id: pageId,
    page_token_length: pageToken?.length ?? 0,
    subscribed_apps: subBody,
    page_info: appBody,
  });
}
