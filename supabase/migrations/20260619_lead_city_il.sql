-- Lead şehir normalizasyonu
-- ============================================
-- Serbest metin "city" alanı kirli gelir (kullanıcı ilçe/plaka/yazım hatası yazar).
-- city_il = resolver (src/lib/leads/turkeyProvinces.ts) tarafından çözülen kanonik T.C. ili.
--   "Orhangazi" → Bursa, "34" → İstanbul, "Istnbul" → İstanbul, "x" → NULL (çözülemedi).
-- Routing kuralları artık bu temiz değere göre eşleşir → doğru kişiye mail.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS city_il TEXT;

COMMENT ON COLUMN leads.city_il IS 'Serbest metin city alanından çözülen kanonik T.C. ili (81 il). NULL = çözülemedi/işaretlenmeli.';

CREATE INDEX IF NOT EXISTS idx_leads_city_il ON leads (organization_id, city_il);
