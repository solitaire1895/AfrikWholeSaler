import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Autocomplete cache (TTL: 2 minutes, shorter for fresher suggestions)
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 2 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("q") || "";

  if (!prefix || prefix.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  // Check cache
  const cacheKey = `autocomplete:${prefix.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const supabase = await createClient();

  // Try the PostgreSQL autocomplete function first
  const { data, error } = await supabase.rpc("search_autocomplete", {
    p_prefix: prefix,
    p_limit: 8,
  });

  if (error || !data) {
    // Fallback: simple ILIKE prefix search
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("products")
      .select("id, name, slug, category, category_slug, images, price_tiers")
      .eq("is_active", true)
      .ilike("name", `${prefix}%`)
      .order("rating", { ascending: false })
      .limit(8);

    if (fallbackError) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = {
      suggestions: (fallbackData || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        categorySlug: p.category_slug,
        image: p.images?.[0] || null,
        price: p.price_tiers?.[0]?.price || 0,
      })),
    };

    cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json(result);
  }

  const result = {
    suggestions: (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      categorySlug: row.category_slug,
      image: (row.images as string[])?.[0] || null,
      price: (row.price_tiers as Array<{ price: number }>)?.[0]?.price || 0,
      similarity: row.similarity,
    })),
  };

  cache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL });
  return NextResponse.json(result);
}
