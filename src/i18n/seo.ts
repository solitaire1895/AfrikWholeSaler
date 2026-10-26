// Search-engine helpers: absolute URLs per language, hreflang alternates, and
// which pages stay out of search results (safe for server code, no request APIs).
import { locales, type Locale } from "./config";
import { localizePath } from "./routing";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://afrikwholesaler.store").replace(/\/$/, "");

/** hreflang codes (Chinese is published as Simplified Chinese). */
export const HREFLANG: Record<Locale, string> = { fr: "fr", en: "en", es: "es", zh: "zh-CN" };

export function absoluteUrl(path: string, locale: Locale): string {
  return `${SITE_URL}${localizePath(path, locale)}`;
}

/** { "fr": "https://…/products", "en": "https://…/en/products", …, "x-default": French }. */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of locales) out[HREFLANG[l]] = absoluteUrl(path, l);
  out["x-default"] = absoluteUrl(path, "fr");
  return out;
}

/** Private or per-user pages: never indexed. */
const PRIVATE_PREFIXES = ["/dashboard", "/admin", "/cart", "/checkout", "/login", "/register", "/search", "/auth"];

export function isIndexable(path: string): boolean {
  return !PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
