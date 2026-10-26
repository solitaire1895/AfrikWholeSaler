-- ============================================================================
-- AfrikWholesaler — Cart, customer orders and product chat
-- Alibaba-style buying: customers add products to a cart, check out to
-- create their own order, and chat with the seller about a product.
-- Run after schema.sql. Safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Cart: one row per (user, product)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 1000000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cart: owner reads" ON cart_items;
CREATE POLICY "Cart: owner reads" ON cart_items FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Cart: owner inserts" ON cart_items;
CREATE POLICY "Cart: owner inserts" ON cart_items FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Cart: owner updates" ON cart_items;
CREATE POLICY "Cart: owner updates" ON cart_items FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Cart: owner deletes" ON cart_items;
CREATE POLICY "Cart: owner deletes" ON cart_items FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. Orders placed by customers from their cart
--    Orders are still written by the server only (service role), after it has
--    re-priced every line from the products table.
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN source TEXT NOT NULL DEFAULT 'staff'; -- 'staff' | 'cart'
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- True while at least one line is "price on request" and staff must set it
-- before the customer can pay.
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN awaiting_price BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN contact_phone TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 3. Product chat: link a conversation to the product it is about
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE conversations ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
