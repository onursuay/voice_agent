import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { leadToVars, renderTemplate, type RenderableTemplate } from '@/lib/email/templates';
import { syncLeadStageToMeta, type SyncLead, type SyncStage } from '@/lib/crm/metaAudienceSync';

// Speed-to-lead eşikleri (saat) — env ile ayarlanabilir.
const SLA_FIRST_HOURS = Number(process.env.SLA_FIRST_HOURS) || 4;
const SLA_RETRY_HOURS = Number(process.env.SLA_RETRY_HOURS) || 4;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type SlaLead = {
  id: string;
  organization_id: string;
  assigned_to: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  assigned_at: string | null;
  routing_last_emailed_at: string | null;
  first_seen_at: string | null;
  created_at: string | null;
  last_contact_at: string | null;
  contact_outcome: string | null;
  sla_alert_retry_at: string | null;
  stage: { is_won: boolean | null; is_lost: boolean | null } | null;
};

async function profileEmail(
  sb: ReturnType<typeof createAdminSupabaseClient>,
  userId: string | null
): Promise<string | null> {
  if (!userId) return null;
  const { data } = await sb.from('profiles').select('email').eq('id', userId).single();
  return data?.email ?? null;
}

async function ownerEmail(
  sb: ReturnType<typeof createAdminSupabaseClient>,
  orgId: string,
  cache: Map<string, string | null>
): Promise<string | null> {
  if (cache.has(orgId)) return cache.get(orgId) ?? null;
  const { data: ow } = await sb
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  const email = ow?.user_id ? await profileEmail(sb, ow.user_id) : null;
  cache.set(orgId, email);
  return email;
}

// Hatırlatma şablonu — atanan temsilciye, lead hâlâ ilk aşamada beklerken.
const REMINDER_TEMPLATE: RenderableTemplate = {
  subject: 'Hatırlatma: {{full_name}} ({{city}}) hâlâ ilk aşamada',
  body:
    '<h2>Lead hatırlatması</h2>' +
    '<p><b>{{full_name}}</b> adlı lead {{days}} gündür ilk aşamada bekliyor ve aşaması değişmedi.</p>' +
    '<p><b>Telefon:</b> {{phone}} · <b>E-posta:</b> {{email}} · <b>Şehir:</b> {{city}}</p>' +
    '<p>Lütfen takip edin.</p>',
};

type LeadRow = {
  id: string;
  organization_id: string;
  assigned_to: string | null;
  routing_last_emailed_at: string | null;
  routing_reminder_at: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  company: string | null;
  source_platform: string | null;
  campaign_name: string | null;
};

export interface ReminderRunResult {
  rules: number;
  processed: number;
  sent: number;
  failed: number;
}

/**
 * Aktif `inactivity` + `send_email` otomasyon kurallarını işler:
 * yönlendirilmiş (routing_status='sent'), atanmış, hâlâ GİRİŞ aşamasında bekleyen
 * ve N gündür hatırlatılmamış leadler için atanan temsilciye hatırlatma maili yollar.
 * Aşama değiştiği anda lead giriş aşamasından çıkar → hatırlatma durur.
 * Best-effort; cron tarafından günde bir çağrılır.
 */
