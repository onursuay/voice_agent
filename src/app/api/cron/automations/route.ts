import { NextResponse } from 'next/server';
import { runInactivityReminders, runSlaChecks } from '@/lib/crm/automationRunner';

// Vercel Cron tarafından günde bir çağrılır (vercel.json'daki schedule).
// CRON_SECRET set ise Vercel "Authorization: Bearer <CRON_SECRET>" başlığı gönderir.
export async function GET(request: Request) {
  // Fail-CLOSED: CRON_SECRET set değilse endpoint'i açık bırakma.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/automations] CRON_SECRET not configured — refusing to run');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reminders = await runInactivityReminders();
    const sla = await runSlaChecks();
    return NextResponse.json({ ok: true, reminders, sla });
  } catch (e) {
    console.error('[cron/automations] failed', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'cron error' },
      { status: 500 }
    );
  }
}
