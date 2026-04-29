import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function buildState(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const sig = createHmac('sha256', process.env.GOOGLE_CLIENT_SECRET || '')
    .update(payload)
    .digest('hex')
    .slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

/**
 * GET /api/integrations/google/connect
 * Redirects the user to Google OAuth for Sheets access.
 * After callback, redirects back to /dashboard/import?google=connected
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET env not set' },
      { status: 500 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const state = buildState(user.id);
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/integrations/google/callback`;

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ].join(' '));
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent select_account');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.redirect(oauthUrl.toString());
}
