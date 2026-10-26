-- ============================================================================
-- AfrikWholesaler — Live chat & notifications
-- Run after schema.sql and cart_orders.sql. Safe to run more than once.
--
-- Each notification stores an English title/body (fallback) plus data.kind
-- and its parameters, so the website shows it in the reader's language.
--
--   1. notifications table (in-app bell, toasts, desktop notifications)
--   2. message trigger: keeps conversations up to date + notifies the other side
--   3. order / shipment / quote triggers: notify customers (and staff on new orders)
--   4. mark_conversation_read() and chat_unread_counts() RPCs
--   5. private storage bucket for chat attachments
--   6. realtime publication for messages, conversations, notifications
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                -- message | order | payment | shipment | quote | system
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,                         -- where clicking the notification goes
  data        JSONB NOT NULL DEFAULT '{}',  -- e.g. {"conversation_id": "...", "count": 3}
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications: owner reads" ON notifications;
CREATE POLICY "Notifications: owner reads" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications: owner updates" ON notifications;
CREATE POLICY "Notifications: owner updates" ON notifications FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications: owner deletes" ON notifications;
CREATE POLICY "Notifications: owner deletes" ON notifications FOR DELETE USING (user_id = auth.uid());
-- No INSERT policy: notifications are only created by the triggers below.

-- Staff who handle customer conversations and orders.
CREATE OR REPLACE FUNCTION support_staff_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM profiles
  WHERE is_active = true
    AND role IN ('sales_rep', 'support_agent', 'operations_manager', 'admin', 'super_admin');
$$;

-- Insert a notification, or — for chat — fold it into the recipient's
-- existing unread notification for the same conversation ("3 new messages").
CREATE OR REPLACE FUNCTION push_notification(
  p_user UUID, p_type TEXT, p_title TEXT, p_body TEXT, p_link TEXT, p_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing notifications%ROWTYPE;
  v_count INT;
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;

  IF p_type = 'message' AND p_data ? 'conversation_id' THEN
    SELECT * INTO v_existing FROM notifications
    WHERE user_id = p_user AND type = 'message' AND read_at IS NULL
      AND data->>'conversation_id' = p_data->>'conversation_id'
    ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
      v_count := COALESCE((v_existing.data->>'count')::INT, 1) + 1;
      UPDATE notifications
      SET title = regexp_replace(p_title, '^New message', v_count || ' new messages'),
          body = p_body,
          data = v_existing.data || jsonb_build_object('count', v_count),
          created_at = now()
      WHERE id = v_existing.id;
      RETURN;
    END IF;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, link, data)
  VALUES (p_user, p_type, p_title, left(p_body, 300), p_link, p_data || jsonb_build_object('count', 1));
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. New message → update conversation + notify the other side
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_message_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_conv conversations%ROWTYPE;
  v_name TEXT;
  v_preview TEXT;
  v_staff UUID;
BEGIN
  SELECT * INTO v_conv FROM conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Customers can't update conversations directly (RLS), so keep them fresh here.
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      status = CASE
        WHEN NEW.sender_type = 'customer' AND status IN ('resolved', 'closed') THEN 'open'::conversation_status
        ELSE status
      END
  WHERE id = NEW.conversation_id;

  IF NEW.is_internal_note THEN RETURN NEW; END IF;

  v_preview := CASE
    WHEN coalesce(NEW.content, '') = '' AND jsonb_array_length(coalesce(NEW.attachments, '[]'::jsonb)) > 0 THEN '📎 Attachment'
    ELSE left(NEW.content, 160)
  END;

  IF NEW.sender_type = 'customer' THEN
    SELECT coalesce(nullif(contact_name, ''), company_name, 'A customer') INTO v_name
    FROM customers WHERE id = v_conv.customer_id;

    IF v_conv.assigned_agent_id IS NOT NULL THEN
      PERFORM push_notification(v_conv.assigned_agent_id, 'message', 'New message from ' || v_name,
        v_preview, '/admin/messages?c=' || v_conv.id,
        jsonb_build_object('conversation_id', v_conv.id, 'kind', 'message_from_customer', 'name', v_name));
    ELSE
      FOR v_staff IN SELECT * FROM support_staff_ids() LOOP
        PERFORM push_notification(v_staff, 'message', 'New message from ' || v_name,
          v_preview, '/admin/messages?c=' || v_conv.id,
          jsonb_build_object('conversation_id', v_conv.id, 'kind', 'message_from_customer', 'name', v_name));
      END LOOP;
    END IF;
  ELSE
    -- Agent / assistant reply → the customer
    PERFORM push_notification(v_conv.user_id, 'message', 'New message from AfrikWholesaler',
      v_preview, '/dashboard/messages?c=' || v_conv.id,
      jsonb_build_object('conversation_id', v_conv.id, 'kind', 'message_from_team'));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_inserted ON messages;
