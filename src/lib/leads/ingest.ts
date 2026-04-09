import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export type IngestionLeadSource = 'meta_lead_form' | 'zapier' | 'manual';

export interface NormalizedLeadInput {
  organizationId: string;
  provider: string;
  eventType: string;
  eventExternalId?: string | null;
  payload: unknown;
  source: IngestionLeadSource;
  metaLeadId?: string | null;
  metaPageId?: string | null;
  metaFormId?: string | null;
  metaAdId?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  score?: number | null;
  assignedTo?: string | null;
  stageId?: string | null;
  formName?: string | null;
  campaignName?: string | null;
  adName?: string | null;
  customFields?: Record<string, unknown>;
  rawPayload?: unknown;
}

type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  stage_id: string | null;
  assigned_to?: string | null;
  score: number | null;
  custom_fields: Record<string, unknown> | null;
  meta_lead_id?: string | null;
  meta_page_id?: string | null;
  meta_form_id?: string | null;
  meta_ad_id?: string | null;
};

function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
}

function normalizeEmail(value: unknown): string | null {
  const email = sanitizeText(value)?.toLowerCase();
  return email || null;
}

function normalizePhone(value: unknown): string | null {
  const input = sanitizeText(value);
  if (!input) return null;

  const hasPlus = input.startsWith('+');
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;

  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('90') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}

function normalizeName(value: unknown): string | null {
  return sanitizeText(value)?.replace(/\s+/g, ' ') || null;
}

function normalizedNameKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || null;
}

function mergeNonEmpty<T>(incoming: T | null | undefined, current: T | null | undefined): T | null | undefined {
  return incoming ?? current;
}

async function getFirstStageId(organizationId: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from('crm_stages')
    .select('id')
    .eq('organization_id', organizationId)
    .order('position', { ascending: true })
    .limit(1)
    .single();

  return data?.id || null;
}

async function findDuplicateLead(
  organizationId: string,
  metaLeadId: string | null,
  email: string | null,
  phone: string | null,
  fullName: string | null
): Promise<LeadRow | null> {
  const supabase = createAdminSupabaseClient();

  if (metaLeadId) {
    const { data } = await supabase
      .from('leads')
      .select('id, full_name, email, phone, stage_id, assigned_to, score, custom_fields, meta_lead_id, meta_page_id, meta_form_id, meta_ad_id')
      .eq('organization_id', organizationId)
      .eq('meta_lead_id', metaLeadId)
      .maybeSingle();

    if (data) return data as LeadRow;
  }

  if (!email && !phone) return null;

  const recentThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('leads')
    .select('id, full_name, email, phone, stage_id, assigned_to, score, custom_fields, meta_lead_id, meta_page_id, meta_form_id, meta_ad_id')
    .eq('organization_id', organizationId)
    .gte('created_at', recentThreshold)
    .order('created_at', { ascending: false })
    .limit(5);

  if (email && phone) {
    query = query.or(`email.eq.${email},phone.eq.${phone}`);
  } else if (email) {
    query = query.eq('email', email);
  } else if (phone) {
    query = query.eq('phone', phone);
  }

  const { data } = await query;
  if (!data?.length) return null;

  const incomingNameKey = normalizedNameKey(fullName);

  return (
    (data as LeadRow[]).find((lead) => {
      const emailMatches = Boolean(email && lead.email === email);
      const phoneMatches = Boolean(phone && lead.phone === phone);
      if (!emailMatches && !phoneMatches) return false;

      const existingNameKey = normalizedNameKey(lead.full_name);
      if (incomingNameKey && existingNameKey && incomingNameKey !== existingNameKey) {
        return false;
      }

      return true;
    }) || null
  );
}

export async function resolveLeadIngestionOrganization(provider: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const { data: integration } = await supabase
    .from('integration_settings')
    .select('config, is_active')
    .eq('provider', provider)
    .maybeSingle();

  const configOrgId = sanitizeText((integration?.config as Record<string, unknown> | null)?.organization_id);
  if (integration?.is_active && configOrgId) return configOrgId;

  const envOrgId = sanitizeText(process.env.DEFAULT_ORG_ID);
  if (envOrgId) return envOrgId;

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('is_active', true)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return membership?.organization_id || null;
}

export async function getIntegrationConfig(provider: string): Promise<Record<string, unknown> | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from('integration_settings')
    .select('config, is_active')
    .eq('provider', provider)
    .maybeSingle();

  if (!data?.is_active) return null;
  return (data.config as Record<string, unknown>) || null;
}

