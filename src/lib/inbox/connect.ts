import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_GRAPH_VERSION = 'v23.0';
const BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

type Admin = ReturnType<typeof createAdminSupabaseClient>;

interface SubscribedApp { id?: string; subscribed_fields?: string[] }

/**
 * Bir sayfayı verilen webhook field'larına abone et.
 * Önemli: subscribed_apps POST'u o sayfadaki field setini DEĞİŞTİRİR; bu yüzden
 * mevcut field'larla BİRLEŞTİRİP gönderiyoruz (leadgen aboneliği korunsun diye).
 */
export async function subscribePageFields(
  pageId: string,
  pageToken: string,
  addFields: string[],
): Promise<{ success: boolean; fields: string[]; error?: string }> {
  const headers = { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/x-www-form-urlencoded' };

  // 1) Mevcut field'ları oku (mümkünse) — union için
  let current: string[] = [];
  try {
    const getRes = await fetch(`${BASE}/${pageId}/subscribed_apps`, { method: 'GET', headers });
    if (getRes.ok) {
      const parsed = (await getRes.json()) as { data?: SubscribedApp[] };
      const app = (parsed.data || []).find((a) => (a.subscribed_fields || []).length);
      if (app?.subscribed_fields) current = app.subscribed_fields;
    }
  } catch { /* best effort */ }

  const union = Array.from(new Set([...current, ...addFields]));

  const postRes = await fetch(`${BASE}/${pageId}/subscribed_apps`, {
    method: 'POST',
    headers,
    body: new URLSearchParams({ subscribed_fields: union.join(',') }).toString(),
  });
  const postText = await postRes.text();
  if (!postRes.ok) {
    return { success: false, fields: union, error: `subscribe failed (${postRes.status}): ${postText}` };
  }
  return { success: true, fields: union };
}

/** Sayfaya bağlı Instagram professional hesabını getir (varsa). */
export async function fetchPageIgAccount(
  pageId: string,
  pageToken: string,
): Promise<{ id: string; username: string | null } | null> {
  try {
    const url = new URL(`${BASE}/${pageId}`);
    url.searchParams.set('fields', 'instagram_business_account{id,username}');
    url.searchParams.set('access_token', pageToken);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const body = (await res.json()) as { instagram_business_account?: { id?: string; username?: string } };
    const iga = body.instagram_business_account;
    if (!iga?.id) return null;
    return { id: iga.id, username: iga.username ?? null };
  } catch {
    return null;
  }
}

/**
 * Bir org'a bağlı bir sayfanın page access token'ını çöz.
 * Önce meta_account.config.pages[], sonra meta_leads satırı.
 */
export async function getOrgPageToken(
  admin: Admin,
  orgId: string,
  pageId: string,
): Promise<{ token: string; pageName: string | null } | null> {
  const { data: account } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_account')
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  const pages = ((account?.config as { pages?: Array<{ id: string; name?: string; access_token?: string }> } | null)?.pages) || [];
  const page = pages.find((p) => p.id === pageId);
  if (page?.access_token) return { token: page.access_token, pageName: page.name ?? null };

  const { data: leadRow } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', orgId)
    .filter('config->>page_id', 'eq', pageId)
    .maybeSingle();
  const cfg = leadRow?.config as { access_token?: string; page_name?: string } | null;
  if (cfg?.access_token) return { token: cfg.access_token, pageName: cfg.page_name ?? null };

  return null;
}

/** Bir messaging kanal satırını (meta_whatsapp / meta_messenger / meta_instagram) upsert et. */
export async function upsertChannelRow(
  admin: Admin,
  provider: string,
  orgId: string,
  matchField: string,
  matchValue: string,
  config: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const { data: existing } = await admin
    .from('integration_settings')
    .select('id')
    .eq('provider', provider)
    .filter('config->>organization_id', 'eq', orgId)
    .filter(`config->>${matchField}`, 'eq', matchValue)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('integration_settings')
      .update({ config, is_active: true })
      .eq('id', existing.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  const { error } = await admin
    .from('integration_settings')
    .insert({ provider, config, is_active: true });
  return error ? { ok: false, error: error.message } : { ok: true };
}
