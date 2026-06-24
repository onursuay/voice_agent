-- CRM aşamasına Meta Custom Audience kovası ayarı (owner: her aşamaya tek tek seçilir).
-- 'qualified'  → "<Marka>/Nitelikli"   (reklamda DAHİL et / lookalike tohumu)
-- 'unqualified'→ "<Marka>/Niteliksiz"  (reklamda HARİÇ tut)
-- 'none'/NULL  → hiçbir kitleye eklenmez (giriş/ara aşamalar)
-- Kod, NULL durumunda makul sezgisele düşer (giriş→none, kaybedildi→unqualified, gerisi→qualified),
-- bu yüzden migration uygulanmadan da güvenlidir.
ALTER TABLE public.crm_stages
  ADD COLUMN IF NOT EXISTS meta_audience text
  CHECK (meta_audience IN ('qualified', 'unqualified', 'none'));

-- Mevcut aşamalara makul başlangıç değeri (owner Ayarlar > Satış Hattı'ndan değiştirebilir).
-- 1) Her org'un giriş (en düşük position) aşaması → none.
UPDATE public.crm_stages s SET meta_audience = 'none'
  WHERE meta_audience IS NULL
    AND position = (SELECT MIN(position) FROM public.crm_stages s2 WHERE s2.organization_id = s.organization_id);
-- 2) Kaybedildi / niteliksiz adlı aşamalar → unqualified.
UPDATE public.crm_stages SET meta_audience = 'unqualified'
  WHERE meta_audience IS NULL
    AND (is_lost = true OR name ~* 'niteliksiz|unqualified|kay[ıi]p|kaybed|spam|geçersiz|hatal');
-- 3) Kalan tüm aşamalar → qualified.
UPDATE public.crm_stages SET meta_audience = 'qualified' WHERE meta_audience IS NULL;
