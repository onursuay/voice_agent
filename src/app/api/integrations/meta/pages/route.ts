import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * GET /api/integrations/meta/pages
 * Lightweight list of connected Meta pages for the logged-in org — used to
 * populate the lead-area account dropdown. Unlike /status, it does NOT perform
 * live webhook checks, so it returns fast.
 * Response: { pages: { page_id, page_name }[] }
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
    .select('config')
    .eq('provider', 'meta_leads')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .order('created_at', { ascending: true });

  const pages = (integrations || [])
    .map((row) => {
      const config = row.config as Record<string, unknown>;
      return {
        page_id: (config.page_id as string | null) ?? null,
        page_name: (config.page_name as string | null) ?? null,
      };
    })
    .filter((p): p is { page_id: string; page_name: string | null } => !!p.page_id);

  return NextResponse.json({ pages });
}
