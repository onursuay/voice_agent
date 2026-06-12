import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { subscribePageFields, upsertChannelRow } from '@/lib/inbox/connect';

const V = 'v23.0';
const BASE = `https://graph.facebook.com/${V}`;

// Kanal seç/kaldır (canli_chatbot 'select' deseni):
// Body: { channel: whatsapp|messenger|instagram, platform_id, enabled }
// enabled=true → integration_settings kanal satırı + webhook subscribe
// enabled=false → satırı kaldır

async function requireOrg() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return { error: 'No organization', status: 403 as const };
  return { orgId: membership.organization_id as string };
}

async function gj(url: string, init?: RequestInit): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  try {
    const r = await fetch(url, { cache: 'no-store', ...init });
    return { ok: r.ok, json: (await r.json().catch(() => ({}))) as Record<string, unknown> };
  } catch {
    return { ok: false, json: {} };
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { orgId } = auth;

  const body = await request.json().catch(() => ({}));
  const channel = String(body.channel || '');
  const platformId = String(body.platform_id || '').trim();
  const enabled = body.enabled !== false;
  if (!['whatsapp', 'messenger', 'instagram'].includes(channel) || !platformId) {
    return NextResponse.json({ error: 'channel ve platform_id zorunlu' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const providerMap: Record<string, string> = { whatsapp: 'meta_whatsapp', messenger: 'meta_messenger', instagram: 'meta_instagram' };
  const fieldMap: Record<string, string> = { whatsapp: 'phone_number_id', messenger: 'page_id', instagram: 'ig_business_account_id' };

  // Kaldırma: satırı sil (org doğrulamalı)
  if (!enabled) {
    const { data: row } = await admin
      .from('integration_settings')
      .select('id, config')
      .eq('provider', providerMap[channel])
      .filter('config->>organization_id', 'eq', orgId)
      .filter(`config->>${fieldMap[channel]}`, 'eq', platformId)
      .maybeSingle();
    if (row) await admin.from('integration_settings').delete().eq('id', row.id);
    return NextResponse.json({ ok: true, removed: true });
  }

  // Messaging account token'ı (OAuth ile alınmış long-lived user token)
  const { data: acct } = await admin
    .from('integration_settings')
    .select('config, is_active')
    .eq('provider', 'meta_messaging_account')
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();
  const userToken = acct?.is_active ? ((acct.config as { userToken?: string })?.userToken ?? null) : null;
  if (!userToken) return NextResponse.json({ error: 'messaging_not_connected' }, { status: 400 });

  if (channel === 'whatsapp') {
    // Numara detayını doğrula + WABA'yı bul (body.waba_id geldiyse onu kullan)
    const wabaId = String(body.waba_id || '').trim();
    const num = await gj(`${BASE}/${platformId}?fields=display_phone_number,verified_name,quality_rating&access_token=${userToken}`);
    if (!num.ok) return NextResponse.json({ error: 'phone_number_not_accessible' }, { status: 400 });

    // WABA'yı webhook'a abone et (mesajlar bizim app'e düşsün)
    let subscribed = false;
    if (wabaId) {
      const sub = await gj(`${BASE}/${wabaId}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      subscribed = sub.ok;
    }

    const result = await upsertChannelRow(admin, 'meta_whatsapp', orgId, 'phone_number_id', platformId, {
      organization_id: orgId,
      phone_number_id: platformId,
      waba_id: wabaId || null,
      display_number: (num.json.display_phone_number as string) || null,
      verified_name: (num.json.verified_name as string) || null,
      access_token: userToken,
      webhook_subscribed: subscribed,
      connected_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, subscribed });
  }

  // Messenger / Instagram: sayfa token'ı gerekir (user token ile /me/accounts'tan çöz)
  const pageId = channel === 'messenger' ? platformId : String(body.page_id || '').trim();
  if (!pageId) return NextResponse.json({ error: 'page_id zorunlu' }, { status: 400 });

  const pageRes = await gj(`${BASE}/${pageId}?fields=name,access_token,instagram_business_account{id,username}&access_token=${userToken}`);
  const pageToken = pageRes.json.access_token as string | undefined;
  const pageName = pageRes.json.name as string | undefined;
  if (!pageRes.ok || !pageToken) return NextResponse.json({ error: 'page_token_unavailable' }, { status: 400 });

  // Mesaj webhook'una abone ol (leadgen aboneliği korunur — field union)
  const sub = await subscribePageFields(pageId, pageToken, ['messages', 'messaging_postbacks']);
  if (!sub.success) return NextResponse.json({ error: sub.error || 'subscribe_failed' }, { status: 502 });

  if (channel === 'messenger') {
    const result = await upsertChannelRow(admin, 'meta_messenger', orgId, 'page_id', pageId, {
      organization_id: orgId,
      page_id: pageId,
      page_name: pageName ?? null,
      access_token: pageToken,
      webhook_subscribed_fields: sub.fields,
      connected_at: new Date().toISOString(),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // instagram
  const iga = pageRes.json.instagram_business_account as { id?: string; username?: string } | undefined;
  const igId = platformId || iga?.id;
  if (!igId) return NextResponse.json({ error: 'instagram_account_not_found' }, { status: 400 });
  const result = await upsertChannelRow(admin, 'meta_instagram', orgId, 'ig_business_account_id', igId, {
    organization_id: orgId,
    page_id: pageId,
    page_name: pageName ?? null,
    ig_business_account_id: igId,
    ig_username: iga?.username ?? null,
    access_token: pageToken,
    webhook_subscribed_fields: sub.fields,
    connected_at: new Date().toISOString(),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
