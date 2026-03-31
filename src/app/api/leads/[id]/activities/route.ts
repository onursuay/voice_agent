import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    // Verify lead belongs to org
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const { data: activities, error } = await supabase
      .from('lead_activities')
      .select('*, user:profiles(*)')
      .eq('lead_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(activities || []);
  } catch (err) {
    console.error('GET /api/leads/[id]/activities error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
