# DijiGrow Rebrand + Domain Geçişi — Tasarım Dökümanı

> **Tarih:** 2026-06-26
> **Sahip:** Onur Şuay (onursuay@hotmail.com)
> **Durum:** Tasarım onayı bekliyor (brainstorming → spec aşaması)
> **Şablon:** DijiMagic rebrand playbook'u (`~/.claude/REBRAND-PLAYBOOK.md`) — bu, onun ikinci uygulaması.

## 1. Amaç ve Değişmez Kural

`voice_agent` projesi (mevcut ürün adı **VoiceAgent**, teknik ad `ai_agent_santral`), ayrılınan
firma **YO Dijital / `yodijital.com`** izlerinden ve dar **"VoiceAgent"** adından tamamen
arındırılıp **DijiGrow** markasına geçirilecek.

**Neden yeni isim "Voice" değil:** Ürün tek ayaklı değil — kod kanıtıyla **üç ayaklı + otomasyon**:
- **Lead/CRM:** `leads`, `crm_stages`, `stage_history`, `lead_sources`, pipeline (landing: "Hepsi Bir Arada Lead Yönetimi").
- **Sesli arama:** ElevenLabs (`ELEVENLABS_AGENT_ID`/`PHONE_NUMBER_ID`), `call_logs`, `src/lib/calls`.
- **Chatbot/Mesajlaşma:** omnichannel inbox (`conversations`, `messages`, `src/components/inbox`).
- **Otomasyon motoru:** "AI Orkestra" (`sequenceEngine.ts`) — lead düşünce AI arama + funnel mail + chat zinciri.

"DijiVoice/VoiceAgent" yalnız bir ayağı (ses) anlatırdı. **DijiGrow** ("dijital büyüme") üçünü
birden kucaklar ve DijiMagic ailesiyle "Diji" tutarlılığını korur.

| Eski | Yeni |
|------|------|
| `VoiceAgent` / `voiceagent` (ürün) | **DijiGrow** |
| `AI Orkestra` (otomasyon alt-modülü) | **DijiOrkestra** (markalı alt-modül; DijiMagic'teki "DijiAlgoritma" gibi) |
| `voiceagent.yodijital.com` (domain) | **dijigrow.com** (+www) |
| `info@yodijital.com` / `bildirim@yodijital.com` | **info@dijigrow.com** / **bildirim@dijigrow.com** |
| `Yo Dijital` / `yodijital` / `yoai` (firma izleri) | **kaldırılır** (marka DijiGrow) |
| `onursuay/voice_agent` (GitHub) · `voiceagent` (Vercel) · `ai_agent_santral` (package) | **dijigrow** |

**🔴 Hard requirement:** working tree'de `VoiceAgent`, `voiceagent`, `Yo Dijital`, `yodijital`,
`yoai` — **hiçbir formda, hiçbir katmanda kalmayacak.** (Git geçmişi immutable, kapsam dışı.)

## 2. İsim Haritası (büyük/küçük harf duyarlı, önce uzun/bileşik tokenlar)

```
voiceagent.yodijital.com   → dijigrow.com                 (önce — en uzun token)
VoiceAgent by Yo Dijital   → DijiGrow
VoiceAgent / voiceagent    → DijiGrow / dijigrow
AI Orkestra                → DijiOrkestra
Yo Dijital / yodijital     → DijiGrow / dijigrow.com
yoai                       → dijigrow
info@yodijital.com         → info@dijigrow.com
bildirim@yodijital.com     → bildirim@dijigrow.com
"Yo Dijital'den arıyorum"  → "DijiGrow'dan arıyorum"     (i18n defaultScript)
© 2025 Yo Dijital          → © 2025 DijiGrow
```

**İstisna — yasal sayfalar:** `terms-of-service`, `privacy-policy`, `cookie-policy`, `data-deletion`
(+ ileride mesafeli satış / ön bilgilendirme). Marka **DijiGrow** önde; ancak Mesafeli Sözleşmeler
Yönetmeliği m.5 gereği satıcının gerçek kimliği zorunludur → satıcı bloğu **"Story 77 Creative …
Ltd. Şti."** (geçici, DijiMagic ile aynı — VKN 7811085924, Doğanbey VD, Beytepe Mah. 5360 Sk. No:2
İç Kapı 11 Çankaya/Ankara). Bu sayfalar otomatik replace'ten **muaf**, satıcı bloğu elle yazılır.

