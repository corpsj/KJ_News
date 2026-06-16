-- Fix: increment_view_count was missing on the remote DB, so the public view
-- endpoint (/api/articles/[id]/view) returned HTTP 500 and view counts never
-- incremented. Recreate it (published-only, SECURITY DEFINER) and explicitly
-- grant EXECUTE so anonymous (public) visitors can call it via PostgREST RPC.
CREATE OR REPLACE FUNCTION increment_view_count(article_id_param BIGINT)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id_param
    AND status = 'published'
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_view_count(BIGINT) TO anon, authenticated;
