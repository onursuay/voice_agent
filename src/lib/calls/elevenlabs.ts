import 'server-only';

// ElevenLabs Conversational AI — outbound çağrı + sonuç çekme.
// Ada Trust için çalışan apps_script.js otomasyonuyla AYNI endpoint ve karar mantığı:
//   initiate: POST /v1/convai/sip-trunk/outbound-call → { conversation_id }
//   result:   GET  /v1/convai/conversations/{id} → status==='done' && transcript>2 ⇒ görüşüldü

const BASE = 'https://api.elevenlabs.io/v1/convai';

function apiKey(): string | null {
  return process.env.ELEVENLABS_API_KEY || null;
}

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID && process.env.ELEVENLABS_PHONE_NUMBER_ID);
}

// apps_script.formatPhoneNumber ile aynı TR kuralları
export function formatPhoneForCall(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const p = String(phone).replace(/[\s\-()+ ]/g, '');
  if (p.startsWith('90') && p.length === 12) return `+${p}`;
  if (p.startsWith('0') && p.length === 11) return `+9${p}`;
  if (p.startsWith('5') && p.length === 10) return `+90${p}`;
  if (p.startsWith('905') && p.length === 12) return `+${p}`;
  // Uluslararası: + ile geldiyse koru
  if (String(phone).trim().startsWith('+') && p.length >= 10) return `+${p}`;
  return null;
}

export interface InitiateResult {
  ok: boolean;
  conversationId?: string;
  error?: string;
}

export async function initiateOutboundCall(opts: {
  toNumber: string;             // +90... formatlı
  customerName?: string | null;
  projectName?: string | null;  // dynamic_variables.project_name (agent senaryosu kullanıyor)
}): Promise<InitiateResult> {
  const key = apiKey();
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  if (!key || !agentId || !phoneNumberId) return { ok: false, error: 'elevenlabs_not_configured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}/sip-trunk/outbound-call`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        to_number: opts.toNumber,
        conversation_initiation_client_data: {
          dynamic_variables: {
            customer_name: opts.customerName || 'Değerli Müşterimiz',
            project_name: opts.projectName || '',
          },
        },
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => ({}))) as { conversation_id?: string; detail?: unknown };
    if (res.ok && body.conversation_id) {
      return { ok: true, conversationId: body.conversation_id };
    }
    return { ok: false, error: `initiate failed (${res.status}): ${JSON.stringify(body.detail ?? body).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'initiate error' };
  } finally {
    clearTimeout(timer);
  }
}

export interface ConversationResult {
  done: boolean;                 // ElevenLabs işlemeyi bitirdi mi
  reached: boolean;              // görüşme gerçekleşti mi (done && transcript>2)
  transcriptText: string | null;
  summary: string | null;
  durationSecs: number | null;
  raw?: unknown;
}

type TranscriptTurn = { role?: string; message?: string | null };

export async function fetchConversationResult(conversationId: string): Promise<ConversationResult | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}/conversations/${encodeURIComponent(conversationId)}`, {
      headers: { 'xi-api-key': key },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      transcript?: TranscriptTurn[];
      analysis?: { transcript_summary?: string; call_successful?: string };
      metadata?: { call_duration_secs?: number };
    };

    const status = data.status || '';
    // ElevenLabs işleme durumları: initiated/in-progress/processing → henüz bitmedi
    const done = status === 'done' || status === 'failed';
    const transcript = data.transcript || [];
    const reached = status === 'done' && transcript.length > 2;

    const transcriptText = transcript.length
      ? transcript.map((t) => `${t.role === 'agent' ? 'AI' : 'Müşteri'}: ${t.message ?? ''}`).join('\n')
      : null;

    return {
      done,
      reached,
      transcriptText,
      summary: data.analysis?.transcript_summary ?? null,
      durationSecs: data.metadata?.call_duration_secs ?? null,
      raw: data,
    };
  } catch {
    return null;
  }
}
