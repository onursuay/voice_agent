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

  // Read connected Meta account from DB (persistent, no 10-min expiry)
  const admin = createAdminSupabaseClient();
  const { data: account } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_account')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', orgId)
    .maybeSingle();

  if (!account?.config) {
    return NextResponse.json({ error: 'account_not_connected', reason: 'no_account' }, { status: 401 });
  }

  const session = account.config as {
    organization_id: string;
    userToken: string;
    pages: { id: string; name: string }[];
    expires_at?: string;
  };

  // Check long-lived token expiry (~59 days)
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.json({ error: 'account_expired', reason: 'token_expired' }, { status: 401 });
  }

  // Return only id + name, never expose tokens to frontend
  return NextResponse.json({
    orgId: session.organization_id,
    pages: session.pages.map((p) => ({ id: p.id, name: p.name })),
  });
}
