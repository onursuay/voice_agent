import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/google/picker-token
 * Returns the OAuth access token so the client can open Google Picker.
 * Only accessible to authenticated users with an active Google token.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.cookies.get('google_sheets_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
