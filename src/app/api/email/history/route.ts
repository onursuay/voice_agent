import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  let q = supabase.from('email_log').select('*').order('created_at', { ascending: false }).limit(100);
  if (leadId) q = q.eq('lead_id', leadId);
  const { data } = await q;
  return NextResponse.json({ logs: data || [] });
}
