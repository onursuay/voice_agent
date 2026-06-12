import { NextResponse } from 'next/server';
import { processSequences } from '@/lib/crm/sequenceEngine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// AI Orkestra motoru — her 5 dakikada: devam eden aramaların sonuçlarını çeker,
// zamanı gelen senaryo adımlarını (AI arama / funnel mail) çalıştırır.
// CRON_SECRET ile korumalı (fail-closed).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/sequences] CRON_SECRET not configured — refusing to run');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processSequences();
    console.log('[cron/sequences] done', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/sequences] failed', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'cron error' }, { status: 500 });
  }
}
