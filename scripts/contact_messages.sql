-- ═══════════════════════════════════════════
-- 광전타임즈 Contact Messages Table
-- Run in Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at DESC);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anon insert contact messages"
  ON contact_messages FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated read contact messages"
  ON contact_messages FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated update contact messages"
  ON contact_messages FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated delete contact messages"
  ON contact_messages FOR DELETE TO authenticated
  USING (true);

-- Reuse existing trigger function for updated_at
CREATE TRIGGER set_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
