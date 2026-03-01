-- 팝업 관리 테이블
CREATE TABLE popups (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  position TEXT DEFAULT 'center' CHECK (position IN ('center', 'top', 'bottom')),
  width INTEGER DEFAULT 480,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 광고 배너 테이블
CREATE TABLE ad_banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT DEFAULT '',
  slot TEXT NOT NULL CHECK (slot IN ('main_news_below', 'category_below', 'latest_below')),
  is_active BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_banners ENABLE ROW LEVEL SECURITY;

-- 팝업: 공개 읽기 (활성 상태만), 관리자 전체 관리
CREATE POLICY "popups_public_read" ON popups FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "popups_auth_all" ON popups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 광고 배너: 공개 읽기 (활성 상태만), 관리자 전체 관리
CREATE POLICY "ad_banners_public_read" ON ad_banners FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "ad_banners_auth_all" ON ad_banners FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 보도자료, 국제 카테고리 삭제 (해당 카테고리 기사의 category_id는 NULL로 설정됨 - ON DELETE SET NULL)
DELETE FROM categories WHERE slug IN ('press_release', 'international')
  OR name IN ('보도자료', '국제');
