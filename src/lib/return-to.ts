// Remembers the product a visitor reached through an affiliate link, so that
// after signing up (or confirming their email, or logging in) they land back
// on it instead of the generic products page. Browser-only, 30 days.

const KEY = "aw_return_to";
const MAX_AGE_MS = 30 * 86_400_000;

/** Same-site paths only: "/products/x" is fine; "https://…", "//…" and "/\…" are not. */
export function isSafePath(path: string | null | undefined): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export function rememberReturnTo(path: string) {
  if (!isSafePath(path)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, t: Date.now() }));
  } catch {
    // Storage blocked (private mode): the visitor just lands on /products.
  }
}

/** The remembered path (still valid), or the fallback. */
export function returnTo(fallback = "/products"): string {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { path?: string; t?: number } | null;
    if (saved && isSafePath(saved.path) && Date.now() - (saved.t ?? 0) < MAX_AGE_MS) return saved.path;
  } catch {
    // ignore
  }
  return fallback;
}

/** Used once the visitor is signed in and on their way back. */
export function clearReturnTo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
