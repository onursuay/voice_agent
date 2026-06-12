import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { ASSIGNMENT_TEMPLATE, leadToVars, renderTemplate } from '@/lib/email/templates';

// Manuel atama bildirimi: bir lead bir temsilciye atandığında atanan kişiye
// e-posta gönderir. Routing kurallarından BAĞIMSIZ — tablo/detay/bulk'taki
// elle atama da artık bildirim üretir. Org ayarıyla kapatılabilir:
//   organizations.settings.notifications.assignment_email === false → gönderme.
// Best-effort: hata atmaz, kaydı asla bloklamaz.

export interface AssignmentNotifyResult {
  sent: boolean;
  reason?: 'disabled' | 'no_recipient' | 'self_assign' | 'send_failed';
}

export async function notifyAssignment(opts: {
  organizationId: string;
  leadId: string;
  assignedTo: string;          // yeni atanan kullanıcı
  assignedBy?: string | null;  // atamayı yapan (kendine atamada mail atlanır)
}): Promise<AssignmentNotifyResult> {
  const admin = createAdminSupabaseClient();
  try {
    // Org ayarı: varsayılan açık; açıkça false ise kapalı
    const { data: org } = await admin
      .from('organizations')
      .select('settings')
      .eq('id', opts.organizationId)
      .single();
    const notifications = (org?.settings as { notifications?: { assignment_email?: boolean } } | null)?.notifications;
    if (notifications?.assignment_email === false) return { sent: false, reason: 'disabled' };

    // Kendi kendine atamada mail gereksiz
    if (opts.assignedBy && opts.assignedBy === opts.assignedTo) {
      return { sent: false, reason: 'self_assign' };
    }

    // Alıcıyı lead'in org'una AKTİF üyelik üzerinden doğrula (cross-tenant koruması)
    const { data: member } = await admin
      .from('organization_members')
      .select('user_id')
      .eq('user_id', opts.assignedTo)
      .eq('organization_id', opts.organizationId)
      .eq('is_active', true)
      .maybeSingle();
    if (!member) return { sent: false, reason: 'no_recipient' };

    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', opts.assignedTo)
      .single();
    const recipientEmail = profile?.email ?? null;
    if (!recipientEmail) return { sent: false, reason: 'no_recipient' };

    const { data: lead } = await admin
      .from('leads')
      .select('full_name, first_name, last_name, phone, email, city, company, source_platform, campaign_name')
      .eq('id', opts.leadId)
      .eq('organization_id', opts.organizationId)
      .single();
    if (!lead) return { sent: false, reason: 'no_recipient' };

    const { subject, html } = renderTemplate(ASSIGNMENT_TEMPLATE, leadToVars(lead));

    let status: 'sent' | 'failed' = 'sent';
    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;
    try {
      const res = await sendEmail({ to: recipientEmail, subject, html });
      providerMessageId = res.id;
    } catch (e) {
      status = 'failed';
      errorMessage = e instanceof Error ? e.message : 'send failed';
    }

    await admin.from('email_log').insert({
      organization_id: opts.organizationId,
      lead_id: opts.leadId,
      rule_id: null,
      recipient_user_id: opts.assignedTo,
      to_email: recipientEmail,
      subject,
      body: html,
      status,
      provider: 'resend',
      provider_message_id: providerMessageId,
      error_message: errorMessage,
      trigger: 'manual',
    });

    if (status === 'sent') {
      await admin.from('lead_activities').insert({
        lead_id: opts.leadId,
        organization_id: opts.organizationId,
        user_id: opts.assignedBy ?? null,
        activity_type: 'email_sent',
        title: 'Assignment notification sent',
        description: null,
        metadata: { to: recipientEmail, subject, kind: 'assignment' },
      });
      return { sent: true };
    }
    return { sent: false, reason: 'send_failed' };
  } catch (e) {
    console.error('[assignmentNotify] failed', e);
    return { sent: false, reason: 'send_failed' };
  }
}
