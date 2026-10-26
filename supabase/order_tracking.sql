-- ============================================================================
-- AfrikWholesaler — Order tracking
-- Run AFTER schema.sql, cart_orders.sql and chat_notifications.sql. Safe to re-run.
--
-- Every order gets a timeline (order_tracking_events), filled automatically:
--   order placed / paid / status changes  → trigger on orders
--   shipment created / status changes      → trigger on shipments
--   staff updates (location + note)        → inserted by the app
-- Shipment progress also moves the order status forward (dispatched → shipped…).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_tracking_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipment_id  UUID REFERENCES shipments(id) ON DELETE SET NULL,
  -- placed | confirmed | paid | sourcing | quality_check | packed | shipment_created |
  -- shipped | in_transit | customs | out_for_delivery | delivered | exception | cancelled | update
  stage        TEXT NOT NULL,
  location     TEXT,
  note         TEXT,
  data         JSONB NOT NULL DEFAULT '{}',
  is_public    BOOLEAN NOT NULL DEFAULT true,   -- false = internal staff note
  source       TEXT NOT NULL DEFAULT 'system',  -- system | staff
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_order ON order_tracking_events (order_id, created_at);

-- Link to the carrier's own tracking page (optional).
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_url TEXT;

ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tracking: customer reads own public events, staff reads all" ON order_tracking_events;
CREATE POLICY "Tracking: customer reads own public events, staff reads all"
  ON order_tracking_events FOR SELECT
  USING (
    is_staff()
    OR (
      is_public
      AND order_id IN (
        SELECT o.id FROM orders o JOIN customers c ON c.id = o.customer_id WHERE c.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Tracking: staff write" ON order_tracking_events;
CREATE POLICY "Tracking: staff write"
  ON order_tracking_events FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- ----------------------------------------------------------------------------
-- 2. Adding events
-- ----------------------------------------------------------------------------
-- Position on the order journey. NULL = not part of the journey (always logged).
CREATE OR REPLACE FUNCTION tracking_stage_rank(p_stage TEXT)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_stage
    WHEN 'placed' THEN 0 WHEN 'confirmed' THEN 1 WHEN 'sourcing' THEN 3
    WHEN 'quality_check' THEN 4 WHEN 'packed' THEN 5 WHEN 'shipped' THEN 6
    WHEN 'in_transit' THEN 7 WHEN 'customs' THEN 8 WHEN 'out_for_delivery' THEN 9
    WHEN 'delivered' THEN 10
    ELSE NULL
  END;
$$;

-- System events: a journey step is only logged when it moves the order
-- forward, so a shipment update and the matching order update never log the
-- same step twice. Staff updates are inserted directly and always logged.
CREATE OR REPLACE FUNCTION add_tracking_event(
  p_order UUID, p_stage TEXT, p_shipment UUID DEFAULT NULL, p_data JSONB DEFAULT '{}',
  p_at TIMESTAMPTZ DEFAULT now()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rank INT := tracking_stage_rank(p_stage);
  v_max INT;
  v_id UUID;
BEGIN
  IF p_order IS NULL THEN RETURN NULL; END IF;

  IF v_rank IS NOT NULL THEN
    SELECT max(tracking_stage_rank(stage)) INTO v_max FROM order_tracking_events WHERE order_id = p_order;
    IF v_max IS NOT NULL AND v_rank <= v_max THEN RETURN NULL; END IF;
  ELSIF p_stage IN ('paid', 'cancelled') THEN
    IF EXISTS (SELECT 1 FROM order_tracking_events WHERE order_id = p_order AND stage = p_stage) THEN RETURN NULL; END IF;
  ELSIF p_stage = 'shipment_created' THEN
    IF EXISTS (SELECT 1 FROM order_tracking_events WHERE shipment_id = p_shipment AND stage = p_stage) THEN RETURN NULL; END IF;
  END IF;

  INSERT INTO order_tracking_events (order_id, shipment_id, stage, data, created_at)
  VALUES (p_order, p_shipment, p_stage, coalesce(p_data, '{}'), p_at)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Orders → events
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_order_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM add_tracking_event(NEW.id, 'placed', NULL, '{}', NEW.created_at);
  END IF;

  IF NEW.payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    PERFORM add_tracking_event(NEW.id, 'paid');
  END IF;

  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM add_tracking_event(NEW.id, CASE NEW.status::TEXT
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'processing' THEN 'sourcing'
      WHEN 'quality_check' THEN 'quality_check'
      WHEN 'shipped' THEN 'shipped'
      WHEN 'in_transit' THEN 'customs'      -- shown as "In customs" in the app
      WHEN 'delivered' THEN 'delivered'
      WHEN 'cancelled' THEN 'cancelled'
      WHEN 'refunded' THEN 'cancelled'
      ELSE NULL
    END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_tracking ON orders;
CREATE TRIGGER trg_order_tracking
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION on_order_tracking();

-- ----------------------------------------------------------------------------
-- 4. Shipments → events, and order status follows the shipment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION order_status_rank(p_status TEXT)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'pending' THEN 0 WHEN 'confirmed' THEN 1 WHEN 'processing' THEN 2 WHEN 'quality_check' THEN 3
    WHEN 'shipped' THEN 4 WHEN 'in_transit' THEN 5 WHEN 'delivered' THEN 6
    ELSE NULL   -- cancelled / refunded: never moved automatically
  END;
$$;

CREATE OR REPLACE FUNCTION on_shipment_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_stage TEXT;
  v_order_status TEXT;
  v_current TEXT;
BEGIN
  IF NEW.order_id IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM add_tracking_event(NEW.order_id, 'shipment_created', NEW.id,
      jsonb_build_object('carrier', NEW.carrier, 'tracking_number', NEW.tracking_number,
                         'shipment_number', NEW.shipment_number), NEW.created_at);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  v_stage := CASE NEW.status::TEXT
    WHEN 'packed' THEN 'packed'
    WHEN 'dispatched' THEN 'shipped'
    WHEN 'in_transit' THEN 'in_transit'
    WHEN 'customs' THEN 'customs'
    WHEN 'out_for_delivery' THEN 'out_for_delivery'
    WHEN 'delivered' THEN 'delivered'
    WHEN 'exception' THEN 'exception'
    ELSE NULL
  END;
  IF v_stage = 'exception' THEN
    INSERT INTO order_tracking_events (order_id, shipment_id, stage) VALUES (NEW.order_id, NEW.id, 'exception');
  ELSIF v_stage IS NOT NULL THEN
    PERFORM add_tracking_event(NEW.order_id, v_stage, NEW.id);
  END IF;

  v_order_status := CASE NEW.status::TEXT
    WHEN 'dispatched' THEN 'shipped'
    WHEN 'in_transit' THEN 'shipped'
    WHEN 'customs' THEN 'in_transit'
    WHEN 'out_for_delivery' THEN 'in_transit'
    WHEN 'delivered' THEN 'delivered'
    ELSE NULL
  END;
  IF v_order_status IS NOT NULL THEN
    SELECT status::TEXT INTO v_current FROM orders WHERE id = NEW.order_id;
    IF order_status_rank(v_current) IS NOT NULL AND order_status_rank(v_order_status) > order_status_rank(v_current) THEN
      UPDATE orders SET status = v_order_status::order_status, updated_at = now() WHERE id = NEW.order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_tracking ON shipments;
CREATE TRIGGER trg_shipment_tracking
  AFTER INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION on_shipment_tracking();

-- Delivery date is recorded automatically.
CREATE OR REPLACE FUNCTION set_shipment_delivered_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivered' AND NEW.actual_delivery IS NULL THEN NEW.actual_delivery := now(); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_delivered_at ON shipments;
CREATE TRIGGER trg_shipment_delivered_at
  BEFORE INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION set_shipment_delivered_at();

-- ----------------------------------------------------------------------------
-- 5. Staff updates → notify the customer
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_tracking_event_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_number TEXT;
BEGIN
  -- System events are already announced by the order/shipment notifications.
  IF NEW.source <> 'staff' OR NOT NEW.is_public THEN RETURN NEW; END IF;
  SELECT c.user_id, o.order_number INTO v_user, v_number
  FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = NEW.order_id;
  PERFORM push_notification(v_user, 'shipment',
    'Tracking update — ' || v_number,
    concat_ws(' · ', NEW.location, NEW.note),
    '/dashboard/orders/' || NEW.order_id,
    jsonb_build_object('order_id', NEW.order_id, 'kind', 'tracking_update', 'order', v_number,
      'stage', NEW.stage, 'location', NEW.location, 'note', NEW.note));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracking_event_added ON order_tracking_events;
CREATE TRIGGER trg_tracking_event_added
  AFTER INSERT ON order_tracking_events
  FOR EACH ROW EXECUTE FUNCTION on_tracking_event_added();

-- ----------------------------------------------------------------------------
-- 6. Timeline for orders that existed before this file
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  o RECORD;
  s RECORD;
  m JSONB;
BEGIN
  FOR o IN
    SELECT * FROM orders WHERE NOT EXISTS (SELECT 1 FROM order_tracking_events e WHERE e.order_id = orders.id)
    ORDER BY created_at
  LOOP
    PERFORM add_tracking_event(o.id, 'placed', NULL, '{}', o.created_at);
    IF o.payment_status = 'paid' THEN PERFORM add_tracking_event(o.id, 'paid', NULL, '{}', o.updated_at); END IF;

    FOR s IN SELECT * FROM shipments WHERE order_id = o.id ORDER BY created_at LOOP
      PERFORM add_tracking_event(o.id, 'shipment_created', s.id,
        jsonb_build_object('carrier', s.carrier, 'tracking_number', s.tracking_number, 'shipment_number', s.shipment_number),
        s.created_at);
      -- Old free-text milestones become staff updates.
      FOR m IN SELECT * FROM jsonb_array_elements(coalesce(s.milestones, '[]'::jsonb)) LOOP
        INSERT INTO order_tracking_events (order_id, shipment_id, stage, location, note, data, source, created_at)
        VALUES (o.id, s.id, 'update', nullif(m->>'location', ''), nullif(m->>'note', ''),
                jsonb_build_object('label', m->>'status'), 'system',
                coalesce((m->>'timestamp')::timestamptz, s.created_at));
      END LOOP;
    END LOOP;

    PERFORM add_tracking_event(o.id, CASE o.status::TEXT
      WHEN 'confirmed' THEN 'confirmed' WHEN 'processing' THEN 'sourcing' WHEN 'quality_check' THEN 'quality_check'
      WHEN 'shipped' THEN 'shipped' WHEN 'in_transit' THEN 'customs' WHEN 'delivered' THEN 'delivered'
      WHEN 'cancelled' THEN 'cancelled' WHEN 'refunded' THEN 'cancelled' ELSE NULL END,
      NULL, '{}', o.updated_at);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Live updates on the tracking page
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_tracking_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking_events;
  END IF;
END $$;

REVOKE ALL ON FUNCTION add_tracking_event(UUID, TEXT, UUID, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
