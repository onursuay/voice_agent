import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Meta webhook imza doğrulaması (X-Hub-Signature-256, HMAC-SHA256 + META_APP_SECRET).
 * Tüm Meta webhook'ları (leadgen + messaging) için tek doğrulama noktası.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[meta_webhook] META_APP_SECRET env is not set — cannot verify webhook signature');
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
