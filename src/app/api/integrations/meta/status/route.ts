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
 * Resolve the ad account id tied to a page so we can build a per-page
 * Custom Audience Terms URL. A page belongs to a business that owns/uses
 * ad accounts; in typical SMB setups it maps to a single ad account.
 * Returns the numeric account_id (no `act_` prefix) or null if none found.
 */
async function resolveAdAccountId(pageId: string, userToken: string): Promise<string | null> {
  const base = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
  // 1) Page's owning business → its ad accounts
  try {
    const r = await fetch(`${base}/${pageId}?fields=business&access_token=${encodeURIComponent(userToken)}`, { cache: 'no-store' });
    if (r.ok) {
      const body = await r.json() as { business?: { id?: string } };
      const bizId = body?.business?.id;
      if (bizId) {
        for (const edge of ['owned_ad_accounts', 'client_ad_accounts']) {
          const ar = await fetch(`${base}/${bizId}/${edge}?fields=account_id&limit=1&access_token=${encodeURIComponent(userToken)}`, { cache: 'no-store' });
          if (ar.ok) {
            const ad = await ar.json() as { data?: { account_id?: string }[] };
            const acc = ad?.data?.[0]?.account_id;
            if (acc) return acc;
          }
        }
      }
    }
  } catch { /* ignore */ }
  // 2) Fallback: the user's accessible ad accounts
  try {
    const r = await fetch(`${base}/me/adaccounts?fields=account_id&limit=1&access_token=${encodeURIComponent(userToken)}`, { cache: 'no-store' });
    if (r.ok) {
      const d = await r.json() as { data?: { account_id?: string }[] };
      const acc = d?.data?.[0]?.account_id;
      if (acc) return acc;
    }
  } catch { /* ignore */ }
  return null;
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
