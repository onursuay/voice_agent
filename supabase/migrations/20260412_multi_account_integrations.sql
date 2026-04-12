-- Multi-account integration support
-- Allows multiple rows per provider so one org can connect multiple pages/accounts.

-- 1. Drop the global UNIQUE constraint on provider (was: one row per provider globally)
ALTER TABLE integration_settings DROP CONSTRAINT IF EXISTS integration_settings_provider_key;

-- 2. Partial unique index: one active meta_leads row per (org, page)
--    Allows same page for different orgs (agency), but not duplicate within same org.
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_settings_meta_leads_page
  ON integration_settings ((config->>'organization_id'), (config->>'page_id'))
  WHERE provider = 'meta_leads' AND is_active = true;

-- 3. Partial unique index: one meta_oauth_pending row per org
--    Replaces the broken global UNIQUE; each org gets its own isolated pending session.
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_settings_meta_pending_org
  ON integration_settings ((config->>'organization_id'))
  WHERE provider = 'meta_oauth_pending';

-- 4. Covering index on (provider, org_id) for all the .eq('provider').filter('config->>organization_id') queries
CREATE INDEX IF NOT EXISTS idx_integration_settings_provider_org
  ON integration_settings (provider, (config->>'organization_id'));
