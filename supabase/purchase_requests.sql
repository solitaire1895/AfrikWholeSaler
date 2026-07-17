-- ============================================================================
-- AfrikWholesaler — Internal Purchase Requests Schema
-- Phase 4: Operations & Logistics
--
-- This creates the purchase_requests table for internal procurement tracking.
-- Run this AFTER schema.sql has been executed.
-- This script is IDEMPOTENT — it can be run multiple times safely.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Purchase Requests Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number             TEXT NOT NULL UNIQUE,
  quote_request_id      UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
  product_name          TEXT NOT NULL,
  description           TEXT,
  quantity              INTEGER NOT NULL,
  target_unit_price     NUMERIC(10,2),
  factory_name          TEXT,
  factory_contact       TEXT,
  factory_quoted_price NUMERIC(10,2),
  status                TEXT NOT NULL DEFAULT 'draft', -- draft, sourcing, negotiating, ordered, received, cancelled
  notes                 TEXT,
  admin_notes           TEXT, -- Internal procurement notes (not customer-facing)
  requested_by          UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expected_delivery_date DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_quote_request_id ON purchase_requests(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requested_by ON purchase_requests(requested_by);

-- ----------------------------------------------------------------------------
-- 2. Updated_at trigger
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_purchase_requests_updated_at ON purchase_requests;
CREATE TRIGGER update_purchase_requests_updated_at
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- Staff can read all purchase requests
DROP POLICY IF EXISTS "Purchase requests: staff reads all" ON purchase_requests;
CREATE POLICY "Purchase requests: staff reads all"
  ON purchase_requests FOR SELECT
  USING (is_staff());

-- Staff can insert purchase requests
DROP POLICY IF EXISTS "Purchase requests: staff inserts" ON purchase_requests;
CREATE POLICY "Purchase requests: staff inserts"
  ON purchase_requests FOR INSERT
  WITH CHECK (is_staff());

-- Staff can update purchase requests
DROP POLICY IF EXISTS "Purchase requests: staff updates" ON purchase_requests;
CREATE POLICY "Purchase requests: staff updates"
  ON purchase_requests FOR UPDATE
  USING (is_staff());

-- Staff can delete purchase requests
DROP POLICY IF EXISTS "Purchase requests: staff deletes" ON purchase_requests;
CREATE POLICY "Purchase requests: staff deletes"
  ON purchase_requests FOR DELETE
  USING (is_staff());

-- ============================================================================
-- Done. This script is idempotent and can be re-run safely.
-- ============================================================================