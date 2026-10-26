-- ============================================================================
-- AfrikWholesaler — Clean product slugs (URL part of each product page)
-- Safe to re-run: only slugs that aren't already clean are changed.
--
-- Some slugs contained characters that break URLs and the sitemap:
-- “ ” quotes, #, &, :, commas, parentheses… ("…summer-dresses-#4" can't even
-- be opened: browsers never send what follows "#"). This turns them into
-- lowercase letters, digits and dashes, the same rules as slugify() in
-- src/lib/slug.ts, keeps them unique, and records every change in
-- product_slug_history (old links redirect automatically in the app).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS product_slug_history (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_slug   TEXT NOT NULL,
  new_slug   TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE product_slug_history ENABLE ROW LEVEL SECURITY;   -- staff/admin tooling only (service role)

CREATE OR REPLACE FUNCTION slugify_text(p_text TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT regexp_replace(
           left(
             trim(BOTH '-' FROM regexp_replace(
               replace(lower(unaccent(coalesce(p_text, ''))), '&', ' and '),
               '[^a-z0-9]+', '-', 'g')),
             80),
           '-+$', '');
$$;

DO $$
DECLARE
  p RECORD;
  v_base TEXT;
  v_slug TEXT;
  v_n INT;
  v_changed INT := 0;
BEGIN
  FOR p IN
    SELECT id, slug, name FROM products
    WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ORDER BY created_at
  LOOP
    v_base := nullif(slugify_text(p.slug), '');
    IF v_base IS NULL THEN v_base := coalesce(nullif(slugify_text(p.name), ''), 'product'); END IF;
    v_slug := v_base;
    v_n := 2;
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = v_slug AND id <> p.id) LOOP
      v_slug := v_base || '-' || v_n;
      v_n := v_n + 1;
    END LOOP;

    INSERT INTO product_slug_history (product_id, old_slug, new_slug) VALUES (p.id, p.slug, v_slug);
    UPDATE products SET slug = v_slug WHERE id = p.id;
    v_changed := v_changed + 1;
  END LOOP;

  RAISE NOTICE 'Product slugs cleaned: %', v_changed;
END $$;

-- Check: both should return 0.
SELECT
  (SELECT count(*) FROM products WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$') AS still_unclean,
  (SELECT count(*) - count(DISTINCT slug) FROM products) AS duplicates;

-- Undo (if ever needed):
-- UPDATE products p SET slug = h.old_slug FROM product_slug_history h WHERE h.product_id = p.id;
