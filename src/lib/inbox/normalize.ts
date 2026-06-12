import type { InboxChannel, MessageStatus, MessageType } from '@/lib/types';

// Webhook payload'larından çıkarılan ortak (kanal-agnostik) gelen mesaj şekli.
export interface NormalizedInbound {
  channel: Exclude<InboxChannel, 'lead_form'>;
  channelAccountId: string;        // phone_number_id | page_id | ig_business_account_id
  externalConversationId: string;  // karşı taraf: wa_id | psid | igsid
  externalMessageId: string | null;
  recipientId: string | null;
  contactName: string | null;      // profil adı — yalnız görüntü, dedupe'ta kullanılmaz
  phone: string | null;            // yalnız whatsapp
  messageType: MessageType;
  text: string | null;
  content: Record<string, unknown>;
  timestamp: string | null;        // ISO
  ctwa: {
    clid: string | null;
    sourceId: string | null;
    sourceUrl: string | null;
    headline: string | null;
  } | null;
  raw: unknown;
}

export interface NormalizedStatus {
  externalMessageId: string;
  status: MessageStatus;
  timestamp: string | null;
}

export interface NormalizedEntryResult {
  inbound: NormalizedInbound[];
  statuses: NormalizedStatus[];
}

function metaTsToIso(ts: unknown): string | null {
  if (ts == null) return null;
  const num = typeof ts === 'number' ? ts : parseInt(String(ts), 10);
  if (!Number.isFinite(num)) return null;
  // Meta timestamp'leri saniye cinsinden
  return new Date(num * 1000).toISOString();
}

function mapStatus(s: unknown): MessageStatus {
  switch (String(s)) {
    case 'sent': return 'sent';
    case 'delivered': return 'delivered';
    case 'read': return 'read';
    case 'failed': return 'failed';
    default: return 'sent';
  }
}

// ── WhatsApp (object: whatsapp_business_account) ─────────────────────────────
type WaContact = { wa_id?: string; profile?: { name?: string } };
type WaReferral = { source_url?: string; source_id?: string; source_type?: string; headline?: string; body?: string; ctwa_clid?: string };
type WaMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { caption?: string; id?: string; mime_type?: string };
  video?: { caption?: string; id?: string };
  audio?: { id?: string };
  document?: { caption?: string; filename?: string; id?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  location?: { latitude?: number; longitude?: number; name?: string };
  referral?: WaReferral;
};
type WaStatus = { id?: string; status?: string; timestamp?: string; recipient_id?: string };
type WaChangeValue = {
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  contacts?: WaContact[];
  messages?: WaMessage[];
  statuses?: WaStatus[];
};

function waText(msg: WaMessage): { type: MessageType; text: string | null; content: Record<string, unknown> } {
  const type = (msg.type || 'text') as string;
  switch (type) {
    case 'text':
      return { type: 'text', text: msg.text?.body ?? null, content: {} };
    case 'image':
      return { type: 'image', text: msg.image?.caption ?? null, content: { media_id: msg.image?.id ?? null } };
    case 'video':
      return { type: 'video', text: msg.video?.caption ?? null, content: { media_id: msg.video?.id ?? null } };
    case 'audio':
      return { type: 'audio', text: null, content: { media_id: msg.audio?.id ?? null } };
    case 'document':
      return { type: 'document', text: msg.document?.caption ?? msg.document?.filename ?? null, content: { media_id: msg.document?.id ?? null, filename: msg.document?.filename ?? null } };
    case 'button':
      return { type: 'interactive', text: msg.button?.text ?? null, content: {} };
    case 'interactive':
      return { type: 'interactive', text: msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? null, content: {} };
    case 'location':
      return { type: 'location', text: msg.location?.name ?? null, content: { latitude: msg.location?.latitude, longitude: msg.location?.longitude } };
    default:
      return { type: 'text', text: null, content: { unsupported_type: type } };
  }
}

function normalizeWhatsAppEntry(entry: { changes?: Array<{ field?: string; value?: WaChangeValue }> }): NormalizedEntryResult {
  const inbound: NormalizedInbound[] = [];
  const statuses: NormalizedStatus[] = [];

  for (const change of entry.changes || []) {
    if (change.field !== 'messages') continue;
    const value = change.value || {};
    const phoneNumberId = value.metadata?.phone_number_id || '';
    const contactsByWaId = new Map<string, WaContact>();
    for (const c of value.contacts || []) if (c.wa_id) contactsByWaId.set(c.wa_id, c);

    for (const msg of value.messages || []) {
      const waId = msg.from || '';
      if (!waId) continue;
      const parsed = waText(msg);
      const contact = contactsByWaId.get(waId);
      const ref = msg.referral;
      inbound.push({
        channel: 'whatsapp',
        channelAccountId: phoneNumberId,
        externalConversationId: waId,
        externalMessageId: msg.id ?? null,
        recipientId: phoneNumberId,
        contactName: contact?.profile?.name ?? null,
        phone: waId.startsWith('+') ? waId : `+${waId}`,
        messageType: parsed.type,
        text: parsed.text,
        content: parsed.content,
        timestamp: metaTsToIso(msg.timestamp),
        ctwa: ref
          ? {
              clid: ref.ctwa_clid ?? null,
              sourceId: ref.source_id ?? null,
              sourceUrl: ref.source_url ?? null,
              headline: ref.headline ?? null,
            }
          : null,
        raw: msg,
      });
    }

    for (const st of value.statuses || []) {
      if (!st.id) continue;
      statuses.push({ externalMessageId: st.id, status: mapStatus(st.status), timestamp: metaTsToIso(st.timestamp) });
    }
  }

  return { inbound, statuses };
}

