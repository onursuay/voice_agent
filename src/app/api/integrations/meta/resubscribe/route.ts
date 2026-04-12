import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_GRAPH_VERSION = 'v23.0';

/**
 * GET /api/integrations/meta/resubscribe?id=<integration_id>
 * Manually re-subscribes a specific page (DELETE → POST → GET verify).
 * If no id given, resubscribes all active Meta pages for the org.
 */
export async function GET(request: NextRequest) {
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
  const integrationId = request.nextUrl.searchParams.get('id');

  let rows: Array<{ id: string; config: Record<string, unknown> }>;

  if (integrationId) {
    const { data: row } = await admin
      .from('integration_settings')
      .select('id, config')
      .eq('id', integrationId)
      .eq('provider', 'meta_leads')
      .single();
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const config = row.config as Record<string, unknown>;
    if (config.organization_id !== membership.organization_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    rows = [{ id: row.id as string, config }];
  } else {
    const { data } = await admin
      .from('integration_settings')
      .select('id, config')
      .eq('provider', 'meta_leads')
      .eq('is_active', true)
      .filter('config->>organization_id', 'eq', membership.organization_id);
    rows = (data || []).map((r) => ({ id: r.id as string, config: r.config as Record<string, unknown> }));
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No Meta integration found' }, { status: 404 });
  }

  const results = await Promise.all(rows.map(async (row) => {
    const { id, config } = row;
    const pageId = config.page_id as string;
    const pageToken = config.access_token as string;

    if (!pageId || !pageToken) {
      return { id, page_id: pageId, success: false, error: 'Missing page_id or access_token' };
    }

    const headers = {
      Authorization: `Bearer ${pageToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // DELETE
    let deleteStatus: number | null = null;
    try {
      const delRes = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
        { method: 'DELETE', headers }
      );
      deleteStatus = delRes.status;
      console.log(`[Meta resubscribe] DELETE page=${pageId} status=${deleteStatus}`);
    } catch (err) {
      console.warn(`[Meta resubscribe] DELETE threw: ${err}`);
    }

    // POST
    const postRes = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      { method: 'POST', headers, body: new URLSearchParams({ subscribed_fields: 'leadgen' }).toString() }
    );
    const postText = await postRes.text();
    console.log(`[Meta resubscribe] POST page=${pageId} status=${postRes.status} body=${postText}`);

    if (!postRes.ok) {
      return { id, page_id: pageId, success: false, error: `POST failed (${postRes.status}): ${postText}` };
    }

    // GET verify
    let webhookActive = false;
    let verifyBody: unknown = null;
    try {
      const getRes = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
        { method: 'GET', headers: { Authorization: `Bearer ${pageToken}` } }
      );
      const getText = await getRes.text();
      verifyBody = JSON.parse(getText);
      const apps = (verifyBody as { data?: { subscribed_fields?: string[] }[] }).data || [];
      webhookActive = apps.some((a) => (a.subscribed_fields || []).includes('leadgen'));
    } catch (err) {
      console.warn(`[Meta resubscribe] GET verify threw: ${err}`);
    }

    // Update DB
    await admin
      .from('integration_settings')
      .update({
        config: {
          ...config,
          webhook_subscribed: webhookActive,
          webhook_subscribed_at: new Date().toISOString(),
        },
      })
      .eq('id', id);

    return { id, page_id: pageId, success: true, delete_status: deleteStatus, webhook_active: webhookActive };
  }));

  return NextResponse.json({ results });
}
