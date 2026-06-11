import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const OUTCOMES = ['reached', 'no_answer', 'busy', 'wrong_number'];

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const outcome = OUTCOMES.includes(body.outcome) ? body.outcome : null;
  if (!outcome) return NextResponse.json({ error: 'invalid outcome' }, { status: 400 });
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  // RLS: only accessible lead (own assigned or fully authorized)
  const { data: lead } = await supabase
    .from('leads')
    .select('id, organization_id, contact_attempts, first_contact_at')
    .eq('id', id)
    .single();
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('leads')
    .update({
      contact_attempts: (lead.contact_attempts || 0) + 1,
      last_contact_at: now,
      first_contact_at: lead.first_contact_at || now,
      contact_outcome: outcome,
    })
    .eq('id', id)
    .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Activity log
  await supabase.from('lead_activities').insert({
    lead_id: id,
    organization_id: lead.organization_id,
    user_id: user.id,
    activity_type: 'call_made',
    title: `Arama: ${outcome}`,
    description: note || null,
    metadata: { outcome, ...(note ? { note } : {}) },
  });

  return NextResponse.json({ lead: updated });
}
