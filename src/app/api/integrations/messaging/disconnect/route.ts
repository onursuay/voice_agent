import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { CHANNEL_PROVIDER } from '@/lib/inbox/channels';

// Bir messaging kanalını kaldır (integration_settings satırını sil).
// Güvenlik: yalnız çağıran kullanıcının org'una ait satır silinebilir.
export async function DELETE(request: NextRequest) {
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

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const providers = Object.values(CHANNEL_PROVIDER);

  // Satırın gerçekten bu org'a ait bir messaging kanalı olduğunu doğrula
  const { data: row } = await admin
    .from('integration_settings')
    .select('id, provider, config')
    .eq('id', id)
    .maybeSingle();

  const rowOrg = (row?.config as { organization_id?: string } | null)?.organization_id;
  if (!row || !providers.includes(row.provider) || rowOrg !== orgId) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { error } = await admin.from('integration_settings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
