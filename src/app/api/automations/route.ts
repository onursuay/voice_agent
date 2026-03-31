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

    const { data, error } = await supabase.from('automation_rules').select('*').eq('organization_id', auth.orgId).order('created_at', { ascending: false });
    if (error) return NextResponse.json({ rules: [] });
    return NextResponse.json({ rules: data || [] });
  } catch {
    return NextResponse.json({ rules: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const auth = await getAuth(supabase);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabase.from('automation_rules').insert({
      organization_id: auth.orgId,
      created_by: auth.user.id,
      name: body.name,
      trigger_type: body.trigger_type,
      trigger_config: body.trigger_config || {},
      action_type: body.action_type,
      action_config: body.action_config || {},
      is_active: body.is_active ?? true,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rule: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
