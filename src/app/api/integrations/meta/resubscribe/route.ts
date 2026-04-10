import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_GRAPH_VERSION = 'v23.0';

/**
 * GET /api/integrations/meta/resubscribe
 * Manually re-subscribes the connected page to leadgen webhooks (DELETE → POST → GET verify).
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  if (!membership) return NextResponse.json({ error: 'No org' }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: integration } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .maybeSingle();

  if (!integration?.config) {
    return NextResponse.json({ error: 'No Meta integration found' }, { status: 404 });
  }

  const config = integration.config as Record<string, unknown>;
  const pageId = config.page_id as string;
  const pageToken = config.access_token as string;

  if (!pageId || !pageToken) {
    return NextResponse.json({ error: 'Missing page_id or access_token' }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${pageToken}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Step 1: DELETE old subscription (best-effort)
  let deleteStatus: number | null = null;
  let deleteBody = '';
  try {
    const delRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      { method: 'DELETE', headers }
    );
    deleteStatus = delRes.status;
    deleteBody = await delRes.text();
    console.log(`[Meta resubscribe] DELETE page=${pageId} status=${deleteStatus} body=${deleteBody}`);
  } catch (err) {
    console.warn(`[Meta resubscribe] DELETE threw: ${err}`);
  }

  // Step 2: POST new subscription
  const postBody = new URLSearchParams({ subscribed_fields: 'leadgen' });
  const postRes = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
    { method: 'POST', headers, body: postBody.toString() }
  );
  const postText = await postRes.text();
  console.log(`[Meta resubscribe] POST page=${pageId} status=${postRes.status} body=${postText}`);

  if (!postRes.ok) {
    return NextResponse.json({
      success: false,
      page_id: pageId,
      delete_status: deleteStatus,
      post_status: postRes.status,
      post_response: postText,
      error: `POST subscribed_apps failed (${postRes.status})`,
    }, { status: 502 });
  }

  // Step 3: GET verify
  let verifyBody: unknown = null;
  let webhookActive = false;
  try {
    const getRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      { method: 'GET', headers: { Authorization: `Bearer ${pageToken}` } }
    );
    const getText = await getRes.text();
    console.log(`[Meta resubscribe] GET verify page=${pageId} status=${getRes.status} body=${getText}`);
    verifyBody = JSON.parse(getText);
    const apps = (verifyBody as { data?: { id: string; subscribed_fields?: string[] }[] }).data || [];
    webhookActive = apps.some((a) => (a.subscribed_fields || []).includes('leadgen'));
  } catch (err) {
    console.warn(`[Meta resubscribe] GET verify threw: ${err}`);
  }

  // Update DB with new webhook_subscribed state
  if (integration.id) {
    const updatedConfig = {
      ...config,
      webhook_subscribed: webhookActive,
      webhook_subscribed_at: new Date().toISOString(),
    };
    await admin
      .from('integration_settings')
      .update({ config: updatedConfig })
      .eq('id', integration.id);
  }

  return NextResponse.json({
    success: true,
    page_id: pageId,
    delete_status: deleteStatus,
    post_status: postRes.status,
    webhook_active: webhookActive,
    verify_response: verifyBody,
  });
}
