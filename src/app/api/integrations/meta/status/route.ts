import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_APP_ID = process.env.META_APP_ID;
const META_GRAPH_VERSION = 'v23.0';

interface SubscribedApp {
  id: string;
  subscribed_fields?: string[];
  [key: string]: unknown;
}

/**
 * Check whether our app is actively subscribed to leadgen on the given page.
 * Returns true/false — never throws.
 */
async function checkLiveWebhookSubscription(pageId: string, pageToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${pageToken}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      console.warn(`[Meta status] subscribed_apps check failed: status=${res.status}`);
      return false;
    }
    const body = await res.json() as { data?: SubscribedApp[] };
    const apps: SubscribedApp[] = body.data || [];

    // Match by META_APP_ID if configured, otherwise accept any app with leadgen field
    const found = META_APP_ID
      ? apps.find((a) => String(a.id) === String(META_APP_ID))
      : apps.find((a) => (a.subscribed_fields || []).includes('leadgen'));

    console.log(`[Meta status] subscribed_apps page=${pageId} apps=${apps.map((a) => a.id).join(',')} found=${!!found}`);
    return !!found;
  } catch (err) {
    console.warn(`[Meta status] subscribed_apps check threw: ${err}`);
    return false;
  }
}

/**
 * GET /api/integrations/meta/status
 * Returns current Meta integration status for the logged-in org.
 * Performs a live check against Meta's subscribed_apps API.
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
  if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: integration } = await admin
    .from('integration_settings')
    .select('config, is_active, created_at')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .maybeSingle();

  if (!integration || !integration.is_active) {
    return NextResponse.json({ connected: false });
  }

  const config = integration.config as Record<string, unknown>;
  const expiresAt = config.expires_at as string | null;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  const pageId = config.page_id as string | null;
  const pageToken = config.access_token as string | null;

  // Live subscription check — only if we have credentials
  let webhookSubscribed = false;
  if (pageId && pageToken && !isExpired) {
    webhookSubscribed = await checkLiveWebhookSubscription(pageId, pageToken);
  }

  return NextResponse.json({
    connected: true,
    page_id: pageId,
    page_name: config.page_name,
    connected_at: config.connected_at,
    expires_at: expiresAt,
    is_expired: isExpired,
    webhook_subscribed: webhookSubscribed,
  });
}
