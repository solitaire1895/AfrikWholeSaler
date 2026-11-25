import { createClient } from "@supabase/supabase-js";
import { cleanTranslations } from "@/lib/product-i18n";
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

type IndexRow = {
  id: string;
  name: string | null;
  slug: string;
  category: string;
  category_slug: string;
  sub_category: string | null;
  images: string[] | null;
  price_tiers: { price: number }[] | null;
  rating: number | null;
  translations?: unknown;
};

/** { en: "...", zh: "..." } for the languages that have a translated name. */
function translatedNames(value: unknown): { tn?: Record<string, string> } {
  const tn: Record<string, string> = {};
  for (const [lang, tr] of Object.entries(cleanTranslations(value))) if (tr?.name) tn[lang] = tr.name;
  return Object.keys(tn).length ? { tn } : {};
}

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

  // Without translations until supabase/translations_visual_search.sql has run.
  let columns = "id, name, slug, category, category_slug, sub_category, images, price_tiers, rating, translations";
  for (let from = 0; from < MAX_PRODUCTS; from += PAGE) {
    const page = () =>
      supabase
        .from("products")
        .select(columns)
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .range(from, from + PAGE - 1);
    let { data, error } = await page();
    if (error && from === 0 && columns.endsWith("translations")) {
      columns = columns.replace(", translations", "");
      ({ data, error } = await page());
    }

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    for (const row of (data ?? []) as unknown as IndexRow[]) {
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
        ...translatedNames(row.translations),
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
