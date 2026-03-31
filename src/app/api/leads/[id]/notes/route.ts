import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    // Verify lead belongs to org
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const { data: notes, error } = await supabase
      .from('lead_notes')
      .select('*, user:profiles(*)')
      .eq('lead_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(notes || []);
  } catch (err) {
    console.error('GET /api/leads/[id]/notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    // Verify lead belongs to org
    const { data: lead } = await supabase
      .from('leads')
      .select('id, notes_count')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const body = await request.json();
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: note, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: id,
        organization_id: orgId,
        user_id: user.id,
        content: body.content.trim(),
        is_system: body.is_system || false,
      })
      .select('*, user:profiles(*)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Increment notes_count on lead
    await supabase
      .from('leads')
      .update({
        notes_count: (lead.notes_count || 0) + 1,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Activity log
    await supabase.from('lead_activities').insert({
      lead_id: id,
      organization_id: orgId,
      user_id: user.id,
      activity_type: 'note_added',
      title: 'Not eklendi',
      description: body.content.trim().substring(0, 200),
      metadata: { note_id: note.id },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error('POST /api/leads/[id]/notes error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