CREATE TRIGGER trg_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION on_message_inserted();

-- ----------------------------------------------------------------------------
-- 3a. Orders → notify the customer of progress, staff of new orders
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_order_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_staff UUID;
  v_link TEXT := '/dashboard/orders';
  v_new JSONB := to_jsonb(NEW);
  v_old JSONB := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
BEGIN
  SELECT user_id INTO v_user FROM customers WHERE id = NEW.customer_id;

  IF TG_OP = 'INSERT' THEN
    IF v_new->>'source' = 'cart' THEN
      FOR v_staff IN SELECT * FROM support_staff_ids() LOOP
        PERFORM push_notification(v_staff, 'order', 'New order ' || NEW.order_number,
          CASE WHEN (v_new->>'awaiting_price')::BOOLEAN THEN 'Needs a price before the customer can pay.'
               ELSE 'Total: ' || NEW.total_amount || ' ' || NEW.currency END,
          '/admin/orders', jsonb_build_object('order_id', NEW.id, 'kind', 'order_new', 'order', NEW.order_number,
            'awaiting', COALESCE((v_new->>'awaiting_price')::BOOLEAN, false), 'total', NEW.total_amount, 'currency', NEW.currency));
      END LOOP;
    END IF;
    RETURN NEW;
  END IF;

  -- Price confirmed by staff → customer can pay now
  IF (v_old->>'awaiting_price')::BOOLEAN IS TRUE AND (v_new->>'awaiting_price')::BOOLEAN IS FALSE THEN
    PERFORM push_notification(v_user, 'order', 'Your price is ready — ' || NEW.order_number,
      'Total: ' || NEW.total_amount || ' ' || NEW.currency || '. You can pay now with Mobile Money or card.',
      v_link, jsonb_build_object('order_id', NEW.id, 'kind', 'price_ready', 'order', NEW.order_number,
        'total', NEW.total_amount, 'currency', NEW.currency));
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF NEW.payment_status = 'paid' THEN
      PERFORM push_notification(v_user, 'payment', 'Payment received — ' || NEW.order_number,
        'Thank you! We are now processing your order.', v_link,
        jsonb_build_object('order_id', NEW.id, 'kind', 'payment_received', 'order', NEW.order_number));
      FOR v_staff IN SELECT * FROM support_staff_ids() LOOP
        PERFORM push_notification(v_staff, 'payment', 'Order paid — ' || NEW.order_number,
          'Total: ' || NEW.total_amount || ' ' || NEW.currency, '/admin/orders',
          jsonb_build_object('order_id', NEW.id, 'kind', 'order_paid', 'order', NEW.order_number,
            'total', NEW.total_amount, 'currency', NEW.currency));
      END LOOP;
    ELSIF NEW.payment_status = 'failed' THEN
      PERFORM push_notification(v_user, 'payment', 'Payment failed — ' || NEW.order_number,
        'Your payment did not go through. You can try again from your orders.', v_link,
        jsonb_build_object('order_id', NEW.id, 'kind', 'payment_failed', 'order', NEW.order_number));
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM push_notification(v_user, 'order',
      'Order ' || NEW.order_number || ' — ' || initcap(replace(NEW.status::TEXT, '_', ' ')),
      CASE NEW.status::TEXT
        WHEN 'confirmed' THEN 'Your order is confirmed.'
        WHEN 'processing' THEN 'We are sourcing your products.'
        WHEN 'quality_check' THEN 'Your products are being inspected.'
        WHEN 'shipped' THEN 'Your order is on its way.'
        WHEN 'in_transit' THEN 'Your order is in transit.'
        WHEN 'delivered' THEN 'Your order has been delivered.'
        WHEN 'cancelled' THEN 'Your order was cancelled. Contact us if you have questions.'
        ELSE NULL
      END,
      v_link, jsonb_build_object('order_id', NEW.id, 'kind', 'order_status', 'order', NEW.order_number,
        'status', NEW.status::TEXT));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_changed ON orders;
