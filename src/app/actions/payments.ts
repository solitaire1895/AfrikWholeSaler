"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCustomer } from "@/lib/queries";
import { createCheckoutSession } from "@/lib/saspay";
import { balanceDue, canPayDeposit, depositAmount } from "@/lib/deposit";

const ZERO_DECIMAL = new Set(["XAF", "XOF", "GNF", "JPY", "BIF", "DJF", "KMF", "RWF", "UGX", "MGA"]);

/**
 * Converts between currencies. Uses currencies.per_usd (units per 1 USD,
 * precise for small-value currencies) and falls back to rate_to_usd
 * (USD value of 1 unit) when per_usd is not set.
 */
async function convert(amount: number, from: string, to: string) {
  if (from === to) return amount;
  const supabase = await createClient();
  type Row = { code: string; rate_to_usd: number | null; per_usd?: number | null };
  const first = await supabase.from("currencies").select("code, rate_to_usd, per_usd").in("code", [from, to]);
  // Falls back when the per_usd column is not added yet (currencies_africa.sql not run).
  const data: Row[] | null = first.error
    ? (await supabase.from("currencies").select("code, rate_to_usd").in("code", [from, to])).data
    : first.data;
  const rate = (code: string) => {
    const row = data?.find((c) => c.code === code);
    const perUsd = Number(row?.per_usd);
    return perUsd > 0 ? 1 / perUsd : Number(row?.rate_to_usd);
  };
  const fromRate = from === "USD" ? 1 : rate(from);
  const toRate = to === "USD" ? 1 : rate(to);
  if (!fromRate || !toRate) throw new Error(`No exchange rate for ${from} → ${to}`);
  return (amount * fromRate) / toRate;
}

/**
 * Creates a SasPay hosted checkout for one of the current customer's orders
 * and redirects the browser to it.
 */
export async function payOrder(orderId: string, mode: "full" | "deposit" = "full") {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  // RLS ensures customers can only read their own orders.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!order) throw new Error("Order not found");
  if (order.payment_status === "paid") redirect("/dashboard/orders");
  // "Price on request" orders can only be paid once staff have set the price.
  if (order.awaiting_price || Number(order.total_amount) <= 0) {
    throw new Error("This order is waiting for the seller to confirm its price.");
  }

  const payCurrency = process.env.SASPAY_CURRENCY || "XAF";
  const payable = {
    totalAmount: Number(order.total_amount),
    walletApplied: Number(order.wallet_applied ?? 0),
    amountPaid: Number(order.amount_paid ?? 0),
    awaitingPrice: Boolean(order.awaiting_price),
    paymentStatus: order.payment_status,
  };
  // Deposit (30%) for big orders not paid yet; otherwise everything that's left
  // (the full amount, or the balance after a deposit). The wallet share is never charged.
  const kind = mode === "deposit" && canPayDeposit(payable) ? "deposit" : payable.amountPaid > 0 ? "balance" : "full";
  const due = kind === "deposit" ? depositAmount(payable) : balanceDue(payable);
  if (due <= 0) redirect("/dashboard/orders");
  const converted = await convert(due, order.currency, payCurrency);
  const amount = ZERO_DECIMAL.has(payCurrency)
    ? Math.ceil(converted).toFixed(2)
    : converted.toFixed(2);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await createCheckoutSession({
    amount,
    currency: payCurrency,
    description: kind === "deposit" ? `Deposit 30% — order ${order.order_number}` : kind === "balance" ? `Balance — order ${order.order_number}` : `Order ${order.order_number}`,
    customer_email: customer.email,
    customer_name: `${customer.firstName} ${customer.lastName}`.trim() || customer.email,
    customer_phone: customer.phone || undefined,
    return_url: `${siteUrl}/dashboard/orders?order=${order.id}`,
    metadata: { order_id: order.id, order_number: order.order_number },
  });

  const record = {
    order_id: order.id,
    checkout_session_id: session.id,
    checkout_url: session.checkout_url,
    amount,
    currency: payCurrency,
    status: "PENDING",
  };
  const admin = createAdminClient();
  let { error } = await admin.from("payments").insert({ ...record, kind, order_amount: due });
  // Before supabase/deposits.sql runs, those columns don't exist yet.
  if (error && /kind|order_amount/.test(error.message)) ({ error } = await admin.from("payments").insert(record));
  if (error) throw new Error(`Could not record payment: ${error.message}`);

  redirect(session.checkout_url);
}
