// Shared affiliate-program constants and helpers (safe for client and server).

export const AFFILIATE_RATE = 0.05;
export const MIN_WITHDRAWAL_XAF = 10_000;
export const ATTRIBUTION_DAYS = 30;
export const AFFILIATE_COOKIE = "aw_aff";

export const PAYOUT_NETWORKS = [
  { id: "orange", label: "Orange Money" },
  { id: "mtn", label: "MTN MoMo" },
  { id: "moov", label: "Moov Money" },
  { id: "wave", label: "Wave" },
  { id: "free", label: "Free Money" },
  { id: "celtiis", label: "Celtiis Cash" },
  { id: "togocel", label: "T-Money" },
  { id: "airtel", label: "Airtel Money" },
] as const;

/**
 * Where SasPay can send affiliate payouts (FCFA zone — XAF and XOF have the
 * same value, so FCFA amounts work 1:1). network id → SasPay method code.
 * Keep in sync with affiliate_payout_method() in supabase/affiliate_payouts.sql.
 */
export const PAYOUT_COUNTRIES = [
  { code: "CM", currency: "XAF", dial: "237", methods: { mtn: "mtn_cm", orange: "orange_cm" } },
  { code: "CI", currency: "XOF", dial: "225", methods: { orange: "orange_ci", mtn: "mtn_ci", moov: "moov_ci", wave: "wave_ci" } },
  { code: "SN", currency: "XOF", dial: "221", methods: { orange: "orange_sn", wave: "wave_sn", free: "freemoney_sn" } },
  { code: "BJ", currency: "XOF", dial: "229", methods: { mtn: "mtn_bj", moov: "moov_bj", celtiis: "celtiis_bj" } },
  { code: "BF", currency: "XOF", dial: "226", methods: { orange: "orange_bf", moov: "moov_bf" } },
  { code: "ML", currency: "XOF", dial: "223", methods: { orange: "orange_ml", moov: "moov_ml" } },
  { code: "TG", currency: "XOF", dial: "228", methods: { moov: "moov_tg", togocel: "togocel" } },
  { code: "NE", currency: "XOF", dial: "227", methods: { airtel: "airtel_ne" } },
] as const;

export type PayoutCountry = (typeof PAYOUT_COUNTRIES)[number];

export function payoutCountry(code: string): PayoutCountry | undefined {
  return PAYOUT_COUNTRIES.find((c) => c.code === code);
}

/** SasPay method code (e.g. "orange_cm"), or null when the pair is not supported. */
export function payoutMethod(country: string, network: string): string | null {
  const c = payoutCountry(country);
  return (c?.methods as Record<string, string> | undefined)?.[network] ?? null;
}

export function networkLabel(id: string): string {
  return PAYOUT_NETWORKS.find((n) => n.id === id)?.label ?? id;
}

/** productId → { code, time } — which affiliate link brought the visitor to each product. */
export type Attribution = Record<string, { c: string; t: number }>;

export function parseAttribution(raw: string | undefined): Attribution {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Attribution;
    const cutoff = Date.now() - ATTRIBUTION_DAYS * 86_400_000;
    const out: Attribution = {};
    for (const [productId, v] of Object.entries(parsed)) {
      if (v && typeof v.c === "string" && typeof v.t === "number" && v.t >= cutoff) out[productId] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Keep the cookie small: the 25 most recent product attributions. */
export function serializeAttribution(a: Attribution): string {
  const entries = Object.entries(a)
    .sort((x, y) => y[1].t - x[1].t)
    .slice(0, 25);
  return JSON.stringify(Object.fromEntries(entries));
}

export function affiliateLink(origin: string, productSlug: string, code: string) {
  return `${origin}/products/${productSlug}?ref=${encodeURIComponent(code)}`;
}

export function isValidCode(code: string) {
  return /^[A-Z0-9]{4,16}$/i.test(code);
}
