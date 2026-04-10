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

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    return NextResponse.json(lead);
  } catch (err) {
    console.error('GET /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Get current lead to detect stage change
    const { data: currentLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    if (!currentLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const body = await request.json();
    body.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If stage changed, create stage_history and activity
    if (body.stage_id && body.stage_id !== currentLead.stage_id) {
      await supabase.from('stage_history').insert({
        lead_id: id,
        organization_id: orgId,
        from_stage_id: currentLead.stage_id,
        to_stage_id: body.stage_id,
        changed_by: user.id,
      });

      await supabase.from('lead_activities').insert({
        lead_id: id,
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'stage_change',
        title: 'Aşama değiştirildi',
        description: null,
        metadata: {
          from_stage_id: currentLead.stage_id,
          to_stage_id: body.stage_id,
        },
      });
    }

    // If assigned_to changed, create activity
    if (body.assigned_to !== undefined && body.assigned_to !== currentLead.assigned_to) {
      await supabase.from('lead_activities').insert({
        lead_id: id,
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'assigned',
        title: 'Lead atandı',
        description: null,
        metadata: {
          from_user: currentLead.assigned_to,
          to_user: body.assigned_to,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { data: deleted, error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId)
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!deleted) return NextResponse.json({ error: 'Lead bulunamadı veya silinemedi' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
