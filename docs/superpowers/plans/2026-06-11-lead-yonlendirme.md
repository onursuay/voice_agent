# Lead Yönlendirme Kural Motoru + E-posta — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yeni düşen leadleri kurallara göre (şehir → satış temsilcisi) otomatik atayıp temsilciye e-posta gönder; sonucu "İletildi" durumu olarak göster.

**Architecture:** Mevcut `automation_rules` tablosu (JSON config) üzerinde jenerik kural motoru. Yeni lead `ingestLead`'te oluşunca (yalnızca Meta) best-effort tetiklenir; import/manuel için butonla tetiklenir. İlk uyan kural lead'i atar + Resend ile mail atar; her gönderim `email_log`'a yazılır, lead'de `routing_status` güncellenir.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL + RLS), Resend, next-intl, TypeScript.

**Test yaklaşımı:** Projeye test altyapısı/dosyası **EKLENMEZ** (kullanıcı isteği — geçici/test alanı istenmiyor). Doğrulama yalnızca `npm run build` + `npm run lint` + elle (localhost) doğrulama ile yapılır.

**Referans spec:** [docs/superpowers/specs/2026-06-11-lead-yonlendirme-kural-motoru-design.md](../specs/2026-06-11-lead-yonlendirme-kural-motoru-design.md)

---

## Dosya Yapısı

**Yeni:**
- `supabase/migrations/20260611_lead_routing.sql` — DB değişiklikleri
- `src/lib/email/resend.ts` — Resend client
- `src/lib/email/send.ts` — `sendEmail()`
- `src/lib/email/templates.ts` — varsayılan şablon + `renderTemplate()` + `leadToVars()`
- `src/lib/crm/ruleConditions.ts` — koşul normalize + değerlendirme (saf)
- `src/lib/crm/routingEngine.ts` — `evaluateLeadRouting()`
- `src/app/api/leads/[id]/route-rules/route.ts` — tek lead manuel tetikleme
- `src/app/api/leads/route-rules/route.ts` — toplu manuel tetikleme

**Değişecek:**
- `src/lib/leads/ingest.ts` — `city` eşlemesi + routing hook (Meta, created)
- `src/lib/meta.ts` — Meta form alanından `city` çıkarımı
- `src/app/api/automations/route.ts` + `[id]/route.ts` — `priority` + sıralama
- `src/app/api/email/templates/route.ts`, `templates/[id]/route.ts`, `history/route.ts`, `send/route.ts` — stub'ları doldur
- `src/components/leads/lead-grid.tsx` — "İletildi" sütunu
- `src/components/leads/lead-toolbar.tsx` — "İçe Aktarma" kaynak filtresi + "Kuralları çalıştır" toplu aksiyonu
- `src/components/leads/lead-detail-drawer.tsx` — "Kuralları çalıştır / Yeniden gönder" + mail geçmişi
- `src/app/[locale]/(dashboard)/automations/page.tsx` — kural listesi/formu (yönlendirme)
- `src/app/[locale]/(dashboard)/email/page.tsx` — şablon editörü + gönderim geçmişi
- `src/messages/tr.json` + `src/messages/en.json` — yeni metin anahtarları
- **Zapier kaldırma:** `src/app/api/webhooks/zapier-leads/route.ts` (sil), `src/lib/leads/ingest.ts`, `src/lib/types.ts`, `src/lib/utils.ts`, `src/app/[locale]/(dashboard)/import/page.tsx`, `src/components/leads/lead-toolbar.tsx`, `src/app/api/webhooks/status/route.ts`, `src/components/landing/LandingHeader.tsx`, `src/components/landing/LandingContent.tsx`

---

## Task 1: DB migration

**Files:**
- Create: `supabase/migrations/20260611_lead_routing.sql`

- [ ] **Step 1: Migration dosyasını yaz**

