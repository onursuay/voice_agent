# Erişim Yönetimi + Satış Temsilcisi Hesapları + Mobil Görünüm — Tasarım

**Tarih:** 2026-06-11
**Durum:** Onaylandı
**Proje:** voice_agent (Next.js 16 App Router + Supabase + next-intl)
**İlgili spec:** [Lead Yönlendirme Kural Motoru + E-posta](2026-06-11-lead-yonlendirme-kural-motoru-design.md)
(aynı e-posta/Resend altyapısını paylaşır)

---

## 1. Amaç

1. **Owner-tanımlı erişim**: Owner, hesap menüsü → **Ayarlar → Erişim Yönetimi** ekranından
   her kullanıcı için (e-posta bazlı) hangi sayfaları görebileceğini ve hangi leadlere
   erişeceğini tek tek seçer. Kullanıcı yalnızca onaylanan alanları görür.
2. **Satış temsilcisi hesapları**: Owner/admin yeni temsilci davet eder; temsilci kendi
   şifresini belirleyip giriş yapar.
3. **Saha/mobil kullanım**: Temsilci sahada telefondan kendi leadlerini görüp işlem yapar
   (ara, aşama değiştir, not ekle). Görünüm mobil-öncelikli ve responsive.
4. **i18n düzeltmesi**: TR modunda İngilizce sızan nav başlıkları Türkçeye çekilir; tüm
   yeni/revize metinler TR/EN kuralına uyar.

## 2. Onaylanmış Kararlar

| Konu | Karar |
|------|-------|
| Erişim modeli | Owner-tanımlı, **kullanıcı (e-posta) bazlı**, sayfa bazında aç/kapa. |
| Konum | Hesap menüsü → **Ayarlar → Erişim Yönetimi** (yalnızca owner/admin görür). |
| Kapsam | Sidebar'daki **8 bölümün tamamı** (yeni eklenen sayfalar otomatik dahil). |
| Lead kapsamı | Kullanıcı başına `Hepsi` veya `Sadece bana atananlar`. |
| Temsilci hesabı | **Admin davet → temsilci şifresini belirler** (Resend ile davet maili). |
| Temsilci yetkisi | Görüntüle + Ara + Aşama değiştir + Not ekle. **Atama/silme YOK.** |
| Mobil | Mobil-öncelikli, responsive; temsilci için kart tabanlı lead görünümü. |
| Zorunluluk | 3 katman: menü gizleme + rota koruması + DB (RLS) veri kısıtı. |
| i18n | TR'de Türkçe, EN'de İngilizce GÖRÜNDÜĞÜ doğrulanır; istisnasız. |

## 3. Erişim Modeli

