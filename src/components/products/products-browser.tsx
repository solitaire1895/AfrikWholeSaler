"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Package } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import type { Product, Category, SubCategory, StockStatus } from "@/types";
import { useI18n } from "@/i18n/client";
import { categoryName, subCategoryName } from "@/i18n/names";
import { FilterChip, FilterDrawer, FilterOption, FilterSection } from "@/components/filters/filter-ui";

const stockStatuses: StockStatus[] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
  "Pre-Order",
];

export function ProductsBrowser({
  products,
  categories,
  subCategories,
}: {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
}) {
  const searchParams = useSearchParams();
  const { t, format } = useI18n();
  const L = t.catalog.list;
  const initialCategory = searchParams.get("category") || "all";
  const initialFilter = searchParams.get("filter") || "all";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [showFilters, setShowFilters] = useState(false);

  const activeCount = [selectedCategory !== "all", selectedSubCategory !== "all", selectedStock !== "all"].filter(Boolean).length;
  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSelectedStock("all");
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }

    // Sub-category filter
    if (selectedSubCategory !== "all") {
      result = result.filter((p) => p.subCategorySlug === selectedSubCategory);
    }

    // Badge filter (featured, best-seller, new)
    if (initialFilter !== "all") {
      const filterMap: Record<string, string> = {
        featured: "Featured",
        "best-seller": "Best Seller",
        new: "New",
      };
      const badge = filterMap[initialFilter];
      if (badge) {
        result = result.filter((p) => p.badges.includes(badge as Product["badges"][number]));
      }
    }

    // Stock filter
    if (selectedStock !== "all") {
      result = result.filter((p) => p.stockStatus === selectedStock);
    }

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort(
          (a, b) =>
            (a.priceTiers[0]?.price ?? 0) - (b.priceTiers[0]?.price ?? 0)
        );
        break;
      case "price-high":
        result.sort(
          (a, b) =>
            (b.priceTiers[0]?.price ?? 0) - (a.priceTiers[0]?.price ?? 0)
        );
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "featured":
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [search, selectedCategory, selectedSubCategory, selectedStock, sortBy, initialFilter, products]);

  // Get sub-categories for the selected category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    return subCategories.filter((sc) => sc.categorySlug === selectedCategory);
  }, [selectedCategory, subCategories]);

  const activeCategory = categories.find((c) => c.slug === selectedCategory);
  const activeCategoryName =
    selectedCategory === "all" || !activeCategory
      ? L.allProducts
      : categoryName(t, activeCategory.slug, activeCategory.name);

  // Same filter contents for the desktop sidebar and the mobile slide-over.
  const filterPanel = (
    <>
      <FilterSection title={L.categories}>
        <FilterOption
          label={L.allCategories}
          active={selectedCategory === "all"}
          onClick={() => {
            setSelectedCategory("all");
            setSelectedSubCategory("all");
          }}
        />
        {categories.map((cat) => (
          <FilterOption
            key={cat.id}
            label={categoryName(t, cat.slug, cat.name)}
            count={cat.productCount}
            active={selectedCategory === cat.slug}
            onClick={() => {
              setSelectedCategory(cat.slug);
              setSelectedSubCategory("all");
            }}
          />
        ))}
      </FilterSection>

      {availableSubCategories.length > 0 && (
        <FilterSection title={L.subCategories}>
          <FilterOption label={L.allSubCategories} active={selectedSubCategory === "all"} onClick={() => setSelectedSubCategory("all")} />
          {availableSubCategories.map((subCat) => (
            <FilterOption
              key={subCat.id}
              label={subCategoryName(t, subCat.slug, subCat.name)}
              count={subCat.productCount}
              active={selectedSubCategory === subCat.slug}
              onClick={() => setSelectedSubCategory(subCat.slug)}
            />
          ))}
        </FilterSection>
      )}

      <FilterSection title={L.availability}>
        <FilterOption label={L.all} active={selectedStock === "all"} onClick={() => setSelectedStock("all")} />
        {stockStatuses.map((status) => (
          <FilterOption
            key={status}
            label={t.catalog.stock[status]}
            active={selectedStock === status}
            onClick={() => setSelectedStock(status)}
          />
        ))}
      </FilterSection>
    </>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Page Header */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
              <Package className="h-4 w-4" />
              <span>{L.home}</span>
              <span>/</span>
              <span className="text-text-primary font-medium">{L.products}</span>
            </div>
            <h1 className="text-3xl font-bold text-navy tracking-tight">
              {activeCategoryName}
            </h1>
            <p className="mt-2 text-text-secondary">
              {L.lead}{" "}
              {filteredProducts.length === 1 ? L.foundOne : format(L.found, { n: filteredProducts.length })}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Search, sort and (below desktop) the filters button */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                placeholder={L.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-10 text-sm text-text-primary placeholder:text-text-disabled transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label={L.clear}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-disabled hover:bg-surface-secondary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 flex-1 cursor-pointer rounded-full border border-border bg-surface px-5 text-sm text-text-primary focus:border-brand focus:outline-none sm:flex-none"
              >
                <option value="featured">{L.sortFeatured}</option>
                <option value="price-low">{L.sortPriceLow}</option>
                <option value="price-high">{L.sortPriceHigh}</option>
                <option value="rating">{L.sortRating}</option>
              </select>
              <button
                onClick={() => setShowFilters(true)}
                className="relative flex h-12 items-center gap-2 rounded-full border border-navy bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy-light lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {L.filters}
                {activeCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filters */}
          {activeCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">{L.activeFilters}</span>
              {selectedCategory !== "all" && (
                <FilterChip
                  label={activeCategoryName}
                  removeLabel={L.clear}
                  onRemove={() => {
                    setSelectedCategory("all");
                    setSelectedSubCategory("all");
                  }}
                />
              )}
              {selectedSubCategory !== "all" && (
                <FilterChip
                  label={(() => {
                    const sc = availableSubCategories.find((x) => x.slug === selectedSubCategory);
                    return sc ? subCategoryName(t, sc.slug, sc.name) : selectedSubCategory;
                  })()}
                  removeLabel={L.clear}
                  onRemove={() => setSelectedSubCategory("all")}
                />
              )}
              {selectedStock !== "all" && (
                <FilterChip
                  label={t.catalog.stock[selectedStock as StockStatus] ?? selectedStock}
                  removeLabel={L.clear}
                  onRemove={() => setSelectedStock("all")}
                />
              )}
              <button onClick={clearFilters} className="ml-1 text-xs font-medium text-brand underline-offset-2 hover:underline">
                {L.clearFilters}
              </button>
            </div>
          )}

          <div className="flex items-start gap-8">
            {/* Desktop: sidebar that stays in view while scrolling */}
            <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-64 shrink-0 overflow-y-auto rounded-[20px] border border-border bg-surface px-5 py-1 lg:block">
              {filterPanel}
            </aside>

            {/* Mobile & tablet: slide-over panel — the grid never moves */}
            <FilterDrawer
              open={showFilters}
              onClose={() => setShowFilters(false)}
              title={L.filters}
              closeLabel={L.closeFilters}
              footer={
                <div className="flex gap-3">
                  <button
                    onClick={clearFilters}
                    disabled={activeCount === 0}
                    className="h-12 rounded-full border border-border px-5 text-sm font-medium text-navy transition-colors hover:bg-surface-secondary disabled:opacity-40"
                  >
                    {L.clear}
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="h-12 flex-1 rounded-full bg-brand text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-colors hover:bg-brand-hover"
                  >
                    {filteredProducts.length === 1 ? L.showResultsOne : format(L.showResults, { n: filteredProducts.length })}
                  </button>
                </div>
              }
            >
              {filterPanel}
            </FilterDrawer>

            {/* Product Grid */}
            <div className="flex-1">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mb-4">
                    <Search className="h-8 w-8 text-text-disabled" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy mb-1">
                    {L.emptyTitle}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {L.emptyText}
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("all");
                      setSelectedSubCategory("all");
                      setSelectedStock("all");
                    }}
                    className="mt-4 text-sm font-medium text-brand hover:text-brand-hover"
                  >
                    {L.clearFilters}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}