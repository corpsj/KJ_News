-- YouTube 영상 관리 테이블
CREATE TABLE youtube_videos (
  id BIGSERIAL PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  video_type TEXT NOT NULL DEFAULT 'long' CHECK (video_type IN ('long', 'short')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 (활성 상태만), 관리자 전체 관리
CREATE POLICY "youtube_videos_public_read" ON youtube_videos FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "youtube_videos_auth_all" ON youtube_videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
