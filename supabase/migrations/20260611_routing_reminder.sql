-- Faz 2: inactivity reminder bookkeeping
-- Son hatırlatma zamanı (her N günde bir tekrar için dedup)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_reminder_at TIMESTAMPTZ;
