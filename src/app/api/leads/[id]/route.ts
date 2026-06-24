import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { syncLeadStageToMeta, type SyncLead, type SyncStage, type AudienceSyncResult } from '@/lib/crm/metaAudienceSync';

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

    // If stage changed, create stage_history + activity, then sync to Meta.
    let metaSync: AudienceSyncResult | undefined;
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
        title: 'Stage changed',
        description: null,
        metadata: {
          from_stage_id: currentLead.stage_id,
          to_stage_id: body.stage_id,
        },
      });

      // Meta Custom Audience sync (best-effort, time-bounded, never blocks the save).
      try {
        const { data: allStages } = await supabase
          .from('crm_stages')
          .select('*') // meta_audience dahil tüm alanlar (kolon yoksa hata vermez)
          .eq('organization_id', orgId);
        const newStage = (updated as { stage?: SyncStage }).stage;
        if (allStages && newStage) {
          metaSync = await Promise.race<AudienceSyncResult>([
            syncLeadStageToMeta({
              organizationId: orgId,
              lead: updated as unknown as SyncLead,
              stage: newStage,
              allStages: allStages as SyncStage[],
            }).catch((e) => ({ ok: false, reason: 'sync_failed', error: e instanceof Error ? e.message : String(e) })),
            new Promise<AudienceSyncResult>((resolve) =>
              setTimeout(() => resolve({ ok: false, reason: 'sync_failed', error: 'sync_timeout' }), 9000)
            ),
          ]);
        }
      } catch (e) {
        console.error('[meta audience sync] PATCH error:', e);
      }
    }

    // If assigned_to changed, create activity + notify the assignee by email
    if (body.assigned_to !== undefined && body.assigned_to !== currentLead.assigned_to) {
      await supabase.from('lead_activities').insert({
        lead_id: id,
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'assigned',
        title: 'Lead assigned',
        description: null,
        metadata: {
          from_user: currentLead.assigned_to,
          to_user: body.assigned_to,
        },
      });

      // Atanan kişiye bildirim maili (best-effort; kaydı asla bloklamaz).
      // Org ayarı settings.notifications.assignment_email=false ile kapatılabilir.
      if (body.assigned_to) {
        void import('@/lib/crm/assignmentNotify')
          .then((m) => m.notifyAssignment({
            organizationId: orgId,
            leadId: id,
            assignedTo: body.assigned_to,
            assignedBy: user.id,
          }))
          .catch((e) => console.error('[assignmentNotify] PATCH error:', e));
      }
    }

    return NextResponse.json({ ...updated, meta_sync: metaSync });
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

    // Soft-delete: kalıcı silmek yerine Çöp Kutusu'na taşı (deleted_at damgala).
    // Hiçbir lead kalıcı silinmez; Çöp'ten geri getirilebilir.
    const { data: deleted, error } = await supabase
      .from('leads')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!deleted) return NextResponse.json({ error: 'Lead not found or could not be deleted' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
