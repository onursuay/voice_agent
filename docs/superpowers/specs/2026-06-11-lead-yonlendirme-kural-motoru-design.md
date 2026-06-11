# Lead Yönlendirme Kural Motoru + E-posta — Tasarım (Faz 1)

**Tarih:** 2026-06-11
**Durum:** Onaylandı (Faz 1 kapsamı)
**Proje:** voice_agent (Next.js 16 App Router + Supabase + next-intl)

---

## 1. Amaç

Sisteme düşen leadleri, tanımlanmış **kurallara** göre otomatik olarak doğru satış
temsilcisine **ata** ve o temsilciye lead bilgilerini (isim, soyisim, telefon vb.)
**e-posta** ile gönder. Gönderim sonucu leads tablosunda **"İletildi"** durumu olarak
görünsün.

Kural motoru **jenerik** olmalı: bugün şehre göre yönlendirme yapılacak (ör. Ankara →
Onur Şuay), ileride migration gerektirmeden aşama/kaynak gibi başka koşullara
genişleyebilmeli ("funnel" mantığı: koşul → aksiyon).

Bu doküman yalnızca **Faz 1**'i (çekirdek) tanımlar. Faz 2 (takip otomasyonu + cron) ve
Faz 3 (gün sonu raporu) ayrı spec'lerle ele alınacak; mimari bunları destekleyecek
şekilde kuruluyor.

## 2. Onaylanmış Kararlar

| Konu | Karar |
|------|-------|
| Fazlama | Önce çekirdek (Faz 1): kural motoru + şehir→temsilci e-posta + "İletildi". |
| E-posta servisi | **Resend**. |
| Hosting / cron (Faz 2+) | **Vercel** (Vercel Cron). |
| Tetikleme | Yeni lead düştüğünde — **yalnızca Meta Lead Form** (doğrudan Meta Graph API / `leads_retrieval`). Zapier kapsam dışı. |
| Eşleşme | **İlk eşleşen kural** (öncelik sırasına göre). |
| Alıcı | **Sistemdeki kullanıcılar** (organization_members) — `assigned_to` ile birebir. |
| "İletildi" derinliği | **Basit**: gönderildi / hata (Resend webhook ile gerçek teslimat Faz 2+). |
| Mimari | **A** — mevcut `automation_rules` tablosu + JSON config + `priority` kolonu. |
| Import istisnası | **İçe Aktarma (Dosya/Google Sheets) ve manuel ekleme otomatik tetiklenmez**; sadece manuel tetikleme ile gönderilir. |

## 3. Kapsam & Tetikleme Modeli

### 3.1 Otomatik tetikleme (sadece Meta Lead Form)
- Yalnızca yeni lead **oluşturulduğunda** (`action === 'created'`) ve
  `source === 'meta_lead_form'` ise çalışır.
- Meta leadleri **doğrudan Meta'dan** gelir (Zapier üzerinden DEĞİL): Meta webhook'u
  ([src/app/api/webhooks/meta-leads](../../../src/app/api/webhooks/meta-leads/route.ts))
  yalnızca `leadgen_id` alır, ardından `fetchMetaLeadDetails` ile **Meta Graph API**'den
  (`leads_retrieval` izni) lead detayını çeker ve `ingestLead`'i çağırır.
- Tek hook noktası: `ingestLead` ([src/lib/leads/ingest.ts](../../../src/lib/leads/ingest.ts)).
- **Zapier kapsam dışı**: Zapier webhook'u
  ([src/app/api/webhooks/zapier-leads](../../../src/app/api/webhooks/zapier-leads/route.ts))
  ayrı, opsiyonel bir genel kanaldır ve Meta ile ilgisi yoktur. Zapier'den düşen leadler
  otomatik tetiklenmez; manuel kanallar gibi yalnızca manuel tetiklemeyle gönderilir.
- Dedupe ile **`updated`** olan leadlerde tetiklenmez (mükerrer mail önlenir).

### 3.2 Manuel tetikleme (otomatik tetiklenmeyen her şey)
İçe aktarma (CSV/Excel + Google Sheets, `source=import`) ve manuel tekil ekleme
(`source=manual`) **otomatik mail göndermez**. Bunlar yalnızca admin manuel
tetiklediğinde gider:
- **Toplu aksiyon** (leads toolbar): "Kuralları çalıştır (mail gönder)" → seçili leadler.
- **Tekil aksiyon** (lead detay drawer): "Kuralları çalıştır / Yeniden gönder".

### 3.3 Import filtresi
Leads toolbar kaynak filtresine **"İçe Aktarma"** (`source_platform=import`) seçeneği
eklenir/garanti edilir. Admin importları filtreleyip toplu seçip kuralları çalıştırabilir.
(Mevcut kaynak filtresi: [src/components/leads/lead-toolbar.tsx](../../../src/components/leads/lead-toolbar.tsx).)

