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
    if (!res.ok) return false;
    const body = await res.json() as { data?: SubscribedApp[] };
    const apps: SubscribedApp[] = body.data || [];
    const found = META_APP_ID
      ? apps.find((a) => String(a.id) === String(META_APP_ID))
      : apps.find((a) => (a.subscribed_fields || []).includes('leadgen'));
    return !!found;
  } catch {
    return false;
  }
}

/**
 * GET /api/integrations/meta/status
 * Returns all active Meta page connections for the logged-in org.
 * Response: { connections: Connection[] }
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
  const { data: integrations } = await admin
    .from('integration_settings')
    .select('id, config, is_active, created_at')
    .eq('provider', 'meta_leads')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .order('created_at', { ascending: true });

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ connections: [] });
  }

  const connections = await Promise.all(
    integrations.map(async (row) => {
      const config = row.config as Record<string, unknown>;
      const expiresAt = config.expires_at as string | null;
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
      const pageId = config.page_id as string | null;
      const pageToken = config.access_token as string | null;

      let webhookSubscribed = false;
      if (pageId && pageToken && !isExpired) {
        webhookSubscribed = await checkLiveWebhookSubscription(pageId, pageToken);
      }

      return {
        id: row.id as string,
        page_id: pageId,
        page_name: config.page_name as string | null,
        connected_at: config.connected_at as string | null,
        expires_at: expiresAt,
        is_expired: isExpired,
        webhook_subscribed: webhookSubscribed,
      };
    })
  );

  return NextResponse.json({ connections });
}
