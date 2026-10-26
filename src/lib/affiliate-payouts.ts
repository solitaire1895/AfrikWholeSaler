import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializePayout, verifyPayout, SaspayError, type SaspayWebhookEvent } from "@/lib/saspay";
import { payoutCountry, payoutMethod } from "@/lib/affiliate";

// ========================================================
// Affiliate withdrawals paid out through SasPay.
// requested/approved → (admin "Pay via SasPay") processing → paid | failed
// The webhook and the admin "Check status" button both end in syncPayout(),
// which asks SasPay for the real state before changing anything.
// ========================================================

interface WithdrawalRow {
  id: string;
  user_id: string;
  amount_xaf: number;
  network: string;
  phone: string;
  country: string;
  currency: string;
  status: string;
  payout_id: string | null;
  payout_attempt: number;
}

export type PayoutOutcome =
  | { state: "processing" | "paid" | "failed" }
  | { state: "released"; error: string } // SasPay refused: nothing sent, back in the queue
  | { state: "unconfirmed"; error: string } // no answer: may or may not be sent — check again
  | { state: "unavailable" };

/** "6 77 88 99 00" (CM) → "237677889900". SasPay accepts local or international forms. */
export function toMsisdn(phone: string, country: string): string {
  let digits = phone.replace(/\D/g, "");
  const dial = payoutCountry(country)?.dial ?? "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  return dial && !digits.startsWith(dial) ? dial + digits : digits;
}

/** One key per attempt: retries of the same attempt never pay twice. */
const idempotencyKey = (w: Pick<WithdrawalRow, "id" | "payout_attempt">) => `aw-withdrawal-${w.id}-${w.payout_attempt}`;

async function sendToSaspay(w: WithdrawalRow): Promise<PayoutOutcome> {
  const admin = createAdminClient();
  const method = payoutMethod(w.country, w.network);
  if (!method) {
    const error = `Unsupported network ${w.network} in ${w.country}`;
    await admin.rpc("release_affiliate_payout", { p_id: w.id, p_error: error });
    return { state: "released", error };
  }

  const [{ data: profile }, { data: aff }] = await Promise.all([
    admin.from("profiles").select("email, first_name, last_name").eq("id", w.user_id).single(),
    admin.from("affiliates").select("code").eq("user_id", w.user_id).single(),
  ]);
  const msisdn = toMsisdn(w.phone, w.country);

  try {
    const res = await initializePayout(
      {
        amount: Number(w.amount_xaf).toFixed(2),
        currency: w.currency,
        country: w.country,
        method,
        recipient: { msisdn },
        customer: {
          phone: `+${msisdn}`,
          ...(profile?.email && { email: profile.email }),
          ...(profile?.first_name && { first_name: profile.first_name }),
          ...(profile?.last_name && { last_name: profile.last_name }),
        },
        description: `AfrikWholesaler affiliate payout${aff?.code ? ` (${aff.code})` : ""}`,
        metadata: { withdrawal_id: w.id },
      },
      idempotencyKey(w)
    );
    await admin.from("affiliate_withdrawals").update({ payout_id: res.id, payout_error: null }).eq("id", w.id);
    // Often still PENDING here; the webhook finishes it. Check once anyway.
    return await syncPayout({ ...w, payout_id: res.id }).catch(() => ({ state: "processing" as const }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof SaspayError && err.definite) {
      await admin.rpc("release_affiliate_payout", { p_id: w.id, p_error: message });
      return { state: "released", error: message };
    }
    // Timeout / 5xx: SasPay may have sent it. Stay "processing"; the retry
    // reuses the same idempotency key, so it can't pay twice.
    await admin.from("affiliate_withdrawals").update({ payout_error: `Unconfirmed: ${message}` }).eq("id", w.id);
    return { state: "unconfirmed", error: message };
  }
}

/** Admin "Pay via SasPay": claims the withdrawal atomically, then sends it. */
export async function startPayout(withdrawalId: string, adminId: string): Promise<PayoutOutcome> {
  const { data } = await createAdminClient().rpc("begin_affiliate_payout", { p_id: withdrawalId, p_admin: adminId });
  const w = (data as WithdrawalRow[] | null)?.[0];
  if (!w) return { state: "unavailable" };
  return sendToSaspay(w);
}

/** Asks SasPay for the payout's real state and records the outcome. */
export async function syncPayout(w: Pick<WithdrawalRow, "id" | "payout_id">): Promise<PayoutOutcome> {
  if (!w.payout_id) return { state: "processing" };
  const remote = await verifyPayout(w.payout_id);
  const status = String(remote.status).toUpperCase();
  if (status !== "SUCCESS" && status !== "FAILED") return { state: "processing" };

  const { data } = await createAdminClient().rpc("complete_affiliate_payout", {
    p_id: w.id,
    p_success: status === "SUCCESS",
    p_reference: remote.reference ?? null,
    p_fee: remote.client_fee ? Number(remote.client_fee) : null,
    p_error: status === "FAILED" ? "Refused by the Mobile Money network" : null,
  });
  return { state: data === "paid" ? "paid" : data === "failed" ? "failed" : "processing" };
}

/** Admin "Check status": verifies a sent payout, or re-sends one that never got an answer. */
export async function refreshPayout(withdrawalId: string): Promise<PayoutOutcome> {
  const { data: w } = await createAdminClient()
    .from("affiliate_withdrawals")
    .select("id, user_id, amount_xaf, network, phone, country, currency, status, payout_id, payout_attempt")
    .eq("id", withdrawalId)
    .single<WithdrawalRow>();
  if (!w || w.status !== "processing") return { state: "unavailable" };
  return w.payout_id ? syncPayout(w) : sendToSaspay(w);
}

/**
 * Webhook: transaction.success / transaction.failed for a payout (type RETRAIT).
 * Matches by payout id, falling back to number + amount among payouts in
 * progress; every candidate is verified with SasPay before anything changes.
 */
export async function handlePayoutEvent(event: SaspayWebhookEvent) {
  const admin = createAdminClient();
  const { id, msisdn, amount } = event.data;
  const columns = "id, payout_id";

  const { data: byId } = await admin.from("affiliate_withdrawals").select(columns).eq("payout_id", id);
  let candidates = (byId ?? []) as Pick<WithdrawalRow, "id" | "payout_id">[];

  if (candidates.length === 0 && msisdn) {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    let query = admin
      .from("affiliate_withdrawals")
      .select(`${columns}, phone`)
      .eq("status", "processing")
      .not("payout_id", "is", null)
      .gte("payout_sent_at", since);
    if (amount) query = query.eq("amount_xaf", Math.round(Number(amount)));
    const { data } = await query.limit(20);
    const tail = msisdn.replace(/\D/g, "").slice(-8);
    candidates = ((data ?? []) as (Pick<WithdrawalRow, "id" | "payout_id"> & { phone: string })[]).filter((w) =>
      w.phone.replace(/\D/g, "").endsWith(tail)
    );
  }

  for (const w of candidates) await syncPayout(w);
  return candidates.length;
}
