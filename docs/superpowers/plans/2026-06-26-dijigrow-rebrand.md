# DijiGrow Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `voice_agent` (ürün "VoiceAgent", firma "Yo Dijital/yodijital") kod tabanını **DijiGrow / dijigrow.com** markasına, sıfır eski-marka izi bırakacak şekilde taşımak.

**Architecture:** Tek branch (`rebrand/dijigrow`), katmanlı + faz-arası `next build` + `tsc` doğrulamalı. Kod/marka/i18n/legal/görsel/DB-veri-string'leri Claude (CLI); dış panolar (Meta/DNS/Vercel-env/Resend/Google/Turnstile/ElevenLabs) owner checklist. **Meta App `968757322162498` izinleri ASLA riske girmez** (§ izin-koruma, spec §7.1.1).

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl (TR/EN), Supabase (`ckqagsvrleyzvfjwldwh`), Vercel (`voiceagent` projesi), Resend, Meta/Google OAuth, ElevenLabs.

## Global Constraints

- **Marka adı:** `DijiGrow` (her yerde) · alt-modül `AI Orkestra` → `DijiOrkestra`.
- **Domain:** `voiceagent.yodijital.com` → `dijigrow.com` · **E-posta:** `info@`/`bildirim@dijigrow.com`.
- **Token map (case-sensitive, compound/longest FIRST):**
  `voiceagent.yodijital.com`→`dijigrow.com` · `VoiceAgent by Yo Dijital`→`DijiGrow` · `VoiceAgent`/`voiceagent`→`DijiGrow`/`dijigrow` · `Voice Agent`→`DijiGrow` · `AI Orkestra`/`AI Orchestra`→`DijiOrkestra` · `Yo Dijital`/`YO Dijital`/`YO DİJİTAL`→`DijiGrow` · `yodijital`→`dijigrow.com`(URL)/`DijiGrow`(brand) · `yoai`→`dijigrow` · `info@yodijital.com`→`info@dijigrow.com` · `bildirim@yodijital.com`→`bildirim@dijigrow.com`.
- **EN/TR parite:** her i18n/legal değişikliği `messages/tr.json` + `messages/en.json` (ve TR/EN legal bileşenleri) birlikte (proje kuralı).
- **YASAL SATICI (m.5):** `YO Dijital Medya A.Ş.` → `Story 77 Creative Reklam ve Tanıtım Hizmetleri Ltd. Şti.` (VKN 7811085924, Doğanbey VD, Beytepe Mah. 5360 Sk. No:2 İç Kapı 11 Çankaya/Ankara). **Exact ticari unvan mali müşavir onayı bekliyor** — owner doğrulayana kadar bu unvanı kullan, doğrulanınca tek yerden düzelt.
- **DOKUNMA listesi:** `apps_script.js` + `apps_script_template.js` (AdaTrust **müşterisine** ait, bizim marka değil — rebrand'lanmaz); `public/platform-icons/meta.svg` + `google-ads.svg` (3rd-party logo); `public/next.svg`/`vercel.svg`/`file.svg`/`globe.svg`/`window.svg` (Next.js scaffold).
- **Karar gerektiren (owner — DEFAULT: değiştirme):** `ZAPIER_INGEST_SECRET` değeri (`yoai_...` — external coupling, rotate riski) ve `GOOGLE_SHEETS_STORAGE_KEY` (`voiceagent_...` — rename = kullanıcı localStorage kaybı). İkisi de **kozmetik**; default AS-IS bırak.
- **Meta DEĞİŞMEZ:** App ID `968757322162498` sabit; app silme/yeniden-oluşturma + Advanced→Standard çevirme YASAK; her kritik adım önce/sonra `GET /me/permissions` baseline.
- **Her faz sonu:** `npx tsc --noEmit` + `npm run build` yeşil → commit. cutover'a kadar `main`'e dokunma.

---

## Task 0: Hazırlık + baseline

**Files:** yok (doğrulama + kayıt).

- [ ] **Step 1: Branch teyidi.** Run: `git -C "/Users/onursuay/Desktop/Onur Suay/Web Siteleri/voice_agent" branch --show-current` → Expected: `rebrand/dijigrow`.
- [ ] **Step 2: Build baseline.** Run: `npm run build` (repo kökünde) → Expected: Compiled successfully. Hata varsa rebrand'dan ÖNCE not al (rebrand'a atfetme).
- [ ] **Step 3: Meta izin baseline (owner/Claude — merkezi token).** `~/.claude/secrets/meta_credentials.json` ile `GET /{968757322162498}` + app-token ile `GET /{968757322162498}/permissions` veya `/me/permissions`. Granted listeyi `docs/rebrand/meta-permissions-baseline.md`'ye yaz (beklenen: leads_retrieval, business_management, pages_show_list, pages_manage_metadata, pages_manage_ads, pages_read_engagement granted). Süreç sonunda birebir karşılaştırılacak.
- [ ] **Step 4: Commit (baseline doc).** `git add docs/rebrand/meta-permissions-baseline.md && git commit -m "chore(rebrand): Meta izin baseline kaydı"`

