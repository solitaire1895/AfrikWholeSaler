-- ============================================================================
-- AfrikWholesaler — Affiliate payouts through SasPay
-- Run AFTER affiliates.sql. Safe to re-run.
--
-- Flow: affiliate requests a withdrawal (country + network + number)
--   → admin clicks "Pay via SasPay" → status 'processing' (payout sent)
--   → SasPay webhook (transaction.success / transaction.failed, type RETRAIT)
--   → complete_affiliate_payout(): 'paid', or 'failed' + money back in the wallet.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Withdrawal columns
-- ----------------------------------------------------------------------------
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'CM';
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XAF';
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS payout_id TEXT;            -- SasPay payout/transaction id
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS payout_reference TEXT;     -- SasPay reference (TXN-…)
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS payout_attempt INT NOT NULL DEFAULT 0;
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS payout_error TEXT;
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS payout_fee NUMERIC(14,2);
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS payout_sent_at TIMESTAMPTZ;
ALTER TABLE affiliate_withdrawals ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_withdrawals_payout ON affiliate_withdrawals (payout_id) WHERE payout_id IS NOT NULL;
-- status: requested | approved | processing | paid | failed | rejected

-- Countries and networks SasPay can pay out to (FCFA zone: XAF and XOF have
-- the same value, so withdrawal amounts in FCFA work 1:1 in both).
CREATE OR REPLACE FUNCTION affiliate_payout_method(p_country TEXT, p_network TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT m FROM (VALUES
    ('CM', 'mtn', 'mtn_cm'), ('CM', 'orange', 'orange_cm'),
    ('CI', 'orange', 'orange_ci'), ('CI', 'mtn', 'mtn_ci'), ('CI', 'moov', 'moov_ci'), ('CI', 'wave', 'wave_ci'),
    ('SN', 'orange', 'orange_sn'), ('SN', 'wave', 'wave_sn'), ('SN', 'free', 'freemoney_sn'),
    ('BJ', 'mtn', 'mtn_bj'), ('BJ', 'moov', 'moov_bj'), ('BJ', 'celtiis', 'celtiis_bj'),
    ('BF', 'orange', 'orange_bf'), ('BF', 'moov', 'moov_bf'),
    ('ML', 'orange', 'orange_ml'), ('ML', 'moov', 'moov_ml'),
    ('TG', 'moov', 'moov_tg'), ('TG', 'togocel', 'togocel'),
    ('NE', 'airtel', 'airtel_ne')
  ) AS t(c, n, m)
  WHERE c = upper(p_country) AND n = lower(p_network);
$$;

-- ----------------------------------------------------------------------------
-- 2. Request a withdrawal (now with the country)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS request_affiliate_withdrawal(NUMERIC, TEXT, TEXT);

CREATE OR REPLACE FUNCTION request_affiliate_withdrawal(
  p_amount_xaf NUMERIC, p_network TEXT, p_phone TEXT, p_country TEXT DEFAULT 'CM'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_rate NUMERIC := xaf_rate_to_usd();
  v_country TEXT := upper(coalesce(p_country, 'CM'));
  v_usd NUMERIC;
  v_balance NUMERIC;
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not logged in'; END IF;
  IF affiliate_payout_method(v_country, p_network) IS NULL THEN RAISE EXCEPTION 'Choose a Mobile Money network'; END IF;
  IF p_phone IS NULL OR length(regexp_replace(p_phone, '\D', '', 'g')) < 8 THEN RAISE EXCEPTION 'Enter a valid phone number'; END IF;
  IF p_amount_xaf < 10000 THEN RAISE EXCEPTION 'The minimum withdrawal is 10,000 XAF'; END IF;

  PERFORM 1 FROM affiliates WHERE user_id = v_user AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Your affiliate account is not active'; END IF;

  IF EXISTS (SELECT 1 FROM affiliate_withdrawals WHERE user_id = v_user AND status IN ('requested', 'approved', 'processing')) THEN
    RAISE EXCEPTION 'You already have a withdrawal in progress';
  END IF;

  v_usd := round(floor(p_amount_xaf) * v_rate, 2);
  v_balance := affiliate_balance(v_user);
  IF v_usd > v_balance THEN RAISE EXCEPTION 'Not enough balance for this withdrawal'; END IF;

  INSERT INTO affiliate_withdrawals (user_id, amount_usd, amount_xaf, network, phone, country, currency)
  VALUES (v_user, v_usd, floor(p_amount_xaf), lower(p_network), trim(p_phone), v_country,
          CASE WHEN v_country = 'CM' THEN 'XAF' ELSE 'XOF' END)
  RETURNING id INTO v_id;

  INSERT INTO affiliate_ledger (user_id, amount_usd, type, withdrawal_id, note)
  VALUES (v_user, -v_usd, 'withdrawal', v_id, 'Withdrawal requested');

  PERFORM push_notification(s, 'system', 'Affiliate withdrawal requested',
    floor(p_amount_xaf) || ' XAF to ' || upper(p_network) || ' ' || p_phone, '/admin/affiliates',
    jsonb_build_object('withdrawal_id', v_id, 'kind', 'withdrawal_requested', 'amount_xaf', floor(p_amount_xaf),
      'network', lower(p_network), 'phone', p_phone))
  FROM support_staff_ids() s;

  RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Server-only: claim a withdrawal for a SasPay payout (atomic, so two
--    clicks can never send the money twice). Returns the row, or nothing.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION begin_affiliate_payout(p_id UUID, p_admin UUID)
RETURNS SETOF affiliate_withdrawals
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  UPDATE affiliate_withdrawals
     SET status = 'processing',
         payout_attempt = payout_attempt + 1,
         payout_error = NULL,
         payout_sent_at = now(),
         processed_by = p_admin,
         processed_at = now()
   WHERE id = p_id AND status IN ('requested', 'approved')
  RETURNING *;
$$;

-- Server-only: finish a payout once SasPay confirms it (webhook or status check).
CREATE OR REPLACE FUNCTION complete_affiliate_payout(
  p_id UUID, p_success BOOLEAN, p_reference TEXT DEFAULT NULL, p_fee NUMERIC DEFAULT NULL, p_error TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  w affiliate_withdrawals%ROWTYPE;
  v_staff UUID;
BEGIN
  SELECT * INTO w FROM affiliate_withdrawals WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF w.status <> 'processing' THEN RETURN w.status; END IF;   -- already handled (webhook retries)

  IF p_success THEN
    UPDATE affiliate_withdrawals
       SET status = 'paid', paid_at = now(), payout_reference = coalesce(p_reference, payout_reference),
           payout_fee = coalesce(p_fee, payout_fee), payout_error = NULL
     WHERE id = p_id;
    PERFORM push_notification(w.user_id, 'payment', 'Withdrawal sent — ' || w.amount_xaf || ' XAF',
      'We sent your affiliate earnings to ' || upper(w.network) || ' ' || w.phone || '.', '/dashboard/affiliate',
      jsonb_build_object('withdrawal_id', w.id, 'kind', 'withdrawal_paid', 'amount_xaf', w.amount_xaf,
        'network', w.network, 'phone', w.phone));
    RETURN 'paid';
  END IF;

  -- Failed: money goes back to the wallet; the affiliate can request again.
  UPDATE affiliate_withdrawals
     SET status = 'failed', payout_reference = coalesce(p_reference, payout_reference), payout_error = p_error
   WHERE id = p_id;
  INSERT INTO affiliate_ledger (user_id, amount_usd, type, withdrawal_id, note)
  VALUES (w.user_id, w.amount_usd, 'withdrawal_refund', w.id, 'Mobile Money transfer failed');
  PERFORM push_notification(w.user_id, 'payment', 'Withdrawal failed',
    'The Mobile Money transfer to ' || w.phone || ' did not go through. The amount is back in your balance.',
    '/dashboard/affiliate',
    jsonb_build_object('withdrawal_id', w.id, 'kind', 'withdrawal_failed', 'amount_xaf', w.amount_xaf,
      'network', w.network, 'phone', w.phone));
  FOR v_staff IN SELECT * FROM support_staff_ids() LOOP
    PERFORM push_notification(v_staff, 'system', 'Affiliate payout failed',
      w.amount_xaf || ' XAF to ' || w.phone, '/admin/affiliates',
      jsonb_build_object('withdrawal_id', w.id, 'kind', 'payout_failed_staff', 'amount_xaf', w.amount_xaf,
        'phone', w.phone));
  END LOOP;
  RETURN 'failed';
END;
$$;

-- Server-only: SasPay refused the request outright (wrong number format,
-- network down…) — nothing was sent, so the withdrawal goes back to the queue.
CREATE OR REPLACE FUNCTION release_affiliate_payout(p_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  UPDATE affiliate_withdrawals
     SET status = 'approved', payout_error = p_error, payout_id = NULL
   WHERE id = p_id AND status = 'processing';
$$;

-- ----------------------------------------------------------------------------
-- 4. Admin actions: manual "mark paid" / reject stay available for withdrawals
--    not yet sent through SasPay.
-- ----------------------------------------------------------------------------
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
    UPDATE affiliate_withdrawals SET status = 'paid', paid_at = now(), admin_note = coalesce(p_note, admin_note), processed_by = auth.uid(), processed_at = now() WHERE id = p_id;
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
-- 5. Permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION request_affiliate_withdrawal(NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_affiliate_withdrawal(UUID, TEXT, TEXT) TO authenticated;
-- Only the server (service role) moves payouts forward.
REVOKE ALL ON FUNCTION begin_affiliate_payout(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION complete_affiliate_payout(UUID, BOOLEAN, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_affiliate_payout(UUID, TEXT) FROM PUBLIC, anon, authenticated;
