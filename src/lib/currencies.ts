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

// ========================================================
// Currency from the visitor's country.
// ========================================================

/** Countries using each currency (also lets the picker find "Cameroun", "Kenya"…). */
export const CURRENCY_COUNTRIES: Record<string, string[]> = {
  XAF: ["CM", "GA", "CG", "TD", "CF", "GQ"],
  XOF: ["SN", "CI", "BJ", "BF", "ML", "NE", "TG", "GW"],
  CDF: ["CD"], AOA: ["AO"], RWF: ["RW"], BIF: ["BI"], STN: ["ST"],
  NGN: ["NG"], GHS: ["GH"], GNF: ["GN"], SLE: ["SL"], LRD: ["LR"], GMD: ["GM"], CVE: ["CV"], MRU: ["MR"],
  KES: ["KE"], UGX: ["UG"], TZS: ["TZ"], ETB: ["ET"], SOS: ["SO"], DJF: ["DJ"], ERN: ["ER"], SSP: ["SS"],
  MGA: ["MG"], MUR: ["MU"], SCR: ["SC"], KMF: ["KM"],
  EGP: ["EG"], MAD: ["MA", "EH"], DZD: ["DZ"], TND: ["TN"], LYD: ["LY"], SDG: ["SD"],
  ZAR: ["ZA"], BWP: ["BW"], NAD: ["NA"], SZL: ["SZ"], LSL: ["LS"], ZMW: ["ZM"], MWK: ["MW"], MZN: ["MZ"], ZWG: ["ZW"],
  USD: ["US", "EC", "SV", "PA", "PR", "TL", "ZW"],
  EUR: ["FR", "DE", "BE", "IT", "ES", "PT", "NL", "LU", "AT", "IE", "FI", "GR", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR", "MC", "AD", "SM", "VA", "ME", "XK", "RE", "YT", "GP", "MQ", "GF"],
  GBP: ["GB", "IM", "JE", "GG"],
  CNY: ["CN"],
};

const COUNTRY_TO_CURRENCY = new Map<string, string>();
for (const [code, countries] of Object.entries(CURRENCY_COUNTRIES))
  for (const cc of countries) if (!COUNTRY_TO_CURRENCY.has(cc)) COUNTRY_TO_CURRENCY.set(cc, code);

/** "CM" → "XAF"; null for countries without a listed currency (they keep USD). */
export function currencyForCountry(country: string | null | undefined): string | null {
  return country ? COUNTRY_TO_CURRENCY.get(country.toUpperCase()) ?? null : null;
}

/** Cookie set by the proxy from the hosting's IP-country header (CDN geolocation). */
export const COUNTRY_COOKIE = "aw_country";

/**
 * Fallback when the host sends no country: the device's time zone.
 * Windows reports one zone for many countries (all of West-Central Africa is
 * "Africa/Lagos", all of GMT West Africa "Atlantic/Reykjavik"), so the
 * language breaks the tie: French there is far more likely FCFA than naira.
 */
const ZONE_COUNTRY: Record<string, string> = {
  Abidjan: "CI", Accra: "GH", Addis_Ababa: "ET", Algiers: "DZ", Asmara: "ER", Bamako: "ML", Bangui: "CF", Banjul: "GM",
  Bissau: "GW", Blantyre: "MW", Brazzaville: "CG", Bujumbura: "BI", Cairo: "EG", Casablanca: "MA", Conakry: "GN",
  Dakar: "SN", Dar_es_Salaam: "TZ", Djibouti: "DJ", Douala: "CM", El_Aaiun: "EH", Freetown: "SL", Gaborone: "BW",
  Harare: "ZW", Johannesburg: "ZA", Juba: "SS", Kampala: "UG", Khartoum: "SD", Kigali: "RW", Kinshasa: "CD",
  Lagos: "NG", Libreville: "GA", Lome: "TG", Luanda: "AO", Lubumbashi: "CD", Lusaka: "ZM", Malabo: "GQ", Maputo: "MZ",
  Maseru: "LS", Mbabane: "SZ", Mogadishu: "SO", Monrovia: "LR", Nairobi: "KE", Ndjamena: "TD", Niamey: "NE",
  Nouakchott: "MR", Ouagadougou: "BF", "Porto-Novo": "BJ", Sao_Tome: "ST", Tripoli: "LY", Tunis: "TN", Windhoek: "NA",
  Antananarivo: "MG", Mauritius: "MU", Mahe: "SC", Comoro: "KM", Cape_Verde: "CV", Shanghai: "CN", London: "GB",
  Paris: "FR", Brussels: "BE", Berlin: "DE", Madrid: "ES", Rome: "IT", New_York: "US", Chicago: "US", Los_Angeles: "US",
};

export function guessCountryFromDevice(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const city = zone.split("/").pop() ?? "";
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    // A region in the language tag ("fr-CM") is the clearest hint.
    for (const l of langs) {
      const region = l.split("-")[1];
      if (region && region.length === 2 && region !== "US" && region !== "FR" && region !== "GB" && currencyForCountry(region)) {
        if (ZONE_COUNTRY[city] === region || !ZONE_COUNTRY[city]) return region.toUpperCase();
      }
    }
    const french = langs.some((l) => l.toLowerCase().startsWith("fr"));
    if (city === "Lagos") return french ? "CM" : "NG";
    if (city === "Reykjavik") return french ? "SN" : null;
    return ZONE_COUNTRY[city] ?? null;
  } catch {
    return null;
  }
}
