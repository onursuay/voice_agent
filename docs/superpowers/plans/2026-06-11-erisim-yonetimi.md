# Erişim Yönetimi + Temsilci Hesapları + Mobil + Kayıt Onayı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use `- [ ]` checkboxes.

**Goal:** Owner'ın kullanıcı bazında (e-posta) hangi sayfaları göreceğini ve hangi leadlere erişeceğini seçebilmesi; yeni kayıtların owner onayına tabi olması; satış temsilcisi hesaplarının davetle açılması; saha için mobil lead görünümü.

**Architecture:** Erişim, `organization_members`'a eklenen `allowed_pages`, `lead_scope`, `approval_status` alanlarıyla yönetilir. 3 katman: (1) sidebar nav filtresi, (2) route guard, (3) RLS. Owner Ayarlar→Erişim Yönetimi ekranından yönetir.

**Tech Stack:** Next.js 16 App Router, Supabase (RLS), next-intl, Resend (davet maili — routing'de kurulan modül), TypeScript.

**Test yaklaşımı:** Test altyapısı/dosyası **EKLENMEZ**. Doğrulama: `npm run build` + `npm run lint` + elle (localhost) doğrulama.

**Referans spec:** [docs/superpowers/specs/2026-06-11-erisim-yonetimi-temsilci-mobil-design.md](../specs/2026-06-11-erisim-yonetimi-temsilci-mobil-design.md)

**KRİTİK güvenlik notu:** RLS ve auth değişiklikleri mevcut owner'ı KİLİTLEMEMELİ. `approval_status` default `'approved'` (mevcut tüm üyeler approved kalır); yalnız yeni self-signup `'pending'`. Owner `lead_scope` default `'all'` → tüm leadleri görür.

---

## Dosya Yapısı

**Yeni:**
- `supabase/migrations/20260611_access_control.sql`
- `src/app/[locale]/(dashboard)/settings/access/page.tsx` — Erişim Yönetimi ekranı (veya mevcut settings sayfasına sekme)
- `src/app/[locale]/pending-approval/page.tsx` — "onay bekliyor" ekranı
- `src/app/api/members/[id]/route.ts` — üye güncelle (allowed_pages/lead_scope/role/approval) + sil
- `src/app/api/members/pending/route.ts` — bekleyen kayıtlar (veya GET /api/members'a dahil)
- `src/lib/access.ts` — nav anahtarları + erişim yardımcıları (allowedPages defaults, canAccessPage)

**Değişecek:**
- `src/lib/types.ts` — `OrganizationMember` tipine `allowed_pages`, `lead_scope`, `approval_status`
- `src/lib/store.ts` — session membership alanları
- `src/app/[locale]/(dashboard)/layout.tsx` — route guard (pending + allowed_pages)
- `src/components/layout/sidebar.tsx` — nav filtresi
- `src/app/api/members/route.ts` — gerçek davet (Supabase admin + Resend) + GET'e access alanları
- `src/app/api/auth/register/route.ts` (veya setup) — self-signup → `approval_status='pending'`
- Leads sayfası/grid/drawer — mobil-responsive temsilci görünümü
- `src/messages/tr.json` + `en.json` — yeni anahtarlar

---

## Task 1: DB migration (access alanları + RLS)

**Files:** Create `supabase/migrations/20260611_access_control.sql`

- [ ] **Step 1: Migration yaz**

```sql
-- Access control: per-member page access, lead scope, registration approval

-- 1) organization_members alanları
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS allowed_pages TEXT[];
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS lead_scope TEXT NOT NULL DEFAULT 'all';        -- 'all' | 'assigned_only'
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'; -- 'approved' | 'pending' | 'rejected'

-- 2) get_user_org_ids: yalnız approved üyeler org erişir (TÜM org-scoped tabloları onay'a kapılar)
CREATE OR REPLACE FUNCTION get_user_org_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = uid AND is_active = true AND approval_status = 'approved';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 3) Lead kapsamı yardımcı fonksiyonu
CREATE OR REPLACE FUNCTION get_user_lead_scope(org UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(lead_scope, 'all') FROM organization_members
  WHERE user_id = auth.uid() AND organization_id = org AND is_active = true AND approval_status = 'approved'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 4) leads: tek FOR ALL politikayı granüler + kapsam-duyarlı politikalarla değiştir
DROP POLICY IF EXISTS "Org access" ON leads;

CREATE POLICY "leads_select" ON leads FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (get_user_lead_scope(organization_id) = 'all' OR assigned_to = auth.uid())
);
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND get_user_lead_scope(organization_id) = 'all'
);
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (get_user_lead_scope(organization_id) = 'all' OR assigned_to = auth.uid())
);
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND get_user_lead_scope(organization_id) = 'all'
);
```

Not: `get_user_org_ids` değişikliği `approval_status='approved'` koşulu ekler — pending kullanıcı hiçbir org-scoped tabloyu göremez (tek noktadan onay kapısı). Diğer tabloların mevcut "Org access" politikaları `get_user_org_ids` kullandığı için otomatik onay-kapılı olur.

- [ ] **Step 2: Doğrulama notu** — Bu migration CANLI DB'ye controller/kullanıcı koordinasyonuyla uygulanır (subagent uygulamaz). Subagent yalnız dosyayı yazar.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260611_access_control.sql
git commit -m "feat(db): per-member access, lead scope, registration approval + RLS"
```

---

## Task 2: Tipler + nav anahtarları + erişim yardımcıları

**Files:** Create `src/lib/access.ts`; Modify `src/lib/types.ts`

- [ ] **Step 1: `src/lib/access.ts`**
```ts
// Sidebar nav bölümleri (sidebar.tsx NAV_ITEMS_BASE ile birebir id'ler)
export const NAV_PAGE_KEYS = [
  'dashboard', 'leads', 'pipeline', 'import', 'email', 'automations', 'integrations', 'calls',
] as const;
export type NavPageKey = (typeof NAV_PAGE_KEYS)[number];

// Rol şablonları (UI kolaylığı): owner/admin tam erişim
export const ROLE_PAGE_PRESETS: Record<string, NavPageKey[]> = {
  owner: [...NAV_PAGE_KEYS],
  admin: [...NAV_PAGE_KEYS],
  sales_manager: ['dashboard', 'leads', 'pipeline', 'email', 'calls'],
  sales_rep: ['leads'],
  analyst: ['dashboard', 'leads'],
  readonly: ['leads'],
};

export function isFullAccessRole(role?: string | null): boolean {
  return role === 'owner' || role === 'admin';
}

// allowed_pages null ise rol şablonundan türet; owner/admin her zaman tüm sayfalar
export function resolveAllowedPages(role: string | null | undefined, allowed: string[] | null | undefined): NavPageKey[] {
  if (isFullAccessRole(role)) return [...NAV_PAGE_KEYS];
  if (allowed && allowed.length) return allowed.filter((p): p is NavPageKey => (NAV_PAGE_KEYS as readonly string[]).includes(p));
  return ROLE_PAGE_PRESETS[role || 'readonly'] || ['leads'];
}

export function canAccessPage(page: NavPageKey, role: string | null | undefined, allowed: string[] | null | undefined): boolean {
  return resolveAllowedPages(role, allowed).includes(page);
}
```

- [ ] **Step 2: `src/lib/types.ts`** — `OrganizationMember` tipine ekle (mevcut alanların yanına): `allowed_pages?: string[] | null; lead_scope?: string | null; approval_status?: string | null;`

- [ ] **Step 3: Build doğrula** — `npx tsc --noEmit`

- [ ] **Step 4: Commit**
```bash
git add src/lib/access.ts src/lib/types.ts
git commit -m "feat(access): nav page keys + access helpers + member types"
```

---

## Task 3: Session/store — membership erişim alanlarını taşı

**Files:** Modify `src/lib/store.ts`, `src/app/[locale]/(dashboard)/layout.tsx`

> ÖNCE OKU. Layout (`(dashboard)/layout.tsx`) membership'i Supabase'den çekip store'a koyuyor; membership zaten `select('*')` ile çekiliyorsa yeni kolonlar otomatik gelir — doğrula.

- [ ] **Step 1:** Store `session.membership` tipinin `allowed_pages/lead_scope/approval_status` taşıdığından emin ol (tip Task 2'de güncellendi). Layout'taki membership select'i `*` değilse, bu üç kolonu ekle.
- [ ] **Step 2:** Build doğrula — `npx tsc --noEmit`
- [ ] **Step 3:** Commit `git add -A && git commit -m "feat(access): expose membership access fields in session"`

---

## Task 4: Route guard + "onay bekliyor" ekranı

**Files:** Create `src/app/[locale]/pending-approval/page.tsx`; Modify `src/app/[locale]/(dashboard)/layout.tsx`

> OKU: layout şu an oturum yoksa `/login`'e yönlendiriyor. Aynı yere iki kontrol ekle.

- [ ] **Step 1: Pending ekranı** — basit, i18n'li bir sayfa: "Hesabınız onay bekliyor" + çıkış butonu. (Mevcut auth/login stilini izle.)
- [ ] **Step 2: Guard (layout.tsx)** — membership yüklendikten sonra:
  - `membership.approval_status !== 'approved'` → `router.replace('/pending-approval')`.
  - Mevcut pathname'i `resolveAllowedPages(role, allowed_pages)` ile karşılaştır (sayfa key'ini pathname'den çıkar — örn. `/leads` → 'leads'); izinli değilse izinli ilk sayfaya `router.replace`. `src/lib/access.ts`'ten `canAccessPage`/`resolveAllowedPages` kullan. Owner/admin her sayfaya erişir.
  - Hesap menüsü sayfaları (settings/hesabim/faturalarim/abonelik) bu kısıttan muaf (kendi hesabı).
- [ ] **Step 3:** Build + lint
- [ ] **Step 4:** Commit `git add -A && git commit -m "feat(access): pending-approval screen + route guard"`

---

## Task 5: Sidebar nav filtresi

**Files:** Modify `src/components/layout/sidebar.tsx`

> OKU: `NAV_ITEMS_BASE` herkese render ediliyor; session `useAppStore` üzerinden mevcut.

- [ ] **Step 1:** `navItems`'i `resolveAllowedPages(session?.membership?.role, session?.membership?.allowed_pages)` ile filtrele (owner/admin tümü). İlgili `id` izinli değilse menüden çıkar. `src/lib/access.ts`'ten yardımcı kullan.
- [ ] **Step 2:** Build + lint
- [ ] **Step 3:** Commit `git add -A && git commit -m "feat(access): filter sidebar nav by allowed pages"`

---

## Task 6: Kayıt → pending (self-signup onay bekler)

**Files:** Modify `src/app/api/auth/register/route.ts` (ve/veya `src/app/api/auth/setup/route.ts`)

> OKU: register/setup yeni kullanıcı + `organization_members` satırı oluşturuyor. İLK kullanıcı (org sahibi/owner) `approved` kalmalı; sonradan aynı org'a self-signup ile katılanlar `pending` olmalı.

- [ ] **Step 1:** Yeni org kuran ilk kullanıcı (owner) → `approval_status: 'approved'` (mevcut davranış). Var olan bir org'a self-signup ile katılan kullanıcı → `approval_status: 'pending'`. (Akış nasılsa: yeni org mu açılıyor yoksa mevcut org'a mı katılınıyor ayrımını koddan tespit et; owner her zaman approved.)
- [ ] **Step 2:** Build + lint
- [ ] **Step 3:** Commit `git add -A && git commit -m "feat(access): self-signup members start as pending"`

---

## Task 7: Members API — davet + onay/red + güncelle

**Files:** Modify `src/app/api/members/route.ts`; Create `src/app/api/members/[id]/route.ts`

> Mevcut `members/route.ts` POST'u placeholder. Gerçek davet akışını kur. Supabase admin client: `createAdminSupabaseClient` (`@/lib/supabase/admin`). Resend: `sendEmail` (`@/lib/email/send`).

- [ ] **Step 1: GET (route.ts)** — mevcut GET org üyelerini döner; `approval_status` dahil tüm alanların döndüğünden emin ol (`select('*, profile:profiles(*)')` zaten *).

- [ ] **Step 2: POST davet (route.ts)** — yalnız owner/admin (`members.manage`). Body: `{ email, full_name, role, allowed_pages, lead_scope }`.
  - `createAdminSupabaseClient().auth.admin.generateLink({ type: 'invite', email })` ile davet/şifre-belirleme linki üret.
  - Kullanıcı/profil + `organization_members` satırı oluştur: `role`, `allowed_pages`, `lead_scope`, `approval_status: 'approved'` (davetli doğrudan approved).
  - Daveti `sendEmail({ to: email, subject, html })` ile gönder (link içeren markalı şablon).
  - Hata yönetimi + uygun JSON.

- [ ] **Step 3: PATCH (`[id]/route.ts`)** — yalnız owner/admin. Body partial: `{ allowed_pages?, lead_scope?, role?, approval_status? }`. İlgili `organization_members` satırını güncelle. (Onayla = `approval_status:'approved'`; Reddet = `'rejected'`.) Onaylandığında opsiyonel bilgilendirme maili.

- [ ] **Step 4: DELETE (`[id]/route.ts`)** — yalnız owner/admin; üyeliği sil (kullanıcı reddi/çıkarma).

- [ ] **Step 5:** Build + lint
- [ ] **Step 6:** Commit `git add -A && git commit -m "feat(api): member invite (Supabase admin + Resend), approve/reject, update access"`

---

## Task 8: Erişim Yönetimi UI (Ayarlar)

**Files:** Create `src/app/[locale]/(dashboard)/settings/access/page.tsx` (veya mevcut settings sayfasına "Erişim Yönetimi" sekmesi — OKU mevcut settings yapısını); Modify sidebar user-dropdown (Ayarlar linki zaten var)

> Reusable UI: `src/components/ui` (Button, Input, Select, Modal, Badge, Tabs). E-posta sayfasının desenini izle. i18n: yeni `access` namespace.

- [ ] **Step 1:** Owner/admin'e görünür ekran (değilse erişim engelle). İki bölüm:
  - **Bekleyen kayıtlar**: `approval_status='pending'` üyeler — her biri için Onayla/Reddet + (onaylarken) rol/sayfa/lead-kapsamı ön-ataması.
  - **Kullanıcılar matrisi**: her üye satırı × 8 sayfa toggle (`allowed_pages`) + `lead_scope` (Hepsi/Sadece atananlar) + rol. "Saha/Yönetici" şablon butonları (`ROLE_PAGE_PRESETS`). Değişiklik → `PATCH /api/members/[id]`.
  - **Davet et**: e-posta+ad+rol+erişim → `POST /api/members`.
- [ ] **Step 2:** Build + lint
- [ ] **Step 3:** Commit `git add -A && git commit -m "feat(ui): access management (Ayarlar) — pending approvals, page matrix, invite"`

---

## Task 9: Mobil temsilci görünümü (responsive)

**Files:** Modify `src/app/[locale]/(dashboard)/layout.tsx` (mobil drawer), `src/app/[locale]/(dashboard)/leads/page.tsx` + ilgili grid/kart bileşeni

> OKU: layout masaüstü sabit sidebar; store'da `sidebarOpen` var. Leads grid mobilde yatay kayıyor.

- [ ] **Step 1:** Layout mobilde (`< md`): sidebar yerine hamburger + kayar drawer (`sidebarOpen`/`setSidebarOpen`, Topbar tetikler). Masaüstü değişmez.
- [ ] **Step 2:** Leads mobilde kart listesi: dar ekranda tablo yerine kartlar (Ad Soyad + şehir + aşama rozeti). Lead detayında büyük "Ara" (`tel:` linki), aşama seçimi, not ekleme — mevcut drawer aksiyonlarını mobil-dostu sun. (Reusable bileşenleri kullan; masaüstü grid'i bozma.)
- [ ] **Step 3:** Build + lint
- [ ] **Step 4:** Commit `git add -A && git commit -m "feat(ui): mobile-responsive rep lead view + nav drawer"`

---

## Task 10: i18n + tam doğrulama

**Files:** Modify `src/messages/tr.json` + `en.json`

- [ ] **Step 1:** Önceki task'larda kullanılan tüm yeni metinler için `access` namespace (TR+EN, aynı anahtarlar): pending ekranı, erişim yönetimi etiketleri, davet, onayla/reddet, sayfa adları, lead kapsamı, vb. **TR Türkçe / EN İngilizce** doğrula.
- [ ] **Step 2:** `node -e "require('./src/messages/tr.json'); require('./src/messages/en.json')"` → JSON OK.
- [ ] **Step 3:** Tam `npm run build` + `npm run lint` (benim dosyalarımda hata yok).
- [ ] **Step 4:** Commit `git add -A && git commit -m "feat(i18n): access management namespace (TR/EN)"`

---

## Tamamlanma Kriterleri

- [ ] Owner, Ayarlar→Erişim Yönetimi'nden her kullanıcının sayfalarını ve lead kapsamını seçebilir.
- [ ] Yetkisiz sayfa menüde yok + URL'le erişilemez (izinli ilk sayfaya yönlenir).
- [ ] `lead_scope='assigned_only'` kullanıcı yalnız kendi leadlerini görür (RLS — API'den bile).
- [ ] Yeni self-signup `pending` → "onay bekliyor"; owner onaylayınca erişir.
- [ ] Owner davet → temsilci şifre belirleyip girer (approved).
- [ ] Mobilde temsilci kendi leadlerini görüp arar/aşama değiştirir/not ekler.
- [ ] TR/EN; mevcut owner KİLİTLENMEDİ.
- [ ] `npm run build` + `npm run lint` (benim dosyalarımda) temiz.