```sql
-- Lead routing: automation_rules priority, leads routing status, email_log

-- 1) automation_rules: öncelik
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_active
  ON automation_rules(organization_id, is_active, priority);

-- 2) leads: yönlendirme durumu (grid "İletildi" sütunu)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_status TEXT;            -- null|no_match|sent|failed|skipped
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_last_emailed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL;

-- 3) email_log: kalıcı gönderim kaydı
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL,            -- 'sent' | 'failed'
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  trigger TEXT NOT NULL,           -- 'auto' | 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_log_org ON email_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_lead ON email_log(lead_id);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org access" ON email_log FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
```

- [ ] **Step 2: Migration'ı uygula**

Run: `npx supabase db push` (veya proje hangi yöntemi kullanıyorsa — Supabase SQL editöründen elle de çalıştırılabilir).
Expected: Hata yok; `email_log` tablosu ve yeni kolonlar oluşur.

- [ ] **Step 3: Doğrula**

Supabase'de `select column_name from information_schema.columns where table_name='leads' and column_name like 'routing%';` → 3 satır döner. `email_log` tablosu mevcut.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260611_lead_routing.sql
git commit -m "feat(db): lead routing columns + email_log table"
```

---

## Task 2: E-posta modülü (Resend)

**Files:**
- Create: `src/lib/email/resend.ts`, `src/lib/email/send.ts`, `src/lib/email/templates.ts`
- Modify: `.env` / `.env.local` (anahtarlar)

- [ ] **Step 1: Resend'i kur**

Run: `npm i resend`

- [ ] **Step 2: Env değişkenlerini ekle**

`.env.local` (ve deploy ortamı) içine:
```
RESEND_API_KEY=re_xxx
EMAIL_FROM="YO CRM <bildirim@DOMAIN>"
```
Not: `EMAIL_FROM` domaini Resend'de doğrulanmış olmalı.

- [ ] **Step 3: Resend client**

`src/lib/email/resend.ts`:
```ts
import { Resend } from 'resend';

let client: Resend | null = null;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  if (!client) client = new Resend(key);
  return client;
}
```

- [ ] **Step 4: sendEmail**

`src/lib/email/send.ts`:
```ts
import { getResend } from './resend';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string }[];
}

export interface SendEmailResult {
  id: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error('EMAIL_FROM is not set');
  const { data, error } = await getResend().emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });
  if (error) throw new Error(error.message || 'Resend send failed');
  if (!data?.id) throw new Error('Resend returned no id');
  return { id: data.id };
}
```

- [ ] **Step 5: Şablon modülü (saf)**

`src/lib/email/templates.ts`:
```ts
export interface RenderableTemplate {
  subject: string;
  body: string; // HTML, {{var}} placeholder'ları içerir
}

export const DEFAULT_ROUTING_TEMPLATE: RenderableTemplate = {
  subject: 'Yeni lead: {{full_name}} — {{city}}',
  body:
    '<h2>Yeni lead atandı</h2>' +
    '<p><b>Ad Soyad:</b> {{full_name}}</p>' +
    '<p><b>Telefon:</b> {{phone}}</p>' +
    '<p><b>E-posta:</b> {{email}}</p>' +
    '<p><b>Şehir:</b> {{city}}</p>' +
    '<p><b>Kaynak:</b> {{source}}</p>',
};

export type LeadLike = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  company?: string | null;
  source_platform?: string | null;
  campaign_name?: string | null;
};

export function leadToVars(lead: LeadLike): Record<string, string> {
  return {
    full_name: lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '-',
    first_name: lead.first_name || '-',
    last_name: lead.last_name || '-',
    phone: lead.phone || '-',
    email: lead.email || '-',
    city: lead.city || '-',
    company: lead.company || '-',
    source: lead.source_platform || '-',
    campaign: lead.campaign_name || '-',
  };
}

