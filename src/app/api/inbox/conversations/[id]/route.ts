import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

const DETAIL_JOIN =
  '*, lead:leads(*), assigned_user:profiles!conversations_assigned_to_fkey(id, full_name, avatar_url)';

async function getOrg(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  return membership?.organization_id ?? null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrg(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    const { data, error } = await supabase
      .from('conversations')
      .select(DETAIL_JOIN)
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    if (error || !data) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    return NextResponse.json({ conversation: data });
  } catch (err) {
    console.error('GET /api/inbox/conversations/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const ALLOWED_STATUS = ['new', 'open', 'pending', 'resolved', 'snoozed'];

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrg(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.status === 'string' && ALLOWED_STATUS.includes(body.status)) {
      update.status = body.status;
    }
    if ('assigned_to' in body) {
      update.assigned_to = body.assigned_to || null;
    }
    if (body.read === true) {
      update.unread_count = 0;
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(update)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select(DETAIL_JOIN)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ conversation: data });
  } catch (err) {
    console.error('PATCH /api/inbox/conversations/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
