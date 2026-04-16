import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_GRAPH_VERSION = 'v23.0';

interface LeadgenForm {
  id: string;
  name?: string;
  status?: string;
  created_time?: string;
}

async function fetchLeadgenForms(
  pageId: string,
  pageToken: string
): Promise<LeadgenForm[]> {
  const url = new URL(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${pageId}/leadgen_forms`
  );
  url.searchParams.set('fields', 'id,name,status,created_time');
  url.searchParams.set('limit', '100');
  url.searchParams.set('access_token', pageToken);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  const body = await res.text();
  console.log(`[Meta forms GET] page=${pageId} status=${res.status} body=${body.slice(0, 500)}`);

  if (!res.ok) {
    throw new Error(`leadgen_forms fetch failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const parsed = JSON.parse(body) as { data?: LeadgenForm[] };
  return parsed.data ?? [];
}

/**
 * GET /api/integrations/meta/forms?page_id=xxx
 * Returns Lead Forms for the given connected page.
 * Requires pages_manage_ads permission on the page access token.
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
  if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const pageId = request.nextUrl.searchParams.get('page_id');
  if (!pageId) return NextResponse.json({ error: 'page_id required' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: integration } = await admin
    .from('integration_settings')
    .select('id, config')
    .eq('provider', 'meta_leads')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', membership.organization_id)
    .filter('config->>page_id', 'eq', pageId)
    .maybeSingle();

  if (!integration?.config) {
    return NextResponse.json({ error: 'Page not connected' }, { status: 404 });
  }

  const config = integration.config as Record<string, unknown>;
  const pageToken = config.access_token as string | null;
  if (!pageToken) {
    return NextResponse.json({ error: 'Missing page token' }, { status: 500 });
  }

  try {
    const forms = await fetchLeadgenForms(pageId, pageToken);

    // Refresh cached forms in config
    await admin
      .from('integration_settings')
      .update({
        config: {
          ...config,
          leadgen_forms: forms,
          leadgen_forms_fetched_at: new Date().toISOString(),
        },
      })
      .eq('id', integration.id);

    return NextResponse.json({ forms });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Meta forms GET] failed page=${pageId}: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
