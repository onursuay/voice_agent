-- Lead routing: automation_rules priority, leads routing status, email_log

-- 1) automation_rules: öncelik
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_active
  ON automation_rules(organization_id, is_active, priority);

-- 2) leads: yönlendirme durumu (grid "İletildi" sütunu)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_status TEXT;            -- null|no_match|sent|failed|skipped
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_last_emailed_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS routing_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL;

-- 3) email_log: kalıcı gönderim kaydı
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL,            -- 'sent' | 'failed'
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  trigger TEXT NOT NULL,           -- 'auto' | 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_log_org ON email_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_lead ON email_log(lead_id);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org access" ON email_log FOR ALL
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
