import { getCurrentCustomer, getOrdersByCustomer } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { syncPayment } from "@/lib/payments";
import { OrdersList } from "@/components/dashboard/orders-list";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; placed?: string; wallet?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  // Returning from SasPay checkout: confirm the payment right away instead of
  // waiting for the webhook. RLS limits this to the customer's own payments.
  const { order: returnedOrderId, placed, wallet } = await searchParams;
  if (returnedOrderId) {
    const supabase = await createClient();
    const { data: pending } = await supabase
      .from("payments")
      .select("id, order_id, checkout_session_id, status")
      .eq("order_id", returnedOrderId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pending) {
      await syncPayment(pending).catch((err) =>
        console.error("SasPay status check failed", err)
      );
    }
  }

  const orders = await getOrdersByCustomer(customer.id);

  return <OrdersList orders={orders} placed={placed} paidWithWallet={wallet === "1"} />;
}
