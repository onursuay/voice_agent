import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * GET /api/integrations/meta/status
 * Returns current Meta integration status for the logged-in org.
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
  const { data: integration } = await admin
    .from('integration_settings')
    .select('config, is_active, created_at')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .maybeSingle();

  if (!integration || !integration.is_active) {
    return NextResponse.json({ connected: false });
  }

  const config = integration.config as Record<string, unknown>;
  const expiresAt = config.expires_at as string | null;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return NextResponse.json({
    connected: true,
    page_id: config.page_id,
    page_name: config.page_name,
    connected_at: config.connected_at,
    expires_at: expiresAt,
    is_expired: isExpired,
  });
}
