-- ============================================================================
-- AfrikWholesaler — Full-Text Search Infrastructure
-- Run this AFTER schema.sql to enable PostgreSQL full-text search.
-- Implements: tsvector column, GIN index, auto-update trigger, trigram fuzzy matching
-- ============================================================================

-- Enable trigram extension for fuzzy/typo-tolerant search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search_vector column to products (stores pre-computed tsvector)
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN search_vector tsvector;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);

-- Create trigram index for fuzzy/autocomplete search on name
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- Function to generate search vector from product fields
-- Weighted: name (A=high), description (B=medium), category (C=low), sub_category (C=low)
CREATE OR REPLACE FUNCTION products_search_vector_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.sub_category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.origin_country, '')), 'D');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;

-- Create trigger to auto-update search_vector on insert/update
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_trigger();

-- Backfill search_vector for existing products
UPDATE products SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(sub_category, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(origin_country, '')), 'D')
WHERE search_vector IS NULL;

-- ============================================================================
-- Search function — returns matching products with relevance ranking
-- Uses SECURITY DEFINER to bypass RLS for search queries
-- ============================================================================
CREATE OR REPLACE FUNCTION search_products(
  p_query TEXT,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 20,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_in_stock BOOLEAN DEFAULT NULL,
  p_sort TEXT DEFAULT 'relevance'
)
RETURNS SETOF products
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_tsquery tsquery;
BEGIN
  v_offset := (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 20);

  -- Build the query dynamically
  IF p_query IS NOT NULL AND p_query != '' THEN
    v_tsquery := plainto_tsquery('english', p_query);
    
    RETURN QUERY
    SELECT * FROM products
    WHERE is_active = true
      AND search_vector @@ v_tsquery
      AND (p_category IS NULL OR p_category = '' OR category_slug = p_category)
      AND (p_min_price IS NULL OR (price_tiers->0->>'price')::NUMERIC >= p_min_price)
      AND (p_max_price IS NULL OR (price_tiers->0->>'price')::NUMERIC <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND stock_status = 'In Stock') OR (p_in_stock = false))
    ORDER BY
      CASE WHEN p_sort = 'relevance' THEN
        ts_rank_cd(search_vector, v_tsquery, 32) *
        CASE WHEN featured THEN 1.2 ELSE 1.0 END *
        CASE WHEN stock_status = 'In Stock' THEN 1.15 ELSE 0.95 END *
        CASE WHEN rating > 4.5 THEN 1.1 ELSE 1.0 END
      END DESC,
      CASE WHEN p_sort = 'price_asc' THEN (price_tiers->0->>'price')::NUMERIC END ASC,
      CASE WHEN p_sort = 'price_desc' THEN (price_tiers->0->>'price')::NUMERIC END DESC,
      CASE WHEN p_sort = 'newest' THEN created_at END DESC,
      CASE WHEN p_sort = 'rating' THEN rating END DESC,
      created_at DESC
    LIMIT p_page_size OFFSET v_offset;
  ELSE
    -- No text query — just filter and sort
    RETURN QUERY
    SELECT * FROM products
    WHERE is_active = true
      AND (p_category IS NULL OR p_category = '' OR category_slug = p_category)
      AND (p_min_price IS NULL OR (price_tiers->0->>'price')::NUMERIC >= p_min_price)
      AND (p_max_price IS NULL OR (price_tiers->0->>'price')::NUMERIC <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND stock_status = 'In Stock') OR (p_in_stock = false))
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN (price_tiers->0->>'price')::NUMERIC END ASC,
      CASE WHEN p_sort = 'price_desc' THEN (price_tiers->0->>'price')::NUMERIC END DESC,
      CASE WHEN p_sort = 'newest' THEN created_at END DESC,
      CASE WHEN p_sort = 'rating' THEN rating END DESC,
      created_at DESC
    LIMIT p_page_size OFFSET v_offset;
  END IF;
END;
$$;

-- ============================================================================
-- Search count function — returns total matching count (separate from results)
-- ============================================================================
CREATE OR REPLACE FUNCTION search_products_count(
  p_query TEXT,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_in_stock BOOLEAN DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
  v_tsquery tsquery;
BEGIN
  IF p_query IS NOT NULL AND p_query != '' THEN
    v_tsquery := plainto_tsquery('english', p_query);
    
    SELECT COUNT(*) INTO v_count
    FROM products
    WHERE is_active = true
      AND search_vector @@ v_tsquery
      AND (p_category IS NULL OR p_category = '' OR category_slug = p_category)
      AND (p_min_price IS NULL OR (price_tiers->0->>'price')::NUMERIC >= p_min_price)
      AND (p_max_price IS NULL OR (price_tiers->0->>'price')::NUMERIC <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND stock_status = 'In Stock') OR (p_in_stock = false));
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM products
    WHERE is_active = true
      AND (p_category IS NULL OR p_category = '' OR category_slug = p_category)
      AND (p_min_price IS NULL OR (price_tiers->0->>'price')::NUMERIC >= p_min_price)
      AND (p_max_price IS NULL OR (price_tiers->0->>'price')::NUMERIC <= p_max_price)
      AND (p_in_stock IS NULL OR (p_in_stock = true AND stock_status = 'In Stock') OR (p_in_stock = false));
  END IF;
  
  RETURN v_count;
END;
$$;

-- ============================================================================
-- Autocomplete function — prefix + trigram fuzzy matching
-- Usage: SELECT * FROM search_autocomplete('usb', 8);
-- ============================================================================
CREATE OR REPLACE FUNCTION search_autocomplete(
  p_prefix TEXT,
  p_limit INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  category TEXT,
  category_slug TEXT,
  images JSONB,
  price_tiers JSONB,
  similarity REAL
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_prefix IS NULL OR p_prefix = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.category,
    p.category_slug,
    p.images,
    p.price_tiers,
    similarity(p.name, p_prefix) AS similarity
  FROM products p
  WHERE p.is_active = true
    AND (
      p.name ILIKE p_prefix || '%'
      OR p.name % p_prefix
    )
  ORDER BY
    similarity DESC,
    p.rating DESC,
    p.review_count DESC
  LIMIT p_limit;
END;
$$;
