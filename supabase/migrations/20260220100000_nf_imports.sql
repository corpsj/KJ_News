CREATE TABLE IF NOT EXISTS nf_imports (
  id SERIAL PRIMARY KEY,
  nf_article_id UUID NOT NULL UNIQUE,
  local_article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  nf_title TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('imported', 'published'))
);

CREATE INDEX idx_nf_imports_nf_article_id ON nf_imports(nf_article_id);
CREATE INDEX idx_nf_imports_imported_at ON nf_imports(imported_at DESC);

ALTER TABLE nf_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read nf_imports" ON nf_imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert nf_imports" ON nf_imports FOR INSERT TO authenticated WITH CHECK (true);

DROP TABLE IF EXISTS nf_sync_logs;
DROP TABLE IF EXISTS nf_settings;