export async function runInactivityReminders(): Promise<ReminderRunResult> {
  const supabase = createAdminSupabaseClient();
  const out: ReminderRunResult = { rules: 0, processed: 0, sent: 0, failed: 0 };

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', 'inactivity')
    .eq('action_type', 'send_email');

  const notifCache = new Map<string, Awaited<ReturnType<typeof getNotificationSettings>>>();

  for (const rule of rules || []) {
    out.rules++;
    const days = Number((rule.trigger_config as { days?: number } | null)?.days) || 3;
    const orgId = rule.organization_id as string;

    // Owner ayarı: hareketsizlik hatırlatmaları kapalıysa bu org'u atla
    const notif = await getNotificationSettings(orgId, notifCache);
    if (!notif.inactivity_reminders) continue;

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Org'un giriş (entry) aşaması — position en küçük olan
    const { data: entryStage } = await supabase
      .from('crm_stages')
      .select('id')
      .eq('organization_id', orgId)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!entryStage?.id) continue;

    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .eq('routing_status', 'sent')
      .eq('stage_id', entryStage.id)
      .not('assigned_to', 'is', null);

    const leads = (leadsData || []) as LeadRow[];

    for (const lead of leads) {
      // Dedup: en son hatırlatma (yoksa ilk mail) zamanından bu yana N gün geçmeli
      const ref = lead.routing_reminder_at || lead.routing_last_emailed_at;
      if (ref && ref > cutoff) continue;
      out.processed++;

      // Atanan, org'a AKTİF üye olmalı (cross-tenant / geçersiz atanan koruması)
      const { data: member } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('user_id', lead.assigned_to)
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .maybeSingle();
      if (!member) continue;

      const { data: prof } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', lead.assigned_to)
        .single();
      if (!prof?.email) { out.failed++; continue; }

      const vars = { ...leadToVars(lead), days: String(days) };
      const { subject, html } = renderTemplate(REMINDER_TEMPLATE, vars);

      let status: 'sent' | 'failed' = 'failed';
      let providerMessageId: string | null = null;
      let errorMessage: string | null = null;
      try {
        const res = await sendEmail({ to: prof.email, subject, html });
        providerMessageId = res.id;
        status = 'sent';
        out.sent++;
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : 'send failed';
        out.failed++;
      }

      await supabase.from('email_log').insert({
        organization_id: orgId,
        lead_id: lead.id,
        rule_id: rule.id,
        recipient_user_id: lead.assigned_to,
        to_email: prof.email,
        subject,
        body: html,
        status,
        provider: 'resend',
        provider_message_id: providerMessageId,
        error_message: errorMessage,
        trigger: 'reminder',
      });

      if (status === 'sent') {
        await supabase
          .from('leads')
          .update({ routing_reminder_at: new Date().toISOString() })
          .eq('id', lead.id);
      }
    }
  }

  return out;
}

/**
 * Speed-to-lead + retry SLA kontrolü (saatlik cron):
 * - İlk-arama SLA: lead atandı ama SLA_FIRST_HOURS içinde hiç aranmadı → rep + owner'a uyarı.
 * - Retry SLA: ulaşılamadı (no_answer/busy) ama SLA_RETRY_HOURS içinde tekrar aranmadı → uyarı.
 * Kapalı aşamalar (won/lost) hariç. Dedup `sla_alert_*` kolonlarıyla.
 */
export async function runSlaChecks(): Promise<{ firstAlerts: number; retryAlerts: number }> {
  const supabase = createAdminSupabaseClient();
  const out = { firstAlerts: 0, retryAlerts: 0 };
  const ownerCache = new Map<string, string | null>();
  const notifCache = new Map<string, Awaited<ReturnType<typeof getNotificationSettings>>>();
  const slaEnabled = async (orgId: string) => (await getNotificationSettings(orgId, notifCache)).sla_alerts;
  const now = Date.now();
  const firstMs = SLA_FIRST_HOURS * 3600 * 1000;
  const retryMs = SLA_RETRY_HOURS * 3600 * 1000;

  // --- İlk-arama SLA ihlali ---
  const { data: firstCand } = await supabase
    .from('leads')
    .select('*, stage:crm_stages(is_won,is_lost)')
    .not('assigned_to', 'is', null)
    .eq('contact_attempts', 0)
    .is('first_contact_at', null)
    .is('sla_alert_first_at', null);

  for (const lead of ((firstCand || []) as unknown as SlaLead[])) {
    if (lead.stage && (lead.stage.is_won || lead.stage.is_lost)) continue;
    if (!(await slaEnabled(lead.organization_id))) continue; // owner ayarı
    const ref = lead.assigned_at || lead.routing_last_emailed_at || lead.first_seen_at || lead.created_at;
    if (!ref || now - new Date(ref).getTime() < firstMs) continue;

    const repE = await profileEmail(supabase, lead.assigned_to);
    const ownE = await ownerEmail(supabase, lead.organization_id, ownerCache);
    const subject = `SLA: ${lead.full_name || 'Lead'} ${SLA_FIRST_HOURS} saattir aranmadı`;
    const html = `<h2>İlk arama SLA ihlali</h2><p><b>${escapeHtml(lead.full_name || '-')}</b> atandı ama ${SLA_FIRST_HOURS} saat içinde aranmadı.</p><p>Telefon: ${escapeHtml(lead.phone || '-')} · Şehir: ${escapeHtml(lead.city || '-')}</p>`;
    for (const addr of [...new Set([repE, ownE].filter((x): x is string => !!x))]) {
      try { await sendEmail({ to: addr, subject, html }); } catch { /* best effort */ }
    }
    await supabase.from('leads').update({ sla_alert_first_at: new Date().toISOString() }).eq('id', lead.id);
    out.firstAlerts++;
  }

  // --- Retry SLA ihlali (ulaşılamadı, tekrar aranmadı) ---
  const { data: retryCand } = await supabase
    .from('leads')
    .select('*, stage:crm_stages(is_won,is_lost)')
    .not('assigned_to', 'is', null)
    .in('contact_outcome', ['no_answer', 'busy']);

  for (const lead of ((retryCand || []) as unknown as SlaLead[])) {
    if (lead.stage && (lead.stage.is_won || lead.stage.is_lost)) continue;
    if (!lead.last_contact_at || now - new Date(lead.last_contact_at).getTime() < retryMs) continue;
    // Her yeni başarısız denemeden sonra tekrar uyar: alert son aramadan eski olmalı
    if (lead.sla_alert_retry_at && new Date(lead.sla_alert_retry_at).getTime() >= new Date(lead.last_contact_at).getTime()) continue;

    const repE = await profileEmail(supabase, lead.assigned_to);
    const ownE = await ownerEmail(supabase, lead.organization_id, ownerCache);
    const subject = `SLA: ${lead.full_name || 'Lead'} ulaşılamadı, tekrar aranmadı`;
    const html = `<h2>Retry SLA ihlali</h2><p><b>${escapeHtml(lead.full_name || '-')}</b> "${escapeHtml(lead.contact_outcome || '-')}" sonucuyla ${SLA_RETRY_HOURS}+ saattir tekrar aranmadı.</p><p>Telefon: ${escapeHtml(lead.phone || '-')}</p>`;
    for (const addr of [...new Set([repE, ownE].filter((x): x is string => !!x))]) {
      try { await sendEmail({ to: addr, subject, html }); } catch { /* best effort */ }
    }
    await supabase.from('leads').update({ sla_alert_retry_at: new Date().toISOString() }).eq('id', lead.id);
    out.retryAlerts++;
  }

  return out;
}

