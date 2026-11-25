import type { Locale } from "@/i18n/config";

// ========================================================
// Product name/description in the visitor's language.
// `translations` (products.translations) holds per-language overrides;
// the plain name/description columns stay the default text.
// ========================================================

export type ProductTranslation = { name?: string; description?: string };
export type ProductTranslations = Partial<Record<Locale, ProductTranslation>>;

/** Keeps only non-empty, trimmed name/description entries (safe to store). */
export function cleanTranslations(value: unknown): ProductTranslations {
  const out: ProductTranslations = {};
  if (!value || typeof value !== "object") return out;
  for (const [lang, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!["fr", "en", "es", "zh"].includes(lang) || !entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim().slice(0, 200) : "";
    const description = typeof e.description === "string" ? e.description.trim().slice(0, 5000) : "";
    if (name || description) out[lang as Locale] = { ...(name && { name }), ...(description && { description }) };
  }
  return out;
}

/** Name and description for `locale`, falling back to the default text. */
export function localizedText(
  base: { name: string; description: string | null },
  translations: unknown,
  locale: Locale | undefined
): { name: string; description: string } {
  const tr = locale ? cleanTranslations(translations)[locale] : undefined;
  return { name: tr?.name || base.name, description: tr?.description || base.description || "" };
}
