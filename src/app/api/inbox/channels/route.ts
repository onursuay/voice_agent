import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listOrgChannels } from '@/lib/inbox/channels';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    const channels = await listOrgChannels(membership.organization_id);
    return NextResponse.json({ channels });
  } catch (err) {
    console.error('GET /api/inbox/channels error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
