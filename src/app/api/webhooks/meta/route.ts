import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyMetaSignature } from '@/lib/meta/verify';
import { processLeadgenChange, logWebhookFailure, type MetaWebhookEntry } from '@/lib/leads/metaLeadgen';
import { normalizeWebhook } from '@/lib/inbox/normalize';
import { resolveInboundChannel } from '@/lib/inbox/channels';
import { processInboundMessage, processStatusUpdate } from '@/lib/inbox/ingest';

// ── Birleşik Meta webhook dispatcher ─────────────────────────────────────────
// Tek callback URL ile tüm Meta webhook object'lerini karşılar:
//   • page  + changes[].field==='leadgen'  → Lead Ads (mevcut akış)
//   • page  + messaging[]                   → Messenger DM
//   • instagram + messaging[]               → Instagram DM
//   • whatsapp_business_account + changes[] → WhatsApp mesaj/status
// /api/webhooks/meta-leads bu işleyiciye delege eder (eski URL korunur).
const DEPLOY_MARKER = 'WEBHOOK_UNIFIED_v1_20260612';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const verifyToken = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  const configuredToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'dijigrow_meta_2026';

  if (mode === 'subscribe' && verifyToken && challenge && verifyToken === configuredToken) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

type WebhookBody = {
  object?: string;
  entry?: Array<Record<string, unknown>>;
};

export async function POST(request: NextRequest) {
  const reqId = randomUUID().slice(0, 8);
  const t0 = Date.now();

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-hub-signature-256');
  const sigValid = verifyMetaSignature(rawBody, signatureHeader);

  // Geçersiz imzada bile mevcut leadgen akışıyla parite için işlemeye devam eder,
  // ama uyarı loglanır. (İmza zorunluluğuna geçiş ayrı bir sertleştirme adımı.)
  if (!sigValid) {
    console.warn(`[meta_webhook][${reqId}] Signature verification failed — processing anyway`);
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log(`[meta_webhook][${DEPLOY_MARKER}][${reqId}] object=${body.object} entries=${body.entry?.length ?? 0}`);

  const jobs: Promise<unknown>[] = [];

  // 1) Lead Ads (leadgen) — yalnız page object'inde changes[] altında
  if (body.object === 'page' && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      const changes = (entry as MetaWebhookEntry).changes;
      if (!Array.isArray(changes)) continue;
      for (const change of changes) {
        if (change.field === 'leadgen') {
          jobs.push(processLeadgenChange(entry as MetaWebhookEntry, change, reqId));
        }
      }
    }
  }

  // 2) Messaging (WhatsApp / Instagram DM / Messenger DM)
  try {
    const { inbound, statuses } = normalizeWebhook(body);

    for (const msg of inbound) {
      jobs.push(
        (async () => {
          const resolved = await resolveInboundChannel(msg.channel, msg.channelAccountId);
          if (!resolved) {
            const err = `No connected ${msg.channel} channel for account_id=${msg.channelAccountId}`;
            console.error(`[meta_webhook][${reqId}] ${err}`);
            await logWebhookFailure(`meta_${msg.channel}`, 'inbound_message', msg.externalMessageId, msg.raw, err);
            return;
          }
          try {
            const result = await processInboundMessage(resolved.organizationId, msg);
            console.log(`[meta_webhook][${reqId}] inbound ${msg.channel} conv=${result.conversationId} dup=${result.isDuplicate} newLead=${result.isNewLead}`);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'inbound processing failed';
            console.error(`[meta_webhook][${reqId}] inbound ${msg.channel} FAILED: ${message}`);
            await logWebhookFailure(`meta_${msg.channel}`, 'inbound_message', msg.externalMessageId, msg.raw, message);
          }
        })(),
      );
    }

    for (const st of statuses) {
      jobs.push(processStatusUpdate(st).catch((e) => console.error(`[meta_webhook][${reqId}] status update failed`, e)));
    }
  } catch (error) {
    console.error(`[meta_webhook][${reqId}] normalize/messaging failed`, error);
  }

  await Promise.allSettled(jobs);
  console.log(`[meta_webhook][${reqId}] DONE in ${Date.now() - t0}ms (jobs=${jobs.length})`);
  return NextResponse.json({ received: true }, { status: 200 });
}
