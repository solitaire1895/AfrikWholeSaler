import { createClient } from "@supabase/supabase-js";
import type { SearchIndex, SearchIndexProduct } from "@/lib/search-engine";

// Compact catalog index for instant, in-browser search suggestions.
// Served statically and regenerated at most every 5 minutes, so typing
// never waits on the database.
export const dynamic = "force-static";
export const revalidate = 300;

// Above this size the index is marked incomplete and the search bar falls
// back to the server autocomplete for the remainder.
const MAX_PRODUCTS = 5000;
const PAGE = 1000;

export async function GET() {
  // Anonymous client without cookies: the index is public catalog data and
  // must not vary per user, or it could not be cached.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const products: SearchIndexProduct[] = [];
  let complete = true;

  for (let from = 0; from < MAX_PRODUCTS; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, category, category_slug, sub_category, images, price_tiers, rating")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    for (const row of data ?? []) {
      products.push({
        id: row.id,
        n: (row.name ?? "").trim(),
        s: row.slug,
        c: row.category,
        cs: row.category_slug,
        sc: row.sub_category,
        img: row.images?.[0] ?? null,
        p: Number(row.price_tiers?.[0]?.price ?? 0),
        r: Number(row.rating ?? 0),
      });
    }

    if (!data || data.length < PAGE) break;
    if (from + PAGE >= MAX_PRODUCTS) complete = false;
  }

  const body: SearchIndex = {
    products,
    complete,
    generatedAt: new Date().toISOString(),
  };

  return Response.json(body, {
    headers: {
      // Let browsers/CDNs reuse it briefly and refresh in the background.
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
