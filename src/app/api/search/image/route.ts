import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectImage } from "@/lib/file-signature";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { embedImage, getEmbedder, toVector } from "@/lib/visual-search";
import { getLocale } from "@/i18n/server";
import { localizedText } from "@/lib/product-i18n";

// POST /api/search/image (multipart "image") → products that look like the photo.
// GET  /api/search/image → loads the model in the background (sent when the
// camera button is shown, so the first real search is fast).

const MAX_BYTES = 6 * 1024 * 1024;
/** CLIP photo-to-photo similarity below this is mostly "same colours/background". */
const MIN_SIMILARITY = 0.55;

export async function GET() {
  after(() => getEmbedder().catch(() => {}));
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof Blob) || file.size === 0) return Response.json({ error: "no_image" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  if (!(await detectImage(file))) return Response.json({ error: "not_image" }, { status: 415 });

  // Embedding and the rate-limit check run side by side.
  const ip = await clientIp();
  const [allowed, embedding] = await Promise.all([rateLimit(`image-search:${ip}`, 40, 3600), embedImage(file)]);
  if (!allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

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
