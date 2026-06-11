import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ history: [] });

    const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).eq('is_active', true).single();
    if (!m) return NextResponse.json({ history: [] });

    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('organization_id', m.organization_id)
      .eq('activity_type', 'email_sent')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ history: data || [] });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