export function renderTemplate(
  tpl: RenderableTemplate,
  vars: Record<string, string>
): { subject: string; html: string } {
  const sub = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '-');
  return { subject: sub(tpl.subject), html: sub(tpl.body) };
}
```

- [ ] **Step 6: Build doğrula**

Run: `npm run build`
Expected: Tip/derleme hatası yok.

- [ ] **Step 7: Commit**

```bash
git add src/lib/email package.json package-lock.json
git commit -m "feat(email): Resend client, sendEmail, template render"
```

---

## Task 3: Kural koşul değerlendirme (saf mantık)

**Files:**
- Create: `src/lib/crm/ruleConditions.ts`

- [ ] **Step 1: Modülü yaz**

`src/lib/crm/ruleConditions.ts`:
```ts
export type Operator = 'equals' | 'not_equals' | 'contains' | 'in';

export interface Condition {
  field: string;        // örn. 'city'
  operator: Operator;
  value: string | string[];
}

export interface TriggerConfig {
  conditions?: Condition[];
  match?: 'all' | 'any';
}

// Türkçe-duyarlı normalize: küçük harf + trim + boşluk sadeleştir + aksan kaldır
export function normalizeValue(v: unknown): string {
  if (v == null) return '';
  let s = String(v).toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ');
  // Türkçe karakter sadeleştirme (İstanbul/Istanbul toleransı)
  s = s
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function leadFieldValue(lead: Record<string, unknown>, field: string): string {
  return normalizeValue(lead[field]);
}

export function evaluateCondition(cond: Condition, lead: Record<string, unknown>): boolean {
  const left = leadFieldValue(lead, cond.field);
  if (cond.operator === 'in') {
    const arr = (Array.isArray(cond.value) ? cond.value : [cond.value]).map(normalizeValue);
    return arr.includes(left);
  }
  const right = normalizeValue(Array.isArray(cond.value) ? cond.value[0] : cond.value);
  switch (cond.operator) {
    case 'equals': return left === right;
    case 'not_equals': return left !== right;
    case 'contains': return left.includes(right);
    default: return false;
  }
}

export function evaluateConditions(cfg: TriggerConfig, lead: Record<string, unknown>): boolean {
  const conditions = cfg.conditions || [];
  if (conditions.length === 0) return true; // koşulsuz = catch-all
  const match = cfg.match || 'all';
  return match === 'any'
    ? conditions.some((c) => evaluateCondition(c, lead))
    : conditions.every((c) => evaluateCondition(c, lead));
}
```

- [ ] **Step 2: Build doğrula**

Run: `npm run build`
Expected: Hata yok.

- [ ] **Step 3: Commit**

```bash
git add src/lib/crm/ruleConditions.ts
git commit -m "feat(crm): rule condition evaluation (tr-normalized)"
```

---

## Task 4: Yönlendirme motoru (`evaluateLeadRouting`)

**Files:**
- Create: `src/lib/crm/routingEngine.ts`

- [ ] **Step 1: Motoru yaz**

`src/lib/crm/routingEngine.ts`:
```ts
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { DEFAULT_ROUTING_TEMPLATE, leadToVars, renderTemplate, type RenderableTemplate } from '@/lib/email/templates';
import { evaluateConditions, type TriggerConfig } from '@/lib/crm/ruleConditions';

export type RoutingTrigger = 'auto' | 'manual';

export interface RoutingResult {
  status: 'sent' | 'failed' | 'no_match' | 'skipped';
  ruleId?: string | null;
  error?: string;
}

interface ActionConfig {
  assigned_to?: string | null;
  send_email?: boolean;
  email_template_id?: string | null;
}

export async function evaluateLeadRouting(
  leadId: string,
  opts: { trigger: RoutingTrigger; force?: boolean }
): Promise<RoutingResult> {
  const supabase = createAdminSupabaseClient();
  try {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    if (!lead) return { status: 'failed', error: 'lead not found' };

    // Otomatik yolda zaten gönderildiyse atla
    if (opts.trigger === 'auto' && !opts.force && lead.routing_status === 'sent') {
      return { status: 'skipped', ruleId: lead.routing_rule_id };
    }

    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('organization_id', lead.organization_id)
      .eq('is_active', true)
      .eq('action_type', 'route_lead')
      .order('priority', { ascending: true });

    const matched = (rules || []).find((r) =>
      evaluateConditions((r.trigger_config || {}) as TriggerConfig, lead as Record<string, unknown>)
    );

    if (!matched) {
      await supabase.from('leads').update({ routing_status: 'no_match' }).eq('id', leadId);
      return { status: 'no_match' };
    }

    const action = (matched.action_config || {}) as ActionConfig;

    // Atama
    if (action.assigned_to && action.assigned_to !== lead.assigned_to) {
      await supabase.from('leads').update({ assigned_to: action.assigned_to }).eq('id', leadId);
      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        organization_id: lead.organization_id,
        type: 'assigned',
        metadata: { from_user: lead.assigned_to, to_user: action.assigned_to, by: 'routing_rule', rule_id: matched.id },
      });
    }

    let status: RoutingResult['status'] = 'no_match';
    let providerMessageId: string | null = null;
    let errorMessage: string | null = null;

    if (action.send_email) {
      // Alıcı: atanan kullanıcının e-postası
      const recipientId = action.assigned_to || lead.assigned_to;
      const { data: recipient } = recipientId
        ? await supabase.from('profiles').select('id, email').eq('id', recipientId).single()
        : { data: null };

      // Şablon
      let tpl: RenderableTemplate = DEFAULT_ROUTING_TEMPLATE;
      if (action.email_template_id) {
        const { data: t } = await supabase
          .from('email_templates')
          .select('subject, body')
          .eq('id', action.email_template_id)
          .single();
        if (t) tpl = { subject: t.subject, body: t.body };
      }
      const { subject, html } = renderTemplate(tpl, leadToVars(lead));

      if (!recipient?.email) {
        status = 'failed';
        errorMessage = 'recipient has no email';
      } else {
        try {
          const res = await sendEmail({ to: recipient.email, subject, html });
          providerMessageId = res.id;
          status = 'sent';
        } catch (e) {
          status = 'failed';
          errorMessage = e instanceof Error ? e.message : 'send failed';
        }
      }

      // email_log
      await supabase.from('email_log').insert({
        organization_id: lead.organization_id,
        lead_id: leadId,
        rule_id: matched.id,
        recipient_user_id: recipientId || null,
        to_email: recipient?.email || '-',
        subject,
        body: html,
        status: status === 'sent' ? 'sent' : 'failed',
        provider: 'resend',
        provider_message_id: providerMessageId,
        error_message: errorMessage,
        trigger: opts.trigger,
      });

      if (status === 'sent') {
        await supabase.from('lead_activities').insert({
          lead_id: leadId,
          organization_id: lead.organization_id,
          type: 'email_sent',
          metadata: { rule_id: matched.id, to: recipient?.email },
        });
      }
    } else {
      status = 'skipped';
    }

    await supabase
      .from('leads')
      .update({
        routing_status: status,
        routing_rule_id: matched.id,
        routing_last_emailed_at: status === 'sent' ? new Date().toISOString() : lead.routing_last_emailed_at,
      })
      .eq('id', leadId);

    return { status, ruleId: matched.id, error: errorMessage || undefined };
  } catch (e) {
    // Best-effort: hatayı yut, durumu failed yap
    try {
      await supabase.from('leads').update({ routing_status: 'failed' }).eq('id', leadId);
    } catch { /* ignore */ }
    return { status: 'failed', error: e instanceof Error ? e.message : 'routing error' };
  }
}
```

- [ ] **Step 2: Tip kontrolü (build)**

Run: `npm run build`
Expected: Tip hatası yok. (Hata varsa: `lead_activities.type` ve `metadata` kolon adlarını mevcut şemaya göre düzelt — bkz. `supabase/schema.sql` `lead_activities` tanımı.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/crm/routingEngine.ts
git commit -m "feat(crm): lead routing engine (first-match, assign + email, best-effort)"
```

