import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';

const OUTCOME_TR: Record<string, string> = {
  reached: 'Ulaştı', no_answer: 'Ulaşamadı', busy: 'Meşgul', wrong_number: 'Yanlış no',
};
const STATUS_TR: Record<string, string> = {
  sent: 'İletildi', failed: 'İletilemedi', no_match: 'Eşleşme yok', skipped: 'Atlandı',
};

type Nested = { full_name?: string; email?: string; name?: string; is_won?: boolean; is_lost?: boolean } | null;

// Vercel Cron (günde 1, akşam) — owner'a gün sonu Excel raporu maili.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();
  const dateStr = startIso.slice(0, 10);

  // Tek-şirket: DEFAULT_ORG_ID set ise yalnız o org'a; değilse owner'ı olan tüm org'lar.
  const defaultOrg = process.env.DEFAULT_ORG_ID?.trim();
  let ownersQuery = supabase
    .from('organization_members')
    .select('organization_id, user_id, profile:profiles(email, full_name)')
    .eq('role', 'owner')
    .eq('is_active', true);
  if (defaultOrg) ownersQuery = ownersQuery.eq('organization_id', defaultOrg);
  const { data: owners } = await ownersQuery;

  let reportsSent = 0;
  const notifCache = new Map<string, Awaited<ReturnType<typeof import('@/lib/crm/notificationSettings').getNotificationSettings>>>();
  const { getNotificationSettings } = await import('@/lib/crm/notificationSettings');
  for (const ow of (owners || [])) {
    const orgId = ow.organization_id as string;
    const ownerEmail = (ow.profile as Nested)?.email;
    if (!ownerEmail) continue;

    // Owner ayarı: günlük rapor kapalıysa atla
    const notif = await getNotificationSettings(orgId, notifCache);
    if (!notif.daily_report) continue;

    const { data: todays } = await supabase
      .from('leads')
      .select('full_name, phone, email, city, routing_status, contact_attempts, contact_outcome, stage:crm_stages(name), assigned_user:profiles!leads_assigned_to_fkey(full_name)')
      .eq('organization_id', orgId)
      .gte('created_at', startIso)
      .order('created_at', { ascending: true });

    const { data: openLeads } = await supabase
      .from('leads')
      .select('assigned_to, contact_attempts, contact_outcome, sla_alert_first_at, assigned_user:profiles!leads_assigned_to_fkey(full_name), stage:crm_stages(is_won,is_lost)')
      .eq('organization_id', orgId)
      .not('assigned_to', 'is', null);

    const leadRows = (todays || []).map((l) => ({
      'Ad Soyad': l.full_name || '-',
      'Telefon': l.phone || '-',
      'E-posta': l.email || '-',
      'Şehir': l.city || '-',
      'Atanan': (l.assigned_user as Nested)?.full_name || '-',
      'Aşama': (l.stage as Nested)?.name || '-',
      'İletildi': STATUS_TR[l.routing_status as string] || '-',
      'Arama denemesi': l.contact_attempts || 0,
      'Sonuç': OUTCOME_TR[l.contact_outcome as string] || '-',
    }));

    const repMap = new Map<string, { name: string; atanan: number; arandi: number; ulasildi: number; bekleyen: number; sla: number }>();
    for (const l of (openLeads || [])) {
      const st = l.stage as Nested;
      if (st && (st.is_won || st.is_lost)) continue;
      const id = l.assigned_to as string;
      const name = (l.assigned_user as Nested)?.full_name || id;
      if (!repMap.has(id)) repMap.set(id, { name, atanan: 0, arandi: 0, ulasildi: 0, bekleyen: 0, sla: 0 });
      const r = repMap.get(id)!;
      r.atanan++;
      if ((l.contact_attempts || 0) > 0) r.arandi++; else r.bekleyen++;
      if (l.contact_outcome === 'reached') r.ulasildi++;
      if (l.sla_alert_first_at) r.sla++;
    }
    const repRows = [...repMap.values()].map((r) => ({
      'Temsilci': r.name,
      'Atanan': r.atanan,
      'Arandı': r.arandi,
      'Ulaşıldı': r.ulasildi,
      'Bekleyen (aranmadı)': r.bekleyen,
      'SLA ihlali': r.sla,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leadRows.length ? leadRows : [{ Bilgi: 'Bugün lead yok' }]), 'Bugünkü Leadler');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(repRows.length ? repRows : [{ Bilgi: 'Atanmış lead yok' }]), 'Temsilci Özeti');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    try {
      await sendEmail({
        to: ownerEmail,
        subject: `Gün sonu raporu — ${dateStr}`,
        html: `<h2>Gün sonu raporu (${dateStr})</h2><p>Bugün düşen lead: <b>${leadRows.length}</b>. Temsilci performansı ve detaylar ekteki Excel dosyasında.</p>`,
        attachments: [{ filename: `gun-sonu-${dateStr}.xlsx`, content: buf }],
      });
      reportsSent++;
    } catch (e) {
      console.error('[daily-report] mail failed', orgId, e);
    }
  }

  return NextResponse.json({ ok: true, reportsSent, date: dateStr });
}
