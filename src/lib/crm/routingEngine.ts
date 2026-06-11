import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { DEFAULT_ROUTING_TEMPLATE, leadToVars, renderTemplate, type RenderableTemplate } from '@/lib/email/templates';
import { evaluateConditions, type TriggerConfig } from '@/lib/crm/ruleConditions';

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

    const matched = (rules || []).find((r) =>
      evaluateConditions((r.trigger_config || {}) as TriggerConfig, lead as Record<string, unknown>)
    );

    if (!matched) {
      await supabase.from('leads').update({ routing_status: 'no_match' }).eq('id', leadId);
      return { status: 'no_match' };
    }

    const action = (matched.action_config || {}) as ActionConfig;

    // Atama
    if (action.assigned_to && action.assigned_to !== lead.assigned_to) {
      await supabase.from('leads').update({ assigned_to: action.assigned_to }).eq('id', leadId);
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

    let status: RoutingResult['status'] = 'no_match';
    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;

    if (action.send_email) {
      const recipientId = action.assigned_to || lead.assigned_to;
      const { data: recipient } = recipientId
        ? await supabase.from('profiles').select('id, email').eq('id', recipientId).single()
        : { data: null };

      let tpl: RenderableTemplate = DEFAULT_ROUTING_TEMPLATE;
      if (action.email_template_id) {
        const { data: t } = await supabase
          .from('email_templates')
          .select('subject, body')
          .eq('id', action.email_template_id)
          .single();
        if (t) tpl = { subject: t.subject, body: t.body };
      }
      const { subject, html } = renderTemplate(tpl, leadToVars(lead));

      if (!recipient?.email) {
        status = 'failed';
        errorMessage = 'recipient has no email';
      } else {
        try {
          const res = await sendEmail({ to: recipient.email, subject, html });
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
        to_email: recipient?.email || '-',
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
          metadata: { rule_id: matched.id, to: recipient?.email },
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
