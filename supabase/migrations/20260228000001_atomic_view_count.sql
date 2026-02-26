-- Atomic view count increment to prevent race conditions
CREATE OR REPLACE FUNCTION increment_view_count(article_id_param BIGINT)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id_param
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