---

## Task 5: Şehir eşlemesi + otomatik tetikleme (ingest)

**Files:**
- Modify: `src/lib/meta.ts`, `src/lib/leads/ingest.ts`, `src/app/api/webhooks/meta-leads/route.ts`

- [ ] **Step 1: `src/lib/meta.ts`'te city çıkarımı**

`src/lib/meta.ts` dosyasını aç, form alanı eşleme mantığını bul (telefon/email/isim nasıl çıkarılıyorsa aynı yerde). Şehir için yaygın anahtarları `city`'ye haritalayan çıkarım ekle: alan adlarından biri `city`, `şehir`, `sehir`, `il`, `location`, `province` (küçük harfe çevirerek) ise değeri `city` olarak döndür. `fetchMetaLeadDetails`'in döndürdüğü nesneye `city` alanını ekle (mevcut `fullName/email/phone` ile aynı şekilde).

- [ ] **Step 2: `ingest.ts` — `NormalizedLeadInput`'a city ekle**

`src/lib/leads/ingest.ts` içinde `NormalizedLeadInput` arayüzüne ekle:
```ts
  city?: string | null;
```

- [ ] **Step 3: `ingest.ts` — insert/update payload'ına city yaz**

`duplicateLead` select listelerine (satır ~129 ve ~142) `city` kolonunu ekle. `insertPayload` nesnesine ekle (mevcut `full_name, email, phone` satırlarının yanına):
```ts
      city: sanitizeText(input.city),
```
`updatePayload` nesnesine de ekle; boş gelirse mevcut değeri koru (diğer alanların `mergeNonEmpty`/sil desenini izle):
```ts
      city: mergeNonEmpty(sanitizeText(input.city), duplicateLead.city),
```
(Boşsa update'ten düşür: `if (!input.city) delete (updatePayload as Record<string, unknown>).city;`)

- [ ] **Step 4: Meta webhook'unun city'yi geçmesi**

`src/app/api/webhooks/meta-leads/route.ts` içindeki `ingestLead({...})` çağrısına ekle:
```ts
        city: metaLead.city,
```

- [ ] **Step 5: `ingest.ts` — routing hook (yalnız Meta, created)**

`ingestLead` fonksiyonunda, yeni lead başarıyla oluşturulduktan (`createdLead`) ve `lead_events` 'processed' yapıldıktan sonra, `return { lead: createdLead, ... action: 'created' }`'tan ÖNCE, best-effort fire-and-forget tetikleme ekle:
```ts
    // Best-effort otomatik yönlendirme — yalnız dış otomatik kanal (Meta). Bloklamaz.
    if (input.source === 'meta_lead_form') {
      void import('@/lib/crm/routingEngine')
        .then((m) => m.evaluateLeadRouting(createdLead.id, { trigger: 'auto' }))
        .catch((e) => console.error('[routing] auto eval failed', e));
    }
```
Not: dinamik import, ağır modülü webhook'un kritik yolundan ayırır ve döngüsel bağımlılığı önler.

- [ ] **Step 6: Build + lint**

Run: `npm run build && npm run lint`
Expected: Hata yok.

- [ ] **Step 7: Commit**

```bash
git add src/lib/meta.ts src/lib/leads/ingest.ts src/app/api/webhooks/meta-leads/route.ts
git commit -m "feat(leads): map city on ingest + auto-route Meta leads on create"
```

---

## Task 6: API uçları (manuel tetikleme + automations priority + email stub'ları)

**Files:**
- Create: `src/app/api/leads/[id]/route-rules/route.ts`, `src/app/api/leads/route-rules/route.ts`
- Modify: `src/app/api/automations/route.ts`, `src/app/api/email/templates/route.ts`, `src/app/api/email/templates/[id]/route.ts`, `src/app/api/email/history/route.ts`, `src/app/api/email/send/route.ts`

- [ ] **Step 1: Tek lead manuel tetikleme**

`src/app/api/leads/[id]/route-rules/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateLeadRouting } from '@/lib/crm/routingEngine';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // RLS: kullanıcı bu lead'i görebiliyorsa erişebilir
  const { data: lead } = await supabase.from('leads').select('id').eq('id', id).single();
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await evaluateLeadRouting(id, { trigger: 'manual', force: true });
  return NextResponse.json({ result });
}
```

- [ ] **Step 2: Toplu manuel tetikleme**

`src/app/api/leads/route-rules/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateLeadRouting } from '@/lib/crm/routingEngine';

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const ids: string[] = Array.isArray(body.lead_ids) ? body.lead_ids.slice(0, 500) : [];
  if (ids.length === 0) return NextResponse.json({ error: 'lead_ids required' }, { status: 400 });

  // Yalnız erişilebilen leadler (RLS)
  const { data: visible } = await supabase.from('leads').select('id').in('id', ids);
  const visibleIds = (visible || []).map((l) => l.id);

  const results = [];
  for (const id of visibleIds) {
    results.push({ id, ...(await evaluateLeadRouting(id, { trigger: 'manual', force: true })) });
  }
  return NextResponse.json({ results, count: results.length });
}
```

- [ ] **Step 3: automations — priority desteği**

`src/app/api/automations/route.ts`:
- GET'te sıralamayı değiştir: `.order('priority', { ascending: true })` (created_at yerine).
- POST'taki insert nesnesine ekle: `priority: body.priority ?? 0,`

`src/app/api/automations/[id]/route.ts`: PATCH zaten body'yi doğrudan günceller; `priority` otomatik çalışır. Değişiklik gerekmez.

- [ ] **Step 4: email/templates CRUD stub'ını doldur**

`src/app/api/email/templates/route.ts` (GET listele + POST oluştur) — `automations/route.ts` desenini birebir izle ama tablo `email_templates`, alanlar `name, subject, body, variables`. `created_by: auth.user.id`.
`src/app/api/email/templates/[id]/route.ts` (PATCH + DELETE) — `automations/[id]/route.ts` desenini izle, tablo `email_templates`.

- [ ] **Step 5: email/history stub'ını doldur**

`src/app/api/email/history/route.ts` GET: org'a göre `email_log`'u çek:
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  let q = supabase.from('email_log').select('*').order('created_at', { ascending: false }).limit(100);
  if (leadId) q = q.eq('lead_id', leadId);
  const { data } = await q;
  return NextResponse.json({ logs: data || [] });
}
```

- [ ] **Step 6: email/send stub'ını doldur (manuel tekil mail)**

`src/app/api/email/send/route.ts` POST: `{ to, subject, html }` alır, `sendEmail` çağırır.
```ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { to, subject, html } = await req.json();
  if (!to || !subject) return NextResponse.json({ error: 'to/subject required' }, { status: 400 });
  try {
    const res = await sendEmail({ to, subject, html: html || '' });
    return NextResponse.json({ id: res.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'send failed' }, { status: 500 });
  }
}
```

- [ ] **Step 7: Build + lint**

Run: `npm run build && npm run lint`
Expected: Hata yok.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/leads src/app/api/automations src/app/api/email
git commit -m "feat(api): manual routing triggers, automations priority, email CRUD/history/send"
```

