-- ============================================================================
-- AfrikWholesaler — Fix: products could not be created
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- The category product-count trigger ran "UPDATE categories SET … " with no
-- WHERE clause on every product insert/update/delete. Supabase rejects that
-- ("UPDATE requires a WHERE clause"), which cancelled the whole product
-- insert. It also returned text instead of a row.
--
-- This version only recounts the category / sub-category the product left
-- and the one it joined, each with a WHERE clause.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_categories UUID[] := ARRAY[]::UUID[];
  v_sub_categories UUID[] := ARRAY[]::UUID[];
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_categories := v_categories || NEW.category_id;
    v_sub_categories := v_sub_categories || NEW.sub_category_id;
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_categories := v_categories || OLD.category_id;
    v_sub_categories := v_sub_categories || OLD.sub_category_id;
  END IF;

  UPDATE categories c
     SET product_count = (SELECT count(*) FROM products p WHERE p.category_id = c.id AND p.is_active = true)
   WHERE c.id = ANY (v_categories);

  UPDATE sub_categories s
     SET product_count = (SELECT count(*) FROM products p WHERE p.sub_category_id = s.id AND p.is_active = true)
   WHERE s.id = ANY (v_sub_categories);

  RETURN NULL;   -- AFTER trigger: the return value is ignored
END;
$$;

DROP TRIGGER IF EXISTS trg_product_count_insert ON products;
DROP TRIGGER IF EXISTS trg_product_count_update ON products;
DROP TRIGGER IF EXISTS trg_product_count_delete ON products;

CREATE TRIGGER trg_product_count_insert
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

CREATE TRIGGER trg_product_count_update
  AFTER UPDATE OF category_id, sub_category_id, is_active ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

CREATE TRIGGER trg_product_count_delete
  AFTER DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- Recount everything once so the numbers are right today.
UPDATE categories c
   SET product_count = (SELECT count(*) FROM products p WHERE p.category_id = c.id AND p.is_active = true)
 WHERE true;
UPDATE sub_categories s
   SET product_count = (SELECT count(*) FROM products p WHERE p.sub_category_id = s.id AND p.is_active = true)
 WHERE true;

-- Check: the triggers that will run on products.
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.products'::regclass AND NOT tgisinternal ORDER BY tgname;
