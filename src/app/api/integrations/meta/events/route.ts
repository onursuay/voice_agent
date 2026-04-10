import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * GET /api/integrations/meta/events
 * Returns recent lead_events for the logged-in org's Meta integration.
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
  const { data: events } = await admin
    .from('lead_events')
    .select('id, event_type, external_id, status, error_message, created_at')
    .eq('provider', 'meta_leads')
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ events: events ?? [] });
}
