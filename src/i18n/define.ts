import type { Locale } from "./config";

/** Same keys as the English source, any string values (for the other languages). */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

/**
 * Declares one area's texts in every language. English is the source of
 * truth for the keys: if French, Spanish or Chinese misses (or adds) a key,
 * TypeScript fails the build — so no text is ever left untranslated.
 */
export function defineMessages<const T extends Record<string, unknown>>(
  messages: { en: T } & { [L in Exclude<Locale, "en">]: Shape<T> }
): Record<Locale, Shape<T>> {
  return messages as Record<Locale, Shape<T>>;
}
