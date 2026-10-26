import type { Dictionary } from "./dictionary";
import { format } from "./format";

interface StoredNotification {
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
}

/**
 * Rebuilds a database notification in the reader's language from its
 * data.kind and parameters. Older notifications without a kind keep the
 * English text they were stored with.
 */
export function notificationText(
  t: Dictionary,
  n: StoredNotification,
  helpers: { formatPrice: (usd: number) => string; formatNumber: (n: number) => string }
): { title: string; body: string | null } {
  const d = n.data ?? {};
  const k = t.notify.kinds;
  const str = (key: string) => (d[key] == null ? "" : String(d[key]));
  const count = Number(d.count ?? 1);
  const money = (key: string) => helpers.formatPrice(Number(d[key] ?? 0));
  const xaf = (key: string) => `${helpers.formatNumber(Number(d[key] ?? 0))} FCFA`;
  const network = (key: string) => {
    const v = str(key);
    return ({ orange: "Orange Money", mtn: "MTN MoMo", moov: "Moov Money", wave: "Wave" } as Record<string, string>)[v] ?? v.toUpperCase();
  };
  const orderStatus = (s: string) => (t.status.order as Record<string, string>)[s] ?? s;

  switch (d.kind) {
    case "message_from_customer":
      return {
        title: count > 1 ? format(k.messagesFromCustomer, { n: count, name: str("name") }) : format(k.messageFromCustomer, { name: str("name") }),
        body: n.body === "📎 Attachment" ? k.attachment : n.body,
      };
    case "message_from_team":
      return {
        title: count > 1 ? format(k.messagesFromTeam, { n: count }) : k.messageFromTeam,
        body: n.body === "📎 Attachment" ? k.attachment : n.body,
      };
    case "order_new":
      return {
        title: format(k.orderNew, { order: str("order") }),
        body: d.awaiting ? k.orderNewAwaiting : format(k.orderNewTotal, { total: money("total") }),
      };
    case "price_ready":
      return { title: format(k.priceReady, { order: str("order") }), body: format(k.priceReadyBody, { total: money("total") }) };
    case "deposit_received":
      return {
        title: format(k.depositReceived, { order: str("order") }),
        body: format(k.depositReceivedBody, { balance: money("balance") }),
      };
    case "payment_received":
      return { title: format(k.paymentReceived, { order: str("order") }), body: k.paymentReceivedBody };
    case "order_paid":
      return { title: format(k.orderPaid, { order: str("order") }), body: format(k.orderNewTotal, { total: money("total") }) };
    case "payment_failed":
      return { title: format(k.paymentFailed, { order: str("order") }), body: k.paymentFailedBody };
    case "order_status":
      return {
        title: format(k.orderStatus, { order: str("order"), status: orderStatus(str("status")) }),
        body: (k.orderStatusBody as Record<string, string>)[str("status")] ?? null,
      };
    case "tracking_update": {
      const stage = str("stage");
      const label = stage === "update" ? "" : ((t.tracking.stages as Record<string, string>)[stage] ?? "");
      return {
        title: format(k.trackingUpdate, { order: str("order") }),
        body: [label || null, str("location") || null, str("note") || null].filter(Boolean).join(" · ") || null,
      };
    }
    case "shipment_status":
      return {
        title: format(k.shipmentStatus, {
          shipment: str("shipment"),
          status: (t.status.shipment as Record<string, string>)[str("status")] ?? str("status"),
        }),
        body: d.tracking
          ? format(k.shipmentBodyTracking, { carrier: str("carrier"), tracking: str("tracking") })
          : format(k.shipmentBody, { carrier: str("carrier") }),
      };
    case "quote_status": {
      const s = str("status");
      const title = s === "quoted" ? k.quoteReady : s === "under_review" ? k.quoteReview : k.quoteUpdate;
      return { title: format(title, { product: str("product") }), body: n.body };
    }
    case "affiliate_earned":
      return {
        title: format(k.affiliateEarned, { amount: money("amount_usd") }),
        body: format(k.affiliateEarnedBody, { product: str("product") }),
      };
    case "withdrawal_requested":
      return {
        title: k.withdrawalRequested,
        body: format(k.withdrawalRequestedBody, { amount: xaf("amount_xaf"), network: network("network"), phone: str("phone") }),
      };
    case "withdrawal_paid":
      return {
        title: format(k.withdrawalPaid, { amount: xaf("amount_xaf") }),
        body: format(k.withdrawalPaidBody, { network: network("network"), phone: str("phone") }),
      };
    case "withdrawal_failed":
      return {
        title: k.withdrawalFailed,
        body: format(k.withdrawalFailedBody, { amount: xaf("amount_xaf"), network: network("network"), phone: str("phone") }),
      };
    case "payout_failed_staff":
      return {
        title: k.payoutFailedStaff,
        body: format(k.payoutFailedStaffBody, { amount: xaf("amount_xaf"), phone: str("phone") }),
      };
    case "withdrawal_rejected":
      return { title: k.withdrawalRejected, body: str("note") || k.withdrawalRejectedBody };
    default:
      return { title: n.title, body: n.body };
  }
}
