import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { listOrgChannels } from '@/lib/inbox/channels';

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

    const channels = await listOrgChannels(orgId);

    // Bağlanabilir sayfalar (Messenger/Instagram için) — meta_account OAuth'tan
    const admin = createAdminSupabaseClient();
    const { data: account } = await admin
      .from('integration_settings')
      .select('config')
      .eq('provider', 'meta_account')
      .filter('config->>organization_id', 'eq', orgId)
      .maybeSingle();

    const pages = (((account?.config as { pages?: Array<{ id: string; name?: string }> } | null)?.pages) || [])
      .map((p) => ({ page_id: p.id, page_name: p.name ?? null }));

    return NextResponse.json({ channels, pages });
  } catch (err) {
    console.error('GET /api/integrations/messaging/status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
