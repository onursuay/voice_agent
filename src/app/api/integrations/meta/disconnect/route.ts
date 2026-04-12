import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/integrations/meta/disconnect?id=<integration_id>
 * Disconnects a specific Meta page by integration_settings row id.
 * If no id is given, disconnects all Meta pages for the org.
 */
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

  const admin = createAdminSupabaseClient();
  const integrationId = request.nextUrl.searchParams.get('id');

  if (integrationId) {
    // Disconnect a specific page — verify it belongs to this org first
    const { data: row } = await admin
      .from('integration_settings')
      .select('id, config')
      .eq('id', integrationId)
      .eq('provider', 'meta_leads')
      .single();

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const config = row.config as Record<string, unknown>;
    if (config.organization_id !== membership.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await admin
      .from('integration_settings')
      .update({ is_active: false })
      .eq('id', integrationId);
  } else {
    // Disconnect all Meta pages for this org
    await admin
      .from('integration_settings')
      .update({ is_active: false })
      .eq('provider', 'meta_leads')
      .filter('config->>organization_id', 'eq', membership.organization_id);
  }

  return NextResponse.json({ success: true });
}
