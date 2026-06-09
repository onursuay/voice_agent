import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { MetaGraphClient } from '@/lib/meta/graph-client';

/**
 * CRM stage → Meta Custom Audience sync (voice_agent port of the YoAi CRM model).
 *
 * When a lead's stage changes, the lead's hashed (SHA-256) email/phone is added
 * to the CUSTOMER_LIST custom audience that corresponds to that stage, and
 * removed from every other stage's audience — so the lead lives in exactly one
 * stage audience. The lowest-position ("entry") stage gets NO audience (a lead
 * moved back to the entry stage is removed from every audience). Won/forward
 * stages also fire a best-effort CAPI conversion event for ad optimization.
 *
 * Prerequisites (all degrade gracefully — failures never break the PATCH):
 *   - The org connected Meta (meta_account config holds a userToken) AND that
 *     token carries `ads_management` (requires reconnect + Meta App Review).
 *   - The lead carries `meta_ad_id` so the originating ad account can be
 *     resolved (manual/imported leads without an ad id are skipped).
 *   - The ad account accepted the Custom Audience Terms of Service.
 *
 * The reference Meta integration is NEVER touched: this is additive (creates
 * new named audiences idempotently) and isolated to voice_agent.
 */

export interface SyncLead {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  meta_ad_id: string | null;
  meta_capi_sent?: boolean | null;
}

export interface SyncStage {
  id: string;
  name: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface AudienceSyncResult {
  ok: boolean;
  reason?: 'meta_not_connected' | 'no_pii' | 'no_ad_account' | 'sync_failed' | 'tos_required';
  capiSent?: boolean;
  error?: string;
  /** reason='tos_required' → URL where the user accepts Custom Audience terms. */
  tosUrl?: string;
}

const META_GRAPH_VERSION = 'v23.0';
const AUDIENCE_PREFIX = 'YO CRM';

/** SHA-256 (trim + lowercase) — Meta CUSTOMER_LIST matching spec. */
function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/** Phone → digits only, drop leading zeros (Meta matching spec); keep country code. */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '').replace(/^0+/, '');
}

function audienceName(stage: SyncStage): string {
  return `${AUDIENCE_PREFIX} — ${stage.name}`;
}

interface AudienceEntry { id: string; name: string }

/** Lists the account's custom audiences (paginated), returning Map<name, id> for the wanted names. */
async function findAudiencesByName(
  client: MetaGraphClient,
  account: string,
  names: string[],
): Promise<Map<string, string>> {
  const wanted = new Set(names);
  const found = new Map<string, string>();
  let after: string | undefined;

  for (let page = 0; page < 10 && wanted.size > found.size; page++) {
    const params: Record<string, string> = { fields: 'id,name', limit: '200' };
    if (after) params.after = after;
    const res = await client.get<{
      data?: AudienceEntry[];
      paging?: { cursors?: { after?: string }; next?: string };
    }>(`/${account}/customaudiences`, params);
    if (!res.ok) break;
    for (const a of res.data?.data ?? []) {
      if (a?.id && a?.name && wanted.has(a.name) && !found.has(a.name)) found.set(a.name, a.id);
    }
    const next = res.data?.paging?.next;
    after = res.data?.paging?.cursors?.after;
    if (!next || !after) break;
  }
  return found;
}

/** Finds a named CUSTOMER_LIST audience, creating it if absent (idempotent). Throws on create failure. */
async function ensureAudience(
  client: MetaGraphClient,
  account: string,
  name: string,
  existing: Map<string, string>,
): Promise<string | null> {
  const cached = existing.get(name);
  if (cached) return cached;

  const form = new URLSearchParams();
  form.set('name', name);
  form.set('subtype', 'CUSTOM');
  form.set('customer_file_source', 'USER_PROVIDED_ONLY');

  const res = await client.postForm<{ id: string }>(`/${account}/customaudiences`, form);
  if (!res.ok || !res.data?.id) {
    throw new Error(res.error?.error_user_msg || res.error?.message || 'audience_create_failed');
  }
  existing.set(name, res.data.id);
  return res.data.id;
}

function buildUserPayload(email: string | null, phone: string | null): { schema: string[]; data: string[][] } | null {
  const schema: string[] = [];
  const row: string[] = [];
  if (email) { schema.push('EMAIL'); row.push(sha256(email)); }
  if (phone) { schema.push('PHONE'); row.push(sha256(phone)); }
  if (schema.length === 0) return null;
  return { schema, data: [row] };
}

async function addUserToAudience(client: MetaGraphClient, audienceId: string, email: string | null, phone: string | null): Promise<void> {
  const payload = buildUserPayload(email, phone);
  if (!payload) return;
  const form = new URLSearchParams();
  form.set('payload', JSON.stringify(payload));
  const res = await client.postForm(`/${audienceId}/users`, form);
  // TOS rejection surfaces here too — bubble it up so the caller can map it.
  if (!res.ok) throw new Error(res.error?.error_user_msg || res.error?.message || 'audience_add_failed');
}

async function removeUserFromAudience(client: MetaGraphClient, audienceId: string, email: string | null, phone: string | null): Promise<void> {
  const payload = buildUserPayload(email, phone);
  if (!payload) return;
  const form = new URLSearchParams();
  form.set('payload', JSON.stringify(payload));
  // Meta: DELETE /{audience_id}/users with the payload form-encoded in the body.
  await client.del(`/${audienceId}/users`, form);
}

/** Stage → CAPI event name (best-effort, needs a pixel). null = no event. */
function stageEventName(stage: SyncStage, isEntry: boolean): string | null {
  if (stage.is_won) return 'Converted';
  if (stage.is_lost || isEntry) return null;
  return 'QualifiedLead';
}

