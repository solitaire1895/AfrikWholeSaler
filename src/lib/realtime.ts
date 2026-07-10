import { createClient } from "@/lib/supabase/client";

// ========================================================
// Real-time subscriptions — AfrikWholesaler
// ========================================================

/**
 * Subscribe to new messages in a conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: unknown) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to order status changes for a customer.
 * Returns an unsubscribe function.
 */
export function subscribeToOrders(
  customerId: string,
  onChange: (order: unknown) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`orders:${customerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        onChange(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to shipment status changes for a customer.
 * Returns an unsubscribe function.
 */
export function subscribeToShipments(
  customerId: string,
  onChange: (shipment: unknown) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`shipments:${customerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shipments",
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        onChange(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to quote request status changes for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToQuotes(
  userId: string,
  onChange: (quote: unknown) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`quotes:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "quote_requests",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all new conversations (for admin/staff dashboard).
 * Returns an unsubscribe function.
 */
export function subscribeToConversations(
  onChange: (conversation: unknown) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel("conversations:all")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversations",
      },
      (payload) => {
        onChange(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}