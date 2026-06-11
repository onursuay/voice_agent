import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateLeadRouting } from '@/lib/crm/routingEngine';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // RLS: kullanıcı bu lead'i görebiliyorsa erişebilir
  const { data: lead } = await supabase.from('leads').select('id').eq('id', id).single();
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await evaluateLeadRouting(id, { trigger: 'manual', force: true });
  return NextResponse.json({ result });
}
