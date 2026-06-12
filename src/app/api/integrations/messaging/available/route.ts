import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { listOrgChannels } from '@/lib/inbox/channels';

const V = 'v23.0';
const BASE = `https://graph.facebook.com/${V}`;

// Messaging OAuth'u sonrası bağlanabilir hesapları listeler (canli_chatbot 'available' deseni):
//   whatsapp: WABA'lardaki telefon numaraları | pages: Messenger sayfaları | instagram: bağlı IG hesapları
async function gj(url: string): Promise<Record<string, unknown>> {
  try { const r = await fetch(url, { cache: 'no-store' }); return (await r.json()) as Record<string, unknown>; }
  catch { return { error: { message: 'fetch_failed' } }; }
}

export async function GET() {
  try {
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
    const orgId = membership.organization_id;

    const admin = createAdminSupabaseClient();
    const { data: acct } = await admin
      .from('integration_settings')
      .select('config, is_active')
      .eq('provider', 'meta_messaging_account')
      .filter('config->>organization_id', 'eq', orgId)
      .maybeSingle();

    const cfg = (acct?.config || {}) as { userToken?: string; expires_at?: string; connected_at?: string };
    const token = acct?.is_active ? cfg.userToken : null;
    const connected = Boolean(token);

    const selections = await listOrgChannels(orgId);

    if (!connected) {
      return NextResponse.json({ connected: false, whatsapp: [], pages: [], instagram: [], selections });
    }

    // ── WhatsApp: businesses → WABA'lar → telefon numaraları ──
    const whatsapp: Array<{ phone_number_id: string; display_number: string; verified_name: string | null; quality: string | null; waba_id: string }> = [];
    const biz = await gj(`${BASE}/me/businesses?fields=id,name&limit=50&access_token=${token}`);
    for (const b of ((biz.data as Array<{ id: string }>) || [])) {
      for (const edge of ['owned_whatsapp_business_accounts', 'client_whatsapp_business_accounts']) {
        const wabas = await gj(`${BASE}/${b.id}/${edge}?fields=id,name&limit=50&access_token=${token}`);
        for (const w of ((wabas.data as Array<{ id: string }>) || [])) {
          const nums = await gj(`${BASE}/${w.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating&access_token=${token}`);
          for (const n of ((nums.data as Array<{ id: string; display_phone_number?: string; verified_name?: string; quality_rating?: string }>) || [])) {
            if (!whatsapp.some((x) => x.phone_number_id === n.id)) {
              whatsapp.push({
                phone_number_id: n.id,
                display_number: n.display_phone_number || n.id,
                verified_name: n.verified_name ?? null,
                quality: n.quality_rating ?? null,
                waba_id: w.id,
              });
            }
          }
        }
      }
    }

    // ── Pages (Messenger) + bağlı Instagram hesapları ──
    const pages: Array<{ page_id: string; page_name: string; access_token: string }> = [];
    const instagram: Array<{ ig_id: string; username: string | null; page_id: string; page_name: string; page_token: string }> = [];
    let nextUrl: string | null = `${BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${token}`;
    let guard = 0;
    while (nextUrl && guard++ < 5) {
      const res = await gj(nextUrl);
      for (const p of ((res.data as Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }>) || [])) {
        pages.push({ page_id: p.id, page_name: p.name, access_token: p.access_token });
        if (p.instagram_business_account?.id) {
          instagram.push({
            ig_id: p.instagram_business_account.id,
            username: p.instagram_business_account.username ?? null,
            page_id: p.id,
            page_name: p.name,
            page_token: p.access_token,
          });
        }
      }
      nextUrl = ((res.paging as { next?: string })?.next) || null;
    }

    // Page token'larını client'a SIZDIRMA — select çağrısı server'da tekrar çözer
    return NextResponse.json({
      connected: true,
      connected_at: cfg.connected_at ?? null,
      expires_at: cfg.expires_at ?? null,
      whatsapp,
      pages: pages.map(({ page_id, page_name }) => ({ page_id, page_name })),
      instagram: instagram.map(({ ig_id, username, page_id, page_name }) => ({ ig_id, username, page_id, page_name })),
      selections,
    });
  } catch (err) {
    console.error('GET /api/integrations/messaging/available error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
