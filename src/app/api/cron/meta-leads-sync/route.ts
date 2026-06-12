import { NextResponse } from 'next/server';
import { reconcileMetaLeads } from '@/lib/leads/metaSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // çok sayıda form/lead taranabilir (Vercel Pro: 300s)

// Meta Lead Ads güvenlik-ağı senkronizasyonu — webhook teslimatı bayatlasa veya
// yeni/değişen formlar olsa bile eksik lead'leri periyodik yakalar.
// Vercel Cron çağırır (vercel.json schedule). CRON_SECRET ile korumalı (fail-closed).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/meta-leads-sync] CRON_SECRET not configured — refusing to run');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await reconcileMetaLeads({ lookbackDays: 3 });
    console.log('[cron/meta-leads-sync] done', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/meta-leads-sync] failed', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'cron error' }, { status: 500 });
  }
}
