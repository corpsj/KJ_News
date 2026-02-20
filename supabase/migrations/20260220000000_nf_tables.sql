CREATE TABLE IF NOT EXISTS nf_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  client_name text NOT NULL DEFAULT 'KJTIMES',
  is_active boolean NOT NULL DEFAULT true,
  collect_categories text[] NOT NULL DEFAULT ARRAY['행정','복지','문화','경제','안전','정치','사회','스포츠','오피니언'],
  collect_schedule text NOT NULL DEFAULT '매일 06:00, 12:00, 18:00',
  last_synced_at timestamptz,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO nf_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS nf_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nf_sync_logs_synced_at ON nf_sync_logs(synced_at DESC);