---

## Task 7: Zapier kaldırma

**Files:**
- Delete: `src/app/api/webhooks/zapier-leads/route.ts`
- Modify: `src/lib/leads/ingest.ts`, `src/lib/types.ts`, `src/lib/utils.ts`, `src/app/[locale]/(dashboard)/import/page.tsx`, `src/components/leads/lead-toolbar.tsx`, `src/app/api/webhooks/status/route.ts`, `src/components/landing/LandingHeader.tsx`, `src/components/landing/LandingContent.tsx`

- [ ] **Step 1: Endpoint'i sil**

Run: `git rm "src/app/api/webhooks/zapier-leads/route.ts"`

- [ ] **Step 2: ingest.ts — zapier'i kaldır**

`IngestionLeadSource` tipini `'meta_lead_form' | 'manual'` yap. `SOURCE_PRIORITY`'den `zapier` satırını sil (meta_lead_form: 2, manual: 1). `mergeSource` ve yorumlardaki zapier referanslarını temizle.

- [ ] **Step 3: types.ts — zapier'i kaldır**

`LeadSourcePlatform` union'ından `'zapier'`'i çıkar (satır 8). Etiket map'ten `zapier: 'Zapier',` satırını sil (satır ~248).

- [ ] **Step 4: utils.ts — zapier rengini kaldır**

