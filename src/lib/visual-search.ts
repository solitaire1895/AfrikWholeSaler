import "server-only";

// ========================================================
// Camera search, server side: no model here (shared hosting can't run one).
// Browsers send 512-number vectors (see visual-search-client.ts); this file
// validates them and lists the product photos still to index.
// ========================================================

export const DIMENSIONS = 512;

/** A well-formed embedding from the browser, or null. */
export function parseEmbedding(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== DIMENSIONS) return null;
  const v = value.map(Number);
  return v.every((x) => Number.isFinite(x) && Math.abs(x) <= 1) ? v : null;
}

/** pgvector text form: "[0.1,0.2,...]". */
export const toVector = (v: number[]) => `[${v.join(",")}]`;

type ProductPhotoRow = { id: string; images: string[] | null; image_url: string | null };
const mainPhoto = (p: ProductPhotoRow) => p.images?.[0] || p.image_url || null;

/** Stored key: "<model>|<photo url>", so a photo change or a new model both re-index. */
export const indexKey = (model: string, url: string) => `${model}|${url}`;

/** Active products whose main photo has no embedding for `model` yet. */
export async function pendingProductPhotos(model: string, limit = 50) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const db = createAdminClient();

  // PostgREST returns at most 1000 rows per request: page through.
  async function all<T>(table: string, columns: string, active: boolean) {
    const out: T[] = [];
    for (let from = 0; from < 50_000; from += 1000) {
      let q = db.from(table).select(columns).order(table === "products" ? "id" : "product_id").range(from, from + 999);
      if (active) q = q.eq("is_active", true);
      const { data } = await q;
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < 1000) break;
    }
    return out;
  }
  const [products, done] = await Promise.all([
    all<ProductPhotoRow>("products", "id, images, image_url", true),
    all<{ product_id: string; image_url: string }>("product_image_embeddings", "product_id, image_url", false),
  ]);
  const indexed = new Map(done.map((d) => [d.product_id, d.image_url]));
  const todo = products.flatMap((p) => {
    const url = mainPhoto(p);
    return url && indexed.get(p.id) !== indexKey(model, url) ? [{ id: p.id, url }] : [];
  });
  return { items: todo.slice(0, limit), remaining: todo.length };
}
