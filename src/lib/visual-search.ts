import "server-only";

// ========================================================
// Camera search: CLIP (ViT-B/32) turns a photo into a 512-number vector;
// products whose photos have the closest vectors look the most alike.
// Runs on this server with ONNX Runtime (no external API, no per-call cost):
// ~50-150 ms per photo once the model is loaded. Vectors live in Supabase
// (pgvector, HNSW index), so matching the whole catalog takes a few ms.
// ========================================================

const MODEL_ID = process.env.VISUAL_SEARCH_MODEL || "Xenova/clip-vit-base-patch32";

type Embedder = (image: Blob) => Promise<number[]>;
let loading: Promise<Embedder> | null = null;

/** Loads the model once per server process; later calls reuse it. */
export function getEmbedder(): Promise<Embedder> {
  loading ??= (async () => {
    const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } = await import("@huggingface/transformers");
    if (process.env.VISUAL_SEARCH_CACHE_DIR) env.cacheDir = process.env.VISUAL_SEARCH_CACHE_DIR;
    const [processor, model] = await Promise.all([
      AutoProcessor.from_pretrained(MODEL_ID),
      CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: "q8" }),
    ]);
    return async (image: Blob) => {
      const raw = await RawImage.fromBlob(image);
      const inputs = await processor(raw);
      const { image_embeds } = await model(inputs);
      return normalize(Array.from(image_embeds.data as Float32Array));
    };
  })().catch((err) => {
    loading = null; // let the next request retry
    throw err;
  });
  return loading;
}

function normalize(v: number[]) {
  const norm = Math.hypot(...v) || 1;
  return v.map((x) => Number((x / norm).toFixed(6)));
}

export async function embedImage(image: Blob) {
  return (await getEmbedder())(image);
}

/** pgvector text form: "[0.1,0.2,...]". */
export const toVector = (v: number[]) => `[${v.join(",")}]`;

/** Downloads a product photo and embeds it (null when the photo can't be read). */
export async function embedImageUrl(url: string): Promise<number[] | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return await embedImage(await res.blob());
  } catch {
    return null;
  }
}

// ---- Indexing product photos ------------------------------------------

type ProductPhotoRow = { id: string; images: string[] | null; image_url: string | null };
const mainPhoto = (p: ProductPhotoRow) => p.images?.[0] || p.image_url || null;

/**
 * Embeds the main photo of the given products (or, without ids, of up to
 * `limit` active products whose photo has no embedding yet or changed).
 * Returns how many were indexed and how many still need it.
 */
export async function indexProductPhotos({ ids, limit = 20 }: { ids?: string[]; limit?: number } = {}) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const db = createAdminClient();

  // PostgREST returns at most 1000 rows per request: page through.
  const all = async <T,>(table: string, columns: string, filter?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const out: T[] = [];
    for (let from = 0; from < 50_000; from += 1000) {
      let q = db.from(table).select(columns).order(table === "products" ? "id" : "product_id").range(from, from + 999);
      if (filter) q = filter(q);
      const { data } = await q;
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < 1000) break;
    }
    return out;
  };
  const [products, done] = await Promise.all([
    all<ProductPhotoRow>("products", "id, images, image_url", (q) => {
      q = q.eq("is_active", true);
      return ids?.length ? q.in("id", ids) : q;
    }),
    all<{ product_id: string; image_url: string }>("product_image_embeddings", "product_id, image_url"),
  ]);
  const indexed = new Map(done.map((d) => [d.product_id, d.image_url]));
  const todo = products.filter((p) => {
    const photo = mainPhoto(p);
    return photo && indexed.get(p.id) !== photo;
  });

  let count = 0;
  for (const p of todo.slice(0, limit)) {
    const photo = mainPhoto(p)!;
    const vector = await embedImageUrl(photo);
    if (!vector) continue;
    const { error } = await db
      .from("product_image_embeddings")
      .upsert({ product_id: p.id, embedding: toVector(vector), image_url: photo, updated_at: new Date().toISOString() });
    if (!error) count++;
  }
  return { indexed: count, remaining: Math.max(0, todo.length - limit) };
}
