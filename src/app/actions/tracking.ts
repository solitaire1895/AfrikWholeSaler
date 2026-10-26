"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendShipmentEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { te } from "@/i18n/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadOrderTracking, type OrderTracking } from "@/lib/tracking";
import {
  STAFF_STAGES,
  STAGE_TO_ORDER_STATUS,
  STAGE_TO_SHIPMENT_STATUS,
  type StaffStage,
} from "@/lib/tracking-steps";

type Result<T = undefined> = { success: true; data?: T } | { success: false; error: string };

const LOGISTICS_ROLES = ["warehouse_staff", "logistics_staff", "operations_manager", "admin", "super_admin", "sales_rep", "support_agent"];
const ORDER_RANK: Record<string, number> = {
  pending: 0, confirmed: 1, processing: 2, quality_check: 3, shipped: 4, in_transit: 5, delivered: 6,
};
const SHIPMENT_RANK: Record<string, number> = {
  preparing: 0, packed: 1, dispatched: 2, in_transit: 3, customs: 4, out_for_delivery: 5, delivered: 6,
};

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile && LOGISTICS_ROLES.includes(profile.role) ? { supabase, user } : null;
}

function revalidateOrder(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/shipments");
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/shipments");
}

// ========================================================
// Public: "Track my order" (no account needed)
// ========================================================

/**
 * Looks an order up by its number and the email used for it. The answer is
 * the same whether the number or the email is wrong, so it can't be used to
 * discover orders. Internal notes, the street address and prices stay hidden.
 */
export async function trackOrderPublic(orderNumber: string, email: string): Promise<Result<OrderTracking>> {
  const number = orderNumber.trim();
  const mail = email.trim().toLowerCase();
  if (!number || !mail) return { success: false, error: await te("Enter the order number and the email used for the order.") };

  // Order number + email can't be guessed at scale: 10 lookups per IP per 15 minutes.
  if (!(await rateLimit(`track:${await clientIp()}`, 10, 900))) return { success: false, error: await te("Too many requests. Please wait a moment and try again.") };

  const admin = createAdminClient();
  const tracking = await loadOrderTracking(admin, { orderNumber: number }, { publicOnly: true });
  const notFound = { success: false as const, error: await te("We couldn't find an order with this number and email.") };
  if (!tracking) return notFound;

  const { data: customer } = await admin
    .from("customers")
    .select("email, user_id")
    .eq("id", tracking.customerId)
    .single();
  let emails = [customer?.email?.toLowerCase()];
  if (customer?.user_id) {
    const { data: profile } = await admin.from("profiles").select("email").eq("id", customer.user_id).single();
    emails = [...emails, profile?.email?.toLowerCase()];
  }
  if (!emails.includes(mail)) return notFound;

  const { customerId: _omit, ...rest } = tracking;
  void _omit;
  // Amounts are not needed to follow a delivery.
  return { success: true, data: { ...rest, totalAmount: 0, events: rest.events.filter((e) => e.isPublic) } };
}

// ========================================================
// Staff
// ========================================================

