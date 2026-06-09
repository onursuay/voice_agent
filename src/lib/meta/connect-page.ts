import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_GRAPH_VERSION = 'v23.0';
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  source?: 'direct' | 'business_manager';
}

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

interface SubscribedApp {
  id: string;
  subscribed_fields?: string[];
  [key: string]: unknown;
}

interface LeadgenForm {
  id: string;
  name?: string;
  status?: string;
  created_time?: string;
}

/**
 * Fetch Lead Forms for the given page. Requires pages_manage_ads permission.
 * Non-fatal: returns [] on failure so the connection flow continues.
 */
export async function fetchLeadgenForms(
  pageId: string,
  pageToken: string
): Promise<LeadgenForm[]> {
  const url = new URL(`${META_GRAPH_BASE}/${pageId}/leadgen_forms`);
  url.searchParams.set('fields', 'id,name,status,created_time');
  url.searchParams.set('limit', '100');
  url.searchParams.set('access_token', pageToken);

  try {
    const res = await fetch(url.toString());
    const body = await res.text();
    console.log(`[Meta leadgen_forms] page=${pageId} status=${res.status} body=${body.slice(0, 500)}`);
    if (!res.ok) return [];
    const parsed = JSON.parse(body) as { data?: LeadgenForm[] };
    return parsed.data ?? [];
  } catch (err) {
    console.warn(`[Meta leadgen_forms] fetch failed page=${pageId}: ${err}`);
    return [];
  }
}

/**
 * DELETE existing subscription, POST new one, then GET verify.
 * Returns { success, subscribed_fields, error? }.
 *
 * The POST acts as a permission gate: a page the user did not grant lead access
 * for (pages_manage_metadata / leads_retrieval) fails here, so it never gets saved.
 */
