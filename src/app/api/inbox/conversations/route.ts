import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const LEAD_JOIN =
  '*, lead:leads(id, full_name, display_name, phone, email, instagram_username, stage_id, assigned_to, source_platform), assigned_user:profiles!conversations_assigned_to_fkey(id, full_name, avatar_url)';

// PostgREST .or() filtre injection'ı önle: yapısal karakterleri (virgül, parantez,
// nokta, yıldız, çift tırnak, ters bölü, iki nokta) boşlukla değiştir. % ilike wildcard kalır.
function sanitizeSearch(value: string): string {
  return value.replace(/[,()*:."\\]/g, ' ').trim();
}

export async function GET(request: NextRequest) {
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
    const orgId = membership.organization_id;

    const params = request.nextUrl.searchParams;
    const channel = params.get('channel');           // whatsapp | instagram | messenger
    const status = params.get('status');             // new | open | pending | resolved | snoozed
    const search = (params.get('search') || '').trim();
    const limit = Math.min(200, Math.max(1, parseInt(params.get('limit') || '100', 10)));

    let query = supabase
      .from('conversations')
      .select(LEAD_JOIN)
      .eq('organization_id', orgId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (channel) query = query.eq('channel', channel);
    if (status) query = query.eq('status', status);

    if (search) {
      // Arama: ilgili lead'leri bul → konuşmaları lead_id ile filtrele
      const { data: matchLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', orgId)
        .or(`full_name.ilike.%${search}%,display_name.ilike.%${search}%,phone.ilike.%${search}%,instagram_username.ilike.%${search}%`)
        .limit(200);
      const leadIds = (matchLeads || []).map((l: { id: string }) => l.id);
      if (leadIds.length === 0) return NextResponse.json({ conversations: [] });
      query = query.in('lead_id', leadIds);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ conversations: data || [] });
  } catch (err) {
    console.error('GET /api/inbox/conversations error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
