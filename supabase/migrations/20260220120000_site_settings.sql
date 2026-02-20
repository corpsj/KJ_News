CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read site_settings" ON site_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated upsert site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update site_settings" ON site_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