`zapier: '#ff4f00',` satırını sil (satır ~75).

- [ ] **Step 5: UI kaynak listelerinden kaldır**

`src/app/[locale]/(dashboard)/import/page.tsx:530` ve `src/components/leads/lead-toolbar.tsx:478` içindeki `{ value: 'zapier', label: 'Zapier' },` satırlarını sil.

- [ ] **Step 6: webhook status route'undan kaldır**

`src/app/api/webhooks/status/route.ts` içindeki `ZAPIER_INGEST_SECRET` kontrolünü (satır 26, 83) ve `zapier_endpoint` duyurusunu (satır 37) sil.

- [ ] **Step 7: Landing referanslarını sadeleştir**

`LandingHeader.tsx` (satır 35, 55) ve `LandingContent.tsx` (satır 303): "Webhook / Zapier" → "Webhook"; bağımsız "Zapier" öğesini listeden çıkar.

- [ ] **Step 8: Build + lint + referans taraması**

Run: `npm run build && npm run lint`
Run: `grep -rin zapier src | grep -v node_modules` → çıktı BOŞ olmalı (DB enum migration'ı hariç, o src dışında).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove Zapier integration (code + UI), Meta is direct"
```

---

## Task 8: UI — Otomasyonlar, E-posta, Leads grid/toolbar/drawer + i18n

> Her alt-adımda önce ilgili dosyayı oku ve mevcut bileşen/stil desenini izle (Button, Modal, Dropdown, Badge bileşenleri `src/components/ui`). Tüm metinler `useTranslations` ile TR+EN. **TR'de Türkçe, EN'de İngilizce göründüğü doğrulanır.**

**Files:**
- Modify: `src/app/[locale]/(dashboard)/automations/page.tsx`, `src/app/[locale]/(dashboard)/email/page.tsx`, `src/components/leads/lead-grid.tsx`, `src/components/leads/lead-toolbar.tsx`, `src/components/leads/lead-detail-drawer.tsx`, `src/messages/tr.json`, `src/messages/en.json`

- [ ] **Step 1: i18n anahtarlarını ekle**

`src/messages/tr.json` ve `en.json`'a yeni namespace `routing` ekle (her ikisine de, TR Türkçe / EN İngilizce):
TR örnek:
```json
"routing": {
  "deliveredStatus": { "sent": "İletildi", "failed": "İletilemedi", "no_match": "Eşleşme yok", "pending": "Beklemede" },
  "column": "İletildi",
  "runRules": "Kuralları çalıştır",
  "resend": "Yeniden gönder",
  "emailHistory": "Mail geçmişi",
  "rulesTitle": "Yönlendirme kuralları",
  "newRule": "Yeni kural",
  "ruleName": "Kural adı",
  "field": "Alan", "operator": "Operatör", "value": "Değer",
  "assignee": "Atanan", "template": "E-posta şablonu", "priority": "Öncelik",
  "city": "Şehir", "equals": "Eşittir", "contains": "İçerir", "in": "Şunlardan biri"
}
```
EN karşılıkları İngilizce. **Ayrıca** `nav.dashboard`'ı TR'de "Panel", `nav.pipeline`'ı TR'de "Satış Hattı" yap (EN: "Dashboard"/"Pipeline"); `nav.leads` TR "Lead" kalır. (Bkz. i18n memory kuralı.)

- [ ] **Step 2: Leads grid — "İletildi" sütunu**

`src/components/leads/lead-grid.tsx`'te `LEAD_COLUMNS` dizisine yeni sütun ekle (mevcut bir kolon tanımını şablon al): key `routing_status`, başlık `tRouting('column')`, hücre `routing_status` değerine göre renkli badge (sent=yeşil, failed=kırmızı, no_match=gri, null/pending=sarı). `STAGE_LABELS` benzeri bir `ROUTING_STATUS_STYLE` map kullan.

- [ ] **Step 3: Toolbar — import filtresi + toplu aksiyon**

`src/components/leads/lead-toolbar.tsx`:
- Kaynak filtre listesinde `import` değerinin bulunduğundan emin ol: `{ value: 'import', label: t(...) }` ("İçe Aktarma" / "Import"); yoksa ekle.
- Bulk actions menüsüne "Kuralları çalıştır" ekle → seçili `lead_ids` ile `POST /api/leads/route-rules` çağır, dönen sonucu toast/sayım olarak göster, listeyi yenile.

- [ ] **Step 4: Drawer — çalıştır/yeniden gönder + mail geçmişi**

`src/components/leads/lead-detail-drawer.tsx`:
- "Kuralları çalıştır / Yeniden gönder" butonu → `POST /api/leads/[id]/route-rules` → sonucu göster, lead'i yenile.
- Bir bölümde `GET /api/email/history?lead_id=<id>` ile o lead'in mail geçmişini listele (kime, ne zaman, durum ✔/✘).

- [ ] **Step 5: Otomasyonlar sayfası — yönlendirme kuralları UI**

`src/app/[locale]/(dashboard)/automations/page.tsx`: kural listesi (`GET /api/automations`, `action_type='route_lead'` filtreli) + oluştur/düzenle formu. Form alanları → `trigger_config`/`action_config`/`priority`:
- Ad → `name`
- Alan/Operatör/Değer → `trigger_config = { conditions: [{ field, operator, value }], match: 'all' }`
- Atanan (org üyesi dropdown, `useAppStore` members) → `action_config.assigned_to`
- Şablon (opsiyonel) → `action_config.email_template_id`, `action_config.send_email = true`
- Öncelik → `priority`
- `trigger_type='lead_created'`, `action_type='route_lead'`
- Aktif toggle (`is_active`), sırala (priority), sil (`DELETE /api/automations/[id]`).

- [ ] **Step 6: E-posta sayfası — şablon editörü + geçmiş**

`src/app/[locale]/(dashboard)/email/page.tsx`:
- Şablon listesi/editörü (`/api/email/templates`): name, subject, body (değişken çipleri: `{{full_name}} {{phone}} {{email}} {{city}} {{source}}`).
- Gönderim geçmişi (`/api/email/history`): kime / ne zaman / durum.

- [ ] **Step 7: Build + lint**

Run: `npm run build && npm run lint`
Expected: Hata yok.

- [ ] **Step 8: Elle doğrulama (localhost)**

Run: `npm run dev` ve tarayıcıda:
1. Otomasyonlar → "Ankara → <kullanıcı>" kuralı oluştur (öncelik 1, send_email açık).
2. Bir lead'i şehir=Ankara yap; drawer'dan "Kuralları çalıştır" → atanan değişir, "İletildi" yeşil, mail geçmişinde kayıt.
3. Şehir=Bursa lead → "Eşleşme yok".
4. TR/EN dil değiştir; nav "Panel/Satış Hattı/Lead" doğru, yeni metinler iki dilde.

- [ ] **Step 9: Commit**

```bash
git add src/app src/components src/messages
git commit -m "feat(ui): routing rules page, email templates/history, İletildi column, manual triggers, i18n"
```

---

## Tamamlanma Kriterleri

- [ ] Meta'dan düşen yeni lead, şehir kuralı varsa otomatik atanır + mail gider, "İletildi" görünür.
- [ ] Import/manuel leadler otomatik mail GÖNDERMEZ; "Kuralları çalıştır" ile gönderir.
- [ ] Eşleşme yok / İletilemedi durumları doğru gösterilir; `email_log` her denemeyi kaydeder.
- [ ] Zapier kodda kalmaz (src'de 0 referans).
- [ ] TR'de Türkçe, EN'de İngilizce; nav başlıkları düzeltildi.
- [ ] `npm run build`, `npm run lint` hatasız.
