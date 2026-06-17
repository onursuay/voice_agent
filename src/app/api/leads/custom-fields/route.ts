import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Org'un lead'lerinde geçen form (custom_fields) alan anahtarlarını döndürür.
// Otomasyon kural kurucusunun "Alan" dropdown'ını form başlıklarına göre
// dinamik beslemek için kullanılır. Son 400 lead taranır (yeterli kapsam, hafif).
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

    const { data, error } = await supabase
      .from('leads')
      .select('custom_fields')
      .eq('organization_id', membership.organization_id)
      .is('deleted_at', null)
      .not('custom_fields', 'eq', '{}')
      .order('created_at', { ascending: false })
      .limit(400);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const counts = new Map<string, number>();
    for (const row of (data || []) as Array<{ custom_fields: Record<string, unknown> | null }>) {
      for (const key of Object.keys(row.custom_fields || {})) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    // En sık görülen alanlar önce
    const keys = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

    return NextResponse.json({ keys });
  } catch (err) {
    console.error('GET /api/leads/custom-fields error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