export async function ingestLead(input: NormalizedLeadInput) {
  const supabase = createAdminSupabaseClient();

  const fullName = normalizeName(input.fullName);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const metaLeadId = sanitizeText(input.metaLeadId);
  const metaPageId = sanitizeText(input.metaPageId);
  const metaFormId = sanitizeText(input.metaFormId);
  const metaAdId = sanitizeText(input.metaAdId);
  const rawPayload = input.rawPayload ?? input.payload;

  const eventPayload = {
    organization_id: input.organizationId,
    source: input.source,
    meta_lead_id: metaLeadId,
    meta_page_id: metaPageId,
    meta_form_id: metaFormId,
    meta_ad_id: metaAdId,
    full_name: fullName,
    email,
    phone,
    raw_payload: rawPayload,
    payload: input.payload,
  };

  const { data: createdEvent, error: eventError } = await supabase
    .from('lead_events')
    .insert({
      provider: input.provider,
      event_type: input.eventType,
      external_id: input.eventExternalId || metaLeadId,
      payload: eventPayload,
      status: 'received',
    })
    .select('id')
    .single();

  if (eventError) {
    throw new Error(`Failed to log lead event: ${eventError.message}`);
  }

  try {
    const duplicateLead = await findDuplicateLead(input.organizationId, metaLeadId, email, phone, fullName);
    const defaultStageId = input.stageId ?? (duplicateLead ? duplicateLead.stage_id : await getFirstStageId(input.organizationId));

    if (duplicateLead) {
      const mergedCustomFields = {
        ...(duplicateLead.custom_fields || {}),
        ...(input.customFields || {}),
      };

      const updatePayload = {
        full_name: mergeNonEmpty(fullName, duplicateLead.full_name),
        email: mergeNonEmpty(email, duplicateLead.email),
        phone: mergeNonEmpty(phone, duplicateLead.phone),
        meta_lead_id: mergeNonEmpty(metaLeadId, duplicateLead.meta_lead_id),
        meta_page_id: mergeNonEmpty(metaPageId, duplicateLead.meta_page_id),
        meta_form_id: mergeNonEmpty(metaFormId, duplicateLead.meta_form_id),
        meta_ad_id: mergeNonEmpty(metaAdId, duplicateLead.meta_ad_id),
        stage_id: duplicateLead.stage_id || defaultStageId,
        score: duplicateLead.score ?? input.score ?? 0,
        source_platform: input.source,
        external_platform_id: metaLeadId || input.eventExternalId || duplicateLead.meta_lead_id || null,
        campaign_name: sanitizeText(input.campaignName),
        ad_name: sanitizeText(input.adName),
        form_name: sanitizeText(input.formName),
        assigned_to: input.assignedTo ?? duplicateLead.assigned_to ?? null,
        custom_fields: mergedCustomFields,
        raw_payload: rawPayload,
        updated_at: new Date().toISOString(),
      };

      if (!updatePayload.campaign_name) delete (updatePayload as Record<string, unknown>).campaign_name;
      if (!updatePayload.ad_name) delete (updatePayload as Record<string, unknown>).ad_name;
      if (!updatePayload.form_name) delete (updatePayload as Record<string, unknown>).form_name;
      if (!input.assignedTo) delete (updatePayload as Record<string, unknown>).assigned_to;

      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', duplicateLead.id)
        .eq('organization_id', input.organizationId)
        .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
        .single();

      if (updateError) {
        throw new Error(`Failed to update lead: ${updateError.message}`);
      }

      await supabase
        .from('lead_events')
        .update({
          status: 'processed',
        })
        .eq('id', createdEvent.id);

      return { lead: updatedLead, eventId: createdEvent.id, action: 'updated' as const };
    }

    const insertPayload = {
      organization_id: input.organizationId,
      full_name: fullName,
      email,
      phone,
      stage_id: defaultStageId,
      score: input.score ?? 0,
      assigned_to: input.assignedTo ?? null,
      source_platform: input.source,
      external_platform_id: metaLeadId || input.eventExternalId || null,
      meta_lead_id: metaLeadId,
      meta_page_id: metaPageId,
      meta_form_id: metaFormId,
      meta_ad_id: metaAdId,
      campaign_name: sanitizeText(input.campaignName),
      ad_name: sanitizeText(input.adName),
      form_name: sanitizeText(input.formName),
      custom_fields: input.customFields || {},
      raw_payload: rawPayload,
      first_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdLead, error: insertError } = await supabase
      .from('leads')
      .insert(insertPayload)
      .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
      .single();

    if (insertError) {
      throw new Error(`Failed to create lead: ${insertError.message}`);
    }

    await supabase
      .from('lead_events')
      .update({
        status: 'processed',
      })
      .eq('id', createdEvent.id);

    return { lead: createdLead, eventId: createdEvent.id, action: 'created' as const };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown ingestion error';

    await supabase
      .from('lead_events')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', createdEvent.id);

    throw error;
  }
}
