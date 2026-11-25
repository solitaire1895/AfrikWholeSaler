import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseEmbedding, toVector } from "@/lib/visual-search";
import { getLocale } from "@/i18n/server";
import { localizedText } from "@/lib/product-i18n";

// POST /api/search/image { embedding: number[512] } → products that look like
// the photo. The browser computes the embedding (visual-search-client.ts);
// this server only runs the database lookup.

/** Similarity below this is mostly "same colours/background". */
const MIN_SIMILARITY = 0.5;

/** Old clients warmed up a server model here; nothing to do any more. */
export async function GET() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { embedding?: unknown } | null;
  const embedding = parseEmbedding(body?.embedding);
  if (!embedding) return Response.json({ error: "not_image" }, { status: 400 });
  if (!(await rateLimit(`image-search:${await clientIp()}`, 60, 3600))) return Response.json({ error: "rate_limited" }, { status: 429 });

  const supabase = await createClient();
  const { data: matches, error } = await supabase.rpc("match_products_by_image", {
    query_embedding: toVector(embedding),
    match_count: 24,
    min_similarity: MIN_SIMILARITY,
  });
  if (error) return Response.json({ error: "unavailable" }, { status: 503 });

  const ranked = (matches ?? []) as { id: string; similarity: number }[];
  if (ranked.length === 0) return Response.json({ results: [] });

  const { data: rows } = await supabase
    .from("products")
    .select("id, slug, name, description, translations, images, image_url, price_tiers, moq, category, category_slug")
    .in("id", ranked.map((m) => m.id))
    .eq("is_active", true);

  const locale = await getLocale();
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const results = ranked.flatMap((m) => {
    const r = byId.get(m.id);
    if (!r) return [];
    const prices = ((r.price_tiers ?? []) as { price: number }[]).map((t) => Number(t.price)).filter((p) => p > 0);
    const images = (r.images as string[] | null)?.length ? (r.images as string[]) : r.image_url ? [r.image_url as string] : [];
    return [
      {
        id: r.id,
        slug: r.slug,
        name: localizedText(r, r.translations, locale).name,
        image: images[0] ?? null,
        price: prices.length ? Math.min(...prices) : 0,
        moq: r.moq,
        category: r.category,
        categorySlug: r.category_slug,
        similarity: Math.round(m.similarity * 1000) / 1000,
      },
    ];
  });

  return Response.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
}
