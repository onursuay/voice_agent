import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
          title: 'Lead toplu atandı',
          description: null,
          metadata: { assigned_to: data.assigned_to, bulk: true },
        }));
        await supabase.from('lead_activities').insert(activities);
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
            title: 'Aşama toplu değiştirildi',
            description: null,
            metadata: { from_stage_id: lead.stage_id, to_stage_id: data.stage_id, bulk: true },
          }));
          await supabase.from('lead_activities').insert(activities);
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
        const { count, error } = await supabase
          .from('leads')
          .delete()
          .eq('organization_id', orgId)
          .in('id', lead_ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        updated = count || 0;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ updated });
  } catch (err) {
    console.error('POST /api/leads/bulk error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
