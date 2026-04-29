import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/google/spreadsheets
 * Returns spreadsheet files visible to the connected Google account.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.cookies.get('google_sheets_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  url.searchParams.set('fields', 'files(id,name,modifiedTime)');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('includeItemsFromAllDrives', 'true');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) return NextResponse.json({ error: 'google_token_expired' }, { status: 401 });
    return NextResponse.json({ error: 'drive_api_error' }, { status: 500 });
  }

  const data = await res.json() as {
    files?: Array<{ id: string; name: string; modifiedTime?: string }>;
  };

  return NextResponse.json({
    files: (data.files || []).map((file) => ({
      id: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime || '',
    })),
  });
}