---

## Task 1: i18n marka string'leri (messages/tr.json + en.json)

**Files:**
- Modify: `messages/tr.json` (7 occurrence — Appendix A)
- Modify: `messages/en.json` (7 occurrence — Appendix A)

**Interfaces:** Hiçbir key adı değişmez, yalnız değerler. EN/TR parite zorunlu.

- [ ] **Step 1:** Appendix A'daki 7 TR + 7 EN occurrence'ı uygula (badge, heroSubtitle, footer, subtitle, defaultScript, sender, sequences.title). Her biri exact current→replacement.
- [ ] **Step 2: Parite kontrolü.** Run: `git -C <repo> grep -nE 'VoiceAgent|Yo Dijital|AI Orkestra|yodijital' messages/` → Expected: 0 satır.
- [ ] **Step 3: Build.** Run: `npm run build` → Expected: PASS.
- [ ] **Step 4: Commit.** `git add messages/ && git commit -m "rebrand(i18n): VoiceAgent/Yo Dijital → DijiGrow + AI Orkestra → DijiOrkestra (TR+EN)"`

---

## Task 2: UI marka string'leri (metadata, landing, sidebar, modal, calls, yorumlar, fallback'ler)

**Files (Appendix B — 29 occurrence, 18 dosya):**
- Modify: `src/app/layout.tsx` (title/description), `src/components/landing/LandingContent.tsx`, `LandingHeader.tsx` (alt+src), `ScheduleModal.tsx` (CONTACT_EMAIL, brand, subject), `src/components/layout/sidebar.tsx` (alt), `src/app/[locale]/(auth)/login/page.tsx` + `register/page.tsx` (alt+src), `pending-approval/page.tsx`, `src/app/[locale]/(dashboard)/hesabim/page.tsx` (referralLink), `calls/page.tsx` (mock transcript + system_prompt), `automations/page.tsx` (yorum), `src/components/automations/sequences-section.tsx` (yorum), `src/app/api/cron/sequences/route.ts` (yorum), `src/app/api/email/send/route.ts` (FROM fallback), `src/app/api/webhooks/meta/route.ts` (verify-token fallback), `src/app/sunum/page.tsx`.

