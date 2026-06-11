import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateLeadRouting } from '@/lib/crm/routingEngine';

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const ids: string[] = Array.isArray(body.lead_ids) ? body.lead_ids.slice(0, 500) : [];
  if (ids.length === 0) return NextResponse.json({ error: 'lead_ids required' }, { status: 400 });

  // Yalnız erişilebilen leadler (RLS)
  const { data: visible } = await supabase.from('leads').select('id').in('id', ids);
  const visibleIds = (visible || []).map((l) => l.id);

  const results = [];
  for (const id of visibleIds) {
    results.push({ id, ...(await evaluateLeadRouting(id, { trigger: 'manual', force: true })) });
  }
  return NextResponse.json({ results, count: results.length });
}
