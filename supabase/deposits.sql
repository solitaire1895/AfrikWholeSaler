-- ============================================================================
-- AfrikWholesaler — Deposits for big orders
-- Run AFTER payments.sql, affiliates.sql, chat_notifications.sql and
-- order_tracking.sql. Safe to re-run.
--
-- Orders of $1,000 or more can be paid 30% now (deposit) and the rest before
-- shipping (balance). Every confirmed SasPay payment is added to
-- orders.amount_paid exactly once; the order becomes 'partial', then 'paid'.
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'full';     -- full | deposit | balance
ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_amount NUMERIC(12,2);            -- share of the order paid, in the order's currency
ALTER TABLE payments ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;                -- when it was added to orders.amount_paid

-- Orders already paid before this file: their payment covered everything.
UPDATE orders SET amount_paid = GREATEST(total_amount - wallet_applied, 0)
WHERE payment_status = 'paid' AND amount_paid = 0;
UPDATE payments SET applied_at = updated_at WHERE status = 'SUCCESS' AND applied_at IS NULL;

-- ----------------------------------------------------------------------------
-- Applies a confirmed payment to its order — once. Server-only (service role).
-- Returns { applied, kind, order_amount, order_status, balance_due }.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_order_payment(p_payment UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  p payments%ROWTYPE;
  o orders%ROWTYPE;
  v_due NUMERIC;
  v_paid NUMERIC;
  v_status TEXT;
BEGIN
  SELECT * INTO p FROM payments WHERE id = p_payment FOR UPDATE;
  IF NOT FOUND OR p.status <> 'SUCCESS' THEN RETURN jsonb_build_object('applied', false); END IF;
  IF p.applied_at IS NOT NULL THEN
    RETURN jsonb_build_object('applied', false, 'kind', p.kind);
  END IF;

  SELECT * INTO o FROM orders WHERE id = p.order_id FOR UPDATE;
  v_due := GREATEST(o.total_amount - o.wallet_applied, 0);
  -- Older payments (before this file) have no order_amount: they covered the rest.
  v_paid := LEAST(v_due, o.amount_paid + coalesce(p.order_amount, v_due - o.amount_paid));
  v_status := CASE WHEN v_paid >= v_due - 0.01 THEN 'paid' ELSE 'partial' END;

  UPDATE payments SET applied_at = now() WHERE id = p.id;
  UPDATE orders
     SET amount_paid = v_paid,
         payment_status = v_status::payment_status,
         updated_at = now()
   WHERE id = o.id;

  RETURN jsonb_build_object(
    'applied', true,
    'kind', p.kind,
    'order_amount', coalesce(p.order_amount, v_due - o.amount_paid),
    'order_status', v_status,
    'balance_due', GREATEST(v_due - v_paid, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION apply_order_payment(UUID) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Deposit received → customer notification + tracking timeline entry
-- (full payments are already announced by chat_notifications.sql).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_order_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
BEGIN
  IF NEW.payment_status = 'partial' AND OLD.payment_status IS DISTINCT FROM 'partial' THEN
    SELECT user_id INTO v_user FROM customers WHERE id = NEW.customer_id;
    PERFORM push_notification(v_user, 'payment', 'Deposit received — ' || NEW.order_number,
      'We are starting to source your products. The balance is due before shipping.',
      '/dashboard/orders/' || NEW.id,
      jsonb_build_object('order_id', NEW.id, 'kind', 'deposit_received', 'order', NEW.order_number,
        'paid', NEW.amount_paid, 'balance', GREATEST(NEW.total_amount - NEW.wallet_applied - NEW.amount_paid, 0),
        'currency', NEW.currency));
    IF to_regclass('public.order_tracking_events') IS NOT NULL THEN
      INSERT INTO order_tracking_events (order_id, stage, data)
      VALUES (NEW.id, 'deposit_paid', jsonb_build_object('amount', NEW.amount_paid, 'currency', NEW.currency));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_deposit ON orders;
CREATE TRIGGER trg_order_deposit
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION on_order_deposit();