export async function hardSubscribePageToWebhook(
  pageId: string,
  pageToken: string
): Promise<{ success: boolean; subscribed_fields?: string[]; error?: string }> {
  const headers = {
    Authorization: `Bearer ${pageToken}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Step 1: DELETE old subscription (best-effort — ignore failure)
  try {
    const delRes = await fetch(`${META_GRAPH_BASE}/${pageId}/subscribed_apps`, {
      method: 'DELETE',
      headers,
    });
    const delBody = await delRes.text();
    console.log(`[Meta subscribe] DELETE page=${pageId} status=${delRes.status} body=${delBody}`);
  } catch (err) {
    console.warn(`[Meta subscribe] DELETE failed (ignoring): ${err}`);
  }

  // Step 2: POST new subscription
  const postBody = new URLSearchParams({ subscribed_fields: 'leadgen' });
  const postRes = await fetch(`${META_GRAPH_BASE}/${pageId}/subscribed_apps`, {
    method: 'POST',
    headers,
    body: postBody.toString(),
  });
  const postText = await postRes.text();
  console.log(`[Meta subscribe] POST page=${pageId} status=${postRes.status} body=${postText}`);

  if (!postRes.ok) {
    return { success: false, error: `POST subscribed_apps failed (${postRes.status}): ${postText}` };
  }

  // Step 3: GET verify — confirm app appears in subscribed_apps list
  try {
    const getRes = await fetch(`${META_GRAPH_BASE}/${pageId}/subscribed_apps`, {
      method: 'GET',
      headers,
    });
    const getBody = await getRes.text();
    console.log(`[Meta subscribe] GET verify page=${pageId} status=${getRes.status} body=${getBody}`);

    if (getRes.ok) {
      const parsed = JSON.parse(getBody) as { data?: SubscribedApp[] };
      const apps: SubscribedApp[] = parsed.data || [];

      // Find our app — match by META_APP_ID if set, otherwise accept any app with leadgen
      const ourApp = META_APP_ID
        ? apps.find((a) => String(a.id) === String(META_APP_ID))
        : apps.find((a) => (a.subscribed_fields || []).includes('leadgen'));

      if (ourApp) {
        console.log(`[Meta subscribe] Verified: app=${ourApp.id} fields=${JSON.stringify(ourApp.subscribed_fields)}`);
        return { success: true, subscribed_fields: ourApp.subscribed_fields || ['leadgen'] };
      }
      console.warn(`[Meta subscribe] POST ok but app not found in subscribed list: ${getBody}`);
      // POST was ok, so treat as success even if verification is inconclusive
      return { success: true, subscribed_fields: ['leadgen'] };
    }
  } catch (err) {
    console.warn(`[Meta subscribe] GET verify failed (ignoring): ${err}`);
  }

  // POST succeeded — accept it
  return { success: true, subscribed_fields: ['leadgen'] };
}

/**
 * Subscribe a page to the leadgen webhook and upsert its meta_leads row.
 * Single source of truth for "wire a page up for lead capture", shared by the
 * OAuth callback (auto-connect) and the select-page endpoints.
 *
 * Returns { success: false } (without writing a row) when the page cannot be
 * subscribed, so a page the user never granted access to is silently skipped.
 */
export async function connectPageForLeads(
  admin: AdminClient,
  orgId: string,
  page: FacebookPage,
  userToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!page.access_token) {
    console.error(`[Meta connectPage] Missing page access token for page=${page.id}`);
    return { success: false, error: 'missing_token' };
  }

  const subscribeResult = await hardSubscribePageToWebhook(page.id, page.access_token);
  if (!subscribeResult.success) {
    console.error(`[Meta connectPage] Webhook subscription failed for page=${page.id}: ${subscribeResult.error}`);
    return { success: false, error: subscribeResult.error };
  }

  const { data: existing } = await admin
    .from('integration_settings')
    .select('id')
    .eq('provider', 'meta_leads')
    .filter('config->>organization_id', 'eq', orgId)
    .filter('config->>page_id', 'eq', page.id)
    .maybeSingle();

  // Fetch Lead Forms for this page (exercises pages_manage_ads permission)
  const leadgenForms = await fetchLeadgenForms(page.id, page.access_token);
  console.log(`[Meta connectPage] Fetched ${leadgenForms.length} lead forms for page=${page.id}`);

  const now = new Date().toISOString();
  const config = {
    organization_id: orgId,
    page_id: page.id,
    page_name: page.name,
    access_token: page.access_token,
    user_access_token: userToken,
    connected_at: now,
    expires_at: new Date(Date.now() + 59 * 24 * 60 * 60 * 1000).toISOString(),
    webhook_subscribed: true,
    webhook_subscribed_fields: subscribeResult.subscribed_fields || ['leadgen'],
    webhook_subscribed_at: now,
    leadgen_forms: leadgenForms,
    leadgen_forms_fetched_at: now,
  };

  if (existing) {
    const { error: updateErr } = await admin
      .from('integration_settings')
      .update({ config, is_active: true })
      .eq('id', existing.id);
    if (updateErr) {
      console.error(`[Meta connectPage] Update failed page=${page.id}: ${updateErr.message}`);
      return { success: false, error: updateErr.message };
    }
  } else {
    const { error: insertErr } = await admin
      .from('integration_settings')
      .insert({ provider: 'meta_leads', config, is_active: true });
    if (insertErr) {
      console.error(`[Meta connectPage] Insert failed page=${page.id}: ${insertErr.message}`);
      return { success: false, error: insertErr.message };
    }
  }

  console.log(`[Meta connectPage] Connected page=${page.name} (${page.id}) for org=${orgId}`);
  return { success: true };
}

/**
 * Ask Meta which pages the user actually authorized for lead access in the OAuth
 * dialog (granular permissions), via /debug_token.
 *
 * - { unrestricted: true }  → the grant covers all pages (no per-page restriction)
 *   OR the lookup failed (fail open — the subscription gate then filters out any
 *   page that wasn't really granted).
 * - { unrestricted: false, ids } → connect only these explicitly-granted page ids.
 *   An empty set means lead access was not granted for any page.
 */
export async function fetchGrantedLeadPageIds(
  userToken: string
): Promise<{ unrestricted: boolean; ids: Set<string> }> {
  if (!META_APP_ID || !META_APP_SECRET) return { unrestricted: true, ids: new Set() };

  try {
    const url = new URL(`${META_GRAPH_BASE}/debug_token`);
    url.searchParams.set('input_token', userToken);
    url.searchParams.set('access_token', `${META_APP_ID}|${META_APP_SECRET}`);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`[Meta debug_token] status=${res.status} — falling back to all granted pages`);
      return { unrestricted: true, ids: new Set() };
    }

    const body = await res.json() as {
      data?: {
        scopes?: string[];
        granular_scopes?: { scope: string; target_ids?: string[] }[];
      };
    };
    const data = body.data;
    if (!data) return { unrestricted: true, ids: new Set() };

    const leadScope = (data.granular_scopes || []).find((s) => s.scope === 'leads_retrieval');
    if (leadScope) {
      const targets = leadScope.target_ids || [];
      if (targets.length > 0) {
        console.log(`[Meta debug_token] granted leads_retrieval for ${targets.length} page(s): ${targets.join(',')}`);
        return { unrestricted: false, ids: new Set(targets) };
      }
      // Scope granted with no per-page restriction → all pages.
      return { unrestricted: true, ids: new Set() };
    }

    // leads_retrieval present only at the flat scope level → treat as broad grant.
    if ((data.scopes || []).includes('leads_retrieval')) {
      return { unrestricted: true, ids: new Set() };
    }

    // Lead access not granted at all.
    console.warn('[Meta debug_token] leads_retrieval not granted');
    return { unrestricted: false, ids: new Set() };
  } catch (err) {
    console.warn(`[Meta debug_token] lookup failed (${err}) — falling back to all granted pages`);
    return { unrestricted: true, ids: new Set() };
  }
}
