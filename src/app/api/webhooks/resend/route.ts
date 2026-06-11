import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Resend (Svix) webhook imza doğrulaması.
function verifySvix(secret: string, id: string, ts: string, sigHeader: string, body: string): boolean {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signed = `${id}.${ts}.${body}`;
  const expected = createHmac('sha256', key).update(signed).digest('base64');
  const exp = Buffer.from(expected);
  for (const part of sigHeader.split(' ')) {
    const sig = part.split(',')[1];
    if (!sig) continue;
    const got = Buffer.from(sig);
    if (got.length === exp.length && timingSafeEqual(got, exp)) return true;
  }
  return false;
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const body = await request.text();
  const id = request.headers.get('svix-id');
  const ts = request.headers.get('svix-timestamp');
  const sig = request.headers.get('svix-signature');

  if (!secret || !id || !ts || !sig || !verifySvix(secret, id, ts, sig, body)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let evt: { type?: string; data?: { email_id?: string } };
  try { evt = JSON.parse(body); } catch { return NextResponse.json({ ok: true }); }

  const type = evt.type;
  const emailId = evt.data?.email_id;
  if (!emailId) return NextResponse.json({ ok: true });

  const status =
    type === 'email.delivered' ? 'delivered'
    : type === 'email.bounced' ? 'bounced'
    : type === 'email.complained' ? 'complained'
    : null;
  if (!status) return NextResponse.json({ ok: true });

  const supabase = createAdminSupabaseClient();

  // email_log'u güncelle — yalnız BİZE ait email id eşleşirse (başka projenin maili 0 satır etkiler).
  const { data: logRow } = await supabase
    .from('email_log')
    .update({ status })
    .eq('provider_message_id', emailId)
    .select('lead_id, trigger')
    .maybeSingle();

  // Routing maili geri döndü/şikayet → "İletildi" durumunu düşür (rep almadı → owner görsün).
  if (
    logRow?.lead_id &&
    (status === 'bounced' || status === 'complained') &&
    (logRow.trigger === 'auto' || logRow.trigger === 'manual')
  ) {
    await supabase.from('leads').update({ routing_status: 'failed' }).eq('id', logRow.lead_id);
  }

  return NextResponse.json({ ok: true });
}
