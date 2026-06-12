import { createHmac } from 'crypto';

/**
 * Meta OAuth is split into three flows:
 *  - 'account':   BM / business + ads-sync scopes only (no page chooser shown by Meta)
 *  - 'pages':     page-level scopes, triggered later from "Sayfa Bağla" on the dashboard
 *  - 'messaging': WhatsApp/IG/Messenger mesajlaşma scope'ları (Omnichannel Inbox bağlama)
 * The mode is signed into the OAuth state so the shared callback knows what to do.
 */
export type MetaOAuthMode = 'account' | 'pages' | 'messaging';

const STATE_TTL_MS = 10 * 60 * 1000;

export function buildMetaState(orgId: string, mode: MetaOAuthMode): string {
  const payload = `${orgId}:${mode}:${Date.now()}`;
  const sig = createHmac('sha256', process.env.META_APP_SECRET || '')
    .update(payload)
    .digest('hex')
    .slice(0, 16);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyMetaState(state: string): { orgId: string; mode: MetaOAuthMode } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;
    const [orgId, mode, timestamp, receivedSig] = parts;

    if (mode !== 'account' && mode !== 'pages') return null;
    if (Date.now() - parseInt(timestamp, 10) > STATE_TTL_MS) return null;

    const payload = `${orgId}:${mode}:${timestamp}`;
    const expectedSig = createHmac('sha256', process.env.META_APP_SECRET || '')
      .update(payload)
      .digest('hex')
      .slice(0, 16);

    if (expectedSig !== receivedSig) return null;
    return { orgId, mode };
  } catch {
    return null;
  }
}
