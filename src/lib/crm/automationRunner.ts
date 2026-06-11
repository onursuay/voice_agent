import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { leadToVars, renderTemplate, type RenderableTemplate } from '@/lib/email/templates';

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

  for (const rule of rules || []) {
    out.rules++;
    const days = Number((rule.trigger_config as { days?: number } | null)?.days) || 3;
    const orgId = rule.organization_id as string;
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
