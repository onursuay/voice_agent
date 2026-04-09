import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/google/sheets/[spreadsheetId]
 * Returns the sheet tabs and optionally the data of a specific sheet.
 *
 * Query params:
 *   sheet  - sheet tab name (if omitted, returns only tab list)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spreadsheetId: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = request.cookies.get('google_sheets_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'google_not_connected' }, { status: 401 });
  }

  const { spreadsheetId } = await params;
  const sheetName = request.nextUrl.searchParams.get('sheet');

  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

  if (!sheetName) {
    // Return only metadata (sheet tabs)
    const res = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title,index)`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) return NextResponse.json({ error: 'google_token_expired' }, { status: 401 });
      if (res.status === 404) return NextResponse.json({ error: 'spreadsheet_not_found' }, { status: 404 });
      return NextResponse.json({ error: 'sheets_api_error' }, { status: 500 });
    }

    const data = await res.json() as {
      sheets?: { properties: { sheetId: number; title: string; index: number } }[];
    };
    const tabs = (data.sheets || []).map((s) => ({
      id: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
    }));

    return NextResponse.json({ tabs });
  }

  // Return sheet data
  const range = encodeURIComponent(sheetName);
  const res = await fetch(`${baseUrl}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) return NextResponse.json({ error: 'google_token_expired' }, { status: 401 });
    return NextResponse.json({ error: 'sheets_api_error' }, { status: 500 });
  }

  const data = await res.json() as { values?: string[][] };
  const values = data.values || [];

  if (values.length === 0) {
    return NextResponse.json({ headers: [], rows: [] });
  }

  const headers = values[0].map((h) => String(h).trim());
  const rows = values.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? String(row[i]) : '';
    });
    return obj;
  });

  return NextResponse.json({ headers, rows });
}
