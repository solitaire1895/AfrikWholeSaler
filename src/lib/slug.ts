// URL-safe slugs for products (safe for client and server).
// "Joker 1 “Lapis Blue” (EU 36–40)" → "joker-1-lapis-blue-eu-36-40"

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // é → e
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-") // everything else (quotes, #, :, (), commas, spaces, Chinese…) → dash
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** A slug that is valid for a URL: lowercase letters, digits and single dashes. */
export function isCleanSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}
