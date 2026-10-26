-- ============================================================================
-- AfrikWholesaler — Security hardening
-- Run AFTER all other SQL files. Safe to re-run.
--
-- 1. Users can no longer change their own role or suspension (profiles).
-- 2. Customers can no longer verify themselves or edit their order stats.
-- 3. Customers can only post chat messages as themselves ("customer").
-- 4. Rate limiting used by the server (tracking lookups, chat, checkout, search log).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles: role and is_active are admin-only
-- ----------------------------------------------------------------------------
-- The "update own" policy allows editing one's own row (name, phone…). This
-- trigger rejects changes to the protected columns unless the caller is an
-- admin. Server code using the service role (auth.uid() IS NULL) and the
-- signup trigger are not affected.
CREATE OR REPLACE FUNCTION protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only admins can change user roles.' USING ERRCODE = '42501';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Only admins can suspend users.' USING ERRCODE = '42501';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_columns ON profiles;
CREATE TRIGGER trg_protect_profile_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_columns();

-- The update policy also gets a WITH CHECK so a row can't be moved to someone else.
DROP POLICY IF EXISTS "Profiles: update own" ON profiles;
CREATE POLICY "Profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Nobody can insert a profile with a staff role through the API (signups
-- go through the handle_new_user trigger, which runs as the owner).
CREATE OR REPLACE FUNCTION protect_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin() AND NEW.role IS DISTINCT FROM 'customer' THEN
    RAISE EXCEPTION 'Only admins can change user roles.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_insert ON profiles;
CREATE TRIGGER trg_protect_profile_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_insert();

-- ----------------------------------------------------------------------------
-- 2. customers: verification and order statistics are staff-only
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_customer_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR is_staff() THEN
    RETURN NEW;
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Only admins can update verification status.' USING ERRCODE = '42501';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.total_orders IS DISTINCT FROM OLD.total_orders
     OR NEW.total_spent IS DISTINCT FROM OLD.total_spent THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_customer_columns ON customers;
CREATE TRIGGER trg_protect_customer_columns
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION protect_customer_columns();

DROP POLICY IF EXISTS "customers: update own" ON customers;
DROP POLICY IF EXISTS "Customers: update own or staff updates" ON customers;
DO $$
DECLARE
  p RECORD;
BEGIN
  -- Replace whatever the existing customer UPDATE policy is called.
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND cmd = 'UPDATE' LOOP
    EXECUTE format('DROP POLICY %I ON customers', p.policyname);
  END LOOP;
END $$;
CREATE POLICY "Customers: update own or staff updates"
  ON customers FOR UPDATE
  USING (user_id = auth.uid() OR is_staff())
  WITH CHECK (user_id = auth.uid() OR is_staff());

-- ----------------------------------------------------------------------------
-- 3. messages: customers post as themselves, never as an agent or internal note
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Messages: customer or staff inserts" ON messages;
CREATE POLICY "Messages: customer or staff inserts"
  ON messages FOR INSERT
  WITH CHECK (
    is_staff()
    OR (
      conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
      AND sender_type = 'customer'
      AND sender_id = auth.uid()
      AND is_internal_note = false
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Rate limiting (called by the server with the service role)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  hits         INT NOT NULL DEFAULT 0
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;   -- no policies: service role only

-- Counts one hit for `p_key`. Returns true while under `p_limit` hits per
-- `p_window_seconds`, false once the limit is reached.
CREATE OR REPLACE FUNCTION hit_rate_limit(p_key TEXT, p_limit INT, p_window_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_hits INT;
BEGIN
  INSERT INTO rate_limits AS r (key, window_start, hits)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
    SET hits = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds) THEN 1 ELSE r.hits + 1 END,
        window_start = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds) THEN now() ELSE r.window_start END
  RETURNING hits INTO v_hits;

  -- Occasional cleanup of old windows.
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN v_hits <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION hit_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON rate_limits FROM anon, authenticated;

-- Searches are logged by the server now; anonymous visitors can't call it directly.
REVOKE EXECUTE ON FUNCTION log_search(TEXT, INT) FROM anon, authenticated;
