-- ============================================================================
-- Omnichannel Gelen Kutusu — WhatsApp / Instagram DM / Messenger
-- conversations + messages tabloları, leads kanal-kimlik kolonları, RLS, realtime
-- ============================================================================

-- 1) LEADS: kanal kimlik kolonları (her kanal için birincil eşleştirme anahtarı)
--    Not: ad-soyad güvenilmez; eşleştirme wa_id / ig_user_id / psid üzerinden yapılır.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS display_name TEXT;          -- profil adı (yalnız görüntü, dedupe'ta kullanılmaz)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_wa_id TEXT;        -- WhatsApp wa_id (telefon temelli kimlik)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;     -- Instagram-scoped user id (IGSID)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_username TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS messenger_psid TEXT;        -- Page-Scoped User ID

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_wa_id
  ON leads(organization_id, whatsapp_wa_id) WHERE whatsapp_wa_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_ig_user
  ON leads(organization_id, instagram_user_id) WHERE instagram_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_psid
  ON leads(organization_id, messenger_psid) WHERE messenger_psid IS NOT NULL;

-- 2) CONVERSATIONS — kanal-agnostik konuşma kaydı
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'messenger', 'lead_form')),
  -- organic | click_to_whatsapp | instagram_dm | messenger | lead_form
  source TEXT NOT NULL DEFAULT 'organic',
  -- new | open | pending | resolved | snoozed
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('new', 'open', 'pending', 'resolved', 'snoozed')),
  assigned_to UUID REFERENCES profiles(id),

  -- Bağlı kanal hesabı: phone_number_id | ig_business_account_id | page_id
  channel_account_id TEXT,
  -- Karşı taraf kimliği: wa_id | igsid | psid
  external_conversation_id TEXT,

  -- Click-to-WhatsApp reklam attribution (varsa)
  ctwa_clid TEXT,
  ad_source_id TEXT,
  ad_source_url TEXT,
  ad_headline TEXT,

  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tek konuşma: (org, channel, channel_account, external_conversation_id)
-- Not: COALESCE yok — partial WHERE her iki anahtarın da dolu olmasını şart koşar,
-- böylece NULL-distinctness yarışı oluşmaz (messaging konuşmalarında ikisi de hep dolu).
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_external
  ON conversations (organization_id, channel, channel_account_id, external_conversation_id)
  WHERE external_conversation_id IS NOT NULL AND channel_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_org_last ON conversations(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(organization_id, channel);

-- 3) MESSAGES — tek mesaj kaydı (inbound/outbound)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  channel TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  -- text | image | video | audio | document | location | template | interactive | system
  message_type TEXT NOT NULL DEFAULT 'text',
  message_text TEXT,
  content JSONB NOT NULL DEFAULT '{}',

  external_message_id TEXT,
  external_sender_id TEXT,
  external_recipient_id TEXT,

  -- received | sent | delivered | read | failed
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  -- contact | agent | system
  sender_type TEXT NOT NULL DEFAULT 'contact',
  sender_user_id UUID REFERENCES profiles(id),

  raw_payload JSONB,
  sent_at TIMESTAMPTZ,                       -- platform timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedup anahtarı: platform mesaj id'si benzersiz (webhook tekrarlarını engeller)
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id
  ON messages(external_message_id) WHERE external_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_org ON messages(organization_id);

-- 4) MESSAGING KANAL HESABI BENZERSİZLİĞİ
-- phone_number_id / page_id / ig_business_account_id global kimliklerdir; bir hesap
-- yalnız BİR org'a bağlanabilsin (inbound webhook çözümünde org çakışmasını önler).
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_settings_whatsapp_phone
  ON integration_settings ((config->>'phone_number_id'))
  WHERE provider = 'meta_whatsapp' AND is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_settings_messenger_page
  ON integration_settings ((config->>'page_id'))
  WHERE provider = 'meta_messenger' AND is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_settings_instagram_account
  ON integration_settings ((config->>'ig_business_account_id'))
  WHERE provider = 'meta_instagram' AND is_active = true;

-- 5) ROW LEVEL SECURITY — leads desenine birebir uyumlu (org + lead_scope)
-- Tüm policy'ler idempotent (DROP IF EXISTS) ve org-eşleşme guard'lı (cross-org lead_id sızıntısı kapalı).
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- conversations: org üyesi + (kapsam='all' VEYA konuşma/lead bana atanmış)
DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (
    get_user_lead_scope(organization_id) = 'all'
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = conversations.lead_id
        AND l.organization_id = conversations.organization_id
        AND l.assigned_to = auth.uid()
    )
  )
);
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
);
DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (
    get_user_lead_scope(organization_id) = 'all'
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = conversations.lead_id
        AND l.organization_id = conversations.organization_id
        AND l.assigned_to = auth.uid()
    )
  )
);
DROP POLICY IF EXISTS "conversations_delete" ON conversations;
CREATE POLICY "conversations_delete" ON conversations FOR DELETE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND get_user_lead_scope(organization_id) = 'all'
);

-- messages: kapsamı bağlı konuşma üzerinden türet (iki ayrı EXISTS — NULL-OR belirsizliği yok)
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  AND (
    get_user_lead_scope(organization_id) = 'all'
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.organization_id = messages.organization_id
        AND c.assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM conversations c
      JOIN leads l ON l.id = c.lead_id
      WHERE c.id = messages.conversation_id
        AND c.organization_id = messages.organization_id
        AND l.organization_id = messages.organization_id
        AND l.assigned_to = auth.uid()
    )
  )
);
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
);
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

-- 6) updated_at trigger (conversations) — idempotent
DROP TRIGGER IF EXISTS set_updated_at ON conversations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7) REALTIME — inbox canlı güncelleme için publication'a ekle (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION
  WHEN duplicate_object THEN NULL;   -- zaten ekli
  WHEN undefined_object THEN NULL;   -- publication yok (lokal/test)
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
