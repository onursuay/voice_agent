-- ============================================
-- YO DİJİTAL - Lead Operations Dashboard + CRM
-- Supabase Database Schema
-- ============================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'sales_manager', 'sales_rep', 'analyst', 'readonly');
CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'meeting', 'offer', 'won', 'lost');
CREATE TYPE lead_source_platform AS ENUM ('meta_lead_form', 'whatsapp', 'instagram_dm', 'messenger', 'website', 'manual', 'import', 'other');
CREATE TYPE activity_type AS ENUM ('created', 'stage_change', 'note_added', 'email_sent', 'call_made', 'assigned', 'tag_added', 'tag_removed', 'merged', 'imported', 'edited', 'score_changed');
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================
-- ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORGANIZATION MEMBERS (role mapping)
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'sales_rep',
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ============================================
-- CRM STAGES (customizable per org)
-- ============================================
CREATE TABLE crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- ============================================
-- LEADS (normalized, deduplicated)
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity (dedupe keys)
  phone TEXT,
  email TEXT,
  external_platform_id TEXT,

  -- Personal info
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  company TEXT,
  job_title TEXT,
  city TEXT,
  country TEXT,

  -- CRM fields
  stage_id UUID REFERENCES crm_stages(id),
  assigned_to UUID REFERENCES profiles(id),
  score INTEGER DEFAULT 0,

  -- Source tracking
  source_platform lead_source_platform DEFAULT 'manual',
  campaign_name TEXT,
  ad_set_name TEXT,
  ad_name TEXT,
  form_name TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Meta
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes_count INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dedupe and search
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_phone ON leads(organization_id, phone);
CREATE INDEX idx_leads_email ON leads(organization_id, email);
CREATE INDEX idx_leads_external_id ON leads(organization_id, external_platform_id);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_source ON leads(organization_id, source_platform);
CREATE INDEX idx_leads_created ON leads(organization_id, created_at DESC);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);

-- ============================================
-- RAW SOURCE DATA (preserved as-is from platform)
-- ============================================
CREATE TABLE lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  platform lead_source_platform NOT NULL,
  platform_lead_id TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  ad_set_id TEXT,
  ad_set_name TEXT,
  ad_id TEXT,
  ad_name TEXT,
  form_id TEXT,
  form_name TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}',
  received_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_sources_org ON lead_sources(organization_id);
CREATE INDEX idx_lead_sources_lead ON lead_sources(lead_id);
CREATE INDEX idx_lead_sources_platform_id ON lead_sources(platform_lead_id);

-- ============================================
-- LEAD NOTES
-- ============================================
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id, created_at DESC);

-- ============================================
-- ACTIVITY LOG
-- ============================================
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);

-- ============================================
-- CRM STAGE HISTORY
-- ============================================
CREATE TABLE stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES crm_stages(id),
  to_stage_id UUID REFERENCES crm_stages(id),
  changed_by UUID REFERENCES profiles(id),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stage_history_lead ON stage_history(lead_id, created_at DESC);

-- ============================================
-- IMPORT JOBS
-- ============================================
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT,
  status import_status DEFAULT 'pending',
  column_mapping JSONB DEFAULT '{}',
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  created_rows INTEGER DEFAULT 0,
  updated_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SAVED TABLE VIEWS
-- ============================================
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  sort_config JSONB DEFAULT '[]',
  visible_columns TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EMAIL TEMPLATES (Phase 2 ready)
-- ============================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUTOMATION RULES (Phase 2 ready)
-- ============================================
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CALL LOGS (Phase 2 ready)
-- ============================================
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound',
  duration_seconds INTEGER,
  status TEXT DEFAULT 'pending',
  provider TEXT DEFAULT 'netgsm',
  transcript TEXT,
  summary TEXT,
  result_classification TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's org IDs
CREATE OR REPLACE FUNCTION get_user_org_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = uid AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Profiles: users can read/update own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Org members can view profiles" ON profiles FOR SELECT USING (
  id IN (SELECT user_id FROM organization_members WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))
);

-- Organizations: members can view their orgs
CREATE POLICY "Members can view org" ON organizations FOR SELECT USING (
  id IN (SELECT get_user_org_ids(auth.uid()))
);
CREATE POLICY "Owners can update org" ON organizations FOR UPDATE USING (
  id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'owner')
);

-- Organization members: members can view their org members
CREATE POLICY "Members can view org members" ON organization_members FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- All org-scoped tables: members can access their org data
CREATE POLICY "Org access" ON crm_stages FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON leads FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON lead_sources FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON lead_notes FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON lead_activities FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON stage_history FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON import_jobs FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON saved_views FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON email_templates FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON automation_rules FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "Org access" ON call_logs FOR ALL USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON lead_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON saved_views FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DEFAULT STAGES INSERT FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_default_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crm_stages (organization_id, name, slug, color, position, is_won, is_lost) VALUES
    (NEW.id, 'Yeni', 'new', '#6366f1', 0, false, false),
    (NEW.id, 'İletişime Geçildi', 'contacted', '#3b82f6', 1, false, false),
    (NEW.id, 'Nitelikli', 'qualified', '#8b5cf6', 2, false, false),
    (NEW.id, 'Toplantı', 'meeting', '#f59e0b', 3, false, false),
    (NEW.id, 'Teklif', 'offer', '#f97316', 4, false, false),
    (NEW.id, 'Kazanıldı', 'won', '#22c55e', 5, true, false),
    (NEW.id, 'Kaybedildi', 'lost', '#ef4444', 6, false, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_stages AFTER INSERT ON organizations FOR EACH ROW EXECUTE FUNCTION create_default_stages();
