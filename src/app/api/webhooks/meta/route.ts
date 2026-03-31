// ============================================
// YO DIJITAL - Meta Lead Form Webhook Endpoint
// Handles Facebook/Instagram Lead Ads webhooks
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizePhone } from '@/lib/utils';
import { parseMetaLeadFields } from '@/lib/meta';

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'yodijital_webhook_2026';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || '';
const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Create a Supabase admin client that bypasses RLS.
 * Webhooks are unauthenticated, so we need the service role key.
 */
function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── GET: Webhook Verification ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verification successful');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Meta Webhook] Verification failed - invalid token');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ─── POST: Receive Lead Data ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Always return 200 quickly to Meta
  // Process in the same request but catch all errors
  try {
    const body = await request.json();
    console.log('[Meta Webhook] Received:', JSON.stringify(body).slice(0, 500));

    if (body.object !== 'page') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Process each entry in the background-style (but within the request)
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'leadgen') {
          // Fire and forget - don't await to keep response fast
          // But since we're in a serverless function, we need to await
          await processLeadgenEvent(change.value, entry.id).catch((err) => {
            console.error('[Meta Webhook] Error processing leadgen event:', err);
          });
        }
      }
    }
  } catch (err) {
    console.error('[Meta Webhook] Error parsing request:', err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Lead Processing ─────────────────────────────────────────────────

interface LeadgenValue {
  leadgen_id: string;
  page_id: string;
  form_id: string;
  created_time: number;
}

async function processLeadgenEvent(value: LeadgenValue, entryPageId: string) {
  const { leadgen_id, page_id, form_id } = value;
  const supabase = createAdminSupabase();

  // Resolve organization_id from page_id or fallback
  const orgId = await resolveOrganizationId(supabase, page_id || entryPageId);
  if (!orgId) {
    console.error('[Meta Webhook] No organization found for page_id:', page_id);
    return;
  }

  // Step 1: Fetch lead data from Meta Graph API
  let leadData: any = null;
  let formName: string | null = null;
  let adInfo: { ad_name?: string; campaign_name?: string; adset_name?: string } = {};

  try {
    leadData = await fetchGraphApi(`/${leadgen_id}`, {});
  } catch (err) {
    console.error('[Meta Webhook] Failed to fetch lead data:', err);
    // Save raw webhook to lead_sources with processed=false for retry
    await saveRawLeadSource(supabase, orgId, value, null, false);
    return;
  }

  // Step 2: Fetch form name
  try {
    const formData = await fetchGraphApi(`/${form_id}`, { fields: 'name' });
    formName = formData?.name || null;
  } catch (err) {
    console.warn('[Meta Webhook] Failed to fetch form name:', err);
  }

  // Step 3: Fetch ad/campaign info if ad_id exists
  if (leadData?.ad_id) {
    try {
      const adData = await fetchGraphApi(`/${leadData.ad_id}`, {
        fields: 'name,campaign{name},adset{name}',
      });
      adInfo = {
        ad_name: adData?.name || null,
        campaign_name: adData?.campaign?.name || null,
        adset_name: adData?.adset?.name || null,
      };
    } catch (err) {
      console.warn('[Meta Webhook] Failed to fetch ad info:', err);
    }
  }

  // Step 4: Parse field_data
  const fieldData = leadData?.field_data || [];
  const parsed = parseMetaLeadFields(fieldData);

  // Step 5: Normalize phone
  const phone = parsed.phone ? normalizePhone(parsed.phone) : null;
  const email = parsed.email?.trim().toLowerCase() || null;

  // Step 6: Save raw data to lead_sources
  const leadSource = await saveRawLeadSource(supabase, orgId, value, {
    lead_data: leadData,
    form_name: formName,
    ad_info: adInfo,
    parsed_fields: parsed,
  }, true);

  // Enrich the lead source with campaign/ad info
  if (leadSource) {
    await supabase
      .from('lead_sources')
      .update({
        campaign_id: leadData?.campaign_id || null,
        campaign_name: adInfo.campaign_name || null,
        ad_set_id: leadData?.adset_id || null,
        ad_set_name: adInfo.adset_name || null,
        ad_id: leadData?.ad_id || null,
        ad_name: adInfo.ad_name || null,
        form_id: form_id,
        form_name: formName,
      })
      .eq('id', leadSource.id);
  }

  // Step 7: Dedupe check
  let existingLead: any = null;

  if (phone) {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .eq('phone', phone)
      .single();
    if (data) existingLead = data;
  }

  if (!existingLead && email) {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .eq('email', email)
      .single();
    if (data) existingLead = data;
  }

  if (!existingLead) {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .eq('external_platform_id', leadgen_id)
      .single();
    if (data) existingLead = data;
  }

  if (existingLead) {
    // Step 8: Merge/update - don't overwrite non-null with null
    const mergeFields: Record<string, unknown> = {};
    const fieldMap: Record<string, unknown> = {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      full_name: parsed.full_name,
      email: email,
      phone: phone,
      company: parsed.company,
      job_title: parsed.job_title,
      city: parsed.city,
      campaign_name: adInfo.campaign_name,
      ad_set_name: adInfo.adset_name,
      ad_name: adInfo.ad_name,
      form_name: formName,
      external_platform_id: leadgen_id,
    };

    for (const [key, val] of Object.entries(fieldMap)) {
      if (val && !existingLead[key]) {
        mergeFields[key] = val;
      }
    }

    // Merge custom_fields
    if (Object.keys(parsed.custom_fields).length > 0) {
      mergeFields.custom_fields = {
        ...(existingLead.custom_fields || {}),
        ...parsed.custom_fields,
      };
    }

    mergeFields.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('leads')
      .update(mergeFields)
      .eq('id', existingLead.id);

    if (error) {
      console.error('[Meta Webhook] Failed to update lead:', error);
    }

    // Step 10: Activity log
    await supabase.from('lead_activities').insert({
      lead_id: existingLead.id,
      organization_id: orgId,
      user_id: null,
      activity_type: 'imported',
      title: 'Meta Lead Form verisi guncellendi',
      description: `Form: ${formName || form_id} | Lead ID: ${leadgen_id}`,
      metadata: {
        source: 'meta_lead_form',
        leadgen_id,
        form_id,
        form_name: formName,
        merged_fields: Object.keys(mergeFields),
      },
    });

    // Step 11: Link lead_sources to lead
    if (leadSource) {
      await supabase
        .from('lead_sources')
        .update({ lead_id: existingLead.id })
        .eq('id', leadSource.id);
    }

    console.log(`[Meta Webhook] Updated existing lead ${existingLead.id} for leadgen_id ${leadgen_id}`);
  } else {
    // Step 9: Create new lead
    const firstStageId = await getFirstStageId(supabase, orgId);

    const newLead = {
      organization_id: orgId,
      phone,
      email,
      external_platform_id: leadgen_id,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      full_name: parsed.full_name,
      company: parsed.company,
      job_title: parsed.job_title,
      city: parsed.city,
      country: null,
      stage_id: firstStageId,
      assigned_to: null,
      score: 0,
      source_platform: 'meta_lead_form' as const,
      campaign_name: adInfo.campaign_name || null,
      ad_set_name: adInfo.adset_name || null,
      ad_name: adInfo.ad_name || null,
      form_name: formName,
      utm_source: 'facebook',
      utm_medium: 'paid',
      utm_campaign: adInfo.campaign_name || null,
      utm_content: null,
      utm_term: null,
      tags: [],
      custom_fields: parsed.custom_fields,
      notes_count: 0,
      activities_count: 0,
      first_seen_at: new Date().toISOString(),
    };

    const { data: createdLead, error } = await supabase
      .from('leads')
      .insert(newLead)
      .select('id')
      .single();

    if (error) {
      console.error('[Meta Webhook] Failed to create lead:', error);
      return;
    }

    // Step 10: Activity log
    await supabase.from('lead_activities').insert({
      lead_id: createdLead.id,
      organization_id: orgId,
      user_id: null,
      activity_type: 'created',
      title: 'Meta Lead Form ile olusturuldu',
      description: `Form: ${formName || form_id} | Lead ID: ${leadgen_id}`,
      metadata: {
        source: 'meta_lead_form',
        leadgen_id,
        form_id,
        form_name: formName,
        campaign_name: adInfo.campaign_name,
      },
    });

    // Step 11: Link lead_sources to lead
    if (leadSource) {
      await supabase
        .from('lead_sources')
        .update({ lead_id: createdLead.id })
        .eq('id', leadSource.id);
    }

    console.log(`[Meta Webhook] Created new lead ${createdLead.id} for leadgen_id ${leadgen_id}`);
  }
}

// ─── Helper Functions ────────────────────────────────────────────────

async function fetchGraphApi(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  url.searchParams.set('access_token', META_ACCESS_TOKEN);
  for (const [key, val] of Object.entries(params)) {
    url.searchParams.set(key, val);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Graph API ${response.status}: ${errorBody}`);
  }

  return response.json();
}

async function resolveOrganizationId(supabase: any, pageId: string): Promise<string | null> {
  // TODO: Implement page_id -> organization mapping table
  // For now, use DEFAULT_ORG_ID or fall back to the first org in the system
  if (DEFAULT_ORG_ID) {
    return DEFAULT_ORG_ID;
  }

  const { data } = await supabase
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return data?.id || null;
}

async function getFirstStageId(supabase: any, orgId: string): Promise<string | null> {
  const { data } = await supabase
    .from('crm_stages')
    .select('id')
    .eq('organization_id', orgId)
    .order('position', { ascending: true })
    .limit(1)
    .single();

  return data?.id || null;
}

async function saveRawLeadSource(
  supabase: any,
  orgId: string,
  webhookValue: LeadgenValue,
  enrichedData: any | null,
  processed: boolean
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('lead_sources')
    .insert({
      organization_id: orgId,
      lead_id: null,
      platform: 'meta_lead_form',
      platform_lead_id: webhookValue.leadgen_id,
      form_id: webhookValue.form_id,
      raw_data: {
        webhook_value: webhookValue,
        ...(enrichedData || {}),
      },
      received_at: new Date().toISOString(),
      processed,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Meta Webhook] Failed to save lead_source:', error);
    return null;
  }

  return data;
}
