import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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

    const { data: stages, error } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('organization_id', orgId)
      .order('position', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(stages || []);
  } catch (err) {
    console.error('GET /api/stages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Get max position for ordering
    const { data: lastStage } = await supabase
      .from('crm_stages')
      .select('position')
      .eq('organization_id', orgId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastStage?.position ?? -1) + 1;

    const slug = body.slug || body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const { data: stage, error } = await supabase
      .from('crm_stages')
      .insert({
        organization_id: orgId,
        name: body.name.trim(),
        slug,
        color: body.color || '#6B7280',
        position: body.position ?? nextPosition,
        is_won: body.is_won || false,
        is_lost: body.is_lost || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(stage, { status: 201 });
  } catch (err) {
    console.error('POST /api/stages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json();
    // Expects body.stages: Array<{ id: string; position: number }>
    if (!Array.isArray(body.stages)) {
      return NextResponse.json({ error: 'stages array is required' }, { status: 400 });
    }

    for (const item of body.stages) {
      await supabase
        .from('crm_stages')
        .update({ position: item.position })
        .eq('id', item.id)
        .eq('organization_id', orgId);
    }

    // Return updated stages
    const { data: stages, error } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('organization_id', orgId)
      .order('position', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(stages || []);
  } catch (err) {
    console.error('PATCH /api/stages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
