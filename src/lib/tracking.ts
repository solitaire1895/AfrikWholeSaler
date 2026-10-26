import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// ========================================================
// Loads everything a tracking page shows for one order.
// Customer/staff pages pass their own client (RLS decides what they see);
// the public lookup passes the admin client and strips private data.
// ========================================================

export interface TrackingEvent {
  id: string;
  stage: string;
  location: string | null;
  note: string | null;
  data: Record<string, unknown>;
  isPublic: boolean;
  source: string;
  shipmentId: string | null;
  createdAt: string;
}

export interface TrackingShipment {
  id: string;
  shipmentNumber: string;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  originCountry: string;
  destinationCountry: string;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string; // DB value: pending | confirmed | processing | …
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  awaitingPrice: boolean;
  createdAt: string;
  destination: { city: string | null; country: string | null };
  items: { name: string; quantity: number; image: string | null; slug: string | null }[];
  shipments: TrackingShipment[];
  events: TrackingEvent[];
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  awaiting_price?: boolean;
  created_at: string;
  shipping_address: { city?: string; country?: string } | null;
  customer_id: string;
  order_items: { product_name: string; quantity: number; image_url: string | null; product_slug: string | null }[];
}

export async function loadOrderTracking(
  client: SupabaseClient,
  by: { id: string } | { orderNumber: string },
  options: { publicOnly?: boolean } = {}
): Promise<(OrderTracking & { customerId: string }) | null> {
  let query = client
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total_amount, currency, awaiting_price, created_at, shipping_address, customer_id, order_items(product_name, quantity, image_url, product_slug)"
    );
  query = "id" in by ? query.eq("id", by.id) : query.ilike("order_number", by.orderNumber.trim());
  const { data: order } = await query.maybeSingle<OrderRow>();
  if (!order) return null;

  let eventsQuery = client
    .from("order_tracking_events")
    .select("id, stage, location, note, data, is_public, source, shipment_id, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });
  if (options.publicOnly) eventsQuery = eventsQuery.eq("is_public", true);

  const [{ data: shipments }, { data: events }] = await Promise.all([
    client
      .from("shipments")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    eventsQuery,
  ]);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    totalAmount: Number(order.total_amount),
    currency: order.currency,
    awaitingPrice: Boolean(order.awaiting_price),
    createdAt: order.created_at,
    customerId: order.customer_id,
    destination: { city: order.shipping_address?.city ?? null, country: order.shipping_address?.country ?? null },
    items: (order.order_items ?? []).map((i) => ({
      name: i.product_name,
      quantity: i.quantity,
      image: i.image_url,
      slug: i.product_slug,
    })),
    shipments: (shipments ?? []).map((s) => ({
      id: s.id,
      shipmentNumber: s.shipment_number,
      carrier: s.carrier,
      trackingNumber: s.tracking_number,
      trackingUrl: s.tracking_url ?? null,
      status: s.status,
      estimatedDelivery: s.estimated_delivery,
      actualDelivery: s.actual_delivery,
      originCountry: s.origin_country,
      destinationCountry: s.destination_country,
    })),
    events: (events ?? []).map((e) => ({
      id: e.id,
      stage: e.stage,
      location: e.location,
      note: e.note,
      data: (e.data ?? {}) as Record<string, unknown>,
      isPublic: e.is_public,
      source: e.source,
      shipmentId: e.shipment_id,
      createdAt: e.created_at,
    })),
  };
}
