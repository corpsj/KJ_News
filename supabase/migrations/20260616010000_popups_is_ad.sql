-- Add an explicit advertising flag to popups so commercial popups can be
-- labeled "광고" (표시광고법 / 신문법 기사형광고 표시) while notices are not.
ALTER TABLE popups ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false;
