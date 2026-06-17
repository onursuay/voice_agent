import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { syncLeadStageToMeta, type SyncLead, type SyncStage, type AudienceSyncResult } from '@/lib/crm/metaAudienceSync';

/** Aggregated stage→Meta sync outcome returned to the UI for the bulk action. */
type BulkMetaSync =
  | { pending: true; total: number }
  | { total: number; synced: number; skipped: number; failed: number; reason?: string };

const SKIP_REASONS = new Set(['meta_not_connected', 'no_ad_account', 'no_pii']);

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { action, lead_ids, data } = body;

    if (!action || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'action and lead_ids are required' }, { status: 400 });
    }

    let updated = 0;
    let metaSync: BulkMetaSync | undefined;

    switch (action) {
      case 'assign': {
        if (!data?.assigned_to) {
          return NextResponse.json({ error: 'data.assigned_to is required' }, { status: 400 });
        }
        const { count, error } = await supabase
          .from('leads')
          .update({ assigned_to: data.assigned_to, updated_at: new Date().toISOString() })
          .eq('organization_id', orgId)
          .in('id', lead_ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        updated = count || 0;

        // Activity logs for assign
        const activities = lead_ids.map((leadId: string) => ({
          lead_id: leadId,
          organization_id: orgId,
          user_id: user.id,
          activity_type: 'assigned' as const,
          title: 'Leads bulk-assigned',
          description: null,
          metadata: { assigned_to: data.assigned_to, bulk: true },
        }));
        await supabase.from('lead_activities').insert(activities);

        // Atanan kişiye bildirim maili — bulk'ta tek özet yerine lead başına
        // değil, İLK lead üzerinden tek mail (spam önleme). Best-effort.
        void import('@/lib/crm/assignmentNotify')
          .then((m) => m.notifyAssignment({
            organizationId: orgId,
            leadId: lead_ids[0],
            assignedTo: data.assigned_to,
            assignedBy: user.id,
          }))
          .catch((e) => console.error('[assignmentNotify] bulk error:', e));
        break;
      }

      case 'stage': {
        if (!data?.stage_id) {
          return NextResponse.json({ error: 'data.stage_id is required' }, { status: 400 });
        }

        // Get current leads for stage history
        const { data: currentLeads } = await supabase
          .from('leads')
          .select('id, stage_id')
          .eq('organization_id', orgId)
          .in('id', lead_ids);

        const { count, error } = await supabase
          .from('leads')
          .update({ stage_id: data.stage_id, updated_at: new Date().toISOString() })
          .eq('organization_id', orgId)
          .in('id', lead_ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        updated = count || 0;

        // Stage history and activity logs
        if (currentLeads) {
          const stageHistories = currentLeads.map((lead) => ({
            lead_id: lead.id,
            organization_id: orgId,
            from_stage_id: lead.stage_id,
            to_stage_id: data.stage_id,
            changed_by: user.id,
          }));
          await supabase.from('stage_history').insert(stageHistories);

          const activities = currentLeads.map((lead) => ({
            lead_id: lead.id,
            organization_id: orgId,
            user_id: user.id,
            activity_type: 'stage_change' as const,
            title: 'Stages bulk-updated',
            description: null,
            metadata: { from_stage_id: lead.stage_id, to_stage_id: data.stage_id, bulk: true },
          }));
          await supabase.from('lead_activities').insert(activities);
        }

        // Meta Custom Audience sync for each affected lead (best-effort, time-bounded).
        try {
          const { data: syncLeads } = await supabase
            .from('leads')
            .select('id, email, phone, full_name, meta_ad_id, meta_capi_sent')
            .eq('organization_id', orgId)
            .in('id', lead_ids);
          const { data: allStages } = await supabase
            .from('crm_stages')
            .select('id, name, position, is_won, is_lost')
            .eq('organization_id', orgId);
          const newStage = (allStages || []).find((s) => s.id === data.stage_id);
          if (syncLeads && newStage) {
            const TIMEOUT = Symbol('timeout');
            const raceResult = await Promise.race([
              Promise.allSettled(
                syncLeads.map((l) =>
                  syncLeadStageToMeta({
                    organizationId: orgId,
                    lead: l as unknown as SyncLead,
                    stage: newStage as SyncStage,
                    allStages: (allStages || []) as SyncStage[],
                  })
                )
              ),
              new Promise<typeof TIMEOUT>((resolve) => setTimeout(() => resolve(TIMEOUT), 12000)),
            ]);

            if (raceResult === TIMEOUT) {
              metaSync = { pending: true, total: syncLeads.length };
            } else {
              const settled = raceResult as PromiseSettledResult<AudienceSyncResult>[];
              let synced = 0, skipped = 0, failed = 0;
              let reason: string | undefined;
              for (const r of settled) {
                if (r.status === 'fulfilled' && r.value.ok) {
                  synced++;
                } else if (r.status === 'fulfilled' && SKIP_REASONS.has(r.value.reason || '')) {
                  skipped++;
                  if (!reason) reason = r.value.reason;
                } else {
                  failed++;
                  if (!reason) reason = r.status === 'fulfilled' ? r.value.reason : 'sync_failed';
                }
              }
              metaSync = { total: settled.length, synced, skipped, failed, reason };
            }
          }
        } catch (e) {
          console.error('[meta audience sync] bulk error:', e);
        }
        break;
      }

      case 'tag': {
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json({ error: 'data.tags array is required' }, { status: 400 });
        }

        // Need to update each lead individually to append tags
        const { data: currentLeads } = await supabase
          .from('leads')
          .select('id, tags')
          .eq('organization_id', orgId)
          .in('id', lead_ids);

        if (currentLeads) {
          for (const lead of currentLeads) {
            const existingTags: string[] = lead.tags || [];
            const newTags = [...new Set([...existingTags, ...data.tags])];
            await supabase
              .from('leads')
              .update({ tags: newTags, updated_at: new Date().toISOString() })
              .eq('id', lead.id);
            updated++;
          }

          const activities = currentLeads.map((lead) => ({
            lead_id: lead.id,
            organization_id: orgId,
            user_id: user.id,
            activity_type: 'tag_added' as const,
            title: 'Etiket toplu eklendi',
            description: null,
            metadata: { tags: data.tags, bulk: true },
          }));
          await supabase.from('lead_activities').insert(activities);
        }
        break;
      }

      case 'delete': {
        // Soft-delete: kalıcı silmek yerine Çöp Kutusu'na taşı (deleted_at damgala).
        // Hiçbir lead kalıcı silinmez; Çöp'ten geri getirilebilir.
        const adminSupabase = createAdminSupabaseClient();
        const { data: deleted, error } = await adminSupabase
          .from('leads')
          .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
          .eq('organization_id', orgId)
          .in('id', lead_ids)
          .is('deleted_at', null)
          .select('id');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        updated = deleted?.length || 0;
        if (updated === 0) {
          return NextResponse.json({ error: 'No leads were deleted. They may not exist or belong to this organization.' }, { status: 404 });
        }
        break;
      }

      case 'restore': {
        // Geri getirme yalnız owner'a açık — owner olmayanlar bu işlemi yapamaz/görmez.
        if (membership.role !== 'owner') {
          return NextResponse.json({ error: 'Only owners can restore leads' }, { status: 403 });
        }
        // Çöp Kutusu'ndan geri getir (deleted_at temizle).
        const adminSupabase = createAdminSupabaseClient();
        const { data: restored, error } = await adminSupabase
          .from('leads')
          .update({ deleted_at: null, deleted_by: null })
          .eq('organization_id', orgId)
          .in('id', lead_ids)
          .not('deleted_at', 'is', null)
          .select('id');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        updated = restored?.length || 0;
        if (updated === 0) {
          return NextResponse.json({ error: 'No leads were restored.' }, { status: 404 });
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ updated, meta_sync: metaSync });
  } catch (err) {
    console.error('POST /api/leads/bulk error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
