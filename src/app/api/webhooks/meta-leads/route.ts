import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { fetchMetaLeadDetails } from '@/lib/meta-graph';
import { ingestLead, resolveLeadIngestionOrganization } from '@/lib/leads/ingest';
import { createHmac, timingSafeEqual } from 'crypto';

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

function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[meta_leads] META_APP_SECRET env is not set — cannot verify webhook signature');
    return false;
  }
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const verifyToken = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  const configuredToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  console.log('[meta_leads] webhook verify attempt', {
    mode,
    verifyToken,
    challenge,
    configuredToken: configuredToken ? `set(${configuredToken.length} chars)` : 'NOT SET',
    match: verifyToken === configuredToken,
  });

  if (!configuredToken) {
    console.error('[meta_leads] META_WEBHOOK_VERIFY_TOKEN env is not set — webhook verify disabled');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (
    mode === 'subscribe' &&
    verifyToken &&
    challenge &&
    verifyToken === configuredToken
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  // Read raw body first for signature verification
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-hub-signature-256');

  if (!verifyMetaSignature(rawBody, signatureHeader)) {
    console.warn('[meta_leads] Webhook signature verification failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: MetaLeadWebhookPayload;
  try {
    body = JSON.parse(rawBody) as MetaLeadWebhookPayload;
  } catch (error) {
    console.error('[meta_leads] Invalid webhook body', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (body.object !== 'page' || !Array.isArray(body.entry)) {
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

      // Resolve org by page_id — each org registers their own page via OAuth
      const organizationId = await resolveLeadIngestionOrganization('meta_leads', pageId);
      if (!organizationId) {
        await logWebhookFailure('meta_leads', 'configuration_error', leadgenId, change,
          `No organization found for page_id: ${pageId}. Connect your Facebook page in Settings → Entegrasyonlar.`);
        return;
      }

      try {
        const metaLead = await fetchMetaLeadDetails(leadgenId, organizationId);

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
