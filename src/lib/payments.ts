import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCheckoutSessionStatus, type SaspayWebhookEvent } from "@/lib/saspay";
import { sendPaymentReceivedEmail } from "@/lib/email";

interface PaymentRow {
  id: string;
  order_id: string;
  checkout_session_id: string;
  status: string;
}

/**
 * Asks SasPay for the real state of a checkout session and mirrors it
 * onto the payments row and the order's payment_status.
 */
export async function syncPayment(payment: PaymentRow, event?: SaspayWebhookEvent) {
  const remote = await getCheckoutSessionStatus(payment.checkout_session_id);
  const status = remote.transaction_status ?? (remote.status === "PAID" ? "SUCCESS" : "PENDING");

  const supabase = createAdminClient();
  const fromEvent = event && event.data.id === remote.transaction_id ? event.data : null;

  await supabase
    .from("payments")
    .update({
      status,
      transaction_id: remote.transaction_id,
      transaction_reference: remote.transaction_reference,
      ...(fromEvent && {
        charged: fromEvent.charged ?? null,
        net_amount: fromEvent.net_amount ?? null,
        network: fromEvent.network ?? null,
        raw_event: event,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (status === "SUCCESS") {
    const paidNow = fromEvent?.amount && fromEvent.currency ? { amount: fromEvent.amount, currency: fromEvent.currency } : undefined;
    // Adds this payment to the order exactly once (deposit → 'partial', then 'paid').
    const { data: applied, error: applyError } = await supabase.rpc("apply_order_payment", { p_payment: payment.id });
    if (!applyError) {
      const result = applied as { applied?: boolean; kind?: string; balance_due?: number } | null;
      // Receipt only when this sync applied the payment, so webhook retries and
      // the return-page check never send it twice.
      if (result?.applied) {
        await sendPaymentReceivedEmail(payment.order_id, paidNow, {
          kind: result.kind === "deposit" ? "deposit" : "full",
          balanceDue: Number(result.balance_due ?? 0),
        });
      }
    } else {
      // supabase/deposits.sql not run yet: previous behavior (one payment = paid).
      const { data: newlyPaid } = await supabase
        .from("orders")
        .update({ payment_status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.order_id)
        .neq("payment_status", "paid")
        .select("id");
      if (newlyPaid?.length) await sendPaymentReceivedEmail(payment.order_id, paidNow);
    }
  } else if (status === "FAILED") {
    // Only mark the order failed if no other attempt for it has succeeded.
    await supabase
      .from("orders")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", payment.order_id)
      .eq("payment_status", "pending");
  }

  return status;
}

/**
 * The webhook payload carries no checkout-session id or metadata, so match it
 * to our pending payments: first by transaction id, otherwise by amount and
 * currency among recent pending sessions. Each candidate is re-verified with
 * SasPay, so a wrong guess never marks anything paid.
 */
export async function handleTransactionEvent(event: SaspayWebhookEvent) {
  const supabase = createAdminClient();
  const { id, amount, currency } = event.data;

  const { data: byTxn } = await supabase
    .from("payments")
    .select("id, order_id, checkout_session_id, status")
    .eq("transaction_id", id);

  let candidates = (byTxn ?? []) as PaymentRow[];

  if (candidates.length === 0) {
    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("payments")
      .select("id, order_id, checkout_session_id, status")
      .eq("status", "PENDING")
      .gte("created_at", since);
    if (amount) query = query.eq("amount", amount);
    if (currency) query = query.eq("currency", currency);
    const { data } = await query.limit(20);
    candidates = (data ?? []) as PaymentRow[];
  }

  for (const payment of candidates) {
    await syncPayment(payment, event);
  }
}
