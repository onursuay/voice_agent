import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/integrations/meta/disconnect
 * Disconnects the Meta integration for the logged-in org.
 */
export async function DELETE() {
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
  await admin
    .from('integration_settings')
    .update({ is_active: false })
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', membership.organization_id);

  return NextResponse.json({ success: true });
}
