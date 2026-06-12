import 'server-only';
import type { InboxChannel } from '@/lib/types';
import { resolveChannelForSend } from '@/lib/inbox/channels';

const META_GRAPH_VERSION = 'v23.0';
const BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface SendResult {
  ok: boolean;
  externalMessageId?: string | null;
  error?: string;
}

async function graphPostJson(
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; json: Record<string, unknown>; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* non-json */ }
    return { ok: res.ok, json, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

function extractError(json: Record<string, unknown>, status: number): string {
  const err = json?.error as { message?: string; code?: number } | undefined;
  return err?.message ? `${err.message} (code ${err.code ?? '?'})` : `Graph API error (status ${status})`;
}

/**
 * Bir konuşmaya kanal üzerinden metin mesajı gönder.
 * recipientId: wa_id (whatsapp) | psid (messenger) | igsid (instagram)
 */
export async function sendOutboundText(opts: {
  organizationId: string;
  channel: Exclude<InboxChannel, 'lead_form'>;
  channelAccountId: string | null;
  recipientId: string;
  text: string;
}): Promise<SendResult> {
  const resolved = await resolveChannelForSend(opts.organizationId, opts.channel, opts.channelAccountId);
  if (!resolved) {
    return { ok: false, error: 'channel_not_connected' };
  }
  const { accessToken, config } = resolved;

  if (opts.channel === 'whatsapp') {
    const phoneNumberId = (config.phone_number_id as string) || opts.channelAccountId;
    if (!phoneNumberId) return { ok: false, error: 'missing_phone_number_id' };
    const { ok, json, status } = await graphPostJson(`/${phoneNumberId}/messages`, accessToken, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: opts.recipientId,
      type: 'text',
      text: { preview_url: false, body: opts.text },
    });
    if (!ok) return { ok: false, error: extractError(json, status) };
    const messages = json.messages as Array<{ id?: string }> | undefined;
    return { ok: true, externalMessageId: messages?.[0]?.id ?? null };
  }

  // Messenger & Instagram aynı Send API şeklini kullanır (page token ile)
  const senderNode =
    opts.channel === 'instagram'
      ? (config.ig_business_account_id as string) || opts.channelAccountId
      : (config.page_id as string) || opts.channelAccountId;
  if (!senderNode) return { ok: false, error: 'missing_sender_node' };

  const { ok, json, status } = await graphPostJson(`/${senderNode}/messages`, accessToken, {
    recipient: { id: opts.recipientId },
    messaging_type: 'RESPONSE',
    message: { text: opts.text },
  });
  if (!ok) return { ok: false, error: extractError(json, status) };
  // Messenger & Instagram Send API yanıtı { message_id } döner
  const messageId = (json.message_id as string) || null;
  return { ok: true, externalMessageId: messageId };
}
