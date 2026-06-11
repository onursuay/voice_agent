-- Accountability: speed-to-lead + contact attempt tracking (rep follow-through)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;           -- atandığı an (speed-to-lead referansı)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ;      -- ilk arama denemesi
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;       -- son arama denemesi
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_outcome TEXT;              -- reached | no_answer | busy | wrong_number
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sla_alert_first_at TIMESTAMPTZ;    -- ilk-arama SLA ihlali uyarısı gönderildi (dedup)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sla_alert_retry_at TIMESTAMPTZ;    -- retry SLA ihlali uyarısı (dedup)

CREATE INDEX IF NOT EXISTS idx_leads_accountability
  ON leads(organization_id, assigned_to, contact_outcome);
