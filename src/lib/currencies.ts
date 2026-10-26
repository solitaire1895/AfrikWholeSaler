// ========================================================
// Display currencies. Prices are stored in USD and converted for display.
// perUsd = how many units of the currency 1 USD buys (approximate defaults —
// the live values come from the `currencies` table, see
// supabase/currencies_africa.sql).
// ========================================================

export type CurrencyRegion = "central" | "west" | "east" | "north" | "southern" | "international";

export interface CurrencyInfo {
  code: string;
  symbol: string;
  perUsd: number;
  region: CurrencyRegion;
  /** Where the symbol goes: "1 500 FCFA" (after) vs "₦3,875" (before). */
  position: "before" | "after";
}

export const CURRENCY_REGIONS: CurrencyRegion[] = ["central", "west", "east", "north", "southern", "international"];

const c = (code: string, symbol: string, perUsd: number, region: CurrencyRegion, position: "before" | "after" = "before"): CurrencyInfo => ({
  code,
  symbol,
  perUsd,
  region,
  position,
});

export const CURRENCIES: CurrencyInfo[] = [
  // Central Africa
  c("XAF", "FCFA", 607.4, "central", "after"),
  c("CDF", "FC", 2850, "central", "after"),
  c("AOA", "Kz", 915, "central", "after"),
  c("RWF", "FRw", 1420, "central", "after"),
  c("BIF", "FBu", 2950, "central", "after"),
  c("STN", "Db", 22.7, "central", "after"),
  // West Africa
  c("XOF", "CFA", 607.4, "west", "after"),
  c("NGN", "₦", 1550, "west"),
  c("GHS", "GH₵", 12, "west"),
  c("GNF", "FG", 8650, "west", "after"),
  c("SLE", "Le", 22.7, "west"),
  c("LRD", "L$", 185, "west"),
  c("GMD", "D", 71, "west"),
  c("CVE", "Esc", 102.1, "west", "after"),
  c("MRU", "UM", 39.8, "west", "after"),
  // East Africa
  c("KES", "KSh", 129, "east"),
  c("UGX", "USh", 3650, "east"),
  c("TZS", "TSh", 2550, "east"),
  c("ETB", "Br", 140, "east"),
  c("SOS", "Sh.So.", 571, "east"),
  c("DJF", "Fdj", 177.7, "east", "after"),
  c("ERN", "Nfk", 15, "east"),
  c("SSP", "SSP", 4500, "east"),
  c("MGA", "Ar", 4550, "east", "after"),
  c("MUR", "Rs", 45.5, "east"),
  c("SCR", "SR", 14.2, "east"),
  c("KMF", "CF", 455.6, "east", "after"),
  // North Africa
  c("EGP", "E£", 49.5, "north"),
  c("MAD", "DH", 9.3, "north", "after"),
  c("DZD", "DA", 132, "north", "after"),
  c("TND", "DT", 3.0, "north", "after"),
  c("LYD", "LD", 5.45, "north", "after"),
  c("SDG", "SDG", 600, "north"),
  // Southern Africa
  c("ZAR", "R", 18, "southern"),
  c("BWP", "P", 13.6, "southern"),
  c("NAD", "N$", 18, "southern"),
  c("SZL", "E", 18, "southern"),
  c("LSL", "L", 18, "southern"),
  c("ZMW", "ZK", 25, "southern"),
  c("MWK", "MK", 1735, "southern"),
  c("MZN", "MT", 63.9, "southern", "after"),
  c("ZWG", "ZiG", 26.8, "southern"),
  // Reference currencies
  c("USD", "$", 1, "international"),
  c("EUR", "€", 0.926, "international"),
  c("GBP", "£", 0.79, "international"),
  c("CNY", "¥", 7.2, "international"),
];

export const DEFAULT_CURRENCY = "USD";

/** Big-unit currencies (FCFA, naira, shilling…) are shown without decimals. */
export function decimalsFor(info: Pick<CurrencyInfo, "perUsd">): number {
  return info.perUsd >= 100 ? 0 : 2;
}

/** "1 500 FCFA", "₦3,875", "KSh 322" — numbers grouped for the given locale. */
export function formatAmount(amount: number, info: CurrencyInfo, numberLocale: string): string {
  const d = decimalsFor(info);
  const n = new Intl.NumberFormat(numberLocale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(amount);
  if (info.position === "after") return `${n} ${info.symbol}`;
  // Letter symbols get a space ("KSh 322"); sign symbols stick ("₦3,875").
  return /[A-Za-z]$/.test(info.symbol) ? `${info.symbol} ${n}` : `${info.symbol}${n}`;
}
