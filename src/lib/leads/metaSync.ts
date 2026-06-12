import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { parseMetaLeadFields } from '@/lib/meta';
import { ingestLead } from '@/lib/leads/ingest';

// ── Meta Lead Ads güvenlik-ağı senkronizasyonu ──────────────────────────────
// Webhook birincil yoldur; ama teslimat sessizce bayatlayabilir (sayfa abone
// görünür ama lead gelmez) VEYA yeni/değişen formlar olabilir. Bu reconcile,
// her bağlı sayfanın TÜM formlarını periyodik tarayıp CRM'de eksik lead'leri
// çeker — form_id'den bağımsız, leadgen_id ile. Eksik (gerçekten kaçmış) lead'ler
// ingestLead üzerinden eklenir; bu da dedup eder ve yeni kayıtta routing tetikler.

const META_GRAPH_VERSION = 'v23.0';
const BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

interface PageAcct {
  organizationId: string;
  pageId: string;
  pageName: string | null;
  token: string;
}

type Admin = ReturnType<typeof createAdminSupabaseClient>;

async function activePages(admin: Admin): Promise<PageAcct[]> {
  const { data } = await admin
    .from('integration_settings')
    .select('config')
    .eq('provider', 'meta_leads')
    .eq('is_active', true);

  // (org, page) çifti başına tekille — aynı sayfa birden fazla org'a bağlıysa
  // (ör. ana org + Meta Review org) her birine ayrı reconcile yapılır.
  const map = new Map<string, PageAcct>();
  for (const r of (data || []) as Array<{ config: Record<string, unknown> }>) {
    const c = r.config || {};
    const pageId = typeof c.page_id === 'string' ? c.page_id : null;
    const token = typeof c.access_token === 'string' ? c.access_token : null;
    const org = typeof c.organization_id === 'string' ? c.organization_id : null;
    if (pageId && token && org) {
      const key = `${org}|${pageId}`;
      if (!map.has(key)) {
        map.set(key, { organizationId: org, pageId, pageName: (c.page_name as string) ?? null, token });
      }
    }
  }
  return [...map.values()];
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return { error: { message: 'fetch_failed' } };
  }
}

type GraphLead = { id: string; created_time: string; field_data?: Array<{ name: string; values?: string[] }>; ad_id?: string; form_id?: string };

async function fetchRecentFormLeads(formId: string, token: string, sinceMs: number): Promise<GraphLead[]> {
  const out: GraphLead[] = [];
  let url: string | null =
    `${BASE}/${formId}/leads?fields=id,created_time,field_data,ad_id&limit=100&access_token=${encodeURIComponent(token)}`;
  let guard = 0;
  while (url && guard++ < 25) {
    const j = await fetchJson(url);
    if (j.error) break;
    const rows = (j.data as GraphLead[]) || [];
    for (const ld of rows) out.push(ld);
    const last = rows[rows.length - 1];
    if (last && new Date(last.created_time).getTime() < sinceMs) break;
    url = ((j.paging as { next?: string })?.next) || null;
  }
  return out.filter((l) => new Date(l.created_time).getTime() >= sinceMs);
}

export interface ReconcileResult {
  pagesChecked: number;
  pagesFailed: number;
  synced: number;
  skipped: number;
  errors: number;
  lookbackDays: number;
}

export async function reconcileMetaLeads(opts: { lookbackDays?: number } = {}): Promise<ReconcileResult> {
  const admin = createAdminSupabaseClient();
  const lookbackDays = opts.lookbackDays ?? 3;
  const sinceMs = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const pages = await activePages(admin);

  let synced = 0, skipped = 0, errors = 0, pagesChecked = 0, pagesFailed = 0;

  for (const p of pages) {
    pagesChecked++;
    const forms = await fetchJson(
      `${BASE}/${p.pageId}/leadgen_forms?fields=id,leads_count&limit=100&access_token=${encodeURIComponent(p.token)}`,
    );
    if (forms.error) {
      // Token geçersiz/expired (ör. Meta hata 190) → sayfayı atla; "hata" değil ayrı say.
      pagesFailed++;
      console.warn(`[meta-sync] ${p.pageName || p.pageId} forms erişilemedi:`, (forms.error as { message?: string })?.message);
      continue;
    }

    // Tüm formların son lookback penceresindeki lead'lerini topla (form değişse de kapsanır)
    const candidates: GraphLead[] = [];
    for (const f of ((forms.data as Array<{ id: string; leads_count?: number }>) || [])) {
      if (!f.leads_count) continue;
      const leads = await fetchRecentFormLeads(f.id, p.token, sinceMs);
      for (const ld of leads) candidates.push({ ...ld, form_id: f.id });
    }
    if (!candidates.length) continue;

    // CRM'de zaten var olan meta_lead_id'leri çıkar. GLOBAL kontrol: meta_lead_id
    // tüm org'larda benzersizdir (idx_leads_meta_lead_id_unique). Bir sayfa birden
    // fazla org'a bağlıysa, lead yalnız bir org'da yaşar — bu yüzden org-filtresi YOK.
    const ids = candidates.map((c) => c.id);
    const existing = new Set<string>();
    for (let i = 0; i < ids.length; i += 300) {
      const { data } = await admin
        .from('leads')
        .select('meta_lead_id')
        .in('meta_lead_id', ids.slice(i, i + 300));
      for (const r of (data || []) as Array<{ meta_lead_id: string }>) existing.add(r.meta_lead_id);
    }

    for (const ld of candidates) {
      if (existing.has(ld.id)) { skipped++; continue; }
      const parsed = parseMetaLeadFields((ld.field_data || []).map((f) => ({ name: f.name, values: f.values || [] })));
      try {
        await ingestLead({
          organizationId: p.organizationId,
          provider: 'meta_leads',
          eventType: 'leadgen_reconcile',
          eventExternalId: ld.id,
          payload: { reconcile: true, lead_id: ld.id, form_id: ld.form_id, page_id: p.pageId },
          source: 'meta_lead_form',
          metaLeadId: ld.id,
          metaPageId: p.pageId,
          metaFormId: ld.form_id ?? null,
          metaAdId: ld.ad_id ?? null,
          fullName: parsed.full_name,
          email: parsed.email,
          phone: parsed.phone,
          city: parsed.city,
          customFields: parsed.custom_fields,
          rawPayload: { graph_lead: { id: ld.id, field_data: ld.field_data, created_time: ld.created_time }, reconcile: true },
        });
        synced++;
      } catch (e) {
        errors++;
        console.error(`[meta-sync] ingest hata lead=${ld.id}`, e instanceof Error ? e.message : e);
      }
    }
  }

  return { pagesChecked, synced, skipped, errors, lookbackDays };
}
