import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory LRU cache (TTL: 5 minutes)
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCached(key: string, data: unknown) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
  // Clean up expired entries
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (v.expiry <= now) cache.delete(k);
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const category = searchParams.get("category") || null;
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : null;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
  const inStock = searchParams.get("inStock") === "true" ? true : null;
  const sort = searchParams.get("sort") || "relevance";

  // Build cache key
  const cacheKey = JSON.stringify({ query, page, pageSize, category, minPrice, maxPrice, inStock, sort });
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const supabase = await createClient();

  // Use the PostgreSQL search_products function via RPC (returns SETOF products)
  const { data, error } = await supabase.rpc("search_products", {
    p_query: query,
    p_page: page,
    p_page_size: pageSize,
    p_category: category,
    p_min_price: minPrice,
    p_max_price: maxPrice,
    p_in_stock: inStock,
    p_sort: sort,
  });

  // Get total count separately
  const { data: countData } = await supabase.rpc("search_products_count", {
    p_query: query,
    p_category: category,
    p_min_price: minPrice,
    p_max_price: maxPrice,
    p_in_stock: inStock,
  });

  if (error) {
    // Fallback: simple ILIKE search if full-text search fails
    let fallbackQuery = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    if (query) {
      fallbackQuery = fallbackQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    }
    if (category) {
      fallbackQuery = fallbackQuery.eq("category_slug", category);
    }
    if (minPrice !== null) {
      fallbackQuery = fallbackQuery.gte("moq", minPrice); // fallback approximation
    }
    if (inStock) {
      fallbackQuery = fallbackQuery.eq("stock_status", "In Stock");
    }

    const offset = (page - 1) * pageSize;
    const { data: fallbackData, count, error: fallbackError } = await fallbackQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (fallbackError) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    const result = {
      results: fallbackData || [],
      total: count || 0,
      page,
      pageSize,
      facets: {},
    };
    setCached(cacheKey, result);
    return NextResponse.json(result);
  }

  // Parse the RPC result
  const results = (data || []).map((row: Record<string, unknown>) => {
    const { total_count, search_rank, ...product } = row;
    return product;
  });

  const totalCount = (countData as number) || (data?.length || 0);

  // Compute facets (category counts)
  const categoryFacets: Record<string, number> = {};
  for (const row of data || []) {
    const cat = (row as { category?: string }).category;
    if (cat) {
      categoryFacets[cat] = (categoryFacets[cat] || 0) + 1;
    }
  }

  const result = {
    results,
    total: totalCount,
    page,
    pageSize,
    facets: { categories: categoryFacets },
  };

  setCached(cacheKey, result);
  return NextResponse.json(result);
}
