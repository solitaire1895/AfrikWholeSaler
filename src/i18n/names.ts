import type { Dictionary } from "./dictionary";

// Safe for client components: works on the already-loaded dictionary.

/** Translated category name for a slug, falling back to the stored name. */
export function categoryName(t: Dictionary, slug: string | null | undefined, fallback: string): string {
  return (slug && (t.taxonomy.categories as Record<string, string>)[slug]) || fallback;
}

/** Translated sub-category name for a slug, falling back to the stored name. */
export function subCategoryName(t: Dictionary, slug: string | null | undefined, fallback: string): string {
  return (slug && (t.taxonomy.subCategories as Record<string, string>)[slug]) || fallback;
}

/** "15-30 days" → "15-30 jours" (delivery estimates are stored with an English unit). */
export function deliveryText(t: Dictionary, estimate: string): string {
  return estimate.replace(/\bdays?\b/i, t.catalog.days);
}

/** Country names we show in the UI (product origin, testimonials). */
export function countryName(t: Dictionary, country: string): string {
  return (t.content.countries as Record<string, string>)[country] ?? country;
}