### 3.1 Nav bölümleri (erişim anahtarları)
Sidebar `NAV_ITEMS_BASE` ([src/components/layout/sidebar.tsx:43](../../../src/components/layout/sidebar.tsx#L43))
ile birebir, sırası: `dashboard` (Panel) · `leads` (Lead) · `pipeline` (Satış Hattı) ·
`import` (İçe Aktar) · `email` (E-posta) · `automations` (Otomasyonlar) ·
`integrations` (Entegrasyonlar) · `calls` (AI Aramalar — en sağda).

> Not: "AI Aramalar" matris/sıralamada Otomasyonlar ve Entegrasyonlar'ın sağında konumlanır.

### 3.2 Veri modeli (yeni migration)
`organization_members` tablosuna iki alan eklenir:
```sql
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS allowed_pages TEXT[];
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS lead_scope TEXT NOT NULL DEFAULT 'all';
-- allowed_pages: nav anahtarları dizisi. NULL ⇒ role varsayılanından türetilir.
-- lead_scope: 'all' | 'assigned_only'
```
- **Owner/admin** her zaman tam erişim (allowed_pages yok sayılır, hepsi açık).
- **Hazır şablonlar** (UI kolaylığı): "Saha" → `allowed_pages={leads}`, `lead_scope=assigned_only`;
  "Yönetici" → `{dashboard,leads,pipeline,email,calls}`, `lead_scope=all`. Owner her kutuyu
  şablon sonrası elle düzenler.

### 3.3 UI — Ayarlar → Erişim Yönetimi
- Owner/admin'e görünür yeni Ayarlar sekmesi: kullanıcı listesi (e-posta) × 8 sayfa
  matrisi (toggle) + "Lead kapsamı" seçimi + rol/şablon seçimi.
- "Yeni kullanıcı davet et" aksiyonu (Bölüm 5).
- `GET/PATCH /api/members` erişim alanlarını okur/yazar (mevcut route genişletilir).

## 4. Zorunlu Kılma (3 katman)

### 4.1 Menü (client)
Sidebar `NAV_ITEMS_BASE`'i oturumdaki `membership.allowed_pages`'e göre filtreler
(owner/admin → tümü). Yetkisiz bölüm hiç render edilmez.

### 4.2 Rota koruması
`(dashboard)/layout.tsx` ([src/app/[locale]/(dashboard)/layout.tsx](../../../src/app/%5Blocale%5D/%28dashboard%29/layout.tsx))
oturum yüklendikten sonra mevcut yolu `allowed_pages` ile karşılaştırır; yetkisizse
**izinli ilk sayfaya** yönlendirir. Ek olarak `middleware.ts`'te sunucu tarafı kontrol
(rol + allowed_pages) ile URL'i elle yazma engellenir.

### 4.3 Veri (RLS) — kritik
`leads` üzerindeki mevcut tek `FOR ALL` "Org access" politikası
([supabase/schema.sql:343](../../../supabase/schema.sql#L343)) granüler politikalarla
değiştirilir:
- **SELECT**: org eşleşmesi **VE** (`lead_scope='all'` **VEYA** `assigned_to = auth.uid()`).
- **UPDATE**: temsilci yalnızca kendi leadini güncelleyebilir (aşama/not); `assigned_to`
  değiştirme owner/admin/sales_manager'a kalır.
- **INSERT/DELETE**: temsilcide kapalı; owner/admin/manager'da açık.
- Yardımcı: `get_user_lead_scope(org_id)` SQL fonksiyonu ile politika sadeleştirilir.
- İlgili alt tablolar (`lead_notes`, `lead_activities`) da lead'in görünürlüğünü izler.

## 5. Satış Temsilcisi Hesap Sağlama (davet akışı)

Mevcut `POST /api/members` **placeholder** ([src/app/api/members/route.ts:48](../../../src/app/api/members/route.ts#L48)) —
gerçek akış kurulur:
1. Owner/admin: e-posta + ad + rol + erişim config girer.
2. Sunucu (service role) Supabase **admin** ile kullanıcı oluşturur:
   `auth.admin.generateLink({ type: 'invite', email })` ile davet/şifre-belirleme linki
   üretilir.
3. Link **Resend** ile (paylaşılan e-posta modülü) markalı bir davet mailinde gönderilir
   (Supabase'in yerleşik SMTP'sine bağımlı kalınmaz).
4. `profiles` + `organization_members` (rol + `allowed_pages` + `lead_scope`) satırı
   oluşturulur (davet beklemede olarak işaretlenebilir).
5. Temsilci linke tıklar, şifresini belirler, giriş yapar.

İzin: yalnızca `members.manage` (owner/admin).

## 6. Mobil / Responsive

### 6.1 Genel layout
`(dashboard)/layout.tsx` mobilde: sabit sidebar yerine **hamburger + kayar drawer**
(store'da `sidebarOpen`/`setSidebarOpen` zaten var; Topbar tetikler). `main` padding mobile
için küçülür.

### 6.2 Temsilci lead görünümü (mobil-öncelikli)
- Leads sayfası mobilde **kart listesi** (geniş TanStack tablo yerine): her kart Ad Soyad +
  şehir + aşama rozeti.
- Lead detayı tam ekran: büyük **"Ara"** butonu (`tel:` linki), **aşama** seçimi (negatif
  aşamalar Meta'ya yansır — mevcut `metaAudienceSync`), **not** ekleme alanı.
- Masaüstü grid mevcut haliyle kalır; mobilde alternatif görünüm devreye girer.

## 7. i18n Düzeltmesi (standing rule)

- `messages/tr.json`: `nav.dashboard` → "Panel", `nav.pipeline` → "Satış Hattı";
  `nav.leads` → "Lead" (loanword, korunur). `messages/en.json` İngilizce karşılıklar
  doğrulanır.
- Tüm yeni/revize bileşenler `useTranslations` kullanır; **TR render'ında Türkçe,
  EN'de İngilizce göründüğü** doğrulanır. (Memory: i18n kuralı 2026-06-11'de güçlendirildi.)

## 8. İzinler & Güvenlik

- Erişim Yönetimi ekranı + davet: `owner`/`admin` (`members.manage`).
- RLS kararları sunucuda zorlanır (client filtre yalnızca UX). Davet/oluşturma yalnızca
  service-role sunucu tarafında.

## 9. Test Stratejisi

- **Erişim**: allowed_pages filtresi (menü), rota koruması (yetkisiz URL → redirect),
  RLS (assigned_only kullanıcı yalnızca kendi leadlerini çeker; API'den başkasınınkine
  erişemez).
- **Davet**: davet → set-password → giriş; oluşan üyelik rol + access config doğru.
- **Mobil**: dar viewport'ta kart görünümü, `tel:` linki, aşama/not aksiyonları.
- **i18n**: TR locale'de nav başlıkları Türkçe, EN'de İngilizce.

## 10. Kapsam Dışı / Sonraki

- Sayfa-içi alan/sütun düzeyinde ince yetki (sadece nav bölüm düzeyi kapsamda).
- Denetim günlüğü (kim kimin erişimini değiştirdi) — ileride `lead_activities` benzeri log.
- Çok-org kullanıcılar için org bazlı farklı erişim profilleri (şu an tek aktif org varsayımı).

## 11. Riskler & Varsayımlar

- RLS politika değişikliği dikkatli test edilmeli (mevcut `FOR ALL` politikayı bölmek
  regresyon riski taşır; owner/admin tam erişimi korunmalı).
- Supabase admin işlemleri service-role anahtarı gerektirir (yalnızca sunucu).
- Davet maili Resend domain doğrulamasına bağlıdır (routing spec ile aynı altyapı).