/** Best-effort CAPI event via the account's first pixel. Returns true if sent. */
async function sendStageCapiEvent(
  client: MetaGraphClient,
  account: string,
  accessToken: string,
  eventName: string,
  lead: SyncLead,
  email: string | null,
  phone: string | null,
): Promise<boolean> {
  const pixelRes = await client.get<{ data?: { id: string }[] }>(`/${account}/adspixels`, { fields: 'id', limit: '1' });
  const pixelId = pixelRes.ok ? pixelRes.data?.data?.[0]?.id : undefined;
  if (!pixelId) return false;

  const userData: Record<string, string[]> = {};
  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone)];
  const names = (lead.full_name ?? '').trim().split(/\s+/).filter(Boolean);
  if (names[0]) userData.fn = [sha256(names[0])];
  if (names.length > 1) userData.ln = [sha256(names[names.length - 1])];

  const eventTime = Math.floor(Date.now() / 1000);
  const eventId = `${eventName}_${lead.id}_${eventTime}`;
  const form = new URLSearchParams();
  form.set('access_token', accessToken);
  form.set('data', JSON.stringify([{
    event_name: eventName,
    event_time: eventTime,
    event_id: eventId,
    action_source: 'system_generated',
    user_data: userData,
    custom_data: { lead_event_source: 'yo_crm' },
  }]));

  const res = await client.postForm(`/${pixelId}/events`, form);
  return res.ok;
}

function isTosError(msg: string): boolean {
  return /customaudiences\/tos|custom audience terms|özel hedef kitle/i.test(msg);
}

/**
 * Applies the Meta audience sync for a lead's current stage. Best-effort:
 * the lead's stage is already persisted by the caller; any Meta failure is
 * recorded in leads.meta_sync_error and returned (never thrown).
 */
export async function syncLeadStageToMeta(opts: {
  organizationId: string;
  lead: SyncLead;
  stage: SyncStage;
  allStages: SyncStage[];
}): Promise<AudienceSyncResult> {
  const { organizationId, lead, stage, allStages } = opts;
  const admin = createAdminSupabaseClient();

  // 1) Meta account token for the org (carries ads_management once reconnected).
  const { data: accountRow } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_account')
    .eq('is_active', true)
    .filter('config->>organization_id', 'eq', organizationId)
    .maybeSingle();
  const userToken = (accountRow?.config as Record<string, unknown> | null)?.userToken as string | undefined;
  if (!userToken) return { ok: false, reason: 'meta_not_connected' };

  // 2) Valid PII to match against (no junk).
  const rawEmail = lead.email?.trim() ?? '';
  const email = rawEmail.includes('@') && rawEmail.length >= 5 ? rawEmail : null;
  const digits = lead.phone ? normalizePhone(lead.phone) : '';
  const phone = digits.length >= 7 ? digits : null;
  if (!email && !phone) {
    await admin.from('leads').update({ meta_sync_error: 'no_pii' }).eq('id', lead.id);
    return { ok: false, reason: 'no_pii' };
  }

  const client = new MetaGraphClient({ accessToken: userToken, timeout: 8000 });

  // 3) Resolve the originating ad account from the lead's ad id.
  if (!lead.meta_ad_id) return { ok: false, reason: 'no_ad_account' };
  const adRes = await client.get<{ account_id?: string }>(`/${lead.meta_ad_id}`, { fields: 'account_id' });
  if (!adRes.ok || !adRes.data?.account_id) {
    return { ok: false, reason: 'no_ad_account', error: adRes.error?.message };
  }
  const account = `act_${adRes.data.account_id}`;

  const entryStageId = allStages.reduce<SyncStage | null>((min, s) => (!min || s.position < min.position ? s : min), null)?.id;
  const isEntry = stage.id === entryStageId;

  try {
    const allNames = allStages.map(audienceName);
    const audiences = await findAudiencesByName(client, account, allNames);

    // Add to the target stage's audience (entry stage → no audience).
    const targetName = isEntry ? null : audienceName(stage);
    if (targetName) {
      const targetId = await ensureAudience(client, account, targetName, audiences);
      if (targetId) await addUserToAudience(client, targetId, email, phone);
    }

    // Remove from every other stage's audience (lead lives in exactly one).
    for (const s of allStages) {
      const name = audienceName(s);
      if (name === targetName) continue;
      const id = audiences.get(name);
      if (id) await removeUserFromAudience(client, id, email, phone).catch(() => {});
    }

    // Best-effort CAPI conversion event (once per lead).
    let capiSent = false;
    const eventName = stageEventName(stage, isEntry);
    if (eventName && !lead.meta_capi_sent) {
      capiSent = await sendStageCapiEvent(client, account, userToken, eventName, lead, email, phone).catch(() => false);
    }

    await admin
      .from('leads')
      .update({
        meta_synced_at: new Date().toISOString(),
        meta_sync_error: null,
        ...(capiSent ? { meta_capi_sent: true } : {}),
      })
      .eq('id', lead.id);

    return { ok: true, capiSent };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.from('leads').update({ meta_sync_error: msg }).eq('id', lead.id);
    if (isTosError(msg)) {
      return {
        ok: false,
        reason: 'tos_required',
        error: msg,
        tosUrl: `https://business.facebook.com/ads/manage/customaudiences/tos/?act=${account.replace('act_', '')}`,
      };
    }
    return { ok: false, reason: 'sync_failed', error: msg };
  }
}

export { META_GRAPH_VERSION };
