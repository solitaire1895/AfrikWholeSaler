"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Package, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";

interface SearchResultsProps {
  query: string;
  category: string;
  sort: string;
  page: number;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  categories: Category[];
}

interface SearchResult {
  results: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: { categories: Record<string, number> };
}

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

export function SearchResults({
  query: initialQuery,
  category: initialCategory,
  sort: initialSort,
  page: initialPage,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  inStock: initialInStock,
  categories,
}: SearchResultsProps) {
  const router = useRouter();
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || "");
  const [inStockOnly, setInStockOnly] = useState(initialInStock);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (initialQuery) params.set("q", initialQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSort) params.set("sort", selectedSort);
      params.set("page", String(initialPage));
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStockOnly) params.set("inStock", "true");

      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [initialQuery, selectedCategory, selectedSort, initialPage, minPrice, maxPrice, inStockOnly]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function updateUrl(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`/search?${params.toString()}`);
  }

  function applyFilters() {
    if (selectedCategory !== initialCategory) updateUrl("category", selectedCategory);
    if (selectedSort !== initialSort) updateUrl("sort", selectedSort);
    if (minPrice) updateUrl("minPrice", minPrice);
    if (maxPrice) updateUrl("maxPrice", maxPrice);
    if (inStockOnly) updateUrl("inStock", "true");
    setShowFilters(false);
    // Force re-fetch
    fetchResults();
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(newPage));
    router.push(`/search?${params.toString()}`);
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const products = data?.results || [];

  // Map raw DB rows to Product type
  const mappedProducts: Product[] = (products as unknown as Record<string, unknown>[]).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    description: p.description as string,
    category: p.category as string,
    categorySlug: p.category_slug as string,
    subCategory: (p.sub_category as string) || null,
    subCategorySlug: (p.sub_category_slug as string) || null,
    images: (p.images as string[]) || [],
    videoUrl: (p.video_url as string) || null,
    originCountry: p.origin_country as string,
    moq: p.moq as number,
    priceTiers: (p.price_tiers as Product["priceTiers"]) || [],
    stockStatus: p.stock_status as Product["stockStatus"],
    badges: (p.badges as Product["badges"]) || [],
    specs: (p.specs as Product["specs"]) || [],
    shippingEstimate: p.shipping_estimate ? parseFloat(p.shipping_estimate as string) : 0,
    importTaxEstimate: p.import_tax_rate ? Number(p.import_tax_rate) : 0,
    deliveryEstimate: p.delivery_days_min && p.delivery_days_max
      ? `${p.delivery_days_min}-${p.delivery_days_max} days`
      : "15-30 days",
    featured: p.featured as boolean,
    rating: Number(p.rating),
    reviewCount: p.review_count as number,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Search header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          {initialQuery ? `Results for "${initialQuery}"` : "All Products"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {loading ? "Searching..." : `${data?.total || 0} products found`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>

        <select
          value={selectedSort}
          onChange={(e) => {
            setSelectedSort(e.target.value);
            updateUrl("sort", e.target.value);
          }}
          className="h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-64 shrink-0 space-y-6">
            {/* Category filter */}
            <div>
              <h3 className="text-sm font-semibold text-navy mb-2">Category</h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    updateUrl("category", "");
                  }}
                  className={cn(
                    "block w-full text-left px-2 py-1 rounded text-sm transition-colors",
                    !selectedCategory ? "bg-brand-light text-brand font-medium" : "text-text-secondary hover:bg-surface-secondary"
                  )}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      updateUrl("category", cat.slug);
                    }}
                    className={cn(
                      "block w-full text-left px-2 py-1 rounded text-sm transition-colors",
                      selectedCategory === cat.slug ? "bg-brand-light text-brand font-medium" : "text-text-secondary hover:bg-surface-secondary"
                    )}
                  >
                    {cat.name}
                    {data?.facets?.categories?.[cat.name] && (
                      <span className="ml-1 text-xs text-text-disabled">({data.facets.categories[cat.name]})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price filter */}
            <div>
              <h3 className="text-sm font-semibold text-navy mb-2">Price Range (USD)</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm focus:border-brand focus:outline-none"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <button
                onClick={applyFilters}
                className="mt-2 w-full h-9 rounded-[var(--radius-sm)] bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Stock filter */}
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    updateUrl("inStock", e.target.checked ? "true" : "");
                  }}
                  className="h-4 w-4 rounded border-border"
                />
                In Stock Only
              </label>
            </div>
          </aside>
        )}

        {/* Results grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : mappedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mappedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(initialPage - 1)}
                    disabled={initialPage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-secondary hover:bg-surface-secondary disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
                          pageNum === initialPage
                            ? "bg-brand text-white"
                            : "border border-border text-text-secondary hover:bg-surface-secondary"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(initialPage + 1)}
                    disabled={initialPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-secondary hover:bg-surface-secondary disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mb-4">
                <Package className="h-8 w-8 text-text-disabled" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-1">No products found</h3>
              <p className="text-text-secondary text-sm mb-4">
                {initialQuery
                  ? `We couldn't find any products matching "${initialQuery}". Try different keywords or filters.`
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