// ── Messenger & Instagram (entry.messaging[] ortak şekil) ────────────────────
type MsgEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type?: string; payload?: { url?: string } }>;
  };
  postback?: { title?: string; payload?: string };
  referral?: { ref?: string; source?: string; type?: string; ad_id?: string };
  read?: { mid?: string; watermark?: number };
  delivery?: { mids?: string[]; watermark?: number };
};

function normalizeMessagingEntry(
  channel: 'messenger' | 'instagram',
  entry: { id?: string; messaging?: MsgEvent[] },
): NormalizedEntryResult {
  const inbound: NormalizedInbound[] = [];
  const statuses: NormalizedStatus[] = [];
  const accountId = entry.id || '';

  for (const ev of entry.messaging || []) {
    // Echo (bizim gönderdiğimiz) mesajları atla — outbound zaten kaydediliyor
    if (ev.message?.is_echo) continue;

    // read/delivery status event'leri
    if (ev.read || ev.delivery) {
      const mid = ev.read?.mid || (ev.delivery?.mids || [])[0];
      if (mid) statuses.push({ externalMessageId: mid, status: ev.read ? 'read' : 'delivered', timestamp: ev.timestamp ? new Date(ev.timestamp).toISOString() : null });
      continue;
    }

    const senderId = ev.sender?.id || '';
    if (!senderId) continue;

    let type: MessageType = 'text';
    let text: string | null = null;
    const content: Record<string, unknown> = {};

    if (ev.message) {
      text = ev.message.text ?? null;
      const att = ev.message.attachments?.[0];
      if (att) {
        const t = String(att.type || '');
        type = (['image', 'video', 'audio'].includes(t) ? t : t === 'file' ? 'document' : 'text') as MessageType;
        content.attachment_url = att.payload?.url ?? null;
        content.attachment_type = att.type ?? null;
      }
    } else if (ev.postback) {
      type = 'interactive';
      text = ev.postback.title ?? ev.postback.payload ?? null;
    } else {
      continue;
    }

    const ref = ev.referral || (ev.postback ? undefined : undefined);
    inbound.push({
      channel,
      channelAccountId: accountId,
      externalConversationId: senderId,
      externalMessageId: ev.message?.mid ?? null,
      recipientId: ev.recipient?.id ?? accountId,
      contactName: null,
      phone: null,
      messageType: type,
      text,
      content,
      timestamp: ev.timestamp ? new Date(ev.timestamp).toISOString() : null,
      ctwa: ref?.ad_id
        ? { clid: null, sourceId: ref.ad_id ?? null, sourceUrl: null, headline: ref.ref ?? null }
        : null,
      raw: ev,
    });
  }

  return { inbound, statuses };
}

/**
 * Üst seviye normalizer: webhook gövdesindeki object türüne göre uygun parser'a yönlendirir.
 * Not: leadgen ('page' + changes[].field === 'leadgen') burada İŞLENMEZ — mevcut Lead Ads
 * akışı (processLeadgenChange) ayrı çalışır.
 */
export function normalizeWebhook(body: {
  object?: string;
  entry?: Array<Record<string, unknown>>;
}): NormalizedEntryResult {
  const all: NormalizedEntryResult = { inbound: [], statuses: [] };
  const object = body.object;
  const entries = Array.isArray(body.entry) ? body.entry : [];

  for (const entry of entries) {
    let result: NormalizedEntryResult | null = null;
    if (object === 'whatsapp_business_account') {
      result = normalizeWhatsAppEntry(entry as { changes?: Array<{ field?: string; value?: WaChangeValue }> });
    } else if (object === 'instagram') {
      result = normalizeMessagingEntry('instagram', entry as { id?: string; messaging?: MsgEvent[] });
    } else if (object === 'page') {
      // Page object: Messenger DM'leri entry.messaging[] altında gelir (leadgen ayrı işlenir)
      if (Array.isArray((entry as { messaging?: unknown[] }).messaging)) {
        result = normalizeMessagingEntry('messenger', entry as { id?: string; messaging?: MsgEvent[] });
      }
    }
    if (result) {
      all.inbound.push(...result.inbound);
      all.statuses.push(...result.statuses);
    }
  }

  return all;
}