## 3. Envanter (kanıta dayalı, 2026-06-26)

| Token | Yaklaşık geçiş | Dosya |
|-------|------:|------:|
| `VoiceAgent` (58) + `voiceagent` (9) + `Voice Agent` (2) | ~69 | ~17 |
| `Yo Dijital` (73) + `yodijital` (35) + `yoai` (6) | ~114 | ~20 |

### 3.1 Katmanlar
- **Metin/string:** `messages/tr.json` + `messages/en.json` (landing hero/badge, "Mesajlaşma Kanalları",
  "AI Orkestra Senaryoları", arama scripti, footer, gönderici satırı), UI bileşenleri (`src/components/landing`,
  `layout`), legal sayfa metadata (`src/app/[locale]/{terms-of-service,privacy-policy,cookie-policy}`,
  `src/app/data-deletion`).
- **Görsel/dosya:** `public/yoai-logo.png`, `public/logo.png` (alt="Yo Dijital"), `public/logos/yoai-logo.png`,
  `public/favicon*.png`, `public/ai-brain.png` → **yeni DijiGrow logosu/favicon üretilir** (§6). Dosya adı
  `yoai-logo.png` → `dijigrow-logo.png` (`git mv`), referanslar güncellenir.
- **DB (Supabase `ckqagsvrleyzvfjwldwh`) — HAFİF:** tablo/kolon/index/policy adları **jenerik**
  (`leads`, `conversations`, `organizations`, `sequences`, `crm_stages`…) → **yapısal RENAME YOK.** ✅
  Yalnız **veri içindeki marka string'leri** güncellenir: e-posta şablonları (`email_templates`),
  varsayılan arama scripti, organizasyon/gönderen adları vb. (transaction + doğrula).
