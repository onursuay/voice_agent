import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/google/sheets
 * Returns connection status — token existence check only.
 * File listing is now handled via Google Picker on the client.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.cookies.get('google_sheets_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });
  }

  return NextResponse.json({ connected: true });
}
