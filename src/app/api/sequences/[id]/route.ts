import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

async function requireOrg() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return { error: 'No organization', status: 403 as const };
  return { supabase, orgId: membership.organization_id as string };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, orgId } = auth;

  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
  if (body.trigger_config !== undefined) update.trigger_config = body.trigger_config;
  if (body.call_window !== undefined) update.call_window = body.call_window;
  if (body.priority !== undefined) update.priority = Number(body.priority) || 0;

  if (Object.keys(update).length) {
    const { error } = await supabase
      .from('sequences')
      .update(update)
      .eq('id', id)
      .eq('organization_id', orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Adımlar gönderildiyse replace-all (basit ve deterministik)
  if (Array.isArray(body.steps)) {
    const steps = body.steps
      .filter((s: { step_type?: string }) => s && (s.step_type === 'ai_call' || s.step_type === 'email'))
      .map((s: { step_type: string; delay_minutes?: number; only_if?: string; config?: { email_template_id?: string | null } }, i: number) => ({
        sequence_id: id,
        organization_id: orgId,
        position: i,
        step_type: s.step_type,
        delay_minutes: Math.max(0, Math.min(60 * 24 * 30, Number(s.delay_minutes) || 0)),
        only_if: ['always', 'not_reached', 'reached'].includes(s.only_if || '') ? s.only_if : 'always',
        config: { email_template_id: s.config?.email_template_id ?? null },
      }));
    if (steps.length) {
      const { error: delErr } = await supabase
        .from('sequence_steps').delete().eq('sequence_id', id).eq('organization_id', orgId);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      const { error: insErr } = await supabase.from('sequence_steps').insert(steps);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireOrg();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { supabase, orgId } = auth;

  const { error } = await supabase
    .from('sequences')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
