import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { evaluateConditions, type TriggerConfig } from '@/lib/crm/ruleConditions';
import { sendEmail } from '@/lib/email/send';
import { leadToVars, renderTemplate, type RenderableTemplate } from '@/lib/email/templates';
import {
  elevenLabsConfigured, formatPhoneForCall, initiateOutboundCall, fetchConversationResult,
} from '@/lib/calls/elevenlabs';

// ── AI Orkestra motoru ───────────────────────────────────────────────────────
// Lead düşünce eşleşen senaryoya kaydolur; cron her 5 dk'da:
//   1) devam eden aramaların sonucunu ElevenLabs'tan çeker, lead/call_logs'a işler
//   2) zamanı gelen adımları çalıştırır (ai_call: pencere içinde arar; email: lead'e funnel maili)
// Adım koşulu only_if (always|not_reached|reached) son arama sonucuna göre değerlendirilir.

type Admin = ReturnType<typeof createAdminSupabaseClient>;

const CALL_TZ = 'Europe/Istanbul';
const CALL_RESULT_TIMEOUT_MIN = 20;   // arama başladıktan sonra sonuç gelmezse not_reached say
const MAX_RUNS_PER_TICK = 25;         // tek cron koşusunda işlenecek azami adım

// Lead'e giden varsayılan funnel maili (senaryo adımı şablon seçmediyse).
// Adımın only_if koşuluna göre uygun varsayılan seçilir:
//   not_reached/always → "ulaşamadık" | reached → görüşme sonrası teşekkür
const FUNNEL_DEFAULT_TEMPLATE: RenderableTemplate = {
  subject: 'Merhaba {{full_name}} — talebiniz bize ulaştı',
  body:
    '<p>Merhaba {{full_name}},</p>' +
    '<p>Talebinizi aldık, size telefonla ulaşmaya çalıştık ancak ulaşamadık.</p>' +
    '<p>Uygun olduğunuz bir zamanda bu e-postayı yanıtlayabilir veya bizi arayabilirsiniz.</p>' +
    '<p>Teşekkürler.</p>',
};

const THANKYOU_DEFAULT_TEMPLATE: RenderableTemplate = {
  subject: 'Teşekkürler {{full_name}} — görüşmemiz hakkında',
  body:
    '<p>Merhaba {{full_name}},</p>' +
    '<p>Bugün gerçekleştirdiğimiz telefon görüşmesi için teşekkür ederiz.</p>' +
    '<p>Talebinizle ilgili süreci başlattık; en kısa sürede sizinle tekrar iletişimde olacağız.</p>' +
    '<p>Bu arada sorularınız olursa bu e-postayı yanıtlamanız yeterli.</p>' +
    '<p>İyi günler dileriz.</p>',
};

interface StepRow {
  id: string;
  position: number;
  step_type: 'ai_call' | 'email';
  delay_minutes: number;
  only_if: 'always' | 'not_reached' | 'reached';
  config: { email_template_id?: string | null } | null;
}

interface EnrollmentRow {
  id: string;
  organization_id: string;
  sequence_id: string;
  lead_id: string;
  status: string;
  current_position: number;
  next_run_at: string | null;
  pending_call_id: string | null;
  last_call_outcome: string | null;
}

function istanbulHour(d: Date): number {
  return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: CALL_TZ, hour: '2-digit', hour12: false }).format(d), 10);
}

