import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { resolveLeadIngestionOrganization } from '@/lib/leads/ingest';

/**
 * GET /api/webhooks/status?key=<WEBHOOK_STATUS_KEY>
 *
 * Shows webhook configuration status — no secrets are exposed.
 * Protected by WEBHOOK_STATUS_KEY env var.
 * Use this to verify setup before going live.
 */
export async function GET(request: NextRequest) {
  const statusKey = process.env.WEBHOOK_STATUS_KEY;
  const providedKey = request.nextUrl.searchParams.get('key');

  if (!statusKey || providedKey !== statusKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks = {
    env: {
      META_WEBHOOK_VERIFY_TOKEN: Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN),
      META_APP_SECRET: Boolean(process.env.META_APP_SECRET),
      META_APP_ACCESS_TOKEN: Boolean(process.env.META_APP_ACCESS_TOKEN),
      META_PAGE_ACCESS_TOKEN: Boolean(process.env.META_PAGE_ACCESS_TOKEN),
      ZAPIER_INGEST_SECRET: Boolean(process.env.ZAPIER_INGEST_SECRET),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    meta_access_token_available:
      Boolean(process.env.META_APP_ACCESS_TOKEN) ||
      Boolean(process.env.META_PAGE_ACCESS_TOKEN),
    org_routing: null as { organization_id: string | null; source: string } | null,
    webhook_urls: {
      meta_verify_url: `${request.nextUrl.origin}/api/webhooks/meta-leads`,
      meta_callback_url: `${request.nextUrl.origin}/api/webhooks/meta-leads`,
      zapier_endpoint: `${request.nextUrl.origin}/api/webhooks/zapier-leads`,
    },
  };

  // Check org routing
  try {
    const supabase = createAdminSupabaseClient();
    const { data: integration } = await supabase
      .from('integration_settings')
      .select('config, is_active')
      .eq('provider', 'meta_leads')
      .maybeSingle();

    const configOrgId = integration?.is_active
      ? (integration.config as Record<string, unknown> | null)?.organization_id as string | null
      : null;

    if (configOrgId) {
      checks.org_routing = { organization_id: configOrgId, source: 'integration_settings' };
    } else if (process.env.DEFAULT_ORG_ID) {
      checks.org_routing = { organization_id: process.env.DEFAULT_ORG_ID, source: 'DEFAULT_ORG_ID env' };
    } else {
      const orgId = await resolveLeadIngestionOrganization('meta_leads');
      checks.org_routing = {
        organization_id: orgId,
        source: orgId ? 'organization_members fallback' : 'NOT FOUND',
      };
    }
  } catch (err) {
    checks.org_routing = {
      organization_id: null,
      source: `error: ${err instanceof Error ? err.message : 'unknown'}`,
    };
  }

  const allEnvSet = Object.values(checks.env).every(Boolean);
  const orgResolved = Boolean(checks.org_routing?.organization_id);
  const ready = allEnvSet && orgResolved && checks.meta_access_token_available;

  return NextResponse.json({
    status: ready ? 'ready' : 'not_ready',
    checks,
    action_needed: [
      !checks.env.META_WEBHOOK_VERIFY_TOKEN && 'Set META_WEBHOOK_VERIFY_TOKEN env var',
      !checks.env.META_APP_SECRET && 'Set META_APP_SECRET env var (from Meta App Settings > App Secret)',
      !checks.meta_access_token_available && 'Set META_APP_ACCESS_TOKEN or META_PAGE_ACCESS_TOKEN env var',
      !checks.env.ZAPIER_INGEST_SECRET && 'Set ZAPIER_INGEST_SECRET env var',
      !orgResolved && 'Set DEFAULT_ORG_ID env var — run the query below in Supabase SQL Editor:\n  SELECT id FROM organizations LIMIT 1;',
    ].filter(Boolean),
  });
}
