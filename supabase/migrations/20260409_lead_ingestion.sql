ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'zapier';

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS meta_lead_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_page_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_form_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_id TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_meta_lead_id_unique
  ON leads(meta_lead_id)
  WHERE meta_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_email_global ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone_global ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_desc_global ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_id TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_provider ON lead_events(provider);
CREATE INDEX IF NOT EXISTS idx_lead_events_external_id ON lead_events(external_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_desc ON lead_events(created_at DESC);

CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
