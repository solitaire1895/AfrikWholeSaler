-- ============================================================================
-- SasPay payments — one row per checkout session created for an order.
-- Written only by the server (service role); customers can read their own.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL DEFAULT 'saspay',
  checkout_session_id   TEXT NOT NULL UNIQUE,
  checkout_url          TEXT NOT NULL,
  transaction_id        TEXT,
  transaction_reference TEXT,
  amount                NUMERIC(14,2) NOT NULL,   -- amount sent to SasPay (in `currency`)
  currency              TEXT NOT NULL,
  charged               NUMERIC(14,2),            -- what the payer paid (from webhook)
  net_amount            NUMERIC(14,2),            -- what we receive (from webhook)
  network               TEXT,
  status                TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED | CANCELLED
  raw_event             JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payments: read own or staff reads all" ON payments;
CREATE POLICY "Payments: read own or staff reads all"
  ON payments FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE c.user_id = auth.uid()
    )
    OR is_staff()
  );