/** Creates the order's shipment, or updates it when `shipmentId` is given. */
export async function saveShipment(
  orderId: string,
  input: {
    shipmentId?: string;
    carrier: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string; // YYYY-MM-DD
  }
): Promise<Result<{ id: string }>> {
  const ctx = await requireStaff();
  if (!ctx) return { success: false, error: await te("Only logistics staff can update shipments.") };

  const carrier = input.carrier.trim();
  if (!carrier) return { success: false, error: await te("Enter the carrier name.") };
  const trackingUrl = input.trackingUrl?.trim() || null;
  if (trackingUrl && !/^https?:\/\/\S+$/i.test(trackingUrl)) {
    return { success: false, error: await te("Enter a valid tracking link (https://…).") };
  }
  const fields = {
    carrier,
    tracking_number: input.trackingNumber?.trim() || null,
    tracking_url: trackingUrl,
    estimated_delivery: input.estimatedDelivery ? new Date(`${input.estimatedDelivery}T12:00:00Z`).toISOString() : null,
  };

  if (input.shipmentId) {
    const { error } = await ctx.supabase.from("shipments").update(fields).eq("id", input.shipmentId).eq("order_id", orderId);
    if (error) return { success: false, error: error.message };
    revalidateOrder(orderId);
    return { success: true, data: { id: input.shipmentId } };
  }

  const { data: order } = await ctx.supabase
    .from("orders")
    .select("id, customer_id, shipping_address, customers(country)")
    .eq("id", orderId)
    .single();
  if (!order) return { success: false, error: await te("Order not found.") };
  const address = order.shipping_address as { country?: string } | null;
  const customer = order.customers as { country?: string } | { country?: string }[] | null;
  const customerCountry = Array.isArray(customer) ? customer[0]?.country : customer?.country;

  const { data, error } = await ctx.supabase
    .from("shipments")
    .insert({
      ...fields,
      shipment_number: `SHP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      order_id: orderId,
      customer_id: order.customer_id,
      status: "preparing",
      destination_country: address?.country || customerCountry || "—",
    })
    .select("id")
    .single();
  if (error) return { success: false, error: error.message };
  after(() =>
    sendShipmentEmail(orderId, {
      stage: "shipment_created",
      carrier,
      trackingNumber: fields.tracking_number,
      eta: fields.estimated_delivery,
    })
  );
  revalidateOrder(orderId);
  return { success: true, data: { id: data.id } };
}

/**
 * Posts a tracking update (location + note). Journey stages also move the
 * shipment (or, without a shipment, the order) forward — never backwards.
 */
export async function addTrackingEvent(
  orderId: string,
  input: { stage: StaffStage; location?: string; note?: string; isPublic?: boolean; shipmentId?: string | null }
): Promise<Result> {
  const ctx = await requireStaff();
  if (!ctx) return { success: false, error: await te("Only logistics staff can update shipments.") };
  if (!STAFF_STAGES.includes(input.stage)) return { success: false, error: await te("Unauthorized") };

  const location = input.location?.trim() || null;
  const note = input.note?.trim() || null;
  if (input.stage === "update" && !location && !note) return { success: false, error: await te("Add a location or a note.") };

  const { data: shipments } = await ctx.supabase
    .from("shipments")
    .select("id, status")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  const shipment = shipments?.find((s) => s.id === input.shipmentId) ?? shipments?.[0] ?? null;

  // The update first, so the automatic events below see this stage as logged.
  const { error } = await ctx.supabase.from("order_tracking_events").insert({
    order_id: orderId,
    shipment_id: shipment?.id ?? null,
    stage: input.stage,
    location,
    note,
    is_public: input.isPublic ?? true,
    source: "staff",
    created_by: ctx.user.id,
  });
  if (error) return { success: false, error: error.message };

  const shipmentStatus = STAGE_TO_SHIPMENT_STATUS[input.stage];
  if (shipment && shipmentStatus) {
    const forward =
      shipmentStatus === "exception" || (SHIPMENT_RANK[shipmentStatus] ?? -1) > (SHIPMENT_RANK[shipment.status] ?? -1) ||
      shipment.status === "exception";
    if (forward) await ctx.supabase.from("shipments").update({ status: shipmentStatus }).eq("id", shipment.id);
  }

  // Order-level stages (sourcing, quality check…), or any stage while there is no shipment.
  const orderStatus = STAGE_TO_ORDER_STATUS[input.stage];
  if (orderStatus && (!shipment || !shipmentStatus)) {
    const { data: order } = await ctx.supabase.from("orders").select("status").eq("id", orderId).single();
    if (order && (ORDER_RANK[orderStatus] ?? -1) > (ORDER_RANK[order.status] ?? 99)) {
      await ctx.supabase.from("orders").update({ status: orderStatus }).eq("id", orderId);
    }
  }

  if (input.isPublic ?? true) {
    after(() => sendShipmentEmail(orderId, { stage: input.stage, location, note }));
  }

  revalidateOrder(orderId);
  return { success: true };
}

/** Removes a staff update posted by mistake. */
export async function deleteTrackingEvent(orderId: string, eventId: string): Promise<Result> {
  const ctx = await requireStaff();
  if (!ctx) return { success: false, error: await te("Only logistics staff can update shipments.") };
  const { error } = await ctx.supabase
    .from("order_tracking_events")
    .delete()
    .eq("id", eventId)
    .eq("order_id", orderId)
    .eq("source", "staff");
  if (error) return { success: false, error: error.message };
  revalidateOrder(orderId);
  return { success: true };
}
