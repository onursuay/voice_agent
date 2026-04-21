import { parseMetaLeadFields } from '@/lib/meta';
import { getIntegrationConfig } from '@/lib/leads/ingest';

const META_GRAPH_VERSION = 'v23.0';

interface MetaLeadField {
  name: string;
  values?: string[];
}

interface MetaLeadResponse {
  id: string;
  created_time?: string;
  field_data?: MetaLeadField[];
  ad_id?: string;
  form_id?: string;
}

interface MetaGraphError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

function getMetaAccessToken(config: Record<string, unknown> | null): string | null {
  // Prefer page-level token from integration_settings (set during OAuth)
  const configuredToken =
    (typeof config?.access_token === 'string' && config.access_token) ||
    (typeof config?.page_access_token === 'string' && config.page_access_token) ||
    null;

  return (
    configuredToken ||
    process.env.META_PAGE_ACCESS_TOKEN ||
    process.env.META_APP_ACCESS_TOKEN ||
    null
  );
}

/**
 * Returns true if the leadgen_id looks like a sample/fake value
 * from Meta's webhook test button (all repeated digits, etc.)
 */
export function isSampleLeadgenId(leadgenId: string): boolean {
  // Meta sample payloads use 444444444444 or similar repeating patterns
  if (/^(\d)\1{5,}$/.test(leadgenId)) return true;
  // Our own manual test IDs
  if (leadgenId.startsWith('test_')) return true;
  return false;
}

export async function fetchMetaLeadDetails(leadgenId: string, organizationId: string, pageId?: string | null) {
  const config = await getIntegrationConfig('meta_leads', organizationId, pageId);
  const accessToken = getMetaAccessToken(config);

  if (!accessToken) {
    throw new Error(
      'Missing Meta access token. Set META_PAGE_ACCESS_TOKEN env variable, or connect your Facebook page in Settings → Entegrasyonlar.'
    );
  }

  // Only fetch by leadgen_id — never by form_id or page_id
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(leadgenId)}?fields=field_data,created_time,ad_id,form_id`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Meta Graph lead fetch timed out after 8 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const responseBody = await response.text();

  if (!response.ok) {
    // Parse and log detailed error
    let errorDetail = `status=${response.status}`;
    try {
      const parsed = JSON.parse(responseBody) as MetaGraphError;
      if (parsed.error) {
        errorDetail = `status=${response.status} code=${parsed.error.code} subcode=${parsed.error.error_subcode} type=${parsed.error.type} message=${parsed.error.message} fbtrace=${parsed.error.fbtrace_id}`;
      }
    } catch { /* use raw */ }
    console.error(`[meta-graph] Lead fetch failed for leadgen_id=${leadgenId}: ${errorDetail}`);
    throw new Error(`Meta Graph lead fetch failed (${response.status}): ${responseBody}`);
  }

  const lead = JSON.parse(responseBody) as MetaLeadResponse;
  console.log(`[meta-graph] Lead fetched OK: leadgen_id=${lead.id} form_id=${lead.form_id} ad_id=${lead.ad_id} field_data_count=${lead.field_data?.length ?? 0} raw_fields=${JSON.stringify(lead.field_data?.slice(0, 5))}`);

  const parsed = parseMetaLeadFields(
    (lead.field_data || []).map((field) => ({
      name: field.name,
      values: field.values || [],
    }))
  );

  return {
    metaLeadId: lead.id,
    metaAdId: lead.ad_id || null,
    metaFormId: lead.form_id || null,
    fullName: parsed.full_name,
    email: parsed.email,
    phone: parsed.phone,
    customFields: parsed.custom_fields,
    rawLead: lead,
  };
}
