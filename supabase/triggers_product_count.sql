-- ============================================================================
-- AfrikWholesaler — Product Count Triggers
-- Auto-updates categories.product_count and sub_categories.product_count
-- when products are inserted, updated, or deleted.
-- Run this AFTER schema.sql.
-- ============================================================================

-- Function to update category product counts
-- Uses SECURITY DEFINER to bypass RLS when counting products
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Update all categories with live product counts
  UPDATE categories 
  SET product_count = COALESCE(
    (SELECT COUNT(*) FROM products WHERE category_id = categories.id AND is_active = true),
    0
  );
  
  -- Update all sub-categories with live product counts
  UPDATE sub_categories
  SET product_count = COALESCE(
    (SELECT COUNT(*) FROM products WHERE sub_category_id = sub_categories.id AND is_active = true),
    0
  );
  
  RETURN COALESCE(TG_OP, 'INSERT');
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_product_count_insert ON products;
DROP TRIGGER IF EXISTS trg_product_count_update ON products;
DROP TRIGGER IF EXISTS trg_product_count_delete ON products;

-- Create triggers for INSERT, UPDATE, DELETE
CREATE TRIGGER trg_product_count_insert
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

CREATE TRIGGER trg_product_count_update
  AFTER UPDATE OF category_id, sub_category_id, is_active ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

CREATE TRIGGER trg_product_count_delete
  AFTER DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- Run once to update existing counts
SELECT update_category_product_count();