/**
 * Negatif aşama (niteliksiz/kaybedildi) → Meta'dan silme GÜVENCESİ (paralel, saatlik).
 * Aşama değişiminde syncLeadStageToMeta zaten çıkarır; bu, Meta hatası nedeniyle
 * çıkarılamamış (meta_sync_error dolu) negatif-aşama Meta leadlerini tekrar dener.
 * Meta bağlı değilse her lead için ucuz erken-çıkış (Meta çağrısı yapılmaz).
 */
export async function reconcileNegativeStageMeta(): Promise<{ checked: number; reconciled: number; failed: number }> {
  const supabase = createAdminSupabaseClient();
  const out = { checked: 0, reconciled: 0, failed: 0 };

  const { data: leads } = await supabase
    .from('leads')
    .select('id, email, phone, full_name, meta_ad_id, meta_capi_sent, organization_id, stage:crm_stages(id,name,position,is_won,is_lost)')
    .not('meta_ad_id', 'is', null)
    .not('meta_sync_error', 'is', null)
    .limit(50);

  if (!leads || leads.length === 0) return out;

  const stagesCache = new Map<string, SyncStage[]>();
  const getStages = async (orgId: string): Promise<SyncStage[]> => {
    const cached = stagesCache.get(orgId);
    if (cached) return cached;
    const { data } = await supabase.from('crm_stages').select('id,name,position,is_won,is_lost').eq('organization_id', orgId);
    const list = (data || []) as unknown as SyncStage[];
    stagesCache.set(orgId, list);
    return list;
  };

  type StageObj = { id: string; name: string; position: number; is_won: boolean; is_lost: boolean };
  type Row = {
    id: string; email: string | null; phone: string | null; full_name: string | null;
    meta_ad_id: string | null; meta_capi_sent: boolean | null; organization_id: string;
    stage: StageObj | StageObj[] | null;
  };

  for (const row of (leads as unknown as Row[])) {
    const st = Array.isArray(row.stage) ? row.stage[0] : row.stage;
    if (!st) continue;
    const isNegative = st.is_lost || /niteliksiz|unqualified|disqualif|spam|geçersiz|hatal[ıi]/i.test(st.name);
    if (!isNegative) continue;
    out.checked++;
    const allStages = await getStages(row.organization_id);
    const lead: SyncLead = {
      id: row.id, email: row.email, phone: row.phone, full_name: row.full_name,
      meta_ad_id: row.meta_ad_id, meta_capi_sent: row.meta_capi_sent,
    };
    try {
      const res = await syncLeadStageToMeta({ organizationId: row.organization_id, lead, stage: st as SyncStage, allStages });
      if (res.ok) out.reconciled++; else out.failed++;
    } catch {
      out.failed++;
    }
  }

  return out;
}
