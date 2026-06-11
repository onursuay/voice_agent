-- Access control: per-member page access, lead scope, registration approval + updated RLS

-- 1) organization_members alanları
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS allowed_pages TEXT[];
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS lead_scope TEXT NOT NULL DEFAULT 'all';        -- 'all' | 'assigned_only'
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'; -- 'approved' | 'pending' | 'rejected'

-- 2) get_user_org_ids: yalnız approved üyeler org erişir (TÜM org-scoped tabloları onay'a kapılar)
CREATE OR REPLACE FUNCTION get_user_org_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = uid AND is_active = true AND approval_status = 'approved';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 3) Lead kapsamı yardımcı fonksiyonu
CREATE OR REPLACE FUNCTION get_user_lead_scope(org UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(lead_scope, 'all') FROM organization_members
  WHERE user_id = auth.uid() AND organization_id = org AND is_active = true AND approval_status = 'approved'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 4) leads: tek FOR ALL politikayı granüler + kapsam-duyarlı politikalarla değiştir
DROP POLICY IF EXISTS "Org access" ON leads;

CREATE POLICY "leads_select" ON leads FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (get_user_lead_scope(organization_id) = 'all' OR assigned_to = auth.uid())
);
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND get_user_lead_scope(organization_id) = 'all'
);
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (get_user_lead_scope(organization_id) = 'all' OR assigned_to = auth.uid())
);
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND get_user_lead_scope(organization_id) = 'all'
);
