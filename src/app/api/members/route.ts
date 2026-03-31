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

    const { data: members, error } = await supabase
      .from('organization_members')
      .select('*, profile:profiles(*)')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(members || []);
  } catch (err) {
    console.error('GET /api/members error:', err);
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

    // Phase 2: Invite member via email
    // For now, return a placeholder response
    const body = await request.json();
    const email = body.email;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { message: 'Uye davet ozelligi yakinda aktif olacak. (Phase 2)' },
        { status: 200 }
      );
    }

    // TODO Phase 2: Send invite email, create pending membership
    return NextResponse.json(
      {
        message: `${email} adresine davet gonderme ozelligi yakinda aktif olacak. (Phase 2)`,
        invited_email: email,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('POST /api/members error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