**Not:** Logo `src` path değişiklikleri (`/logos/yoai-logo.png`→`/logos/dijigrow-logo.png`, `/logo.png`→`/dijigrow-logo.png`) **Task 4 (görseller)** ile birlikte yapılır — burada yalnız `alt="Yo Dijital"`→`alt="DijiGrow"` metin değişimini uygula, `src` path'i Task 4'e bırak. (Aynı satırda iki değişiklik varsa Task 4'te tamamla.)

- [ ] **Step 1:** Appendix B'deki tüm `alt`/metin/comment/fallback occurrence'larını uygula. **DİKKAT:** `src/app/api/webhooks/meta/route.ts:27` fallback token `voiceagent_meta_2026`→`dijigrow_meta_2026` — yalnız env unset iken etkili; **canlı `META_WEBHOOK_VERIFY_TOKEN` Meta paneliyle birlikte (Task 9) değişene kadar prod davranışı değişmez** (commit'te not düş).
- [ ] **Step 2: Karar — DEĞİŞTİRME.** `src/app/[locale]/(dashboard)/import/page.tsx:545` `GOOGLE_SHEETS_STORAGE_KEY` AS-IS bırak (Global Constraints; rename = kullanıcı localStorage kaybı). Plana göre dokunma.
- [ ] **Step 3: tsc + build.** Run: `npx tsc --noEmit && npm run build` → Expected: PASS.
- [ ] **Step 4: Commit.** `git add -A && git commit -m "rebrand(ui): marka string + alt + yorum + fallback → DijiGrow"`

---

## Task 3: Legal sayfalar + Story 77 satıcı bloğu

**Files (Appendix C — 87 occurrence, 10 dosya):**
- Modify (route metadata): `src/app/[locale]/{terms-of-service,privacy-policy,cookie-policy}/page.tsx`, `src/app/data-deletion/page.tsx`
- Modify (içerik bileşenleri): `src/components/legal/{TermsOfServiceTR,TermsOfServiceEN,PrivacyPolicyTR,PrivacyPolicyEN,CookiePolicyTR,CookiePolicyEN}.tsx`

- [ ] **Step 1: Standart token swap.** Tüm metadata title/description (`VoiceAgent by Yo Dijital`→`DijiGrow`, `voiceagent.yodijital.com`→`dijigrow.com`), body brand (`VoiceAgent`→`DijiGrow`), mailto+görünür e-posta (`info@yodijital.com`→`info@dijigrow.com`), footer (`© 2025 Yo Dijital`→`© 2025 DijiGrow`), logo alt → Appendix C.
- [ ] **Step 2: TR ek/suffix proofread.** `VoiceAgent'ta`→`DijiGrow'da`, `VoiceAgent'ın`→`DijiGrow'un` (ünlü uyumu: DijiGrow art ünlü → `-da`/`-un`). Etkilenen: `data-deletion/page.tsx:198`, `PrivacyPolicyTR.tsx:114`, `TermsOfServiceTR.tsx:119`.
- [ ] **Step 3: Story 77 SATICI bloğu (elle).** Aşağıdaki body satırlarında yasal entity `YO Dijital Medya A.Ş.`→`Story 77 Creative Reklam ve Tanıtım Hizmetleri Ltd. Şti.` (Appendix C — TermsTR ~22/~36, TermsEN ~22/~36, PrivacyTR ~28/~41/~212, PrivacyEN ~29/~42/~212). **AYRICA** `PrivacyPolicyTR.tsx`+`PrivacyPolicyEN.tsx` "11. İletişim/Contact" kartına (satır ~212-214) **tam satıcı kimlik bloğu EKLE** (m.5 zorunlu): ünvan + VKN 7811085924 + Doğanbey VD + açık adres. Exact unvan mali müşavir onayını bekliyor (Global Constraints).
- [ ] **Step 4: Build + grep.** Run: `npm run build && git -C <repo> grep -nE 'VoiceAgent|YO Dijital Medya|info@yodijital|voiceagent\.yodijital' src/app/\[locale\]/{terms,privacy,cookie}* src/app/data-deletion src/components/legal` → Expected: 0.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "rebrand(legal): DijiGrow + Story 77 satıcı bloğu (TR+EN)"`

---

## Task 4: Görseller — yeni DijiGrow logo/favicon + dosya rename + ref güncelleme

**Files (Appendix D — 5 rename + 23 ref):**
- Design+Create: `public/logos/dijigrow-logo.png`, `public/dijigrow-logo.png`, `public/dijigrow-brain.png`, `public/favicon-32.png` (rebytes), `src/app/favicon.ico` (rebytes), apple-touch.
- Rename (git mv): `public/logos/yoai-logo.png`→`dijigrow-logo.png`; `public/logo.png`→`public/dijigrow-logo.png`; `public/ai-brain.png`→`public/dijigrow-brain.png`. Orphan sil: `public/yoai-logo.png`, `public/favicon.png` (referans yok — owner onayıyla).
- Modify (src path refs): Appendix D'deki tüm `src=` path'leri + kalan `alt` (Task 2'de yapılmadıysa) + `src/app/layout.tsx:16` apple `/logo.png`→`/dijigrow-logo.png`.

- [ ] **Step 1: Yeni logo/favicon TASARLA.** `frontend-design` skill'ini çağır → DijiGrow wordmark (DijiMagic ailesiyle uyumlu, `brightness-0 invert` filtreleri altında düzgün render). PC+mobil önizleme → owner onayı → `public/`'e yerleştir. (Owner "ben tasarlayayım" derse onun varlıklarını bekle.)
- [ ] **Step 2: git mv renames.** Appendix D fileRenames'i `git mv` ile (geçmiş korunur).
- [ ] **Step 3: Ref güncelle.** Tüm `src="/logos/yoai-logo.png"`→`/logos/dijigrow-logo.png`, `src="/logo.png"`→`/dijigrow-logo.png`, `src="/ai-brain.png"`→`/dijigrow-brain.png` + apple icon path (Appendix D).
- [ ] **Step 4: Build + grep.** Run: `npm run build && git -C <repo> grep -nE 'yoai-logo|/logo\.png|ai-brain\.png' src/` → Expected: 0 (tümü dijigrow-*).
- [ ] **Step 5: Commit.** `git add -A && git commit -m "rebrand(assets): DijiGrow logo/favicon + dosya rename + ref"`

---

## Task 5: DB — seed/şema yorumları + canlı veri-string transaction script

**Files (Appendix E):**
- Modify: `supabase/schema.sql:2`, `supabase/seed.sql:2,15,219`, `supabase/migrations/20260612_sequences.sql:2` (yorum + seed VALUES).
- Create: `scripts/rebrand/update-live-data-strings.mjs` (canlı Supabase transaction).

**Not:** Tablo/kolon/index/policy adları **jenerik** → yapısal RENAME YOK (doğrulandı). Yalnız veri-içi string.

- [ ] **Step 1:** `schema.sql`/`seed.sql`/migration yorum + seed VALUES occurrence'larını uygula (Appendix E) — `organizations` seed name `Yo Dijital`→`DijiGrow`, slug `yo-dijital`→`dijigrow`; `lead_activities` JSON subject; comment'ler.
- [ ] **Step 2: Canlı veri script'i yaz.** `scripts/rebrand/update-live-data-strings.mjs` — Supabase Root CA pinli `pg` bağlantısı (DijiMagic deseni `scripts/rebrand/_db.mjs`), `BEGIN`/`COMMIT`, önce `lead_backups` snapshot (reason='pre_restore'). UPDATE'ler: (a) `organizations SET name='DijiGrow', slug='dijigrow' WHERE slug='yo-dijital'` (slug UNIQUE — çakışma kontrolü); (b) `lead_activities` metadata `subject` token replace; (c) `email_templates` subject+body token taraması (compound-first); (d) audit: `email_log`, `lead_notes.content`, `call_logs.transcript/summary`, `sequences.name`, `automation_rules` config — brand token varsa replace. Her UPDATE öncesi `SELECT count(*)` ile etki sayısı logla.
- [ ] **Step 2b: Dry-run.** Script'i önce SELECT-only modda çalıştır (etki sayıları). Beklenmedik yüksek sayı varsa durdur.
- [ ] **Step 3: Çalıştır + doğrula.** Transaction'ı uygula; `SELECT name,slug FROM organizations WHERE id='00000000-0000-0000-0000-000000000001'` → `DijiGrow`/`dijigrow`. `git grep`'le SQL dosyalarında token 0.
- [ ] **Step 4: Commit.** `git add supabase/ scripts/rebrand/ && git commit -m "rebrand(db): seed/şema yorumları + canlı veri-string transaction"`

---

## Task 6: Kod-içi domain + env fallback değerleri

**Files (Appendix F):**
- Modify: `src/app/[locale]/(dashboard)/hesabim/page.tsx:48` (referralLink `voiceagent.yodijital.com`→`dijigrow.com`) — *Task 2'de yapıldıysa atla, değilse burada.*
- Modify: `src/app/api/email/send/route.ts:5` (FROM fallback `Yo Dijital <info@yodijital.com>`→`DijiGrow <info@dijigrow.com>`) — *Task 2 kapsamında; teyit et.*

**Not:** `src/lib/meta/oauth-state.ts` ve OAuth redirect URI'leri **runtime `request.nextUrl.origin`'den türüyor** → kod değişmez; domain cutover'da otomatik dijigrow.com olur. `APP_BASE_URL` boş + referanssız → dokunma.

- [ ] **Step 1:** Kalan kod-içi domain/fallback occurrence'larını uygula (Appendix F).
- [ ] **Step 2: build + grep.** Run: `npm run build && git -C <repo> grep -nE 'yodijital\.com|voiceagent' src/` → Expected: 0 (yalnız Task 2'de AS-IS bırakılan `GOOGLE_SHEETS_STORAGE_KEY` kalabilir — kasıtlı; commit mesajında belirt).
- [ ] **Step 3: Commit.** `git add -A && git commit -m "rebrand(domain): kod-içi referral + e-posta fallback → dijigrow.com"`

---

## Task 7: package.json + repo/Vercel proje adı

**Files:** `package.json:2` (name `ai_agent_santral`→`dijigrow`).

- [ ] **Step 1:** `package.json` name → `dijigrow`. `SUNUM.md` (H1 + e-posta — Appendix G).
- [ ] **Step 2: build.** Run: `npm run build` → PASS.
- [ ] **Step 3: Commit.** `git add package.json SUNUM.md && git commit -m "rebrand(meta): package adı + SUNUM → DijiGrow"`
- [ ] **Step 4: GitHub repo adı (owner/CLI — cutover yakını).** `gh repo rename dijigrow` (remote otomatik güncellenir). *Cutover'a kadar erteleyebilir.*
- [ ] **Step 5: Vercel proje adı (owner/CLI).** Vercel projesi `voiceagent`→`dijigrow` (org `team_0YwKslod6BnDunrkiZm0ewUE`). *Kozmetik; domain bağlamayla birlikte (Task 9).*

---

## Task 8: Final doğrulama (sıfır-iz + build + smoke)

- [ ] **Step 1: Zero-trace grep.** Run: `git -C <repo> grep -niE 'voiceagent|voice agent|yo ?dijital|yodijital|yoai|AI Orkestra' -- ':!docs' ':!apps_script*.js'` → Expected: 0 (AdaTrust `apps_script*` ve `docs/` hariç; kasıtlı `GOOGLE_SHEETS_STORAGE_KEY`/`ZAPIER_INGEST_SECRET` owner kararıyla kalabilir — varsa not).
- [ ] **Step 2: tsc + build.** Run: `npx tsc --noEmit && npm run build` → Expected: 0 hata, Compiled successfully.
- [ ] **Step 3: Smoke (lokal `npm run dev`).** Landing (badge "DijiGrow"), login/register/sidebar logosu, legal sayfalar (DijiGrow + Story 77), data-deletion (info@dijigrow.com). Ekran görüntüsü ile PC+mobil doğrula (global persona kuralı).
- [ ] **Step 4: Commit.** `git add -A && git commit -m "rebrand: final sıfır-iz doğrulama"`

---

## Task 9: Owner checklist — Meta/DNS/dış panolar (izin-koruyan sıra)

> **Bu task kod değil — owner panel işi.** Sıra spec §7.1.1'i izler. **Her kritik adım önce/sonra `GET /me/permissions` baseline karşılaştır.**

- [ ] **Step 1: Domain.** `dijigrow.com` kaydet (registrar) + DNS → Vercel (A `76.76.21.21` / www CNAME).
- [ ] **Step 2: Vercel (Claude/CLI).** `dijigrow.com`+www domain ekle; env: `EMAIL_FROM="DijiGrow <bildirim@dijigrow.com>"`, `META_WEBHOOK_VERIFY_TOKEN="dijigrow_meta_2026"` (Meta panel ile birlikte); redeploy. `ZAPIER_INGEST_SECRET` + localStorage key AS-IS (karar).
- [ ] **Step 3: Resend.** `dijigrow.com` ekle → DKIM/SPF/MX DNS → `verified` → eski domaini sil.
- [ ] **Step 4: Meta (izinler riske girmez).** "önce ekle/sonra sil": App Domains + OAuth redirect (`https://dijigrow.com/api/webhooks/meta`, `/api/integrations/google/callback`, `/api/auth/callback`) + webhook callback `https://dijigrow.com/api/webhooks/meta` + `/api/webhooks/meta-leads` (verify token = `dijigrow_meta_2026`, handshake test + gerçek test lead). Privacy/Terms/Data-Deletion URL → dijigrow.com (canlı). `/me/permissions` baseline karşılaştır.
- [ ] **Step 5: App adı (izole/son).** "Voice Agent"→"DijiGrow" (Display Name Guidelines uyumlu) — AYRI adım, sonra `/me/permissions` doğrula.
- [ ] **Step 6: Portföy taşıma (gerekiyorsa).** Hedef portföy ÖNCE Business Verified → sonra taşı → baseline doğrula → eski portföyü kaldır.
- [ ] **Step 7: Diğer.** Google Cloud OAuth (authorized domains + consent marka), Turnstile (allowed domains), Supabase Auth (Site URL + Redirect URLs), ElevenLabs (agent adı/sender), canlı AI-call agent prompt (`...DijiGrow'dan arıyorum`).
- [ ] **Step 8: Renewal takibi.** Data Access Renewal/DUC deadline'ını izle (60/30/10/3 gün), migration penceresiyle çakıştırma.

---

## Appendix A–G: Exact replace occurrences

> Engineer her occurrence için **current → replacement**'ı uygular. Satır numaraları yaklaşıktır (grep snapshot); eşleşmeyi `current` string ile yap. Tam, kopyala-yapıştır exact liste keşif workflow çıktısındadır (oturum task `w15sgiixh`); aşağıda her katmanın kapsamı + token tipi + ÖZEL (elle/dikkatli) olanlar exact verilmiştir. Basit token swap'lar Global Constraints token map'iyle deterministiktir.

### Appendix A — i18n (messages/tr.json + en.json, 14)
| Satır | Key | Değişim |
|------|-----|---------|
| 654 | calls.defaultScript | `Yo Dijital'den arıyorum`→`DijiGrow'dan arıyorum` (TR) / `from Yo Dijital`→`from DijiGrow` (EN) |
| 699 | email.sender | `info@yodijital.com`→`info@dijigrow.com` |
| 943 | auth.register.subtitle | `Yo Dijital`→`DijiGrow` |
| 979 | landing.badge | `VoiceAgent`→`DijiGrow` |
| 982 | landing.heroSubtitle | baştaki `Yo Dijital`→`DijiGrow` |
| 1026 | landing.footer | `2025 Yo Dijital`→`2025 DijiGrow` |
| 1237 | sequences.title | `AI Orkestra`/`AI Orchestra`→`DijiOrkestra` (TR+EN aynı marka) |

### Appendix B — UI (29, 18 dosya) — token map + ÖZEL:
- `layout.tsx:12-13` title/description `Voice Agent`→`DijiGrow`.
- `LandingContent.tsx` 15/19/64/73/77/122 badge+heroSub+footer (TR+EN); 403 logo alt.
- `LandingHeader.tsx:102` alt (src Task 4).
- `ScheduleModal.tsx`: `6` `CONTACT_EMAIL='info@dijigrow.com'`; `29` `brand:'DijiGrow'`; `143` subject `DijiGrow Görüşme Talebi`.
- `sidebar.tsx:184,197` alt.
- `login/page.tsx:92`, `register/page.tsx:136`, `pending-approval/page.tsx:35-36` alt (src Task 4).
- `hesabim/page.tsx:48` referralLink `dijigrow.com`.
- `calls/page.tsx:58,303` mock transcript + system_prompt `Yo Dijital`→`DijiGrow`.
- `automations/page.tsx:163`, `sequences-section.tsx:22`, `cron/sequences/route.ts:7` yorum `AI Orkestra`→`DijiOrkestra`.
- `email/send/route.ts:5` fallback `'DijiGrow <info@dijigrow.com>'`.
- `webhooks/meta/route.ts:27` fallback `'dijigrow_meta_2026'` (⚠️ canlı token Task 9).
- `sunum/page.tsx:11,448,462,540` (logo alt + tablo satırı + footnote + copyright).
- **AS-IS:** `import/page.tsx:545` `GOOGLE_SHEETS_STORAGE_KEY` (karar — değiştirme).

### Appendix C — Legal (87, 10 dosya)
**Standart (her dosyada):** metadata `VoiceAgent by Yo Dijital`→`DijiGrow`, `voiceagent.yodijital.com`→`dijigrow.com`; body `VoiceAgent`→`DijiGrow`; mailto+text `info@yodijital.com`→`info@dijigrow.com`; footer `© 2025 Yo Dijital`→`© 2025 DijiGrow`; logo alt `Yo Dijital`→`DijiGrow`. Dosyalar: `terms-of-service/page.tsx`, `privacy-policy/page.tsx`, `cookie-policy/page.tsx`, `data-deletion/page.tsx`, `legal/{TermsOfService,PrivacyPolicy,CookiePolicy}{TR,EN}.tsx`.
**ÖZEL — Story 77 (elle):** `YO Dijital Medya A.Ş.`→`Story 77 Creative Reklam ve Tanıtım Hizmetleri Ltd. Şti.` @ TermsTR/EN ~22,~36; PrivacyTR ~28,~41,~212; PrivacyEN ~29,~42,~212. **+ EKLE** PrivacyTR/EN ~212-214 İletişim kartına VKN 7811085924 + Doğanbey VD + açık adres.
**ÖZEL — suffix:** data-deletion ~198 `DijiGrow'un`; PrivacyTR ~114 `DijiGrow'un`; TermsTR ~119 `DijiGrow'da`.
**Badge:** CookieTR/EN ~81 `VoiceAgent · 2025`→`DijiGrow · 2025`.

### Appendix D — Assets (5 rename + 23 ref)
**Renames (git mv):** `public/logos/yoai-logo.png`→`public/logos/dijigrow-logo.png`; `public/logo.png`→`public/dijigrow-logo.png`; `public/ai-brain.png`→`public/dijigrow-brain.png`. **Sil (onayla):** `public/yoai-logo.png`, `public/favicon.png` (orphan).
**Ref güncelle (src=):** `/logos/yoai-logo.png`→`/logos/dijigrow-logo.png` @ login:92, register:136, pending-approval:35, LandingHeader:102. `/logo.png`→`/dijigrow-logo.png` @ data-deletion:227, sunum:11,93, LandingContent:403, sidebar:184,197, legal 6× (~159-162), layout:16(apple). `/ai-brain.png`→`/dijigrow-brain.png` @ LandingContent:223.
**Rebytes-in-place (design):** `public/favicon-32.png` (layout:15), `src/app/favicon.ico`.
**Design (manual):** yeni DijiGrow wordmark + favicon + glyph — `frontend-design`.

### Appendix E — DB (5 + canlı script)
- `schema.sql:2` `-- YO DİJİTAL`→`-- DijiGrow`; `seed.sql:2` `-- YO DIJITAL`→`-- DijiGrow`.
- `seed.sql:15` organizations: name `'Yo Dijital'`→`'DijiGrow'`, slug `'yo-dijital'`→`'dijigrow'`.
- `seed.sql:219` lead_activities JSON `"subject": "Yo Dijital - Cozum Sunumu"`→`"DijiGrow - Cozum Sunumu"`.
- `migrations/20260612_sequences.sql:2` `-- AI Orkestra`→`-- DijiOrkestra` (doc-only, migration re-run YOK).
- **Canlı script:** organizations(name/slug), lead_activities(subject), email_templates, email_log, lead_notes, call_logs, sequences.name, automation_rules — token replace (compound-first), BEGIN/COMMIT + lead_backups snapshot.

### Appendix F — env-domain (kod-içi)
- `hesabim/page.tsx:48` referralLink→`dijigrow.com` (Task 2/6). `email/send/route.ts:5` fallback (Task 2).
- **AS-IS:** `oauth-state.ts` (temiz, runtime origin), `APP_BASE_URL` (boş+referanssız).
- **Owner/Vercel env (Task 9):** `EMAIL_FROM`, `META_WEBHOOK_VERIFY_TOKEN`. **Karar/AS-IS:** `ZAPIER_INGEST_SECRET`, `GOOGLE_SHEETS_STORAGE_KEY`.

### Appendix G — misc (7)
- `package.json:2` name→`dijigrow`. `SUNUM.md:1` H1→`DijiGrow`; `:42` e-posta→`info@dijigrow.com`. `sunum/page.tsx` 11/448/462/540 (Task 2).
- **DOKUNMA:** `apps_script.js`/`apps_script_template.js` (AdaTrust müşteri markası), `next.config.ts`, `.vercel/README.txt`.
