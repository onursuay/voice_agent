import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * GET /api/integrations/meta/resubscribe
 * Manually re-subscribes the connected page to leadgen webhooks.
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
    return NextResponse.json({ error: 'No Meta integration found' }, { status: 404 });
  }

  const config = integration.config as Record<string, unknown>;
  const pageId = config.page_id as string;
  const pageToken = config.access_token as string;

  if (!pageId || !pageToken) {
    return NextResponse.json({ error: 'Missing page_id or access_token' }, { status: 400 });
  }

  // Subscribe via query params (not JSON body)
  const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${encodeURIComponent(pageToken)}&subscribed_fields=leadgen`;
  const res = await fetch(url, { method: 'POST' });
  const body = await res.json();

  console.log(`[Meta resubscribe] page=${pageId} status=${res.status} body=${JSON.stringify(body)}`);

  return NextResponse.json({
    success: res.ok,
    page_id: pageId,
    status: res.status,
    response: body,
  });
}
