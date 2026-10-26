// Language URLs (safe for the proxy, the server and the browser).
// French lives at the plain URLs (/products); the other languages get a
// prefix (/en/products, /es/products, /zh/products). The proxy rewrites a
// prefixed URL to the plain page and passes the language in a header.
import { defaultLocale, locales, type Locale } from "./config";

/** Request headers set by the proxy for every page. */
export const LOCALE_HEADER = "x-aw-locale";
export const PATH_HEADER = "x-aw-path";

export const prefixedLocales = locales.filter((l) => l !== defaultLocale) as Exclude<Locale, typeof defaultLocale>[];

/** "/en/products/x" → { locale: "en", path: "/products/x" }; "/products" → { locale: null, path: "/products" }. */
export function splitLocalePath(pathname: string): { locale: Locale | null; path: string } {
  const seg = pathname.split("/")[1] ?? "";
  if ((prefixedLocales as string[]).includes(seg)) {
    return { locale: seg as Locale, path: pathname.slice(seg.length + 1) || "/" };
  }
  return { locale: null, path: pathname || "/" };
}

/** "/products", "en" → "/en/products"; "/products", "fr" → "/products". */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
