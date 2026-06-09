-- CRM stage → Meta Custom Audience sync: per-lead sync bookkeeping.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS meta_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS meta_capi_sent BOOLEAN NOT NULL DEFAULT false;
