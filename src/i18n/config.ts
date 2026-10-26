// ========================================================
// Languages — French is the default.
// The chosen language lives in a cookie, so URLs stay the same.
// ========================================================

export const locales = ["fr", "en", "es", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Names shown in the language switcher (each in its own language). */
export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  zh: "中文",
};

export const localeShort: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  es: "ES",
  zh: "中文",
};

/** BCP 47 tags for Intl number/date formatting and <html lang>. */
export const intlLocale: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
