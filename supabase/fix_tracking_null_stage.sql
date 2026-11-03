-- ============================================================================
-- AfrikWholesaler — Fix: orders could not be placed
-- Run once in the Supabase SQL editor (AfrikWholesaler project). Safe to re-run.
--
-- A new order has status "pending", which maps to no tracking step, so the
-- order trigger tried to insert a tracking event with stage = NULL and the
-- whole order was rejected. Events without a stage are now skipped.
-- ============================================================================

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
  IF p_order IS NULL OR p_stage IS NULL THEN RETURN NULL; END IF;   -- e.g. a "pending" status has no journey step

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
