import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { elevenLabsConfigured, formatPhoneForCall, initiateOutboundCall } from '@/lib/calls/elevenlabs';

// Tekil AI araması başlat (AI Aramalar sayfası "Başlat" / lead detayından).
// Body: { lead_id } veya { call_log_id } (kuyruktaki pending kaydı başlatmak için)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    if (!elevenLabsConfigured()) {
      return NextResponse.json({ error: 'elevenlabs_not_configured' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const admin = createAdminSupabaseClient();

    // Hedef lead + (varsa) mevcut pending call kaydı
    let leadId: string | null = body.lead_id || null;
    let pendingCallId: string | null = null;
    if (body.call_log_id) {
      const { data: cl } = await admin
        .from('call_logs')
        .select('id, lead_id, organization_id, status')
        .eq('id', body.call_log_id)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (!cl) return NextResponse.json({ error: 'call not found' }, { status: 404 });
      if (cl.status === 'calling') return NextResponse.json({ error: 'already calling' }, { status: 409 });
      leadId = cl.lead_id;
      pendingCallId = cl.id;
    }
    if (!leadId) return NextResponse.json({ error: 'lead_id or call_log_id required' }, { status: 400 });

    const { data: lead } = await admin
      .from('leads')
      .select('id, full_name, phone, campaign_name, form_name')
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .single();
    if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 });

    const phone = formatPhoneForCall(lead.phone);
    if (!phone) return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });

    const init = await initiateOutboundCall({
      toNumber: phone,
      customerName: lead.full_name,
      projectName: lead.campaign_name || lead.form_name || '',
    });
    if (!init.ok) return NextResponse.json({ error: init.error || 'initiate_failed' }, { status: 502 });

    if (pendingCallId) {
      await admin.from('call_logs').update({
        status: 'calling',
        provider: 'elevenlabs',
        conversation_id: init.conversationId,
        phone_number: phone,
      }).eq('id', pendingCallId);
      return NextResponse.json({ ok: true, call_log_id: pendingCallId, conversation_id: init.conversationId });
    }

    const { data: created, error } = await admin.from('call_logs').insert({
      lead_id: leadId,
      organization_id: orgId,
      phone_number: phone,
      direction: 'outbound',
      status: 'calling',
      provider: 'elevenlabs',
      conversation_id: init.conversationId,
      metadata: { initiated_by: user.id, manual: true },
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, call_log_id: created.id, conversation_id: init.conversationId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/calls/initiate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
