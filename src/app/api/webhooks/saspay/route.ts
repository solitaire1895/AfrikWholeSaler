import { verifyWebhookSignature, type SaspayWebhookEvent } from "@/lib/saspay";
import { handleTransactionEvent } from "@/lib/payments";
import { handlePayoutEvent } from "@/lib/affiliate-payouts";

// SasPay webhook endpoint — configure https://<your-domain>/api/webhooks/saspay
// in the SasPay dashboard and subscribe to transaction.success and
// transaction.failed. These cover both customer payments (type PAIEMENT) and
// affiliate payouts (type RETRAIT).
export async function POST(request: Request) {
  // Signature is computed over the raw body — read it before parsing.
  const rawBody = await request.text();
  const valid = verifyWebhookSignature(
    rawBody,
    request.headers.get("x-webhook-signature"),
    request.headers.get("x-webhook-timestamp")
  );
  if (!valid) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: SaspayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (event.event.startsWith("transaction.")) {
      const type = event.data?.type?.toUpperCase();
      // Both handlers re-verify with SasPay, so an event that is not theirs
      // changes nothing. Without a type, try both.
      const finished = event.event === "transaction.success" || event.event === "transaction.failed";
      if (finished && type !== "PAIEMENT") await handlePayoutEvent(event);
      if (type !== "RETRAIT") await handleTransactionEvent(event);
    }
    // settlement.*, wallet_transfer.* and webhook.test need no action;
    // acknowledge them so SasPay stops retrying.
  } catch (err) {
    console.error("SasPay webhook processing failed", err);
    // Non-2xx makes SasPay retry (30s, 5m, 30m, 2h).
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
