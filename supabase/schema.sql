-- ============================================================================
-- AfrikWholesaler — Core Database Schema
-- Phase 0: Foundations
--
-- Run this in the Supabase SQL Editor after creating your project.
-- This creates all core tables, indexes, and Row-Level Security policies.
--
-- This script is IDEMPOTENT — it can be run multiple times safely.
-- Tables, indexes, triggers, and policies use IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. Enums (use DO block to avoid errors if type already exists)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'sales_rep', 'support_agent', 'warehouse_staff', 'logistics_staff', 'operations_manager', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE stock_status AS ENUM ('In Stock', 'Low Stock', 'Out of Stock', 'Pre-Order');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'quality_check', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('draft', 'submitted', 'under_review', 'quoted', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('preparing', 'packed', 'dispatched', 'in_transit', 'customs', 'out_for_delivery', 'delivered', 'exception');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE conversation_status AS ENUM ('open', 'pending_agent', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_sender_type AS ENUM ('customer', 'agent', 'ai_assistant', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 3. Profiles (extends Supabase auth.users)
--    One row per authenticated user, linked by auth.uid()
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  first_name  TEXT,
  last_name   TEXT,
  company     TEXT,
  phone       TEXT,
  country     TEXT,
  role        user_role NOT NULL DEFAULT 'customer',
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, company, phone, country)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create customer record on profile creation
-- This ensures every user has a customers row for the dashboard
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only create customer if one doesn't already exist for this user
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE user_id = NEW.id) THEN
    INSERT INTO public.customers (user_id, company_name, contact_name, email, phone, country)
    VALUES (
      NEW.id,
      COALESCE(NEW.company, 'Individual Buyer'),
      COALESCE(
        NULLIF(TRIM(NEW.first_name || ' ' || NEW.last_name), ''),
        NEW.email,
        'Unknown User'
      ),
      NEW.email,
      NEW.phone,
      COALESCE(NEW.country, 'Unknown')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();

-- ----------------------------------------------------------------------------
-- 4. Categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  icon          TEXT,
  product_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4b. Sub-Categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  icon          TEXT,
  image         TEXT,
  category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  product_count INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_slug ON sub_categories(category_slug);
CREATE INDEX IF NOT EXISTS idx_sub_categories_slug ON sub_categories(slug);

-- ----------------------------------------------------------------------------
-- 5. Products
-- ----------------------------------------------------------------------------
-- Add sub-category columns to products if they don't exist yet
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN sub_category TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN sub_category_slug TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN sub_category_id UUID REFERENCES sub_categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL,
  category_slug     TEXT NOT NULL,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category      TEXT,
  sub_category_slug TEXT,
  sub_category_id   UUID REFERENCES sub_categories(id) ON DELETE SET NULL,
  origin_country    TEXT NOT NULL DEFAULT 'China',
  image_url         TEXT,
  images            JSONB DEFAULT '[]',
  video_url         TEXT,
  specs             JSONB DEFAULT '[]',          -- array of {label, value}
  price_tiers       JSONB NOT NULL DEFAULT '[]', -- array of {minQty, maxQty, price}
  moq               INTEGER NOT NULL DEFAULT 1,
  unit              TEXT NOT NULL DEFAULT 'unit',
  stock_status      stock_status NOT NULL DEFAULT 'In Stock',
  stock_quantity    INTEGER NOT NULL DEFAULT 0,
  badges            JSONB DEFAULT '[]',          -- array of strings
  featured          BOOLEAN NOT NULL DEFAULT false,
  rating            NUMERIC(2,1) NOT NULL DEFAULT 0.0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  shipping_estimate TEXT,
  import_tax_rate   NUMERIC(5,2) DEFAULT 0,      -- percentage
  shipping_cost     NUMERIC(10,2) DEFAULT 0,
  delivery_days_min INTEGER,
  delivery_days_max INTEGER,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_sub_category_slug ON products(sub_category_slug);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- 6. Customers (business profiles — separate from auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name        TEXT NOT NULL,
  contact_name        TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  country             TEXT NOT NULL,
  city                TEXT,
  address             TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- unverified, pending, verified
  total_orders        INTEGER NOT NULL DEFAULT 0,
  total_spent         NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ----------------------------------------------------------------------------
-- 7. Orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT NOT NULL UNIQUE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status          order_status NOT NULL DEFAULT 'pending',
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ----------------------------------------------------------------------------
-- 8. Order Items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ----------------------------------------------------------------------------
-- 9. Quote Requests
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quote_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name        TEXT NOT NULL,
  product_slug        TEXT,
  category            TEXT,
  quantity            INTEGER NOT NULL,
  target_price        NUMERIC(10,2),
  destination_country TEXT NOT NULL,
  description         TEXT,
  customization       TEXT,
  urgency             TEXT NOT NULL DEFAULT 'standard', -- standard, express, rush
  attachments         JSONB DEFAULT '[]',
  status              quote_status NOT NULL DEFAULT 'submitted',
  staff_response      TEXT,
  quoted_price        NUMERIC(12,2),
  quoted_delivery_days INTEGER,
  assigned_agent_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_assigned_agent_id ON quote_requests(assigned_agent_id);

-- ----------------------------------------------------------------------------
-- 10. Shipments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_number TEXT NOT NULL UNIQUE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  carrier         TEXT NOT NULL,
  tracking_number TEXT,
  status          shipment_status NOT NULL DEFAULT 'preparing',
  origin_country  TEXT NOT NULL DEFAULT 'China',
  destination_country TEXT NOT NULL,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery     TIMESTAMPTZ,
  customs_docs    JSONB DEFAULT '[]',
  milestones      JSONB DEFAULT '[]', -- array of {status, timestamp, note}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);

-- ----------------------------------------------------------------------------
-- 11. Conversations (Chat)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status          conversation_status NOT NULL DEFAULT 'open',
  priority        TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  tags            JSONB DEFAULT '[]',
  subject         TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_agent_id ON conversations(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- ----------------------------------------------------------------------------
-- 12. Messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type     message_sender_type NOT NULL,
  sender_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content         TEXT NOT NULL,
  attachments     JSONB DEFAULT '[]',
  is_internal_note BOOLEAN NOT NULL DEFAULT false, -- hidden from customers
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ----------------------------------------------------------------------------
-- 13. Staff (internal staff profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id   TEXT UNIQUE,
  department    TEXT, -- sales, support, warehouse, logistics, operations, admin
  position      TEXT,
  hire_date     DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

-- ----------------------------------------------------------------------------
-- 14. Updated_at triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_sub_categories_updated_at ON sub_categories;
CREATE TRIGGER update_sub_categories_updated_at BEFORE UPDATE ON sub_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON quote_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 15. Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is staff/admin
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('sales_rep', 'support_agent', 'warehouse_staff', 'logistics_staff', 'operations_manager', 'admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

-- ---- Profiles ----
DROP POLICY IF EXISTS "Profiles: read own or staff reads all" ON profiles;
CREATE POLICY "Profiles: read own or staff reads all"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Profiles: update own" ON profiles;
CREATE POLICY "Profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Profiles: admin updates all" ON profiles;
CREATE POLICY "Profiles: admin updates all"
  ON profiles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Profiles: admin inserts" ON profiles;
CREATE POLICY "Profiles: admin inserts"
  ON profiles FOR INSERT
  WITH CHECK (is_admin());

-- ---- Categories ----
DROP POLICY IF EXISTS "Categories: public read" ON categories;
CREATE POLICY "Categories: public read"
  ON categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Categories: admin write" ON categories;
CREATE POLICY "Categories: admin write"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---- Sub-Categories ----
DROP POLICY IF EXISTS "Sub-categories: public read" ON sub_categories;
CREATE POLICY "Sub-categories: public read"
  ON sub_categories FOR SELECT
  USING (is_active = true OR is_staff());

DROP POLICY IF EXISTS "Sub-categories: admin write" ON sub_categories;
CREATE POLICY "Sub-categories: admin write"
  ON sub_categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---- Products ----
DROP POLICY IF EXISTS "Products: public read active" ON products;
CREATE POLICY "Products: public read active"
  ON products FOR SELECT
  USING (is_active = true OR is_staff());

DROP POLICY IF EXISTS "Products: admin write" ON products;
CREATE POLICY "Products: admin write"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---- Customers ----
DROP POLICY IF EXISTS "Customers: read own or staff reads all" ON customers;
CREATE POLICY "Customers: read own or staff reads all"
  ON customers FOR SELECT
  USING (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Customers: insert own" ON customers;
CREATE POLICY "Customers: insert own"
  ON customers FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Customers: update own or staff updates all" ON customers;
CREATE POLICY "Customers: update own or staff updates all"
  ON customers FOR UPDATE
  USING (user_id = auth.uid() OR is_staff());

-- ---- Orders ----
DROP POLICY IF EXISTS "Orders: read own or staff reads all" ON orders;
CREATE POLICY "Orders: read own or staff reads all"
  ON orders FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR is_staff()
  );

DROP POLICY IF EXISTS "Orders: staff inserts" ON orders;
CREATE POLICY "Orders: staff inserts"
  ON orders FOR INSERT
  WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Orders: staff updates" ON orders;
CREATE POLICY "Orders: staff updates"
  ON orders FOR UPDATE
  USING (is_staff());

-- ---- Order Items ----
DROP POLICY IF EXISTS "Order items: read via orders" ON order_items;
CREATE POLICY "Order items: read via orders"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
    OR is_staff()
  );

DROP POLICY IF EXISTS "Order items: staff inserts" ON order_items;
CREATE POLICY "Order items: staff inserts"
  ON order_items FOR INSERT
  WITH CHECK (is_staff());

-- ---- Quote Requests ----
DROP POLICY IF EXISTS "Quote requests: read own or staff reads all" ON quote_requests;
CREATE POLICY "Quote requests: read own or staff reads all"
  ON quote_requests FOR SELECT
  USING (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Quote requests: customer inserts own" ON quote_requests;
CREATE POLICY "Quote requests: customer inserts own"
  ON quote_requests FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Quote requests: staff updates" ON quote_requests;
CREATE POLICY "Quote requests: staff updates"
  ON quote_requests FOR UPDATE
  USING (is_staff());

-- ---- Shipments ----
DROP POLICY IF EXISTS "Shipments: read own or staff reads all" ON shipments;
CREATE POLICY "Shipments: read own or staff reads all"
  ON shipments FOR SELECT
  USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR is_staff()
  );

DROP POLICY IF EXISTS "Shipments: staff write" ON shipments;
CREATE POLICY "Shipments: staff write"
  ON shipments FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ---- Conversations ----
DROP POLICY IF EXISTS "Conversations: read own or staff reads all" ON conversations;
CREATE POLICY "Conversations: read own or staff reads all"
  ON conversations FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_staff()
  );

DROP POLICY IF EXISTS "Conversations: customer inserts own" ON conversations;
CREATE POLICY "Conversations: customer inserts own"
  ON conversations FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Conversations: staff updates" ON conversations;
CREATE POLICY "Conversations: staff updates"
  ON conversations FOR UPDATE
  USING (is_staff());

-- ---- Messages ----
DROP POLICY IF EXISTS "Messages: read own non-internal or staff reads all" ON messages;
CREATE POLICY "Messages: read own non-internal or staff reads all"
  ON messages FOR SELECT
  USING (
    (is_internal_note = false
     AND conversation_id IN (
       SELECT id FROM conversations WHERE user_id = auth.uid()
     ))
    OR is_staff()
  );

DROP POLICY IF EXISTS "Messages: customer or staff inserts" ON messages;
CREATE POLICY "Messages: customer or staff inserts"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
    OR is_staff()
  );

-- ---- Staff ----
DROP POLICY IF EXISTS "Staff: read own or admin reads all" ON staff;
CREATE POLICY "Staff: read own or admin reads all"
  ON staff FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Staff: admin write" ON staff;
CREATE POLICY "Staff: admin write"
  ON staff FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 16. Storage Buckets & Policies
-- ============================================================================

-- product-images — public bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
-- Public read access (anyone can view product images)
DROP POLICY IF EXISTS "Product images: public read" ON storage.objects;
CREATE POLICY "Product images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin-only upload (insert)
DROP POLICY IF EXISTS "Product images: admin upload" ON storage.objects;
CREATE POLICY "Product images: admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- Admin-only update
DROP POLICY IF EXISTS "Product images: admin update" ON storage.objects;
CREATE POLICY "Product images: admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin());

-- Admin-only delete
DROP POLICY IF EXISTS "Product images: admin delete" ON storage.objects;
CREATE POLICY "Product images: admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- customer-docs   — private bucket for KYC/customs documents (signed URLs only)
-- chat-attachments — private bucket for chat file uploads
-- quote-attachments — private bucket for quote request attachments
-- (Create these manually in Supabase Dashboard when needed)

-- ============================================================================
-- Done. This script is idempotent and can be re-run safely.
-- Seed data can be added by adapting src/lib/data.ts into SQL inserts.
-- ============================================================================
