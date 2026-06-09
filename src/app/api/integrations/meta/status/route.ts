import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_APP_ID = process.env.META_APP_ID;
const META_GRAPH_VERSION = 'v23.0';

/** Resolve account_id from a Meta ad id (numeric-only guarded). */
async function accountIdFromAdId(adId: string, userToken: string): Promise<string | null> {
  if (!/^\d+$/.test(adId)) return null;
  try {
    const r = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${adId}?fields=account_id&access_token=${encodeURIComponent(userToken)}`,
      { cache: 'no-store' }
    );
    if (!r.ok) return null;
    const body = await r.json() as { account_id?: string };
    return body?.account_id ?? null;
  } catch {
    return null;
  }
}

interface SubscribedApp {
  id: string;
  subscribed_fields?: string[];
  [key: string]: unknown;
}

/**
 * Resolve the ad account id tied to a page so we can build a per-page
 * Custom Audience Terms URL. Returns the numeric account_id (no `act_`
 * prefix) or null if none found.
 *
 * The TOS link MUST target the same ad account the audience sync writes to
 * (metaAudienceSync derives it from the lead's meta_ad_id). So we resolve it
 * the same way: from this page's actual imported leads. Falling back to the
 * page's business → first ad account is unreliable for agency Business
 * Managers (one BM owns many unrelated client ad accounts), which would point
 * the user at the wrong account's terms.
 */
async function resolveAdAccountId(
  pageId: string,
  userToken: string,
  admin: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const base = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

  // 0) Preferred: the ad account behind this page's real leads — exactly the
  //    account the sync will hit, so the accepted terms actually apply.
  try {
    const { data: leadRows } = await admin
      .from('leads')
      .select('meta_ad_id')
      .eq('organization_id', organizationId)
      .eq('meta_page_id', pageId)
      .not('meta_ad_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    for (const lr of leadRows ?? []) {
      const adId = (lr as { meta_ad_id?: string | null }).meta_ad_id;
      if (!adId) continue;
      const acc = await accountIdFromAdId(adId, userToken);
      if (acc) return acc;
    }
  } catch { /* ignore, fall through to business heuristic */ }

  // 1) Page's owning business → its ad accounts (heuristic fallback)
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
      const userToken = config.user_access_token as string | null;

      // Resolve ad account once and cache it on the config. `undefined` means
      // "not yet resolved"; `null` means "resolved, none found" (don't retry).
      let adAccountId = config.ad_account_id as string | null | undefined;
      const needsResolve = adAccountId === undefined && !!pageId && !!userToken && !isExpired;

      const [webhookSubscribed, resolvedAdAccount] = await Promise.all([
        pageId && pageToken && !isExpired
          ? checkLiveWebhookSubscription(pageId, pageToken)
          : Promise.resolve(false),
        needsResolve
          ? resolveAdAccountId(pageId as string, userToken as string, admin, membership.organization_id as string)
          : Promise.resolve(adAccountId ?? null),
      ]);

      if (needsResolve) {
        adAccountId = resolvedAdAccount;
        // Best-effort write-back so future loads skip the Graph calls.
        admin
          .from('integration_settings')
          .update({ config: { ...config, ad_account_id: adAccountId } })
          .eq('id', row.id as string)
          .then(() => {}, () => {});
      }

      const tosUrl = adAccountId
        ? `https://business.facebook.com/ads/manage/customaudiences/tos/?act=${adAccountId}`
        : null;

      return {
        id: row.id as string,
        page_id: pageId,
        page_name: config.page_name as string | null,
        connected_at: config.connected_at as string | null,
        expires_at: expiresAt,
        is_expired: isExpired,
        webhook_subscribed: webhookSubscribed,
        ad_account_id: adAccountId ?? null,
        tos_url: tosUrl,
      };
    })
  );

  return NextResponse.json({ connections });
}
