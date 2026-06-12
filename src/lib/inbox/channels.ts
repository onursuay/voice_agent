import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { InboxChannel, MessagingChannelAccount } from '@/lib/types';

// Messaging kanalları integration_settings tablosunda kanal-başına provider ile tutulur.
// (meta_leads / meta_account satırlarıyla çakışmaz — onlar Lead Ads içindir.)
export const CHANNEL_PROVIDER: Record<Exclude<InboxChannel, 'lead_form'>, string> = {
  whatsapp: 'meta_whatsapp',
  messenger: 'meta_messenger',
  instagram: 'meta_instagram',
};

// Webhook'tan gelen "hesap kimliği" config içinde hangi alana denk geliyor:
//  - whatsapp  : phone_number_id  (value.metadata.phone_number_id)
//  - messenger : page_id          (entry.id)
//  - instagram : ig_business_account_id (entry.id)
const ACCOUNT_ID_FIELD: Record<Exclude<InboxChannel, 'lead_form'>, string> = {
  whatsapp: 'phone_number_id',
  messenger: 'page_id',
  instagram: 'ig_business_account_id',
};

export interface ResolvedChannel {
  organizationId: string;
  accessToken: string;
  config: Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function tokenFrom(config: Record<string, unknown>): string | null {
  return (
    asString(config.access_token) ||
    asString(config.page_access_token) ||
    null
  );
}

/**
 * Gelen webhook için kanal hesabını çöz: ilgili org + erişim token'ı.
 * Admin client kullanır (RLS bypass) — webhook context'inde oturum yoktur.
 */
export async function resolveInboundChannel(
  channel: Exclude<InboxChannel, 'lead_form'>,
  accountId: string,
): Promise<ResolvedChannel | null> {
  if (!accountId) return null;
  const supabase = createAdminSupabaseClient();
  const provider = CHANNEL_PROVIDER[channel];
  const field = ACCOUNT_ID_FIELD[channel];

  const { data } = await supabase
    .from('integration_settings')
    .select('config, is_active')
    .eq('provider', provider)
    .eq('is_active', true)
    .filter(`config->>${field}`, 'eq', accountId)
    .maybeSingle();

  if (!data?.is_active) return null;
  const config = (data.config as Record<string, unknown>) || {};
  const organizationId = asString(config.organization_id);
  const accessToken = tokenFrom(config);
  if (!organizationId || !accessToken) return null;

  return { organizationId, accessToken, config };
}

/**
 * Bir konuşmaya yanıt göndermek için kanal hesabını çöz.
 * Outbound her zaman sunucu tarafında; token tarayıcıya hiç çıkmaz.
 */
export async function resolveChannelForSend(
  organizationId: string,
  channel: Exclude<InboxChannel, 'lead_form'>,
  channelAccountId: string | null,
): Promise<ResolvedChannel | null> {
  const supabase = createAdminSupabaseClient();
  const provider = CHANNEL_PROVIDER[channel];
  const field = ACCOUNT_ID_FIELD[channel];

  let query = supabase
    .from('integration_settings')
    .select('config, is_active')
    .eq('provider', provider)
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', organizationId);

  if (channelAccountId) {
    query = query.filter(`config->>${field}`, 'eq', channelAccountId);
  }

  const { data } = await query.maybeSingle();
  if (!data?.is_active) return null;
  const config = (data.config as Record<string, unknown>) || {};
  const accessToken = tokenFrom(config);
  if (!accessToken) return null;

  return { organizationId, accessToken, config };
}

/** Bir org'a bağlı tüm messaging kanal hesaplarını listele (UI / status için). */
export async function listOrgChannels(organizationId: string): Promise<MessagingChannelAccount[]> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from('integration_settings')
    .select('id, provider, config, is_active')
    .in('provider', Object.values(CHANNEL_PROVIDER))
    .filter('config->>organization_id', 'eq', organizationId);

  const rows = (data || []) as Array<{
    id: string;
    provider: string;
    config: Record<string, unknown>;
    is_active: boolean;
  }>;

  const providerToChannel: Record<string, InboxChannel> = {
    meta_whatsapp: 'whatsapp',
    meta_messenger: 'messenger',
    meta_instagram: 'instagram',
  };

  return rows.map((row) => {
    const channel = providerToChannel[row.provider];
    const cfg = row.config || {};
    const field = ACCOUNT_ID_FIELD[channel as Exclude<InboxChannel, 'lead_form'>];
    return {
      id: row.id,
      channel,
      channel_account_id: asString(cfg[field]) || '',
      display_name:
        asString(cfg.display_number) ||
        asString(cfg.verified_name) ||
        asString(cfg.page_name) ||
        asString(cfg.ig_username) ||
        null,
      page_id: asString(cfg.page_id),
      connected_at: asString(cfg.connected_at),
      is_active: row.is_active,
    };
  });
}