- **env / domain değerleri:** `EMAIL_FROM` ("YO Dijital <bildirim@yodijital.com>"), `APP_BASE_URL`
  (boş → `https://dijigrow.com`), Google OAuth redirect, Meta redirect/webhook, `RESEND_*`.
  Marka adı taşıyan **özel env yok** (DijiMagic'teki `YOAI_*` muadili yok) → env katmanı sadece değer.
- **Apps Script:** `apps_script.js` + `apps_script_template.js` (Google Sheets entegrasyonu) — marka
  string'i taşıyorsa güncellenir.

### 3.2 Klasör/route yeniden adlandırma
- `src/app/*` route'ları **jenerik** (`leads`, `inbox`, `automations`, `sequences`…) — marka taşımıyor,
  **rename gerekmez.** "AI Orkestra" yalnız **kullanıcı-yüzlü etiket** (kod yorumu + i18n başlığı) →
  string olarak `DijiOrkestra`'ya döner; klasör/route değişmez.

## 4. Yaklaşım — Katmanlı, fazlar arası doğrulamalı, tek branch

Branch: **`rebrand/dijigrow`** (cutover'a kadar `main`'e dokunulmaz). Değerlendirilen alternatifler:
- **(A) Katmanlı + faz-arası doğrulama** — *Seçilen.* Her faz `next build` + `tsc` yeşil olmadan
  sonrakine geçmez; hata izole edilir.
- (B) Tek scriptle toplu replace + tek commit — hızlı ama gözden geçirilemez, substring bozma riski. Reddedildi.
- (C) Worktree + paralel ajan — küçük kapsamda (≈37 dosya) gereksiz. Reddedildi.

**Replace güvenliği:** case-aware + kelime-sınırı duyarlı; `node_modules`/`.next`/`.git` hariç;
yasal satıcı blokları + isim haritası muafiyetleri elle. EN/TR `messages` paritesi korunur.

## 5. Faz Sırası

1. **Metin/string replace** (kod-içi + i18n) — isim haritası; legal satıcı blokları elle. → build+tsc.
2. **Dosya/görsel** — `yoai-logo.png` → `dijigrow-logo.png` (`git mv`) + referanslar; yeni logo/favicon (§6). → build.
3. **DB veri-içi string (Supabase, canlı — hafif):** `scripts/rebrand/update-data-strings.mjs` —
   `email_templates`, varsayılan arama scripti, org/gönderen adlarındaki "Yo Dijital"/"VoiceAgent" →
   "DijiGrow". Transaction + önce SELECT ile etki sayısı + doğrula-veya-rollback. Yapısal değişiklik yok.
4. **env + Vercel (Claude/CLI):** `EMAIL_FROM`, `APP_BASE_URL`, OAuth/Meta redirect değerleri →
   dijigrow.com; Vercel proje adı `voiceagent` → `dijigrow`; `dijigrow.com`+www domain ekle (www SSL);
   **her env değişiminden sonra redeploy.**
5. **GitHub:** repo `voice_agent` → `dijigrow` (remote otomatik güncellenir). `package.json` name → `dijigrow`.
6. **Logo + marka görseli** — `frontend-design` skill'i ile DijiGrow wordmark + favicon (§6).
7. **Dış panolar (checklist, §7)** — Vercel domain (Claude), Meta/Google/Resend/Turnstile/Supabase-Auth/
   ElevenLabs/DNS (owner). Meta izin koruması §7.1.
8. **Doğrulama** — `next build` + `tsc` + smoke (signup→e-posta linki, Meta OAuth, gelen lead/çağrı/mesaj
   akışı, legal sayfalar) + `git grep` ile sıfır-iz kontrolü (VoiceAgent/voiceagent/Yo Dijital/yodijital/yoai = 0).

## 6. Logo Tasarımı (alt-teslimat)
`yoai-logo.png` / `logo.png` görsel olarak eski markayı taşıyor → dosya adı değişimi yetmez.
Tasarımcı kararıyla (global persona kuralı) **DijiGrow wordmark + ikon + favicon** üretilir; "Diji"
ailesiyle (DijiMagic) görsel uyumlu. **PC + mobil önizleme** ile sunulur, onay sonrası yerleştirilir.
`frontend-design` skill'i bu adımda çağrılır.

## 7. Dış Sistem Checklist'i (owner — uygulama planında genişler)

### 7.1 Meta (izin riski — KRİTİK, sıralama bağlayıcı)
App **`968757322162498`** — durum (owner ekran görüntüsü 2026-06-26): **Mode: Live**, Type: İşletme,
Business portfolyosu: **"Yo Dijital Medya"**. Ürün `meta-leads` webhook'u kullanıyor → **lead_retrieval**
izni muhtemelen aktif; bu yüzden app **kritik** (DijiMagic'teki "YoAi Magic" gibi değil ama lead akışı canlı).
Onaylı izinler App'e bağlıdır; domain değişimi izinleri revoke etmez — yine de adım adım doğrulanır.
**İzin envanteri (owner ekran görüntüsü 2026-06-26, App Review → Requests):**
- **Onaylı (Existing access for renewal):** `leads_retrieval`, `business_management`, `pages_show_list`,
  `pages_manage_metadata`, `pages_manage_ads`, `pages_read_engagement`.
- **İncelemede / yeni istenen (Requests):** `instagram_basic`, `instagram_manage_messages`, `pages_messaging`,
  `whatsapp_business_management`, `whatsapp_business_messaging`.
- 🔴 **Owner kırmızı çizgisi:** "alınmış izinler iptal OLMAMALI." Rebrand boyunca bu liste korunur.

0. **Önce izin baseline kaydet:** `/me/permissions` granted listesi (merkezi token `~/.claude/secrets/meta_credentials.json`,
   app-token ile `debug_token`). Süreç sonunda birebir karşılaştır. → `docs/rebrand/meta-permissions-baseline.md`.
1. Business Manager → Brand Safety → Domains: `dijigrow.com` ekle + doğrula (DNS TXT / meta-tag).
2. App → Settings/Basic: **App Domains** `dijigrow.com`; Privacy/ToS/Data-Deletion/Site URL → dijigrow.com;
   **Display name** + **App icon** (yeni DijiGrow) — *display adı değişimi re-review tetikleyebilir, dikkatli.*
3. Facebook Login → **Valid OAuth Redirect URIs** (Meta redirect URI'si `src/lib/meta/oauth-state.ts`'ten;
   Google OAuth callback `https://dijigrow.com/api/integrations/google/callback`) ekle (eskisini test sonrası kaldır).
4. **Webhook callback** `https://dijigrow.com/api/webhooks/meta` + `https://dijigrow.com/api/webhooks/meta-leads`
   (lead retrieval); **verify token Vercel↔Meta birebir aynı** (GET handshake `?hub.mode=subscribe&...&hub.challenge=X` test).
   Resend webhook: `https://dijigrow.com/api/webhooks/resend`.
5. Yeni domainde uçtan uca OAuth + webhook doğrulanınca eski `voiceagent.yodijital.com` URL'lerini kaldır.

#### 7.1.1 İzin koruma — DOĞRULANMIŞ kurallar (kaynak: resmi Meta dökümanı, 2026-06-26 araştırma)

> 🔬 4 boyutlu araştırma + adversarial doğrulama (resmi `developers.facebook.com` kaynakları, hepsi
> `confirmed`). **Sonuç: onaylı izinler App ID'ye (`968757322162498`) bağlı — domaine/redirect'e/portföye
> DEĞİL.** "Restoring Advanced Access to previously approved permissions does not require re-review"
> (Access Levels doc). Rebrand'ın KENDİSİ izinleri iptal etmez; ama **yanlış sıra dolaylı düşürebilir** →
> `permissionsAtRisk = true` (süreç riski, marka riski değil).

**🔴 DEĞİŞMEZ KURALLAR:**
- App ID **`968757322162498` SABİT** — uygulamayı silme / yeniden oluşturma / yeni App ID'ye geçme **YASAK** (App ID değişirse tüm onaylar gider, full App Review'a döner).
- Hiçbir izni **Advanced → Standard** çevirme — bu, izni kaybetmenin **belgelenmiş** yoludur (role'süz kullanıcılar için deaktive).
- Her kritik adımdan **ÖNCE ve SONRA** `GET /{app-id}` + `GET /me/permissions` baseline al + karşılaştır (**ZORUNLU**, özellikle isim değişimi ve portföy taşıması etrafında).

**Güvenli sıra (tüm onaylı izinleri korur):**
1. **Baseline al** (granted tam liste).
2. **Yeni domaini hazırla, ESKİSİNİ KORU:** dijigrow.com Privacy/Terms/Data-Deletion sayfaları CANLI ve erişilebilir (404 = en sık yenileme reddi); eski yodijital.com sayfaları cutover'a kadar açık kalır.
3. **"Önce ekle / sonra sil":** App Domains + OAuth redirect URI (strict **exact-match**, HTTPS) + webhook callback'e dijigrow.com değerlerini **EKLE**; eski yodijital.com değerlerini cutover'a kadar **TUT**.
4. **Webhook verify-token handshake'i** yeni domainde TEKRAR GEÇİR; gerçek test lead'i ile `meta-leads` teslimatını teyit et (lead-to-Sheets akışı buna bağlı).
5. Login'i uçtan uca test et → `/me/permissions` baseline ile karşılaştır (tümü granted olmalı).
6. **Portföy taşıma (gerekiyorsa) — HARD PREREQUISITE:** hedef portföy **ÖNCE Business Verified** olacak. Doğrulanmamış/pending-olmayan portföye taşıma **YASAK** — 1 Şubat 2023 Meta duyurusu birebir: doğrulanmamış işletmeye bağlı app'in advanced izinleri *"revoked"* → `leads_retrieval` CANLI iken inaktif olur. Taşıma sonrası tam liste granted görünene kadar **eski portföyü kaldırma**.
7. **App adı "Voice Agent" → "DijiGrow": AYRI, izole, SON adım** — domain/redirect ile aynı anda YAPMA. İsim+ikon bir "branding review" tetikler (izinlerin re-review'ı **değil**, App ID'ye bağlı kaldıkları için sıfırlanmaz); ancak Meta yazılı garanti vermez → değişiklik sonrası `/me/permissions` **doğrulaması ZORUNLU**. "DijiGrow" Display Name Guidelines uyumlu (Meta marka terimi içermez).
8. **Yıllık YENİLEME / Data Access Renewal (eski Data Use Checkup) deadline'ını KAÇIRMA** — app Admin'e 60/30/10/3 gün e-postaları gelir. Kaçarsa app **DEAKTİVE** olur (*"Extensions will not be provided"*) ve tüm use case/izin/feature **full App Review** ister — onayları gerçekten sıfırlayan **TEK** senaryo. Migration'ı yenileme penceresinin DIŞINDA planla.
9. **Business Verification kesintisiz:** legal seller (Story 77) / işletme adı değişse bile bağlı işletmenin doğrulaması bozulmamalı; aksi halde Advanced Access reddedilir + yenileme başarısız olur.
10. **90 gün inaktivite:** uzun kesinti (Graph/Marketing API + webhook 90 gün sessiz) → token'lar geçersiz, izinler disuse'dan düşer + yeniden App Review ister. Kesinti penceresini kısa tut.

**Kaynaklar (hepsi resmi `developers.facebook.com`):** Access Levels · Permissions Reference · App Review (Introduction/Tutorial) · Business Verification · Transfer App Ownership · Strict URI Matching · Data Use Checkup / Data Access Renewal · 1 Şubat 2023 "Business Verification for Advanced Access" blog. Tam araştırma çıktısı oturum task `wd8lm1gmj`.

### 7.2 Diğer (owner)
- **Vercel (Claude):** `dijigrow.com` domain ekle + production ata; domain-değeri env'ler; proje adı `dijigrow`.
- **Google Cloud OAuth:** Authorized domains `dijigrow.com` + redirect URI'ler + consent screen marka adı.
- **Resend:** `dijigrow.com` domain ekle → 3 DNS kaydı (DKIM `resend._domainkey`, MX `send`, SPF `send`),
  `dig` ile iki yetkili NS'te doğrula, `verified` olunca `EMAIL_FROM` → "DijiGrow <bildirim@dijigrow.com>",
  eski domaini Resend'den sil. (SOA negatif-TTL bekleme notu — playbook §6.)
- **Cloudflare Turnstile:** allowed domains'e `dijigrow.com` ekle (mevcut site key).
- **Supabase → Auth → URL Configuration:** Site URL + Redirect URLs `https://dijigrow.com`.
- **ElevenLabs:** agent adı/ayarlarında marka geçen yer varsa DijiGrow'a güncelle.
- **Abonelik/ödeme:** `src/lib/subscription` mevcut — ödeme sağlayıcısı (iyzico vb.) plan aşamasında
  tespit edilip callback/whitelist domaini `dijigrow.com`'a güncellenir.
- **DNS (owner — EN SON, tetikleyici):** `dijigrow.com` → Vercel (A `76.76.21.21` / www CNAME) +
  Meta doğrulama TXT + Resend SPF/DKIM/MX. **Domain kaydı/satın alımı owner tarafında** (dijigrow.com).

## 8. Risk Kontrolleri
- **Durum:** deploy + gerçek veri + bağlı hesaplar var, **genel kullanıcıya açık değil.** Orta risk.
- **DB:** yalnız veri-içi string update (yapısal RENAME yok) → veri güvende; transaction + doğrula-veya-rollback.
- **Bağlı hesaplar:** Meta izin baseline öncesi/sonrası karşılaştırma; webhook/cron kesintisiz (gelen
  lead/çağrı/mesaj akışı bozulmaz); her env sonrası redeploy + smoke.
- **Meta/Google/ElevenLabs publish/çağrı akışı korunur:** rebrand çoğunlukla entegrasyon-dışı kodu
  etkiler; env **değer** (ad değil) değişimi sonrası akış smoke ile doğrulanır.
- Her faz build+tsc gate'i; tek branch; atomik commit'ler; cutover'a kadar `main` dokunulmaz.

## 9. Proje Kurallarına Uyum (uygulama sırasında)
- EN/TR `messages` paritesi (tr.json + en.json birlikte); hardcoded string yasağı.
- Her faz sonrası auto-commit + push (global tercih); teknik/çalışma dosyalarını gizleme hook'u (yeni
  projede aynı desen kurulur).

## 10. Sahipten Gereken Girdiler
- **dijigrow.com domain kaydı/satın alımı** (WHOIS'e göre müsait — registrar'da kesinleştir) + DNS erişimi.
- `info@dijigrow.com` / `bildirim@dijigrow.com` kutusu + Resend DNS (SPF/DKIM/MX).
- Meta/Google/Supabase-Auth/Turnstile/ElevenLabs panel erişimi (checklist owner'da).
- (Logo: owner isterse "ben tasarlayayım" der; aksi halde Claude üretip önizleme onayı alır.)

## 11. Kapsam Dışı
- Git geçmişi/log yeniden yazımı (immutable).
- 301 yönlendirme (genel kullanıcıya açılmadı — gerekirse minimal eklenir).
- Eski `voiceagent.yodijital.com`'un Vercel'de tutulması (kaldırılır).
- DB yapısal şema değişikliği (tablolar zaten jenerik — yalnız veri-içi string).