### 3.4 Çift gönderim koruması
- Otomatik yol: lead'in `routing_status` değeri zaten `sent` ise tekrar göndermez.
- Manuel "Yeniden gönder": bilinçli aksiyondur, `routing_status`'a bakmadan gönderir.
- Her gönderim denemesi `email_log`'a ayrı kayıt olur.

## 4. Veri Modeli (yeni migration)

Yeni migration dosyası: `supabase/migrations/20260611_lead_routing.sql`.

### 4.1 `automation_rules` (mevcut tablo — genişletme)
```sql
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_active
  ON automation_rules(organization_id, is_active, priority);
```
Kullanım sözleşmesi (JSON config):
- `trigger_type = 'lead_created'`
- `trigger_config = { "conditions": [ { "field": "city", "operator": "equals", "value": "Ankara" } ], "match": "all" }`
  - `match`: `"all"` (AND) | `"any"` (OR). Faz 1 default `"all"`.
  - `field`: Faz 1'de `city` (jenerik; ileride `stage`, `source_platform` vb.).
  - `operator`: `equals` | `not_equals` | `contains` | `in`.
  - `value`: string veya `in` için string dizisi.
- `action_type = 'route_lead'`
- `action_config = { "assigned_to": "<profile_id>", "send_email": true, "email_template_id": "<uuid|null>" }`
- `priority`: küçük sayı = yüksek öncelik (ASC sıralanır). İlk uyan kural uygulanır.

