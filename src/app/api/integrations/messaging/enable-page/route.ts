import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  subscribePageFields, fetchPageIgAccount, getOrgPageToken, upsertChannelRow,
} from '@/lib/inbox/connect';

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

// Bağlı bir Facebook sayfasında Messenger (+ varsa Instagram DM) mesajlaşmasını etkinleştir.
// Sayfanın mevcut leadgen aboneliği korunur (field union ile abone olunur).
export async function POST(request: NextRequest) {
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const pageId = String(body.page_id || '').trim();
  if (!pageId) return NextResponse.json({ error: 'page_id zorunlu' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const page = await getOrgPageToken(admin, auth.orgId, pageId);
  if (!page) {
    return NextResponse.json({ error: 'Sayfa token bulunamadı. Önce Meta hesabını/sayfayı bağlayın.' }, { status: 400 });
  }

  // Messenger + (mevcutsa) leadgen field'larını birleştirerek abone ol
  const sub = await subscribePageFields(pageId, page.token, ['messages', 'messaging_postbacks']);
  if (!sub.success) {
    return NextResponse.json({ error: sub.error || 'subscribe_failed' }, { status: 502 });
  }

  // Messenger kanal satırı
  const messengerRes = await upsertChannelRow(admin, 'meta_messenger', auth.orgId, 'page_id', pageId, {
    organization_id: auth.orgId,
    page_id: pageId,
    page_name: page.pageName,
    access_token: page.token,
    webhook_subscribed_fields: sub.fields,
    connected_at: new Date().toISOString(),
  });
  if (!messengerRes.ok) return NextResponse.json({ error: messengerRes.error }, { status: 500 });

  // Instagram (sayfaya bağlıysa)
  let instagram: { id: string; username: string | null } | null = null;
  const iga = await fetchPageIgAccount(pageId, page.token);
  if (iga) {
    instagram = iga;
    await upsertChannelRow(admin, 'meta_instagram', auth.orgId, 'ig_business_account_id', iga.id, {
      organization_id: auth.orgId,
      page_id: pageId,
      page_name: page.pageName,
      ig_business_account_id: iga.id,
      ig_username: iga.username,
      access_token: page.token,
      webhook_subscribed_fields: sub.fields,
      connected_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, messenger: true, instagram });
}
