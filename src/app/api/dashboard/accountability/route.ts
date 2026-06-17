import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = ['owner', 'admin', 'sales_manager'];

interface AssignedUser {
  full_name: string | null;
  email: string | null;
}

interface Stage {
  is_won: boolean;
  is_lost: boolean;
}

interface LeadRow {
  assigned_to: string;
  contact_attempts: number | null;
  contact_outcome: string | null;
  first_contact_at: string | null;
  assigned_at: string | null;
  sla_alert_first_at: string | null;
  sla_alert_retry_at: string | null;
  assigned_user: AssignedUser | null;
  stage: Stage | null;
}

interface RepStats {
  id: string;
  name: string;
  assigned: number;
  called: number;
  reached: number;
  waiting: number;
  slaBreaches: number;
  avgFirstCallMins: number | null;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // --- Auth ---
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    if (!ALLOWED_ROLES.includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden: manager role required' }, { status: 403 });
    }

    const orgId = membership.organization_id;

    // --- Query ---
    const { data: leads, error } = await supabase
      .from('leads')
      .select(
        'assigned_to, contact_attempts, contact_outcome, first_contact_at, assigned_at, sla_alert_first_at, sla_alert_retry_at, assigned_user:profiles!leads_assigned_to_fkey(full_name,email), stage:crm_stages(is_won,is_lost)'
      )
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .not('assigned_to', 'is', null);

    if (error) {
      console.error('GET /api/dashboard/accountability error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- Aggregate per rep (skip closed leads) ---
    const repMap = new Map<string, RepStats & { firstCallDelayMins: number[] }>();

    for (const lead of (leads || []) as unknown as LeadRow[]) {
      // Skip won/lost
      if (lead.stage?.is_won || lead.stage?.is_lost) continue;

      const repId = lead.assigned_to;
      if (!repId) continue;

      if (!repMap.has(repId)) {
        const u = lead.assigned_user;
        const name = u?.full_name || u?.email || repId;
        repMap.set(repId, {
          id: repId,
          name,
          assigned: 0,
          called: 0,
          reached: 0,
          waiting: 0,
          slaBreaches: 0,
          avgFirstCallMins: null,
          firstCallDelayMins: [],
        });
      }

      const rep = repMap.get(repId)!;
      rep.assigned += 1;

      const attempts = lead.contact_attempts ?? 0;

      if (attempts > 0) {
        rep.called += 1;
      } else {
        rep.waiting += 1;
      }

      if (lead.contact_outcome === 'reached') {
        rep.reached += 1;
      }

      if (lead.sla_alert_first_at || lead.sla_alert_retry_at) {
        rep.slaBreaches += 1;
      }

      // avg first call delay
      if (lead.first_contact_at && lead.assigned_at) {
        const delayMs =
          new Date(lead.first_contact_at).getTime() -
          new Date(lead.assigned_at).getTime();
        if (delayMs >= 0) {
          rep.firstCallDelayMins.push(delayMs / 60000);
        }
      }
    }

    // --- Finalise and sort ---
    const reps: RepStats[] = Array.from(repMap.values())
      .map(({ firstCallDelayMins, ...rep }) => {
        const avg =
          firstCallDelayMins.length > 0
            ? Math.round(
                firstCallDelayMins.reduce((a, b) => a + b, 0) /
                  firstCallDelayMins.length
              )
            : null;
        return { ...rep, avgFirstCallMins: avg };
      })
      .sort((a, b) => {
        // waiting desc first, then slaBreaches desc
        if (b.waiting !== a.waiting) return b.waiting - a.waiting;
        return b.slaBreaches - a.slaBreaches;
      });

    return NextResponse.json({ reps });
  } catch (err) {
    console.error('GET /api/dashboard/accountability error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
