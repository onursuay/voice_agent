import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/meta/pending-pages
 * Returns page list from the pending OAuth session stored in DB.
 */
export async function GET(_request: NextRequest) {
  // Get authenticated user's org
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'session_expired', reason: 'not_authenticated' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'session_expired', reason: 'no_org' }, { status: 401 });
  }

  const orgId = membership.organization_id;

  // Read pending session from DB
  const admin = createAdminSupabaseClient();
  const { data: pending } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_oauth_pending')
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  if (!pending?.config) {
    return NextResponse.json({ error: 'session_expired', reason: 'no_pending_session' }, { status: 401 });
  }

  const session = pending.config as { organization_id: string; userToken: string; pages: { id: string; name: string }[]; ts: number };

  // Check expiry (10 minutes)
  if (Date.now() - session.ts > 10 * 60 * 1000) {
    return NextResponse.json({ error: 'session_expired', reason: 'expired' }, { status: 401 });
  }

  // Return only id + name, never expose tokens to frontend
  return NextResponse.json({
    orgId: session.organization_id,
    pages: session.pages.map((p) => ({ id: p.id, name: p.name })),
  });
}