// Arama penceresi dışındaysa pencerenin bir SONRAKİ açılışına ertele
function deferToWindow(now: Date, startHour: number, endHour: number): Date | null {
  const h = istanbulHour(now);
  if (h >= startHour && h < endHour) return null; // pencere içinde
  const next = new Date(now);
  if (h >= endHour) next.setDate(next.getDate() + 1);
  // Istanbul start saatine hizala (UTC offset'i kabaca hesapla: TR = UTC+3 sabit)
  next.setUTCHours(startHour - 3, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

async function getSteps(admin: Admin, sequenceId: string): Promise<StepRow[]> {
  const { data } = await admin
    .from('sequence_steps')
    .select('id, position, step_type, delay_minutes, only_if, config')
    .eq('sequence_id', sequenceId)
    .order('position', { ascending: true });
  return (data || []) as StepRow[];
}

/** Yeni lead'i eşleşen aktif senaryolara kaydet (ilk eşleşen; priority sıralı). */
export async function enrollLeadInSequences(leadId: string): Promise<{ enrolled: boolean; sequenceId?: string }> {
  const admin = createAdminSupabaseClient();
  try {
    const { data: lead } = await admin.from('leads').select('*').eq('id', leadId).is('deleted_at', null).single();
    if (!lead) return { enrolled: false };

    const { data: seqs } = await admin
      .from('sequences')
      .select('id, trigger_config, priority')
      .eq('organization_id', lead.organization_id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const matched = (seqs || []).find((s) =>
      evaluateConditions((s.trigger_config || {}) as TriggerConfig, lead as Record<string, unknown>),
    );
    if (!matched) return { enrolled: false };

    const steps = await getSteps(admin, matched.id);
    if (!steps.length) return { enrolled: false };

    const first = steps[0];
    const nextRun = new Date(Date.now() + (first.delay_minutes || 0) * 60000).toISOString();

    const { error } = await admin.from('sequence_enrollments').insert({
      organization_id: lead.organization_id,
      sequence_id: matched.id,
      lead_id: leadId,
      status: 'active',
      current_position: first.position,
      next_run_at: nextRun,
    });
    if (error) {
      // unique(sequence,lead) → zaten kayıtlı
      return { enrolled: false };
    }

    await admin.from('lead_activities').insert({
      lead_id: leadId,
      organization_id: lead.organization_id,
      activity_type: 'created',
      title: 'AI orchestra sequence started',
      metadata: { sequence_id: matched.id },
    });
    return { enrolled: true, sequenceId: matched.id };
  } catch (e) {
    console.error('[sequence] enroll failed', e);
    return { enrolled: false };
  }
}

/** Enrollment'ı bir sonraki uygun adıma taşı (only_if'e uymayanları atla). */
async function advance(admin: Admin, enr: EnrollmentRow, steps: StepRow[], fromPosition: number, outcome: string | null) {
  const remaining = steps.filter((s) => s.position > fromPosition);
  const next = remaining.find((s) =>
    s.only_if === 'always' ||
    (s.only_if === 'not_reached' && outcome !== 'reached') ||
    (s.only_if === 'reached' && outcome === 'reached'),
  );
  if (!next) {
    await admin.from('sequence_enrollments').update({
      status: 'completed', next_run_at: null, pending_call_id: null,
      last_call_outcome: outcome ?? enr.last_call_outcome,
    }).eq('id', enr.id);
    return;
  }
  await admin.from('sequence_enrollments').update({
    current_position: next.position,
    next_run_at: new Date(Date.now() + (next.delay_minutes || 0) * 60000).toISOString(),
    pending_call_id: null,
    last_call_outcome: outcome ?? enr.last_call_outcome,
  }).eq('id', enr.id);
}

/** 1. faz: devam eden aramaların sonuçlarını çek ve işle. */
async function resolvePendingCalls(admin: Admin): Promise<number> {
  const { data: calls } = await admin
    .from('call_logs')
    .select('id, lead_id, organization_id, conversation_id, enrollment_id, created_at, metadata')
    .eq('status', 'calling')
    .not('conversation_id', 'is', null)
    .limit(40);

  let resolved = 0;
  for (const call of (calls || [])) {
    const result = await fetchConversationResult(call.conversation_id as string);
    const ageMin = (Date.now() - new Date(call.created_at as string).getTime()) / 60000;

    if (!result || !result.done) {
      if (ageMin < CALL_RESULT_TIMEOUT_MIN) continue; // hâlâ sürüyor olabilir
    }

    const reached = Boolean(result?.reached);
    const outcome = reached ? 'reached' : 'not_reached';

    await admin.from('call_logs').update({
      status: reached ? 'completed' : 'no_answer',
      duration_seconds: result?.durationSecs ?? null,
      transcript: result?.transcriptText ?? null,
      summary: result?.summary ?? null,
      result_classification: outcome,
    }).eq('id', call.id);

    // Lead accountability alanları
    if (call.lead_id) {
      const { data: lead } = await admin
        .from('leads')
        .select('contact_attempts, first_contact_at')
        .eq('id', call.lead_id).single();
      await admin.from('leads').update({
        contact_attempts: (lead?.contact_attempts ?? 0) + 1,
        first_contact_at: lead?.first_contact_at ?? new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
        contact_outcome: reached ? 'reached' : 'no_answer',
        last_activity_at: new Date().toISOString(),
      }).eq('id', call.lead_id);

      await admin.from('lead_activities').insert({
        lead_id: call.lead_id,
        organization_id: call.organization_id,
        activity_type: 'call_made',
        title: reached ? 'AI call completed' : 'AI call — no answer',
        description: result?.summary ?? null,
        metadata: { conversation_id: call.conversation_id, outcome },
      });
    }

    // Senaryoyu ilerlet
    if (call.enrollment_id) {
      const { data: enr } = await admin
        .from('sequence_enrollments').select('*').eq('id', call.enrollment_id).single();
      if (enr && enr.status === 'active') {
        const steps = await getSteps(admin, enr.sequence_id);
        await advance(admin, enr as EnrollmentRow, steps, enr.current_position, outcome);
      }
    }
    resolved++;
  }
  return resolved;
}

/** 2. faz: zamanı gelen adımları çalıştır. */
async function runDueSteps(admin: Admin): Promise<{ calls: number; emails: number; skipped: number }> {
  const nowIso = new Date().toISOString();
  const { data: due } = await admin
    .from('sequence_enrollments')
    .select('*')
    .eq('status', 'active')
    .is('pending_call_id', null)
    .lte('next_run_at', nowIso)
    .order('next_run_at', { ascending: true })
    .limit(MAX_RUNS_PER_TICK);

  let calls = 0, emails = 0, skipped = 0;

  for (const enr of (due || []) as EnrollmentRow[]) {
    // Lead durumu: won/lost aşamasındaysa senaryoyu durdur
    const { data: lead } = await admin
      .from('leads')
      .select('*, stage:crm_stages(is_won, is_lost)')
      .eq('id', enr.lead_id).single();
    if (!lead) { await admin.from('sequence_enrollments').update({ status: 'stopped', next_run_at: null }).eq('id', enr.id); continue; }
    const stage = lead.stage as { is_won?: boolean; is_lost?: boolean } | null;
    if (stage?.is_won || stage?.is_lost) {
      await admin.from('sequence_enrollments').update({ status: 'stopped', next_run_at: null }).eq('id', enr.id);
      continue;
    }

    const steps = await getSteps(admin, enr.sequence_id);
    const step = steps.find((s) => s.position === enr.current_position);
    if (!step) { await admin.from('sequence_enrollments').update({ status: 'completed', next_run_at: null }).eq('id', enr.id); continue; }

    // only_if kontrolü (adım sırası geldiğinde de geçerli)
    const outcomeOk =
      step.only_if === 'always' ||
      (step.only_if === 'not_reached' && enr.last_call_outcome !== 'reached') ||
      (step.only_if === 'reached' && enr.last_call_outcome === 'reached');
    if (!outcomeOk) { await advance(admin, enr, steps, step.position, enr.last_call_outcome); skipped++; continue; }

    if (step.step_type === 'ai_call') {
      if (!elevenLabsConfigured()) { skipped++; continue; }
      const phone = formatPhoneForCall(lead.phone);
      if (!phone) { await advance(admin, enr, steps, step.position, 'not_reached'); skipped++; continue; }

      // Arama penceresi (sequence.call_window)
      const { data: seq } = await admin.from('sequences').select('call_window, name').eq('id', enr.sequence_id).single();
      const win = (seq?.call_window || {}) as { start_hour?: number; end_hour?: number };
      const defer = deferToWindow(new Date(), win.start_hour ?? 11, win.end_hour ?? 18);
      if (defer) {
        await admin.from('sequence_enrollments').update({ next_run_at: defer.toISOString() }).eq('id', enr.id);
        continue;
      }

      const init = await initiateOutboundCall({
        toNumber: phone,
        customerName: lead.full_name,
        projectName: lead.campaign_name || lead.form_name || seq?.name || '',
      });

      const { data: callLog } = await admin.from('call_logs').insert({
        lead_id: enr.lead_id,
        organization_id: enr.organization_id,
        phone_number: phone,
        direction: 'outbound',
        status: init.ok ? 'calling' : 'failed',
        provider: 'elevenlabs',
        conversation_id: init.conversationId ?? null,
        enrollment_id: enr.id,
        metadata: { sequence_id: enr.sequence_id, step_id: step.id, error: init.error ?? null },
      }).select('id').single();

      if (init.ok && callLog) {
        await admin.from('sequence_enrollments').update({
          pending_call_id: callLog.id, next_run_at: null,
        }).eq('id', enr.id);
        calls++;
      } else {
        // Başlatılamadı → not_reached say ve ilerle (mail adımı devreye girebilsin)
        await advance(admin, enr, steps, step.position, 'not_reached');
        skipped++;
      }
    } else {
      // EMAIL — lead'e funnel maili
      const to = (lead.email || '').trim();
      if (!to) { await advance(admin, enr, steps, step.position, enr.last_call_outcome); skipped++; continue; }

      // Varsayılan şablon adım koşuluna göre: görüşüldüyse teşekkür, değilse ulaşamadık
      let tpl: RenderableTemplate = step.only_if === 'reached' ? THANKYOU_DEFAULT_TEMPLATE : FUNNEL_DEFAULT_TEMPLATE;
      const templateId = step.config?.email_template_id;
      if (templateId) {
        const { data: t } = await admin
          .from('email_templates').select('subject, body')
          .eq('id', templateId).eq('organization_id', enr.organization_id).single();
        if (t) tpl = { subject: t.subject, body: t.body };
      }
      const { subject, html } = renderTemplate(tpl, leadToVars(lead));

      let status: 'sent' | 'failed' = 'sent';
      let providerMessageId: string | null = null;
      let errorMessage: string | null = null;
      try {
        const res = await sendEmail({ to, subject, html });
        providerMessageId = res.id;
      } catch (e) {
        status = 'failed';
        errorMessage = e instanceof Error ? e.message : 'send failed';
      }

      await admin.from('email_log').insert({
        organization_id: enr.organization_id,
        lead_id: enr.lead_id,
        rule_id: null,
        recipient_user_id: null,
        to_email: to,
        subject,
        body: html,
        status,
        provider: 'resend',
        provider_message_id: providerMessageId,
        error_message: errorMessage,
        trigger: 'auto',
      });
      if (status === 'sent') {
        await admin.from('lead_activities').insert({
          lead_id: enr.lead_id,
          organization_id: enr.organization_id,
          activity_type: 'email_sent',
          title: 'Funnel email sent',
          metadata: { sequence_id: enr.sequence_id, step_id: step.id, to, subject },
        });
        emails++;
      }
      await advance(admin, enr, steps, step.position, enr.last_call_outcome);
    }
  }
  return { calls, emails, skipped };
}

export interface SequenceTickResult {
  resolvedCalls: number;
  startedCalls: number;
  sentEmails: number;
  skippedSteps: number;
}

export async function processSequences(): Promise<SequenceTickResult> {
  const admin = createAdminSupabaseClient();
  const resolvedCalls = await resolvePendingCalls(admin);
  const { calls, emails, skipped } = await runDueSteps(admin);
  return { resolvedCalls, startedCalls: calls, sentEmails: emails, skippedSteps: skipped };
}
