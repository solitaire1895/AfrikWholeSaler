import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_HEADER, PATH_HEADER } from "./routing";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./dictionary";

/**
 * The visitor's language: the URL's (set by the proxy: /en/… → "en"), else
 * the saved choice (cookie), else French.
 */
export async function getLocale(): Promise<Locale> {
  const fromUrl = (await headers()).get(LOCALE_HEADER);
  if (isLocale(fromUrl)) return fromUrl;
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** The current page's path without the language prefix ("/en/products" → "/products"). */
export async function getPathname(): Promise<string> {
  return (await headers()).get(PATH_HEADER) || "/";
}

/** Texts for the visitor's language — for Server Components and Server Actions. */
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}

/** Texts plus locale-aware formatters, for Server Components. */
export async function getI18n() {
  const { format, plural, formatDate, formatNumber, formatTime, timeAgo } = await import("./format");
  const locale = await getLocale();
  return {
    locale,
    t: getDictionary(locale),
    format,
    plural,
    formatDate: (iso: string | Date, options?: Intl.DateTimeFormatOptions) => formatDate(locale, iso, options),
    formatNumber: (n: number, options?: Intl.NumberFormatOptions) => formatNumber(locale, n, options),
    formatTime: (iso: string | Date) => formatTime(locale, iso),
    timeAgo: (iso: string) => timeAgo(locale, iso),
  };
}
