import "server-only";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { email as emailMessages } from "@/i18n/messages/email";
import { format } from "@/i18n/format";
import { defaultLocale, intlLocale, isLocale, type Locale } from "@/i18n/config";

// ========================================================
// Transactional emails through Resend (https://resend.com/docs/api-reference).
// Sending never throws: a failed email is reported to Sentry and the caller
// carries on (an order is never lost because an email bounced).
// ========================================================

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/$/, "");

const C = {
  brand: "#d62828",
  navy: "#0f172a",
  gold: "#f4b400",
  cream: "#f4f2ef",
  border: "#e2e8f0",
  text: "#111827",
  muted: "#64748b",
};

type EmailText = (typeof emailMessages)["en"];

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sends one email. Returns false (and reports to Sentry) instead of throwing. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return true;
  } catch (err) {
    Sentry.captureException(err, { tags: { area: "email" }, extra: { subject } });
    console.error("Email not sent:", subject, err);
    return false;
  }
}

// --------------------------------------------------------
// Layout
// --------------------------------------------------------

function layout(t: EmailText, locale: Locale, body: string, cta?: { label: string; href: string }): string {
  const button = cta
    ? `<tr><td style="padding:8px 32px 28px"><a href="${esc(cta.href)}" style="display:inline-block;background:${C.brand};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px">${esc(cta.label)}</a></td></tr>`
    : "";
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AfrikWholesaler</title></head>
<body style="margin:0;padding:0;background:${C.cream};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">
<tr><td style="background:${C.navy};padding:22px 32px;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">Afrik<span style="color:${C.gold}">Wholesaler</span></td></tr>
${body}
${button}
<tr><td style="padding:20px 32px;border-top:1px solid ${C.border};font-size:13px;line-height:1.6;color:${C.muted}">${esc(t.common.questions)}</td></tr>
</table>
<p style="font-size:12px;color:${C.muted};margin:16px 0 0">${esc(t.common.footer)}</p>
</td></tr></table></body></html>`;
}

function heading(title: string, greeting: string, intro: string): string {
  return `<tr><td style="padding:32px 32px 8px">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:${C.navy}">${esc(title)}</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:1.6">${esc(greeting)}</p>
<p style="margin:0;font-size:15px;line-height:1.6">${esc(intro)}</p>
</td></tr>`;
}

function paragraph(text: string, style = ""): string {
  return `<tr><td style="padding:12px 32px 4px;font-size:15px;line-height:1.6;${style}">${esc(text)}</td></tr>`;
}

// --------------------------------------------------------
// Data
// --------------------------------------------------------

interface OrderForEmail {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  awaitingPrice: boolean;
  items: { name: string; quantity: number; total: number }[];
  to: string;
  name: string | null;
  locale: Locale;
}

/** Order + recipient + their language. Null when the order or an email address is missing. */
async function loadOrder(orderId: string): Promise<OrderForEmail | null> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, total_amount, currency, awaiting_price, shipping_address, customer_id, order_items(product_name, quantity, total_price)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const { data: customer } = await admin
    .from("customers")
    .select("email, contact_name, user_id")
    .eq("id", order.customer_id)
    .maybeSingle();
  let to = customer?.email ?? null;
  let locale: Locale = defaultLocale;
  let name = (order.shipping_address as { fullName?: string } | null)?.fullName || customer?.contact_name || null;
  if (customer?.user_id) {
    // `locale` only exists once supabase/emails.sql has run — fall back to the default.
    const { data: profile } = await admin.from("profiles").select("*").eq("id", customer.user_id).maybeSingle();
    if (profile) {
      to = profile.email || to;
      if (isLocale(profile.locale)) locale = profile.locale;
      name = name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null;
    }
  }
  if (!to) return null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    total: Number(order.total_amount),
    currency: order.currency || "USD",
    awaitingPrice: Boolean(order.awaiting_price),
    items: ((order.order_items ?? []) as { product_name: string; quantity: number; total_price: number }[]).map((i) => ({
      name: i.product_name,
      quantity: i.quantity,
      total: Number(i.total_price),
    })),
    to,
    name: name?.split(" ")[0] ?? null,
    locale,
  };
}

function money(amount: number, currency: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function itemsTable(o: OrderForEmail, t: EmailText): string {
  const rows = o.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:14px">${esc(i.name)}</td>
<td style="padding:10px 8px;border-bottom:1px solid ${C.border};font-size:14px;text-align:center;color:${C.muted}">${i.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:14px;text-align:right">${i.total > 0 ? esc(money(i.total, o.currency, o.locale)) : esc(t.common.priceOnRequest)}</td></tr>`
    )
    .join("");
  return `<tr><td style="padding:16px 32px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${C.muted};padding-bottom:6px">${esc(t.common.item)}</td><td style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${C.muted};text-align:center;padding-bottom:6px">${esc(t.common.qty)}</td><td></td></tr>
${rows}
<tr><td colspan="2" style="padding:14px 0 0;font-weight:700;color:${C.navy}">${esc(t.common.total)}</td>
<td style="padding:14px 0 0;font-weight:700;color:${C.navy};text-align:right">${o.awaitingPrice ? esc(t.common.priceOnRequest) : esc(money(o.total, o.currency, o.locale))}</td></tr>
</table></td></tr>`;
}

