-- Lead soft-delete (Çöp Kutusu) + günlük yedek altyapısı.
-- GÜVENLİ / EKLEMELİ: yalnızca yeni kolon + yeni tablo ekler. Mevcut canlı
-- uygulamayı ETKİLEMEZ (eski kod bu kolonları görmezden gelir). Tek seferlik.

-- 1) Çöp kutusu kolonları: silme artık kalıcı değil, deleted_at damgalanır.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;   -- doluysa = çöpte
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_by UUID;          -- silen kullanıcı (iz)

-- Aktif/çöp ayrımı sık sorgulanır → org bazlı kısmi-uyumlu index.
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(organization_id, deleted_at);

-- 2) Günlük tam yedek: org başına TÜM lead'lerin (aktif + çöp) JSON anlık görüntüsü.
--    Felaket/kötü-niyet senaryosunda buradan geri yüklenir.
CREATE TABLE IF NOT EXISTS lead_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL DEFAULT 'daily',   -- daily | manual | pre_restore
  lead_count INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL                   -- [{...lead}, ...] tam satır anlık görüntüsü
);

CREATE INDEX IF NOT EXISTS idx_lead_backups_org_taken ON lead_backups(organization_id, taken_at DESC);

ALTER TABLE lead_backups ENABLE ROW LEVEL SECURITY;

-- Org üyeleri yalnız kendi org yedeklerini OKUYABİLİR. Yazma/geri-yükleme
-- yalnızca service role (cron + admin client API) ile yapılır → RLS'i baypas eder.
DROP POLICY IF EXISTS "lead_backups_select" ON lead_backups;
CREATE POLICY "lead_backups_select" ON lead_backups FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
);
