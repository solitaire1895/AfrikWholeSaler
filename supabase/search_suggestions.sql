-- ============================================================================
-- AfrikWholesaler — Popular search suggestions
-- Records what customers search for, so the search bar can suggest the
-- most common searches (like Google's "frais de retrait orange money").
-- Run after schema.sql and search.sql. Safe to run more than once.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS search_queries (
  query            TEXT PRIMARY KEY,               -- normalized: lowercase, single spaces
  display          TEXT NOT NULL,                  -- as last typed by a customer
  hits             INTEGER NOT NULL DEFAULT 1,     -- how many times it was searched
  results          INTEGER NOT NULL DEFAULT 0,     -- products found the last time
  last_searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_hits ON search_queries (hits DESC, last_searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_trgm ON search_queries USING GIN (query gin_trgm_ops);

-- No direct table access: reads and writes go through the functions below.
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Search queries: staff read" ON search_queries;
CREATE POLICY "Search queries: staff read"
  ON search_queries FOR SELECT
  USING (is_staff());

-- ----------------------------------------------------------------------------
-- log_search: record one search. Called by the site when a customer submits
-- a search or picks a suggestion.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_search(p_query TEXT, p_results INT DEFAULT 0)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_display TEXT := btrim(regexp_replace(coalesce(p_query, ''), '\s+', ' ', 'g'));
  v_query   TEXT := lower(v_display);
BEGIN
  -- Ignore empty, very short, very long or link-like input.
  IF length(v_query) < 2 OR length(v_query) > 60 OR v_query ~ '(https?://|www\.|<|>)' THEN
    RETURN;
  END IF;

  INSERT INTO search_queries (query, display, results)
  VALUES (v_query, v_display, GREATEST(coalesce(p_results, 0), 0))
  ON CONFLICT (query) DO UPDATE
    SET hits = search_queries.hits + 1,
        display = EXCLUDED.display,
        results = EXCLUDED.results,
        last_searched_at = now();
END;
$$;

-- ----------------------------------------------------------------------------
-- popular_searches: most frequent searches that returned products.
-- A search must have been made at least twice to be suggested, which keeps
-- one-off typos and junk out of the suggestions.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION popular_searches(p_limit INT DEFAULT 200)
RETURNS TABLE (query TEXT, hits INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.display, s.hits
  FROM search_queries s
  WHERE s.results > 0
    AND s.hits >= 2
  ORDER BY s.hits DESC, s.last_searched_at DESC
  LIMIT LEAST(GREATEST(coalesce(p_limit, 200), 1), 500);
$$;

GRANT EXECUTE ON FUNCTION log_search(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION popular_searches(INT) TO anon, authenticated;
