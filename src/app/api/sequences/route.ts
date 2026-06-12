import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireOrg() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return { error: 'No organization', status: 403 as const };
  return { supabase, userId: user.id, orgId: membership.organization_id as string };
}

type StepInput = {
  step_type: 'ai_call' | 'email';
  delay_minutes?: number;
  only_if?: 'always' | 'not_reached' | 'reached';
  config?: Record<string, unknown>;
};

function sanitizeSteps(raw: unknown): StepInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is StepInput => s && (s.step_type === 'ai_call' || s.step_type === 'email'))
    .map((s) => ({
      step_type: s.step_type,
      delay_minutes: Math.max(0, Math.min(60 * 24 * 30, Number(s.delay_minutes) || 0)),
      only_if: ['always', 'not_reached', 'reached'].includes(s.only_if as string) ? s.only_if : 'always',
      config: typeof s.config === 'object' && s.config ? { email_template_id: (s.config as { email_template_id?: string }).email_template_id ?? null } : {},
    }));
}

export async function GET() {
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, orgId } = auth;

  const { data: sequences, error } = await supabase
    .from('sequences')
    .select('*, steps:sequence_steps(*)')
    .eq('organization_id', orgId)
    .order('priority', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrollment sayıları (aktif/tamamlanan) — kart özetleri için
  const { data: enrCounts } = await supabase
    .from('sequence_enrollments')
    .select('sequence_id, status')
    .eq('organization_id', orgId);
  const counts: Record<string, { active: number; completed: number }> = {};
  for (const e of (enrCounts || []) as Array<{ sequence_id: string; status: string }>) {
    counts[e.sequence_id] = counts[e.sequence_id] || { active: 0, completed: 0 };
    if (e.status === 'active') counts[e.sequence_id].active++;
    if (e.status === 'completed') counts[e.sequence_id].completed++;
  }

  const withSorted = (sequences || []).map((s: { steps?: Array<{ position: number }> } & Record<string, unknown>) => ({
    ...s,
    steps: (s.steps || []).sort((a, b) => a.position - b.position),
    enrollment_counts: counts[(s as { id: string }).id] || { active: 0, completed: 0 },
  }));

  return NextResponse.json({ sequences: withSorted });
}

export async function POST(request: NextRequest) {
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, orgId, userId } = auth;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  const steps = sanitizeSteps(body.steps);
  if (!steps.length) return NextResponse.json({ error: 'at least one step is required' }, { status: 400 });

  const { data: seq, error } = await supabase
    .from('sequences')
    .insert({
      organization_id: orgId,
      name,
      is_active: body.is_active !== false,
      trigger_config: body.trigger_config || {},
      call_window: body.call_window || { start_hour: 11, end_hour: 18 },
      priority: Number(body.priority) || 0,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stepRows = steps.map((s, i) => ({
    sequence_id: seq.id,
    organization_id: orgId,
    position: i,
    step_type: s.step_type,
    delay_minutes: s.delay_minutes ?? 0,
    only_if: s.only_if ?? 'always',
    config: s.config ?? {},
  }));
  const { error: stepErr } = await supabase.from('sequence_steps').insert(stepRows);
  if (stepErr) return NextResponse.json({ error: stepErr.message }, { status: 500 });

  return NextResponse.json({ id: seq.id }, { status: 201 });
}
