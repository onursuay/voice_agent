import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { DEFAULT_ROUTING_TEMPLATE, leadToVars, renderTemplate, type RenderableTemplate } from '@/lib/email/templates';
import { evaluateConditions, type TriggerConfig } from '@/lib/crm/ruleConditions';
import { resolveProvinceName } from '@/lib/leads/turkeyProvinces';

export type RoutingTrigger = 'auto' | 'manual';

export interface RoutingResult {
  status: 'sent' | 'failed' | 'no_match' | 'skipped';
  ruleId?: string | null;
  error?: string;
}

interface ActionConfig {
  assigned_to?: string | null;
  send_email?: boolean;
  email_template_id?: string | null;
  set_stage_id?: string | null;
  add_tag?: string | null;
  score_delta?: number | null;
}

export async function evaluateLeadRouting(
  leadId: string,
  opts: { trigger: RoutingTrigger; force?: boolean }
): Promise<RoutingResult> {
  const supabase = createAdminSupabaseClient();
  try {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    if (!lead) return { status: 'failed', error: 'lead not found' };

    // Otomatik yolda zaten gönderildiyse atla
    if (opts.trigger === 'auto' && !opts.force && lead.routing_status === 'sent') {
      return { status: 'skipped', ruleId: lead.routing_rule_id };
    }

    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('organization_id', lead.organization_id)
      .eq('is_active', true)
      .eq('action_type', 'route_lead')
      .order('priority', { ascending: true });

    // Kural eşleştirmesi kanonik il üzerinden yapılır: kullanıcı ilçe/plaka/yazım hatası
    // yazsa bile ("Orhangazi", "34", "Istnbul") doğru ile çözülür. Çözülemezse ham değere düşer.
    const rawCity = (lead as Record<string, unknown>).city;
    const resolvedIl = ((lead as Record<string, unknown>).city_il as string | null) || resolveProvinceName(rawCity);
    const leadForMatch = { ...(lead as Record<string, unknown>), city: resolvedIl ?? rawCity };

    const matched = (rules || []).find((r) =>
      evaluateConditions((r.trigger_config || {}) as TriggerConfig, leadForMatch)
    );

    if (!matched) {
      await supabase.from('leads').update({ routing_status: 'no_match' }).eq('id', leadId);
      return { status: 'no_match' };
    }

    const action = (matched.action_config || {}) as ActionConfig;

    // action.assigned_to'yu lead'in org'una AKTİF üyeliğe göre doğrula (cross-tenant koruma —
    // motor admin client / RLS bypass kullanıyor; geçersiz UUID ile başka org'a atama/PII sızıntısı engellenir).
    let assigneeValid = false;
    if (action.assigned_to) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('user_id', action.assigned_to)
        .eq('organization_id', lead.organization_id)
        .eq('is_active', true)
        .maybeSingle();
      assigneeValid = !!member;
    }

    // Atama (yalnız geçerli, org-içi atanan)
    if (action.assigned_to && assigneeValid && action.assigned_to !== lead.assigned_to) {
      await supabase.from('leads').update({ assigned_to: action.assigned_to, assigned_at: new Date().toISOString() }).eq('id', leadId);
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        organization_id: lead.organization_id,
        user_id: null,
        activity_type: 'assigned',
        title: 'Lead assigned by routing rule',
        description: null,
        metadata: { from_user: lead.assigned_to, to_user: action.assigned_to, by: 'routing_rule', rule_id: matched.id },
      });
    }

    // Aşama değiştir (kural aksiyonu) — yalnız org-içi geçerli aşama
    if (action.set_stage_id && action.set_stage_id !== lead.stage_id) {
      const { data: st } = await supabase
        .from('crm_stages').select('id')
        .eq('id', action.set_stage_id).eq('organization_id', lead.organization_id).maybeSingle();
      if (st) await supabase.from('leads').update({ stage_id: action.set_stage_id }).eq('id', leadId);
    }
    // Etiket ekle (kural aksiyonu) — mükerrer eklenmez
    if (action.add_tag) {
      const cur = (lead as Record<string, unknown>).tags;
      const tags: string[] = Array.isArray(cur) ? (cur as string[]) : [];
      if (!tags.includes(action.add_tag)) {
        await supabase.from('leads').update({ tags: [...tags, action.add_tag] }).eq('id', leadId);
      }
    }
    // Skoru değiştir (kural aksiyonu) — mevcut skora ekle/çıkar, 0-100 sınırla
    if (typeof action.score_delta === 'number' && action.score_delta !== 0) {
      const curScore = typeof (lead as Record<string, unknown>).score === 'number' ? (lead as { score: number }).score : 0;
      const next = Math.max(0, Math.min(100, curScore + action.score_delta));
      if (next !== curScore) await supabase.from('leads').update({ score: next }).eq('id', leadId);
    }

    let status: RoutingResult['status'] = 'no_match';
    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;

    if (action.send_email) {
      const recipientId = (action.assigned_to && assigneeValid) ? action.assigned_to : lead.assigned_to;
      // Alıcı e-postasını lead'in org'una üyelik üzerinden çöz (cross-tenant PII sızıntısı + güvenilir
      // gönderim domaini suistimaline karşı). Org üyesi değilse mail GÖNDERİLMEZ.
      let recipientEmail: string | null = null;
      if (recipientId) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('user_id', recipientId)
          .eq('organization_id', lead.organization_id)
          .eq('is_active', true)
          .maybeSingle();
        if (member) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', recipientId)
            .single();
          recipientEmail = profile?.email ?? null;
        }
      }

      let tpl: RenderableTemplate = DEFAULT_ROUTING_TEMPLATE;
      if (action.email_template_id) {
        const { data: t } = await supabase
          .from('email_templates')
          .select('subject, body')
          .eq('id', action.email_template_id)
          .eq('organization_id', lead.organization_id)
          .single();
        if (t) tpl = { subject: t.subject, body: t.body };
      }
      const { subject, html } = renderTemplate(tpl, leadToVars(lead));

      if (!recipientEmail) {
        status = 'failed';
        errorMessage = 'recipient not in org or has no email';
      } else {
        try {
          const res = await sendEmail({ to: recipientEmail, subject, html });
          providerMessageId = res.id;
          status = 'sent';
        } catch (e) {
          status = 'failed';
          errorMessage = e instanceof Error ? e.message : 'send failed';
        }
      }

      await supabase.from('email_log').insert({
        organization_id: lead.organization_id,
        lead_id: leadId,
        rule_id: matched.id,
        recipient_user_id: recipientId || null,
        to_email: recipientEmail || '-',
        subject,
        body: html,
        status: status === 'sent' ? 'sent' : 'failed',
        provider: 'resend',
        provider_message_id: providerMessageId,
        error_message: errorMessage,
        trigger: opts.trigger,
      });

      if (status === 'sent') {
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          organization_id: lead.organization_id,
          user_id: null,
          activity_type: 'email_sent',
          title: 'Routing email sent',
          description: null,
          metadata: { rule_id: matched.id, to: recipientEmail, subject, status: 'sent' },
        });
      }
    } else {
      status = 'skipped';
    }

    await supabase
      .from('leads')
      .update({
        routing_status: status,
        routing_rule_id: matched.id,
        routing_last_emailed_at: status === 'sent' ? new Date().toISOString() : lead.routing_last_emailed_at,
      })
      .eq('id', leadId);

    return { status, ruleId: matched.id, error: errorMessage || undefined };
  } catch (e) {
    try {
      await supabase.from('leads').update({ routing_status: 'failed' }).eq('id', leadId);
    } catch { /* ignore */ }
    return { status: 'failed', error: e instanceof Error ? e.message : 'routing error' };
  }
}
