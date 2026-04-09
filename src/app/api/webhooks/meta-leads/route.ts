import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { fetchMetaLeadDetails } from '@/lib/meta-graph';
import { ingestLead, resolveLeadIngestionOrganization } from '@/lib/leads/ingest';

type MetaLeadWebhookChange = {
  field?: string;
  value?: {
    leadgen_id?: string;
    page_id?: string;
    form_id?: string;
    ad_id?: string;
  };
};

type MetaLeadWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: MetaLeadWebhookChange[];
  }>;
};

async function logWebhookFailure(provider: string, eventType: string, externalId: string | null, payload: unknown, errorMessage: string) {
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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const verifyToken = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    verifyToken &&
    challenge &&
    verifyToken === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  let body: MetaLeadWebhookPayload;

  try {
    body = (await request.json()) as MetaLeadWebhookPayload;
  } catch (error) {
    console.error('[meta_leads] Invalid webhook body', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (body.object !== 'page' || !Array.isArray(body.entry)) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const organizationId = await resolveLeadIngestionOrganization('meta_leads');
  if (!organizationId) {
    await logWebhookFailure('meta_leads', 'configuration_error', null, body, 'No organization available for lead ingestion');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const jobs = body.entry.flatMap((entry) =>
    (entry.changes || []).map(async (change) => {
      if (change.field !== 'leadgen') return;

      const leadgenId = change.value?.leadgen_id || null;
      const pageId = change.value?.page_id || entry.id || null;
      const formId = change.value?.form_id || null;
      const adIdFromWebhook = change.value?.ad_id || null;

      if (!leadgenId) {
        await logWebhookFailure('meta_leads', 'leadgen', null, change, 'Missing leadgen_id');
        return;
      }

      try {
        const metaLead = await fetchMetaLeadDetails(leadgenId);

        await ingestLead({
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
          customFields: metaLead.customFields,
          rawPayload: {
            webhook: change,
            graph_lead: metaLead.rawLead,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Meta ingestion error';
        console.error('[meta_leads] Lead processing failed', { leadgenId, error: message });
        await logWebhookFailure('meta_leads', 'leadgen', leadgenId, change, message);
      }
    })
  );

  await Promise.allSettled(jobs);

  return NextResponse.json({ received: true }, { status: 200 });
}
