import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Yo Dijital <info@yodijital.com>';

async function sendViaResend(to: string, subject: string, body: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Resend API error' }));
    throw new Error(err.message || `Resend API ${res.status}`);
  }

  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    const body = await request.json();
    const { subject, body: emailBody, lead_ids } = body;
    let { to } = body;

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Normalize to array
    if (typeof to === 'string') to = [to];
    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
    }

    const isMockMode = !RESEND_API_KEY;
    let sent = 0;
    let failed = 0;
    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const email of to) {
      try {
        if (isMockMode) {
          // Mock mode: simulate success
          await new Promise((r) => setTimeout(r, 50));
        } else {
          await sendViaResend(email, subject, emailBody);
        }
        sent++;
        results.push({ email, status: 'sent' });
      } catch (err) {
        failed++;
        results.push({ email, status: 'failed', error: (err as Error).message });
      }
    }

    // Create activity logs for leads
    if (lead_ids && Array.isArray(lead_ids) && lead_ids.length > 0) {
      const activities = lead_ids.map((leadId: string, index: number) => ({
        lead_id: leadId,
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'email_sent' as const,
        title: 'E-posta gonderildi',
        description: `Konu: ${subject}`,
        metadata: {
          subject,
          to: to[index] || to[0],
          status: results[index]?.status || 'sent',
          sent_at: new Date().toISOString(),
          mock: isMockMode,
        },
      }));

      try { await supabase.from('lead_activities').insert(activities); } catch {
        // Activity logging should not break the response
      }
    }

    return NextResponse.json({
      sent,
      failed,
      results,
      mock: isMockMode,
    });
  } catch (err) {
    console.error('POST /api/email/send error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