CREATE TRIGGER trg_order_changed
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION on_order_changed();

-- ----------------------------------------------------------------------------
-- 3b. Shipments → notify the customer
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_shipment_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT user_id INTO v_user FROM customers WHERE id = NEW.customer_id;
  PERFORM push_notification(v_user, 'shipment',
    'Shipment ' || NEW.shipment_number || ' — ' || initcap(replace(NEW.status::TEXT, '_', ' ')),
    coalesce('Carrier: ' || NEW.carrier || coalesce(' · Tracking: ' || NEW.tracking_number, ''), NULL),
    '/dashboard/shipments', jsonb_build_object('shipment_id', NEW.id, 'kind', 'shipment_status',
      'shipment', NEW.shipment_number, 'status', NEW.status::TEXT, 'carrier', NEW.carrier, 'tracking', NEW.tracking_number));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shipment_changed ON shipments;
CREATE TRIGGER trg_shipment_changed
  AFTER INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION on_shipment_changed();

-- ----------------------------------------------------------------------------
-- 3c. Quotes → notify the customer when we respond
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_quote_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status::TEXT IN ('quoted', 'under_review', 'rejected', 'expired') THEN
    PERFORM push_notification(NEW.user_id, 'quote',
      CASE NEW.status::TEXT
        WHEN 'quoted' THEN 'Your quote is ready — ' || NEW.product_name
        WHEN 'under_review' THEN 'We are reviewing your request — ' || NEW.product_name
        ELSE 'Quote update — ' || NEW.product_name
      END,
      NEW.staff_response, '/dashboard/quotes', jsonb_build_object('quote_id', NEW.id, 'kind', 'quote_status',
        'product', NEW.product_name, 'status', NEW.status::TEXT));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_changed ON quote_requests;
CREATE TRIGGER trg_quote_changed
  AFTER UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION on_quote_changed();

-- ----------------------------------------------------------------------------
-- 4. Read receipts and unread counts
-- ----------------------------------------------------------------------------

-- Marks the other side's messages as read (customers can't UPDATE messages
-- directly) and clears the matching chat notification.
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_staff BOOLEAN := is_staff();
BEGIN
  IF NOT v_staff AND NOT EXISTS (
    SELECT 1 FROM conversations WHERE id = p_conversation AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  UPDATE messages SET read_at = now()
  WHERE conversation_id = p_conversation
    AND read_at IS NULL
    AND is_internal_note = false
    AND CASE WHEN v_staff THEN sender_type = 'customer' ELSE sender_type <> 'customer' END;

  UPDATE notifications SET read_at = now()
  WHERE user_id = auth.uid() AND read_at IS NULL AND type = 'message'
    AND data->>'conversation_id' = p_conversation::TEXT;
END;
$$;

-- Unread messages per conversation for the caller, in one query.
CREATE OR REPLACE FUNCTION chat_unread_counts()
RETURNS TABLE (conversation_id UUID, unread BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.conversation_id, count(*)
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE m.read_at IS NULL
    AND m.is_internal_note = false
    AND (
      (is_staff() AND m.sender_type = 'customer')
      OR (NOT is_staff() AND c.user_id = auth.uid() AND m.sender_type <> 'customer')
    )
  GROUP BY m.conversation_id;
$$;

GRANT EXECUTE ON FUNCTION mark_conversation_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION chat_unread_counts() TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Chat attachments — private bucket, files under <conversation_id>/...
--    Only that conversation's customer and staff can upload or read them.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 'chat-attachments', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv']
)
ON CONFLICT (id) DO UPDATE
  SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION can_access_conversation(p_conversation TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT is_staff() OR EXISTS (
    SELECT 1 FROM conversations
    WHERE id::TEXT = p_conversation AND user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Chat attachments: participants read" ON storage.objects;
CREATE POLICY "Chat attachments: participants read" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments' AND can_access_conversation(split_part(name, '/', 1)));

DROP POLICY IF EXISTS "Chat attachments: participants upload" ON storage.objects;
CREATE POLICY "Chat attachments: participants upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND can_access_conversation(split_part(name, '/', 1)));

-- ----------------------------------------------------------------------------
-- 6. Realtime
-- ----------------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages', 'conversations', 'notifications'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
