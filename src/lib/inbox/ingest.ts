import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { NormalizedInbound, NormalizedStatus } from '@/lib/inbox/normalize';
import type { InboxChannel } from '@/lib/types';

type Admin = ReturnType<typeof createAdminSupabaseClient>;

const UNIQUE_VIOLATION = '23505';

// Kanal → lead.source_platform enum eşlemesi
const CHANNEL_SOURCE_PLATFORM: Record<Exclude<InboxChannel, 'lead_form'>, string> = {
  whatsapp: 'whatsapp',
  instagram: 'instagram_dm',
  messenger: 'messenger',
};

// Kanal → lead kimlik kolonu
const CHANNEL_IDENTITY_COLUMN: Record<Exclude<InboxChannel, 'lead_form'>, string> = {
  whatsapp: 'whatsapp_wa_id',
  instagram: 'instagram_user_id',
  messenger: 'messenger_psid',
};

async function getFirstStageId(admin: Admin, organizationId: string): Promise<string | null> {
  const { data } = await admin
    .from('crm_stages')
    .select('id')
    .eq('organization_id', organizationId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

/**
 * Kanal kimliğiyle lead bul/oluştur. Birincil eşleştirme kanal-kimlik kolonu
 * (wa_id / ig_user_id / psid). WhatsApp'ta ikincil olarak telefon eşleşmesi denenir.
 * Ad-soyad ASLA eşleştirme anahtarı değildir — yalnız display_name olarak yazılır.
 */
async function findOrCreateLead(
  admin: Admin,
  organizationId: string,
  msg: NormalizedInbound,
): Promise<{ leadId: string; created: boolean }> {
  const identityCol = CHANNEL_IDENTITY_COLUMN[msg.channel];
  const identityVal = msg.externalConversationId;

  // 1) Kanal kimliği ile
  const { data: byIdentity } = await admin
    .from('leads')
    .select('id, display_name, phone')
    .eq('organization_id', organizationId)
    .eq(identityCol, identityVal)
    .maybeSingle();
  if (byIdentity) {
    // İsim güncelle (display_name boşsa)
    if (msg.contactName && !byIdentity.display_name) {
      await admin.from('leads').update({ display_name: msg.contactName }).eq('id', byIdentity.id);
    }
    return { leadId: byIdentity.id, created: false };
  }

  // 2) WhatsApp: telefon ile ikincil eşleştirme (mevcut lead'e kanal kimliği bağla)
  if (msg.channel === 'whatsapp' && msg.phone) {
    const { data: byPhone } = await admin
      .from('leads')
      .select('id, whatsapp_wa_id')
      .eq('organization_id', organizationId)
      .eq('phone', msg.phone)
      .is('whatsapp_wa_id', null)
      .limit(1)
      .maybeSingle();
    if (byPhone) {
      await admin
        .from('leads')
        .update({ whatsapp_wa_id: identityVal, display_name: msg.contactName ?? undefined })
        .eq('id', byPhone.id);
      return { leadId: byPhone.id, created: false };
    }
  }

  // 3) Yeni lead oluştur
  const stageId = await getFirstStageId(admin, organizationId);
  const insertPayload: Record<string, unknown> = {
    organization_id: organizationId,
    [identityCol]: identityVal,
    display_name: msg.contactName,
    full_name: msg.contactName,         // başlangıç değeri; doğrulanmamış
    phone: msg.phone,
    source_platform: CHANNEL_SOURCE_PLATFORM[msg.channel],
    stage_id: stageId,
    first_seen_at: new Date().toISOString(),
  };
  if (msg.channel === 'instagram') insertPayload.instagram_username = null;

  const { data: created, error } = await admin
    .from('leads')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    // Eşzamanlı webhook yarışı: kimlik benzersizliği ihlal edildiyse yeniden çöz
    if (error.code === UNIQUE_VIOLATION) {
      const { data: again } = await admin
        .from('leads')
        .select('id')
        .eq('organization_id', organizationId)
        .eq(identityCol, identityVal)
        .maybeSingle();
      if (again) return { leadId: again.id, created: false };
    }
    throw new Error(`findOrCreateLead failed: ${error.message}`);
  }

  // Yeni lead aktivite logu
  await admin.from('lead_activities').insert({
    lead_id: created.id,
    organization_id: organizationId,
    activity_type: 'created',
    title: `Lead created from ${msg.channel}`,
    metadata: { channel: msg.channel, source: msg.ctwa ? 'click_to_whatsapp' : 'organic' },
  });

  // AI Orkestra: mesaj kanalından gelen yeni lead de senaryoya kaydolsun (bloklamaz)
  void import('@/lib/crm/sequenceEngine')
    .then((m) => m.enrollLeadInSequences(created.id))
    .catch((e) => console.error('[sequence] inbox enroll failed', e));

  return { leadId: created.id, created: true };
}

function conversationSource(msg: NormalizedInbound): string {
  if (msg.channel === 'whatsapp') return msg.ctwa ? 'click_to_whatsapp' : 'organic';
  if (msg.channel === 'instagram') return 'instagram_dm';
  return 'messenger';
}

async function findOrCreateConversation(
  admin: Admin,
  organizationId: string,
  leadId: string,
  msg: NormalizedInbound,
): Promise<string> {
  const { data: existing } = await admin
    .from('conversations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('channel', msg.channel)
    .eq('channel_account_id', msg.channelAccountId)
    .eq('external_conversation_id', msg.externalConversationId)
    .maybeSingle();
  if (existing) return existing.id;

  const insertPayload: Record<string, unknown> = {
    organization_id: organizationId,
    lead_id: leadId,
    channel: msg.channel,
    source: conversationSource(msg),
    status: 'new',
    channel_account_id: msg.channelAccountId,
    external_conversation_id: msg.externalConversationId,
  };
  if (msg.ctwa) {
    insertPayload.ctwa_clid = msg.ctwa.clid;
    insertPayload.ad_source_id = msg.ctwa.sourceId;
    insertPayload.ad_source_url = msg.ctwa.sourceUrl;
    insertPayload.ad_headline = msg.ctwa.headline;
  }

  const { data: created, error } = await admin
    .from('conversations')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      const { data: again } = await admin
        .from('conversations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('channel', msg.channel)
        .eq('channel_account_id', msg.channelAccountId)
        .eq('external_conversation_id', msg.externalConversationId)
        .maybeSingle();
      if (again) return again.id;
    }
    throw new Error(`findOrCreateConversation failed: ${error.message}`);
  }
  return created.id;
}

export interface InboundResult {
  conversationId: string;
  leadId: string;
  messageId: string | null;
  isNewLead: boolean;
  isDuplicate: boolean;
}

/** Gelen tek mesajı işle: lead → conversation → message + conversation güncelle. */
export async function processInboundMessage(
  organizationId: string,
  msg: NormalizedInbound,
): Promise<InboundResult> {
  const admin = createAdminSupabaseClient();

  const { leadId, created: isNewLead } = await findOrCreateLead(admin, organizationId, msg);
  const conversationId = await findOrCreateConversation(admin, organizationId, leadId, msg);

  // Mesaj ekle (external_message_id ile dedup)
  const { data: message, error: msgError } = await admin
    .from('messages')
    .insert({
      organization_id: organizationId,
      conversation_id: conversationId,
      lead_id: leadId,
      channel: msg.channel,
      direction: 'inbound',
      message_type: msg.messageType,
      message_text: msg.text,
      content: msg.content,
      external_message_id: msg.externalMessageId,
      external_sender_id: msg.externalConversationId,
      external_recipient_id: msg.recipientId,
      status: 'received',
      sender_type: 'contact',
      raw_payload: msg.raw as Record<string, unknown>,
      sent_at: msg.timestamp,
    })
    .select('id')
    .single();

  if (msgError) {
    if (msgError.code === UNIQUE_VIOLATION) {
      // Aynı mesaj tekrar geldi — sessizce yut
      return { conversationId, leadId, messageId: null, isNewLead, isDuplicate: true };
    }
    throw new Error(`insert message failed: ${msgError.message}`);
  }

  // Konuşma özetini atomik güncelle (unread artışı yarış-güvenli — bkz. bump_conversation_inbound)
  const preview = (msg.text || `[${msg.messageType}]`).slice(0, 200);
  await admin.rpc('bump_conversation_inbound', {
    conv_id: conversationId,
    preview,
    ts: msg.timestamp,
  });

  // Lead son aktivite zamanı
  await admin.from('leads').update({ last_activity_at: msg.timestamp || new Date().toISOString() }).eq('id', leadId);

  return { conversationId, leadId, messageId: message.id, isNewLead, isDuplicate: false };
}

/** Giden mesaj durum güncellemesi (sent/delivered/read/failed). */
export async function processStatusUpdate(status: NormalizedStatus): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin
    .from('messages')
    .update({ status: status.status })
    .eq('external_message_id', status.externalMessageId);
}
