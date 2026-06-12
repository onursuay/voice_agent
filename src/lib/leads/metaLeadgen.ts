import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { fetchMetaLeadDetails, isSampleLeadgenId } from '@/lib/meta-graph';
import { ingestLead, resolveLeadIngestionOrganization } from '@/lib/leads/ingest';
import { randomUUID } from 'crypto';

// Meta Lead Ads (leadgen) webhook işleme — mevcut çalışan akış buradan paylaşılır.
// /api/webhooks/meta ve /api/webhooks/meta-leads aynı işleyiciyi kullanır.

export type MetaLeadWebhookChange = {
  field?: string;
  value?: {
    leadgen_id?: string;
    page_id?: string;
    form_id?: string;
    ad_id?: string;
  };
};

export type MetaWebhookEntry = {
  id?: string;
  changes?: MetaLeadWebhookChange[];
};

export async function logWebhookFailure(
  provider: string,
  eventType: string,
  externalId: string | null,
  payload: unknown,
  errorMessage: string,
) {
  try {
    const supabase = createAdminSupabaseClient();
    await supabase.from('lead_events').insert({
      provider,
      event_type: eventType,
      external_id: externalId,
      payload: payload as Record<string, unknown>,
      status: 'failed',
      error_message: errorMessage,
    });
  } catch (error) {
    console.error(`[${provider}] Failed to persist webhook error`, error);
  }
}

/** Tek bir leadgen change'ini işle (org çöz → Graph'tan lead çek → ingest). */
export async function processLeadgenChange(
  entry: MetaWebhookEntry,
  change: MetaLeadWebhookChange,
  reqId: string,
): Promise<void> {
  const changeId = randomUUID().slice(0, 6);

  if (change.field !== 'leadgen') {
    return;
  }

  const leadgenId = change.value?.leadgen_id || null;
  const pageId = change.value?.page_id || entry.id || null;
  const formId = change.value?.form_id || null;
  const adIdFromWebhook = change.value?.ad_id || null;

  if (!leadgenId) {
    console.error(`[meta_leads][${reqId}][${changeId}] Missing leadgen_id`);
    await logWebhookFailure('meta_leads', 'leadgen', null, change, 'Missing leadgen_id');
    return;
  }

  // Meta'nın "Test" düğmesinden gelen örnek/sahte payload'ları atla
  if (isSampleLeadgenId(leadgenId)) {
    try {
      const supabase = createAdminSupabaseClient();
      await supabase.from('lead_events').insert({
        provider: 'meta_leads',
        event_type: 'leadgen',
        external_id: leadgenId,
        payload: change as unknown as Record<string, unknown>,
        status: 'ignored_sample_payload',
      });
    } catch { /* best effort */ }
    return;
  }

  const organizationId = await resolveLeadIngestionOrganization('meta_leads', pageId);
  if (!organizationId) {
    const errMsg = `No organization found for page_id: ${pageId}. Connect your Facebook page in Settings → Entegrasyonlar.`;
    console.error(`[meta_leads][${reqId}][${changeId}] ${errMsg}`);
    await logWebhookFailure('meta_leads', 'configuration_error', leadgenId, change, errMsg);
    return;
  }

  try {
    const metaLead = await fetchMetaLeadDetails(leadgenId, organizationId, pageId);
    const result = await ingestLead({
      organizationId,
      provider: 'meta_leads',
      eventType: 'leadgen',
      eventExternalId: leadgenId,
      payload: change,
      source: 'meta_lead_form',
      metaLeadId: metaLead.metaLeadId || leadgenId,
      metaPageId: pageId,
      metaFormId: metaLead.metaFormId || formId,
      metaAdId: metaLead.metaAdId || adIdFromWebhook,
      fullName: metaLead.fullName,
      email: metaLead.email,
      phone: metaLead.phone,
      city: metaLead.city,
      customFields: metaLead.customFields,
      rawPayload: {
        webhook: change,
        graph_lead: metaLead.rawLead,
      },
    });
    console.log(`[meta_leads][${reqId}][${changeId}] INGESTED: action=${result.action} lead_id=${result.lead?.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Meta ingestion error';
    console.error(`[meta_leads][${reqId}][${changeId}] LEAD PROCESSING FAILED:`, { leadgenId, pageId, error: message });
    await logWebhookFailure('meta_leads', 'leadgen', leadgenId, change, message);
  }
}
