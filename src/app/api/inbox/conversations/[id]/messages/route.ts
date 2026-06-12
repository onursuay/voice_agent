import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendOutboundText } from '@/lib/inbox/send';
import type { InboxChannel } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

async function getOrg(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  return membership?.organization_id ?? null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrg(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    // RLS konuşma erişimini zaten kısıtlıyor; org filtresi ek güvence
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error('GET messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrg(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    // Konuşmayı yükle (RLS erişimi doğrular)
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .select('id, channel, channel_account_id, external_conversation_id, lead_id, organization_id')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();
    if (convErr || !conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    if (conv.channel === 'lead_form') {
      return NextResponse.json({ error: 'Lead form conversations are not repliable' }, { status: 400 });
    }
    if (!conv.external_conversation_id) {
      return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
    }

    // Kanal üzerinden gönder (token sunucu tarafında çözülür, tarayıcıya çıkmaz)
    const sendResult = await sendOutboundText({
      organizationId: orgId,
      channel: conv.channel as Exclude<InboxChannel, 'lead_form'>,
      channelAccountId: conv.channel_account_id,
      recipientId: conv.external_conversation_id,
      text,
    });

    const nowIso = new Date().toISOString();

    // Giden mesajı kaydet (başarısız olsa bile kayıt tutulur, status=failed)
    const { data: message, error: msgErr } = await supabase
      .from('messages')
      .insert({
        organization_id: orgId,
        conversation_id: conv.id,
        lead_id: conv.lead_id,
        channel: conv.channel,
        direction: 'outbound',
        message_type: 'text',
        message_text: text,
        content: {},
        external_message_id: sendResult.externalMessageId ?? null,
        external_recipient_id: conv.external_conversation_id,
        status: sendResult.ok ? 'sent' : 'failed',
        error_message: sendResult.ok ? null : sendResult.error ?? 'send_failed',
        sender_type: 'agent',
        sender_user_id: user.id,
        sent_at: nowIso,
      })
      .select('*')
      .single();
    if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

    // Konuşma özetini güncelle + okundu işaretle
    await supabase
      .from('conversations')
      .update({
        last_message_at: nowIso,
        last_message_preview: text.slice(0, 200),
        unread_count: 0,
        updated_at: nowIso,
      })
      .eq('id', conv.id)
      .eq('organization_id', orgId);

    if (!sendResult.ok) {
      return NextResponse.json({ message, error: sendResult.error, sent: false }, { status: 502 });
    }
    return NextResponse.json({ message, sent: true }, { status: 201 });
  } catch (err) {
    console.error('POST messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
