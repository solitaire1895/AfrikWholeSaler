import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// SasPay API — https://docs.saspay.me
const BASE_URL = "https://api.saspay.me/api/v1";

export interface CheckoutSessionInput {
  amount: string; // decimal string, e.g. "5000.00"
  currency: string; // e.g. "XAF", "XOF"
  customer_email: string;
  customer_name: string;
  description?: string;
  country?: string; // ISO2, preselects country on the hosted page
  customer_phone?: string;
  return_url?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  checkout_url: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | string;
  amount: string;
  currency: string;
}

export interface CheckoutSessionStatus {
  id: string;
  status: string; // session status, e.g. "PENDING" | "PAID"
  transaction_id: string | null;
  transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | null;
  transaction_reference: string | null;
}

export interface SaspayWebhookEvent {
  event: string; // e.g. "transaction.success"
  data: {
    id: string;
    reference?: string;
    /** "PAIEMENT" for customer payments, "RETRAIT" for payouts. */
    type?: string;
    status: string;
    msisdn?: string;
    fee?: string;
    amount?: string;
    charged?: string;
    net_amount?: string;
    currency?: string;
    network?: string;
    [key: string]: unknown;
  };
}

/** A SasPay API error. `status` is the HTTP status (0 when the request never got an answer). */
export class SaspayError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = "SaspayError";
  }
  /** 4xx: SasPay refused the request, so nothing happened on their side. */
  get definite() {
    return this.status >= 400 && this.status < 500;
  }
}

async function saspayFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.SASPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new SaspayError(`SasPay unreachable: ${(err as Error).message}`, 0);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const code: string | undefined = body?.code ?? body?.error?.code;
    const message =
      body?.error?.message ?? body?.message ?? (body?.error ? JSON.stringify(body.error) : res.statusText);
    throw new SaspayError(`SasPay ${res.status}${code ? ` (${code})` : ""}: ${message}`, res.status, code);
  }
  // Responses may be wrapped in the { success, data } envelope or returned bare.
  return (body?.data ?? body) as T;
}

export function createCheckoutSession(input: CheckoutSessionInput) {
  return saspayFetch<CheckoutSession>("/checkout-sessions/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Re-checks the real state with the gateway — the source of truth for a payment. */
export function getCheckoutSessionStatus(sessionId: string) {
  return saspayFetch<CheckoutSessionStatus>(`/checkout-sessions/${sessionId}/status/`);
}

export interface PayoutInput {
  amount: string; // decimal string, e.g. "10000.00"
  currency: string; // must match country (XAF for CM, XOF for SN/CI/BJ…)
  country: string; // ISO2
  method: string; // network code, e.g. "orange_cm"
  recipient: { msisdn: string };
  customer: { phone?: string; email?: string; first_name?: string; last_name?: string };
  description?: string;
  metadata?: Record<string, string>;
}

export interface PayoutStatus {
  id: string;
  reference?: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  transaction_type?: string; // "RETRAIT"
  requested_amount?: string;
  client_fee?: string;
  net_amount?: string;
  currency?: string;
}

/**
 * Sends money from the SasPay balance to a Mobile Money number.
 * Requires an API key with the PAYOUT scope and this server's IP whitelisted.
 * Reusing the same idempotency key for a retry never pays twice.
 */
export function initializePayout(input: PayoutInput, idempotencyKey: string) {
  return saspayFetch<{ id: string; message?: string }>("/payouts/initialize/", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
}

/** Real state of a payout (SasPay re-checks the gateway while it is PENDING). */
export function verifyPayout(payoutId: string) {
  return saspayFetch<PayoutStatus>(`/payouts/${payoutId}/verify/`);
}

/**
 * Verifies the X-Webhook-Signature header:
 * hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)), timestamp within 5 minutes.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  const secret = process.env.SASPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
