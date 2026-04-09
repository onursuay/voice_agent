import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/google/sheets
 * Lists the user's Google Spreadsheet files from Google Drive.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.cookies.get('google_sheets_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q') || '';
  const query = [
    "mimeType='application/vnd.google-apps.spreadsheet'",
    "trashed=false",
    q ? `name contains '${q.replace(/'/g, "\\'")}'` : '',
  ].filter(Boolean).join(' and ');

  const driveUrl = new URL('https://www.googleapis.com/drive/v3/files');
  driveUrl.searchParams.set('q', query);
  driveUrl.searchParams.set('fields', 'files(id,name,modifiedTime)');
  driveUrl.searchParams.set('orderBy', 'modifiedTime desc');
  driveUrl.searchParams.set('pageSize', '50');

  const res = await fetch(driveUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      return NextResponse.json({ error: 'google_token_expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'drive_api_error' }, { status: 500 });
  }

  const data = await res.json() as { files?: { id: string; name: string; modifiedTime: string }[] };
  return NextResponse.json({ files: data.files || [] });
}