const greetingFor = (t: EmailText, name: string | null) =>
  name ? format(t.common.greeting, { name }) : t.common.greetingNoName;

const orderLink = (orderId: string) => `${SITE_URL}/dashboard/orders/${orderId}`;

// --------------------------------------------------------
// Emails
// --------------------------------------------------------

/** Right after checkout. */
export async function sendOrderPlacedEmail(orderId: string, opts: { paidWithWallet?: boolean } = {}) {
  const o = await loadOrder(orderId);
  if (!o) return false;
  const t = emailMessages[o.locale];
  const next = opts.paidWithWallet ? t.orderPlaced.nextPaid : o.awaitingPrice ? t.orderPlaced.nextQuote : t.orderPlaced.nextPay;
  const body =
    heading(t.orderPlaced.title, greetingFor(t, o.name), format(t.orderPlaced.intro, { order: o.orderNumber })) +
    itemsTable(o, t) +
    paragraph(next, `color:${C.navy};font-weight:600`);
  return sendEmail(
    o.to,
    format(t.orderPlaced.subject, { order: o.orderNumber }),
    layout(t, o.locale, body, { label: t.common.viewOrder, href: orderLink(o.id) })
  );
}

/** When SasPay (or the affiliate wallet) confirms a payment — sent once per payment. */
export async function sendPaymentReceivedEmail(
  orderId: string,
  paid?: { amount: string | number; currency: string },
  opts: { kind?: "full" | "deposit"; balanceDue?: number } = {}
) {
  const o = await loadOrder(orderId);
  if (!o) return false;
  const t = emailMessages[o.locale];
  const P = t.paymentReceived;
  const deposit = opts.kind === "deposit";
  const amount = paid ? money(Number(paid.amount), paid.currency, o.locale) : money(o.total, o.currency, o.locale);
  const balanceRow =
    deposit && opts.balanceDue
      ? `<tr><td style="padding:12px 32px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:14px"><tr>
<td style="padding:14px 20px;font-size:14px;color:${C.muted}">${esc(P.balance)}</td>
<td style="padding:14px 20px;font-size:16px;font-weight:700;color:${C.brand};text-align:right">${esc(money(opts.balanceDue, o.currency, o.locale))}</td></tr></table></td></tr>`
      : "";
  const body =
    heading(
      deposit ? P.depositTitle : P.title,
      greetingFor(t, o.name),
      format(deposit ? P.depositIntro : P.intro, { order: o.orderNumber })
    ) +
    `<tr><td style="padding:16px 32px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};border-radius:14px"><tr>
<td style="padding:16px 20px;font-size:14px;color:${C.muted}">${esc(t.paymentReceived.amount)}</td>
<td style="padding:16px 20px;font-size:20px;font-weight:700;color:${C.navy};text-align:right">${esc(amount)}</td></tr></table></td></tr>` +
    balanceRow +
    paragraph(deposit ? P.depositNext : P.next);
  return sendEmail(
    o.to,
    format(deposit ? P.depositSubject : P.subject, { order: o.orderNumber }),
    layout(t, o.locale, body, { label: t.common.trackOrder, href: orderLink(o.id) })
  );
}

/** Shipment booked, or a visible tracking update posted by staff. */
export async function sendShipmentEmail(
  orderId: string,
  update: { stage: string; location?: string | null; note?: string | null; carrier?: string | null; trackingNumber?: string | null; eta?: string | null }
) {
  const o = await loadOrder(orderId);
  if (!o) return false;
  const t = emailMessages[o.locale];
  const stageLabel = (t.stages as Record<string, string>)[update.stage] ?? t.stages.update;

  const lines: string[] = [];
  if (update.stage === "shipment_created" && update.carrier) lines.push(format(t.shipment.created, { carrier: update.carrier }));
  if (update.trackingNumber) lines.push(format(t.shipment.trackingNumber, { tracking: update.trackingNumber }));
  if (update.eta) {
    const date = new Intl.DateTimeFormat(intlLocale[o.locale], { day: "numeric", month: "long", year: "numeric" }).format(new Date(update.eta));
    lines.push(format(t.shipment.eta, { date }));
  }
  if (update.location) lines.push(format(t.shipment.location, { location: update.location }));

  const body =
    heading(t.shipment.title, greetingFor(t, o.name), `${t.common.orderNumber} ${o.orderNumber} — ${stageLabel}`) +
    lines.map((l) => paragraph(l)).join("") +
    (update.note ? paragraph(update.note, `color:${C.navy};background:${C.cream};border-radius:14px;padding:14px 20px`) : "");
  return sendEmail(
    o.to,
    format(t.shipment.subject, { order: o.orderNumber, stage: stageLabel }),
    layout(t, o.locale, body, { label: t.common.trackOrder, href: orderLink(o.id) })
  );
}
