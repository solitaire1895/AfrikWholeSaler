"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionary";
import * as fmt from "./format";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  format: typeof fmt.format;
  plural: typeof fmt.plural;
  formatNumber: (n: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (iso: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (iso: string | Date) => string;
  timeAgo: (iso: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Receives only the active language's texts from the root layout. */
export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: dictionary,
      format: fmt.format,
      plural: fmt.plural,
      formatNumber: (n, options) => fmt.formatNumber(locale, n, options),
      formatDate: (iso, options) => fmt.formatDate(locale, iso, options),
      formatTime: (iso) => fmt.formatTime(locale, iso),
      timeAgo: (iso) => fmt.timeAgo(locale, iso),
    }),
    [locale, dictionary]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Shortcut: const t = useT(); t.nav.products */
export function useT(): Dictionary {
  return useI18n().t;
}
