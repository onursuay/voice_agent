import { parseMetaLeadFields } from '@/lib/meta';
import { getIntegrationConfig } from '@/lib/leads/ingest';

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

function getMetaAccessToken(config: Record<string, unknown> | null): string | null {
  const configuredToken =
    (typeof config?.access_token === 'string' && config.access_token) ||
    (typeof config?.page_access_token === 'string' && config.page_access_token) ||
    null;

  return (
    configuredToken ||
    process.env.META_APP_ACCESS_TOKEN ||
    process.env.META_PAGE_ACCESS_TOKEN ||
    null
  );
}

export async function fetchMetaLeadDetails(leadgenId: string) {
  const config = await getIntegrationConfig('meta_leads');
  const accessToken = getMetaAccessToken(config);

  if (!accessToken) {
    throw new Error('Missing Meta access token');
  }

  const url = new URL(`https://graph.facebook.com/v19.0/${encodeURIComponent(leadgenId)}`);
  url.searchParams.set('fields', 'id,created_time,field_data,ad_id,form_id');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Meta Graph lead fetch failed (${response.status}): ${body}`);
  }

  const lead = (await response.json()) as MetaLeadResponse;
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
