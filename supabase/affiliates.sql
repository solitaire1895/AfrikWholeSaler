-- ============================================================================
-- AfrikWholesaler — Affiliate program
-- Affiliates share product links (?ref=CODE) and earn a commission (5% by
-- default) on those products when the order is paid. Earnings sit in a
-- wallet that can be spent at checkout or withdrawn by Mobile Money once it
-- reaches 10,000 XAF.
--
-- Run after schema.sql, currencies.sql, cart_orders.sql and
-- chat_notifications.sql. Safe to run more than once.
--
-- Money rules
--   * Every balance change is a row in affiliate_ledger; balance = SUM(amount).
--   * Amounts are stored in USD (like orders); XAF is computed from the
--     currencies table when needed.
--   * All debits go through functions that lock the affiliate row, so two
--     requests can never spend the same money twice.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliates (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code            TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.05 CHECK (commission_rate >= 0 AND commission_rate <= 0.5),
  status          TEXT NOT NULL DEFAULT 'active',       -- active | suspended
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id UUID NOT NULL REFERENCES affiliates(user_id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks (affiliate_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id UUID NOT NULL REFERENCES affiliates(user_id) ON DELETE CASCADE,
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     UUID REFERENCES order_items(id) ON DELETE SET NULL,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name      TEXT,
  rate              NUMERIC(5,4) NOT NULL,
  amount_usd        NUMERIC(12,2) NOT NULL DEFAULT 0,  -- final once available
  status            TEXT NOT NULL DEFAULT 'pending',   -- pending | available | cancelled | reversed
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  available_at      TIMESTAMPTZ,
  UNIQUE (order_item_id)
);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions (affiliate_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order ON affiliate_commissions (order_id);

CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES affiliates(user_id) ON DELETE CASCADE,
  amount_usd    NUMERIC(12,2) NOT NULL CHECK (amount_usd > 0),
  amount_xaf    NUMERIC(14,0) NOT NULL CHECK (amount_xaf > 0),
  network       TEXT NOT NULL,          -- orange | mtn | moov | wave
  phone         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'requested', -- requested | approved | paid | rejected
  admin_note    TEXT,
  processed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user ON affiliate_withdrawals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON affiliate_withdrawals (status);

CREATE TABLE IF NOT EXISTS affiliate_ledger (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES affiliates(user_id) ON DELETE CASCADE,
  amount_usd    NUMERIC(12,2) NOT NULL,   -- + credit, − debit
  type          TEXT NOT NULL,            -- commission | commission_reversal | purchase | purchase_refund | withdrawal | withdrawal_refund | adjustment
  order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
  commission_id UUID REFERENCES affiliate_commissions(id) ON DELETE SET NULL,
  withdrawal_id UUID REFERENCES affiliate_withdrawals(id) ON DELETE SET NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_ledger_user ON affiliate_ledger (user_id, created_at DESC);

-- Orders: commission attribution happens per item; wallet spending per order.
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN wallet_applied NUMERIC(12,2) NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. Row level security — affiliates read their own data; writes go through
--    the SECURITY DEFINER functions below (or the server's service role).
-- ----------------------------------------------------------------------------
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates: own or staff" ON affiliates;
CREATE POLICY "Affiliates: own or staff" ON affiliates FOR SELECT USING (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Affiliate clicks: own or staff" ON affiliate_clicks;
CREATE POLICY "Affiliate clicks: own or staff" ON affiliate_clicks FOR SELECT USING (affiliate_user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Affiliate commissions: own or staff" ON affiliate_commissions;
CREATE POLICY "Affiliate commissions: own or staff" ON affiliate_commissions FOR SELECT USING (affiliate_user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Affiliate withdrawals: own or staff" ON affiliate_withdrawals;
CREATE POLICY "Affiliate withdrawals: own or staff" ON affiliate_withdrawals FOR SELECT USING (user_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "Affiliate ledger: own or staff" ON affiliate_ledger;
CREATE POLICY "Affiliate ledger: own or staff" ON affiliate_ledger FOR SELECT USING (user_id = auth.uid() OR is_staff());

-- ----------------------------------------------------------------------------
-- 3. Helpers
-- ----------------------------------------------------------------------------
-- Balance of one affiliate. Callers may only read their own (staff and the
-- server's service role, where auth.uid() is NULL, may read any).
CREATE OR REPLACE FUNCTION affiliate_balance(p_user UUID)
RETURNS NUMERIC
LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_user IS DISTINCT FROM auth.uid() AND NOT is_staff() THEN
    RETURN 0;
  END IF;
  RETURN (SELECT COALESCE(SUM(amount_usd), 0) FROM affiliate_ledger WHERE user_id = p_user);
END;
$$;

-- 1 XAF in USD, from the currencies table (fallback ≈ 1/600).
CREATE OR REPLACE FUNCTION xaf_rate_to_usd()
RETURNS NUMERIC
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT rate_to_usd FROM currencies WHERE code = 'XAF' AND rate_to_usd > 0), 0.0017);
$$;

-- Join the program (idempotent). Returns the affiliate code.
CREATE OR REPLACE FUNCTION join_affiliate_program()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_base TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not logged in'; END IF;

  SELECT code INTO v_code FROM affiliates WHERE user_id = auth.uid();
  IF FOUND THEN RETURN v_code; END IF;

  -- Readable code: first letters of the name + random digits, e.g. AMADOU4821
  SELECT upper(regexp_replace(coalesce(nullif(first_name, ''), split_part(email, '@', 1)), '[^A-Za-z]', '', 'g'))
  INTO v_base FROM profiles WHERE id = auth.uid();
  v_base := left(coalesce(nullif(v_base, ''), 'AW'), 8);

  LOOP
    v_code := v_base || lpad((floor(random() * 10000))::INT::TEXT, 4, '0');
    BEGIN
      INSERT INTO affiliates (user_id, code) VALUES (auth.uid(), v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- code taken, or the user joined in a parallel request
      SELECT code INTO v_code FROM affiliates WHERE user_id = auth.uid();
      IF FOUND THEN RETURN v_code; END IF;
    END;
  END LOOP;
END;
$$;

-- Count a visit from an affiliate link. Returns the affiliate's user id
-- (NULL if the code is unknown or suspended).
CREATE OR REPLACE FUNCTION record_affiliate_click(p_code TEXT, p_product UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
BEGIN
  SELECT user_id INTO v_user FROM affiliates WHERE code = upper(p_code) AND status = 'active';
  IF NOT FOUND THEN RETURN NULL; END IF;
  -- Don't count affiliates visiting their own links.
  IF v_user IS DISTINCT FROM auth.uid() THEN
    INSERT INTO affiliate_clicks (affiliate_user_id, product_id) VALUES (v_user, p_product);
  END IF;
  RETURN v_user;
END;
$$;

-- Spend wallet money on an order (called by the server at checkout).
CREATE OR REPLACE FUNCTION affiliate_spend(p_user UUID, p_order UUID, p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
  v_spend NUMERIC;
BEGIN
  PERFORM 1 FROM affiliates WHERE user_id = p_user FOR UPDATE;   -- serialize per affiliate
  IF NOT FOUND THEN RETURN 0; END IF;
  v_balance := affiliate_balance(p_user);
  v_spend := round(LEAST(GREATEST(p_amount, 0), v_balance), 2);
  IF v_spend <= 0 THEN RETURN 0; END IF;

  INSERT INTO affiliate_ledger (user_id, amount_usd, type, order_id, note)
  VALUES (p_user, -v_spend, 'purchase', p_order, 'Used for order');
  UPDATE orders SET wallet_applied = wallet_applied + v_spend WHERE id = p_order;
  RETURN v_spend;
END;
$$;

-- Request a Mobile Money withdrawal (minimum 10,000 XAF).
CREATE OR REPLACE FUNCTION request_affiliate_withdrawal(p_amount_xaf NUMERIC, p_network TEXT, p_phone TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_rate NUMERIC := xaf_rate_to_usd();
  v_usd NUMERIC;
  v_balance NUMERIC;
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not logged in'; END IF;
  IF p_network NOT IN ('orange', 'mtn', 'moov', 'wave') THEN RAISE EXCEPTION 'Choose a Mobile Money network'; END IF;
  IF p_phone IS NULL OR length(regexp_replace(p_phone, '\D', '', 'g')) < 8 THEN RAISE EXCEPTION 'Enter a valid phone number'; END IF;
  IF p_amount_xaf < 10000 THEN RAISE EXCEPTION 'The minimum withdrawal is 10,000 XAF'; END IF;

  PERFORM 1 FROM affiliates WHERE user_id = v_user AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your affiliate account is not active'; END IF;

  IF EXISTS (SELECT 1 FROM affiliate_withdrawals WHERE user_id = v_user AND status IN ('requested', 'approved')) THEN
    RAISE EXCEPTION 'You already have a withdrawal in progress';
  END IF;

  v_usd := round(floor(p_amount_xaf) * v_rate, 2);
  v_balance := affiliate_balance(v_user);
  IF v_usd > v_balance THEN RAISE EXCEPTION 'Not enough balance for this withdrawal'; END IF;

  INSERT INTO affiliate_withdrawals (user_id, amount_usd, amount_xaf, network, phone)
  VALUES (v_user, v_usd, floor(p_amount_xaf), p_network, trim(p_phone))
  RETURNING id INTO v_id;

  INSERT INTO affiliate_ledger (user_id, amount_usd, type, withdrawal_id, note)
  VALUES (v_user, -v_usd, 'withdrawal', v_id, 'Withdrawal requested');

  PERFORM push_notification(s, 'system', 'Affiliate withdrawal requested',
    floor(p_amount_xaf) || ' XAF to ' || upper(p_network) || ' ' || p_phone, '/admin/affiliates',
    jsonb_build_object('withdrawal_id', v_id, 'kind', 'withdrawal_requested', 'amount_xaf', floor(p_amount_xaf),
      'network', p_network, 'phone', p_phone))
  FROM support_staff_ids() s;

  RETURN v_id;
END;
$$;

-- Admin: approve / mark paid / reject a withdrawal. Rejecting refunds the wallet.
CREATE OR REPLACE FUNCTION process_affiliate_withdrawal(p_id UUID, p_action TEXT, p_note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  w affiliate_withdrawals%ROWTYPE;
BEGIN
  IF NOT is_admin() AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('operations_manager')
  ) THEN
    RAISE EXCEPTION 'Only admins can process withdrawals';
  END IF;

  SELECT * INTO w FROM affiliate_withdrawals WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;

  IF p_action = 'approve' AND w.status = 'requested' THEN
    UPDATE affiliate_withdrawals SET status = 'approved', admin_note = p_note, processed_by = auth.uid(), processed_at = now() WHERE id = p_id;
  ELSIF p_action = 'paid' AND w.status IN ('requested', 'approved') THEN
    UPDATE affiliate_withdrawals SET status = 'paid', admin_note = coalesce(p_note, admin_note), processed_by = auth.uid(), processed_at = now() WHERE id = p_id;
    PERFORM push_notification(w.user_id, 'payment', 'Withdrawal sent — ' || w.amount_xaf || ' XAF',
      'We sent your affiliate earnings to ' || upper(w.network) || ' ' || w.phone || '.', '/dashboard/affiliate',
      jsonb_build_object('withdrawal_id', w.id, 'kind', 'withdrawal_paid', 'amount_xaf', w.amount_xaf,
        'network', w.network, 'phone', w.phone));
  ELSIF p_action = 'reject' AND w.status IN ('requested', 'approved') THEN
    UPDATE affiliate_withdrawals SET status = 'rejected', admin_note = p_note, processed_by = auth.uid(), processed_at = now() WHERE id = p_id;
    INSERT INTO affiliate_ledger (user_id, amount_usd, type, withdrawal_id, note)
    VALUES (w.user_id, w.amount_usd, 'withdrawal_refund', w.id, coalesce('Withdrawal rejected: ' || p_note, 'Withdrawal rejected'));
    PERFORM push_notification(w.user_id, 'payment', 'Withdrawal not processed',
      coalesce(p_note, 'Your withdrawal was declined and the amount is back in your balance.'), '/dashboard/affiliate',
      jsonb_build_object('withdrawal_id', w.id, 'kind', 'withdrawal_rejected', 'note', p_note));
  ELSE
    RAISE EXCEPTION 'This withdrawal cannot be %', p_action;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Order lifecycle → commissions and wallet refunds
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_order_affiliate_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c RECORD;
  v_item_count INT;
  v_base NUMERIC;
  v_amount NUMERIC;
BEGIN
  -- Paid → pending commissions become available (credited to the wallet).
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    SELECT count(*) INTO v_item_count FROM order_items WHERE order_id = NEW.id;

    FOR c IN
      SELECT ac.*, oi.total_price
      FROM affiliate_commissions ac
      LEFT JOIN order_items oi ON oi.id = ac.order_item_id
      WHERE ac.order_id = NEW.id AND ac.status = 'pending'
    LOOP
      -- Price-on-request lines were 0 at checkout: split the confirmed total evenly.
      v_base := CASE WHEN COALESCE(c.total_price, 0) > 0 THEN c.total_price
                     ELSE NEW.total_amount / GREATEST(v_item_count, 1) END;
      v_amount := round(v_base * c.rate, 2);

      UPDATE affiliate_commissions SET status = 'available', amount_usd = v_amount, available_at = now() WHERE id = c.id;
      IF v_amount > 0 THEN
        INSERT INTO affiliate_ledger (user_id, amount_usd, type, order_id, commission_id, note)
        VALUES (c.affiliate_user_id, v_amount, 'commission', NEW.id, c.id, 'Commission: ' || coalesce(c.product_name, 'product'));
        PERFORM push_notification(c.affiliate_user_id, 'payment', 'You earned ' || to_char(v_amount, 'FM999999990.00') || ' USD',
          'Commission on ' || coalesce(c.product_name, 'a product') || ' sold with your link.', '/dashboard/affiliate',
          jsonb_build_object('commission_id', c.id, 'kind', 'affiliate_earned', 'amount_usd', v_amount,
            'product', coalesce(c.product_name, '')));
      END IF;
    END LOOP;
  END IF;

  -- Cancelled / refunded → cancel pending, reverse paid commissions, refund wallet spend.
  IF (NEW.status IN ('cancelled', 'refunded') AND OLD.status IS DISTINCT FROM NEW.status)
     OR (NEW.payment_status = 'refunded' AND OLD.payment_status IS DISTINCT FROM 'refunded') THEN

    UPDATE affiliate_commissions SET status = 'cancelled' WHERE order_id = NEW.id AND status = 'pending';

    FOR c IN SELECT * FROM affiliate_commissions WHERE order_id = NEW.id AND status = 'available' LOOP
      UPDATE affiliate_commissions SET status = 'reversed' WHERE id = c.id;
      IF c.amount_usd > 0 THEN
        INSERT INTO affiliate_ledger (user_id, amount_usd, type, order_id, commission_id, note)
        VALUES (c.affiliate_user_id, -c.amount_usd, 'commission_reversal', NEW.id, c.id, 'Order cancelled or refunded');
      END IF;
    END LOOP;

    -- Give back wallet money the buyer spent on this order (once).
    IF NEW.wallet_applied > 0 AND NOT EXISTS (
      SELECT 1 FROM affiliate_ledger WHERE order_id = NEW.id AND type = 'purchase_refund'
    ) THEN
      INSERT INTO affiliate_ledger (user_id, amount_usd, type, order_id, note)
      SELECT l.user_id, -SUM(l.amount_usd), 'purchase_refund', NEW.id, 'Order cancelled — balance returned'
      FROM affiliate_ledger l WHERE l.order_id = NEW.id AND l.type = 'purchase'
      GROUP BY l.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_affiliate_events ON orders;
CREATE TRIGGER trg_order_affiliate_events
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION on_order_affiliate_events();

-- ----------------------------------------------------------------------------
-- 5. Permissions: only the server (service role) may spend wallet money.
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION affiliate_spend(UUID, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION affiliate_balance(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION affiliate_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION xaf_rate_to_usd() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_affiliate_program() TO authenticated;
GRANT EXECUTE ON FUNCTION record_affiliate_click(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION request_affiliate_withdrawal(NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_affiliate_withdrawal(UUID, TEXT, TEXT) TO authenticated;

-- Realtime so wallets update live.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['affiliate_ledger', 'affiliate_withdrawals'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
