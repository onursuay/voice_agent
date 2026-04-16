import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * GET /api/integrations/meta/account/status
 * Returns whether the logged-in org has a connected Meta account
 * (OAuth completed, user_access_token stored).
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
  const { data: account } = await admin
    .from('integration_settings')
    .select('config, is_active')
    .eq('provider', 'meta_account')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .maybeSingle();

  if (!account?.config) {
    return NextResponse.json({ connected: false });
  }

  const config = account.config as {
    connected_at?: string;
    expires_at?: string;
    pages?: { id: string; name: string }[];
  };

  const expiresAt = config.expires_at;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return NextResponse.json({
    connected: !isExpired,
    connected_at: config.connected_at ?? null,
    expires_at: expiresAt ?? null,
    is_expired: isExpired,
    page_count: config.pages?.length ?? 0,
  });
}
