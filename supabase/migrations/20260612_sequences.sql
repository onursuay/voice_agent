-- ============================================================================
-- AI Orkestra (Sequences) — lead düşünce plana göre AI arama + funnel mail
-- sequences / sequence_steps / sequence_enrollments + call_logs genişletme
-- ============================================================================

-- 1) SEQUENCES — senaryo tanımı (tetik koşulu + arama penceresi)
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- ruleConditions.TriggerConfig modeli: { conditions: [{field,operator,value}], match }
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- Arama penceresi (yalnız ai_call adımları için): {start_hour, end_hour} — Europe/Istanbul
  call_window JSONB NOT NULL DEFAULT '{"start_hour": 11, "end_hour": 18}',
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sequences_org ON sequences(organization_id, is_active);

-- 2) SEQUENCE_STEPS — sıralı adımlar
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  -- ai_call: ElevenLabs araması | email: lead'e funnel maili
  step_type TEXT NOT NULL CHECK (step_type IN ('ai_call', 'email')),
  -- Önceki adımdan (veya kayıttan) sonra bekleme süresi
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  -- Koşullu çalıştırma: always | not_reached (son aramada ulaşılamadıysa) | reached
  only_if TEXT NOT NULL DEFAULT 'always' CHECK (only_if IN ('always', 'not_reached', 'reached')),
  -- email: {email_template_id} | ai_call: {} (agent org-config'ten)
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_seq ON sequence_steps(sequence_id, position);

-- 3) SEQUENCE_ENROLLMENTS — lead'in senaryodaki konumu
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  -- active | completed | stopped
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  current_position INTEGER NOT NULL DEFAULT 0,    -- sıradaki adımın position'ı
  next_run_at TIMESTAMPTZ,                        -- adımın çalışacağı zaman
  -- Devam eden arama varsa ilgili call_logs kaydı (sonuç gelene kadar due-runner atlar)
  pending_call_id UUID REFERENCES call_logs(id),
  last_call_outcome TEXT,                         -- reached | not_reached
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, lead_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_due ON sequence_enrollments(status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead ON sequence_enrollments(lead_id);

-- 4) CALL_LOGS genişletme — ElevenLabs conversation takibi
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES sequence_enrollments(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_call_logs_conversation
  ON call_logs(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_pending
  ON call_logs(status) WHERE status = 'calling';

-- 5) RLS — org-scoped (leads deseni)
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org access" ON sequences;
CREATE POLICY "Org access" ON sequences FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "Org access" ON sequence_steps;
CREATE POLICY "Org access" ON sequence_steps FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "Org access" ON sequence_enrollments;
CREATE POLICY "Org access" ON sequence_enrollments FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- 6) updated_at trigger'ları — idempotent
DROP TRIGGER IF EXISTS set_updated_at ON sequences;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON sequence_enrollments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sequence_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
