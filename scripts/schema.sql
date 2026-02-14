-- ═══════════════════════════════════════════
-- 광전타임즈 Database Schema
-- Run in Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════

-- Drop existing tables (idempotent)
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS authors CASCADE;

-- Authors
CREATE TABLE authors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT DEFAULT ''
);

-- Categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#64748b'
);

-- Articles
CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  author_id BIGINT REFERENCES authors(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  thumbnail_url TEXT DEFAULT '',
  view_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'scheduled', 'published', 'archived', 'rejected')),
  source TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_view_count ON articles(view_count DESC);

-- Enable RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════

-- Authors: public read, authenticated write
CREATE POLICY "Public read authors" ON authors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated insert authors" ON authors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update authors" ON authors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Categories: public read, authenticated write
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Articles: anon can only read published, authenticated can read all + write
CREATE POLICY "Public read published articles" ON articles FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "Authenticated read all articles" ON articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert articles" ON articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update articles" ON articles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete articles" ON articles FOR DELETE TO authenticated USING (true);

-- ═══════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════
-- Storage: press_image bucket policies
-- ═══════════════════════════════════════════

-- Public read access to press images
CREATE POLICY "Public read press images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'press_image');

-- Authenticated upload
CREATE POLICY "Authenticated upload press images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'press_image');

-- Authenticated update
CREATE POLICY "Authenticated update press images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'press_image');

-- Authenticated delete
CREATE POLICY "Authenticated delete press images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'press_image');
