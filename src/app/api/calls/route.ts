import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getAuth(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: m } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).eq('is_active', true).single();
  if (!m) return null;
  return { user, orgId: m.organization_id };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const auth = await getAuth(supabase);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('call_logs').select('*, lead:leads(id, full_name, phone, company)').eq('organization_id', auth.orgId).order('created_at', { ascending: false });
    if (error) return NextResponse.json({ calls: [] });
    return NextResponse.json({ calls: data || [] });
  } catch {
    return NextResponse.json({ calls: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const auth = await getAuth(supabase);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { lead_ids, script, voice_profile, schedule } = body;

    // Get lead phone numbers
    const { data: leads } = await supabase.from('leads').select('id, phone, full_name').in('id', lead_ids);
    if (!leads || leads.length === 0) return NextResponse.json({ error: 'No valid leads' }, { status: 400 });

    const callLogs = leads.filter(l => l.phone).map(l => ({
      lead_id: l.id,
      organization_id: auth.orgId,
      phone_number: l.phone!,
      direction: 'outbound',
      status: 'pending',
      provider: 'netgsm',
      metadata: { script, voice_profile, schedule: schedule || null, lead_name: l.full_name },
    }));

    const { data, error } = await supabase.from('call_logs').insert(callLogs).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ calls: data, created: data?.length || 0 }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
