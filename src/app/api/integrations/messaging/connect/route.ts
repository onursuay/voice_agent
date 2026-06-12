import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildMetaState } from '@/lib/meta/oauth-state';

/**
 * GET /api/integrations/messaging/connect
 * Omnichannel mesajlaşma OAuth'u — canli_chatbot ile aynı scope seti:
 * WhatsApp Business + Messenger + Instagram DM bağlamak için gereken izinler.
 * Callback ortak: /api/integrations/meta/callback (mode='messaging').
 */
const MESSAGING_SCOPES = [
  'business_management',
  'pages_show_list',
  'pages_messaging',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_messages',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
].join(',');

export async function GET(request: NextRequest) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.json({ error: 'META_APP_ID or META_APP_SECRET env not set' }, { status: 500 });
  }

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

  const state = buildMetaState(membership.organization_id, 'messaging');
  const redirectUri = `${request.nextUrl.origin}/api/integrations/meta/callback`;

  const oauthUrl = new URL('https://www.facebook.com/dialog/oauth');
  oauthUrl.searchParams.set('client_id', appId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('scope', MESSAGING_SCOPES);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.redirect(oauthUrl.toString());
}
