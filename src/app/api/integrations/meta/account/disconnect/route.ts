import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_GRAPH_VERSION = 'v23.0';

interface ConnectedPage {
  page_id?: string;
  access_token?: string;
  [key: string]: unknown;
}

async function bestEffortUnsubscribePage(pageId: string, pageToken: string): Promise<void> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/subscribed_apps`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${pageToken}` },
      }
    );
    const body = await res.text();
    console.log(`[Meta account disconnect] DELETE subscribed_apps page=${pageId} status=${res.status} body=${body.slice(0, 200)}`);
  } catch (err) {
    console.warn(`[Meta account disconnect] Unsubscribe failed page=${pageId}: ${err}`);
  }
}

/**
 * DELETE /api/integrations/meta/account/disconnect
 * Disconnects the Meta account AND all connected pages for the logged-in org.
 * Best-effort unsubscribes each page's webhook before deactivating rows.
 */
export async function DELETE() {
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

  const admin = createAdminSupabaseClient();
  const orgId = membership.organization_id;

  // 1. Fetch all connected pages for this org and unsubscribe webhooks (best-effort)
  const { data: pages } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_leads')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', orgId);

  if (pages?.length) {
    await Promise.allSettled(
      pages.map(async (row) => {
        const config = row.config as ConnectedPage;
        if (config.page_id && config.access_token) {
          await bestEffortUnsubscribePage(config.page_id, config.access_token);
        }
      })
    );
  }

  // 2. Deactivate all page connections
  await admin
    .from('integration_settings')
    .update({ is_active: false })
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', orgId);

  // 3. Remove the account entry
  await admin
    .from('integration_settings')
    .delete()
    .eq('provider', 'meta_account')
    .filter('config->>organization_id', 'eq', orgId);

  // 4. Clean up any legacy pending session
  await admin
    .from('integration_settings')
    .delete()
    .eq('provider', 'meta_oauth_pending')
    .filter('config->>organization_id', 'eq', orgId);

  return NextResponse.json({ success: true });
}
