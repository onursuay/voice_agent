import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { upsertChannelRow } from '@/lib/inbox/connect';

async function requireOrg() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return { error: 'No organization', status: 403 as const };
  return { orgId: membership.organization_id as string, role: membership.role as string };
}

// WhatsApp Business numarasını bağla (Meta WhatsApp API Setup / test numarası bilgileri)
export async function POST(request: NextRequest) {
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const phoneNumberId = String(body.phone_number_id || '').trim();
  const wabaId = String(body.waba_id || '').trim();
  const displayNumber = String(body.display_number || '').trim();
  const accessToken = String(body.access_token || '').trim();

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ error: 'phone_number_id ve access_token zorunlu' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // WABA'yı webhook'a abone et (best-effort, başarısızlık bağlamayı engellemez)
  let subscribed = false;
  if (wabaId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v23.0/${wabaId}/subscribed_apps`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      subscribed = res.ok;
    } catch { /* ignore */ }
  }

  const config = {
    organization_id: auth.orgId,
    phone_number_id: phoneNumberId,
    waba_id: wabaId || null,
    display_number: displayNumber || null,
    access_token: accessToken,
    webhook_subscribed: subscribed,
    connected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const result = await upsertChannelRow(admin, 'meta_whatsapp', auth.orgId, 'phone_number_id', phoneNumberId, config);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ ok: true, subscribed });
}
