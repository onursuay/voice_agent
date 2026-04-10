import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { fetchMetaLeadDetails, isSampleLeadgenId } from '@/lib/meta-graph';
import { ingestLead, resolveLeadIngestionOrganization } from '@/lib/leads/ingest';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';

// ── DEPLOYMENT MARKER — update this to confirm new deploys are live ──────────
const DEPLOY_MARKER = 'WEBHOOK_DIAG_v2_20260410';
// ────────────────────────────────────────────────────────────────────────────

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

  const configuredToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'voiceagent_meta_2026';

  console.log('[meta_leads] webhook verify attempt', {
    mode,
    verifyToken,
    challenge,
    match: verifyToken === configuredToken,
  });

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
  const reqId = randomUUID().slice(0, 8);
  const t0 = Date.now();

  // Read raw body first for signature verification
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-hub-signature-256');
  const userAgent = request.headers.get('user-agent') || '';
  const cfIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';

  const sigValid = verifyMetaSignature(rawBody, signatureHeader);

  // ── HIGH-SIGNAL ARRIVAL LOG ──────────────────────────────────────────────
  console.log(`[meta_leads][${reqId}] POST ARRIVED`, {
    ts: new Date().toISOString(),
    sigValid,
    hasSignature: !!signatureHeader,
    signaturePrefix: signatureHeader?.slice(0, 20),
    bodyLength: rawBody.length,
    userAgent,
    ip: cfIp,
    hasSecret: !!process.env.META_APP_SECRET,
    secretLength: process.env.META_APP_SECRET?.length,
  });

  // Log first 1000 chars of body so we can see the actual payload structure in Vercel logs
  console.log(`[meta_leads][${reqId}] RAW BODY (first 1000):`, rawBody.slice(0, 1000));

  if (!sigValid) {
    console.warn(`[meta_leads][${reqId}] Signature verification failed — processing anyway for debug`);
  }

  let body: MetaLeadWebhookPayload;
  try {
    body = JSON.parse(rawBody) as MetaLeadWebhookPayload;
  } catch (error) {
    console.error(`[meta_leads][${reqId}] Invalid JSON body`, error);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log(`[meta_leads][${reqId}] PARSED: object=${body.object} entries=${body.entry?.length ?? 0}`);

  if (body.object !== 'page' || !Array.isArray(body.entry)) {
    console.warn(`[meta_leads][${reqId}] Unexpected object type or missing entry — object=${body.object}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const jobs = body.entry.flatMap((entry) =>
    (entry.changes || []).map(async (change) => {
      const changeId = randomUUID().slice(0, 6);

      console.log(`[meta_leads][${reqId}][${changeId}] CHANGE: field=${change.field} value=${JSON.stringify(change.value)}`);

      if (change.field !== 'leadgen') {
        console.log(`[meta_leads][${reqId}][${changeId}] Skipping non-leadgen field: ${change.field}`);
        return;
      }

      const leadgenId = change.value?.leadgen_id || null;
      const pageId = change.value?.page_id || entry.id || null;
      const formId = change.value?.form_id || null;
      const adIdFromWebhook = change.value?.ad_id || null;

      console.log(`[meta_leads][${reqId}][${changeId}] LEAD IDs: leadgen_id=${leadgenId} page_id=${pageId} form_id=${formId} ad_id=${adIdFromWebhook}`);

      if (!leadgenId) {
        console.error(`[meta_leads][${reqId}][${changeId}] Missing leadgen_id`);
        await logWebhookFailure('meta_leads', 'leadgen', null, change, 'Missing leadgen_id');
        return;
      }

      // Skip sample/fake payloads from Meta's webhook "Test" button
      if (isSampleLeadgenId(leadgenId)) {
        console.log(`[meta_leads][${reqId}][${changeId}] SAMPLE PAYLOAD — skipping: leadgen_id=${leadgenId}`);
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

      console.log(`[meta_leads][${reqId}][${changeId}] REAL LEAD — processing: leadgen_id=${leadgenId} page_id=${pageId} form_id=${formId}`);

      // Resolve org by page_id
      const tOrg = Date.now();
      const organizationId = await resolveLeadIngestionOrganization('meta_leads', pageId);
      console.log(`[meta_leads][${reqId}][${changeId}] ORG RESOLVED: organizationId=${organizationId} (${Date.now() - tOrg}ms)`);

      if (!organizationId) {
        const errMsg = `No organization found for page_id: ${pageId}. Connect your Facebook page in Settings → Entegrasyonlar.`;
        console.error(`[meta_leads][${reqId}][${changeId}] ${errMsg}`);
        await logWebhookFailure('meta_leads', 'configuration_error', leadgenId, change, errMsg);
        return;
      }

      try {
        const tGraph = Date.now();
        console.log(`[meta_leads][${reqId}][${changeId}] FETCHING from Meta Graph API...`);
        const metaLead = await fetchMetaLeadDetails(leadgenId, organizationId);
        console.log(`[meta_leads][${reqId}][${changeId}] GRAPH FETCHED OK (${Date.now() - tGraph}ms): name=${metaLead.fullName} email=${metaLead.email} phone=${metaLead.phone} form_id=${metaLead.metaFormId} ad_id=${metaLead.metaAdId}`);

        const tIngest = Date.now();
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
          customFields: metaLead.customFields,
          rawPayload: {
            webhook: change,
            graph_lead: metaLead.rawLead,
          },
        });
        console.log(`[meta_leads][${reqId}][${changeId}] INGESTED (${Date.now() - tIngest}ms): action=${result.action} lead_id=${result.lead?.id} event_id=${result.eventId}`);

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Meta ingestion error';
        console.error(`[meta_leads][${reqId}][${changeId}] LEAD PROCESSING FAILED:`, { leadgenId, pageId, error: message });
        await logWebhookFailure('meta_leads', 'leadgen', leadgenId, change, message);
      }
    })
  );

  await Promise.allSettled(jobs);

  console.log(`[meta_leads][${reqId}] DONE in ${Date.now() - t0}ms`);
  return NextResponse.json({ received: true }, { status: 200 });
}