### 4.2 `leads` (mevcut tablo — 3 kolon eklenir)
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_status TEXT;            -- null|no_match|sent|failed|skipped
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_last_emailed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL;
```
Bu kolonlar grid'deki **"İletildi"** sütununu ve hızlı filtrelemeyi besler.

### 4.3 `email_log` (yeni tablo — kalıcı gönderim kaydı)
```sql
CREATE TABLE email_log (
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
CREATE INDEX idx_email_log_org ON email_log(organization_id, created_at DESC);
CREATE INDEX idx_email_log_lead ON email_log(lead_id);
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org access" ON email_log FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
```
Bu tablo Faz 2 (tekrar gönderim geçmişi) ve Faz 3 (gün sonu raporu) için de temeldir.

### 4.4 `email_templates` (mevcut tablo — kullanım)
Bir **varsayılan yönlendirme şablonu** seed edilir (yeni org trigger'ına eklenebilir veya
ilk kullanımda lazy-create). Kural bazında `action_config.email_template_id` ile override
edilebilir. Şablon değişkenleri Bölüm 6'da.

## 5. Şehir Verisi Düzeltmesi (ön koşul)

Şu an `ingestLead` `city` kolonunu doldurmuyor; şehir `custom_fields`/`raw_payload` içinde
kalıyor. Şehir bazlı yönlendirmenin Meta/Zapier leadlerinde çalışması için:
- `NormalizedLeadInput`'a `city` alanı eklenir; `ingestLead` insert/update payload'ına
  `city` yazar.
- Form alanı eşlemesi ([src/lib/meta.ts](../../../src/lib/meta.ts)) ve Zapier payload'ında
  yaygın anahtarlar (`şehir`, `il`, `city`, `location`, `province`) `city`'ye map'lenir.

## 6. Kural Motoru Modülü — `src/lib/crm/routingEngine.ts`

Tek giriş noktası:
```ts
evaluateLeadRouting(leadId: string, opts: { trigger: 'auto' | 'manual'; force?: boolean }): Promise<RoutingResult>
```
Akış:
1. Lead'i ve org'un **aktif** kurallarını `priority ASC` yükle.
2. Koşulları **Türkçe-duyarlı normalize ederek** değerlendir:
   - `toLocaleLowerCase('tr-TR')`, `trim`, çoklu boşluk sadeleştirme.
   - Diakritik toleransı ("İstanbul"/"Istanbul", "Şanlıurfa"/"Sanliurfa") için aksan
     sadeleştirmeli karşılaştırma.
3. **İlk uyan** kuralı seç (`match` moduna göre AND/OR).
4. Uyarsa:
   - `assigned_to` set et (farklıysa) → `lead_activities`'e `assigned` yaz.
   - Şablonu lead verisiyle render et → Resend ile gönder.
   - `email_log` yaz, `leads.routing_status` (`sent`/`failed`), `routing_last_emailed_at`,
     `routing_rule_id` güncelle, `lead_activities`'e `email_sent` yaz.
5. Uymazsa: `routing_status='no_match'` (lead atanmamış kalır; grid'de filtrelenir).
   - Opsiyonel: en düşük öncelikli **koşulsuz catch-all** kural ile varsayılan kişiye atama.
6. **Best-effort**: tamamı try/catch ile sarılı; `metaAudienceSync` gibi lead
   oluşturmayı **asla bloklamaz/düşürmez**. Otomatik yolda timeout'lu fire-and-forget.

Operatörler (Faz 1): `equals`, `not_equals`, `contains`, `in`.

## 7. E-posta Modülü — `src/lib/email/`

- `resend.ts`: Resend client (`RESEND_API_KEY`).
- `send.ts`: `sendEmail({ to, subject, html, attachments? }) => { id }` (hata fırlatır).
- `templates.ts`: değişken interpolasyonu. Desteklenen değişkenler:
  `{{first_name}} {{last_name}} {{full_name}} {{phone}} {{email}} {{city}} {{company}}
  {{source}} {{campaign}} {{stage}} {{assigned_to}}`.
- Boş olan `src/app/api/email/send` route'u bu modülü kullanır.
- Env: `RESEND_API_KEY`, `EMAIL_FROM` (doğrulanmış domain), opsiyonel `EMAIL_REPLY_TO`.

Varsayılan yönlendirme şablonu (örnek gövde):
> Yeni lead: **{{full_name}}** — {{city}}
> Telefon: {{phone}} · E-posta: {{email}} · Kaynak: {{source}}

## 8. API Uçları

- `POST /api/leads/[id]/route-rules` — tek lead için kuralları çalıştır (manuel/yeniden).
- `POST /api/leads/route-rules` — body `{ lead_ids: string[], force?: boolean }` toplu
  manuel tetikleme.
- `GET/POST/PATCH/DELETE /api/automation/rules` — kural CRUD (`automations.manage`).
- `GET/POST/PATCH/DELETE /api/email/templates` — şablon CRUD (mevcut boş route'lar dolar).
- `GET /api/email/history` — `email_log` listesi (mevcut boş route dolar).

## 9. Arayüz (mevcut nav'a oturur)

Sol menüde **Otomasyonlar** ve **E-posta** sayfaları zaten var.

- **Otomasyonlar**: kural listesi (ad, koşul özeti, atanan, öncelik sırası, aktif anahtarı)
  + oluştur/düzenle formu (alan→operatör→değer; atanan = org üyesi dropdown; e-posta
  şablonu; öncelik; aktif).
- **E-posta**: şablon editörü (konu/gövde + değişken çipleri) + gönderim geçmişi
  (`email_log`).
- **Leads grid** ([src/components/leads/lead-grid.tsx](../../../src/components/leads/lead-grid.tsx)):
  "İletildi" sütunu (rozet: Beklemede / İletildi / İletilemedi / Eşleşme yok).
  "Atanan" sütunu zaten var.
- **Toolbar**: "İçe Aktarma" kaynak filtresi + "Kuralları çalıştır" toplu aksiyonu.
- **Drawer** ([src/components/leads/lead-detail-drawer.tsx](../../../src/components/leads/lead-detail-drawer.tsx)):
  "Kuralları çalıştır / Yeniden gönder" + o lead'in mail geçmişi.
- **i18n**: tüm metinler `next-intl` ile TR + EN (hardcode string yok).

## 10. İzinler & Güvenlik

- Kural/şablon yönetimi: `owner`/`admin` (`automations.manage`).
- Manuel tetikleme: `leads.write` / `leads.assign`.
- RLS: `automation_rules`, `email_templates`, `email_log` org-scoped (mevcut desen).
- Resend API key ve `EMAIL_FROM` yalnızca sunucu tarafında; webhook secret'ları gibi env.

## 11. Test Stratejisi

- **Birim**: koşul değerlendirme (normalize + operatörler + match modu), şablon
  interpolasyonu, ilk-eşleşen seçim, çift-gönderim koruması.
- **Entegrasyon**: `ingestLead` created (meta/zapier) → otomatik mail; import/manuel →
  mail YOK; manuel tetikleme → mail. Resend mock'lanır (`email_log` doğrulanır).
- **Best-effort**: e-posta/kural hatası lead oluşturmayı düşürmez (hata `email_log` ve
  `routing_status='failed'`).

## 12. Faz 1 Dışı (sonraki fazlar)

- **Faz 2**: 3 gün aşama değişmezse tekrar mail (Vercel Cron); negatif aşama
  (`niteliksiz`/`kaybedildi`) → Meta'dan silme garantisi
  ([src/lib/crm/metaAudienceSync.ts](../../../src/lib/crm/metaAudienceSync.ts) zaten kısmen
  yapıyor; doğrulanıp genişletilecek); dashboard takip kartları.
- **Faz 3**: gün sonu raporu owner'a Excel ekli mail (Vercel Cron + `xlsx`).
- Resend webhook ile gerçek teslimat (delivered/bounce/open) takibi.

## 13. Riskler & Varsayımlar

- Şehir verisi tutarlılığı: formlardan gelen şehir adları normalize edilmeli (Bölüm 6).
  Eşleşme olmazsa lead `no_match` kalır — bu beklenen davranış, dashboard'da görünür.
- Resend domain doğrulaması gönderim öncesi tamamlanmalı (aksi halde mailler düşmez).
- Catch-all kural opsiyoneldir; tanımlanmazsa eşleşmeyen leadler atanmadan kalır.
