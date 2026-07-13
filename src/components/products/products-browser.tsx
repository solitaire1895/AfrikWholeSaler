"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Package } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { Product, Category, SubCategory, StockStatus } from "@/types";

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
  const initialCategory = searchParams.get("category") || "all";
  const initialFilter = searchParams.get("filter") || "all";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [showFilters, setShowFilters] = useState(false);

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

  const activeCategoryName =
    selectedCategory === "all"
      ? "All Products"
      : categories.find((c) => c.slug === selectedCategory)?.name ||
        "All Products";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Page Header */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
              <Package className="h-4 w-4" />
              <span>Home</span>
              <span>/</span>
              <span className="text-text-primary font-medium">Products</span>
            </div>
            <h1 className="text-3xl font-bold text-navy tracking-tight">
              {activeCategoryName}
            </h1>
            <p className="mt-2 text-text-secondary">
              Browse our catalog of quality-sourced products from China.{" "}
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "product" : "products"} found.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm text-text-primary focus:border-brand focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex h-11 items-center gap-2 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside
              className={cn(
                "w-64 shrink-0 space-y-6",
                showFilters ? "block" : "hidden lg:block"
              )}
            >
              {/* Categories */}
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">
                  Categories
                </h3>
                <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedSubCategory("all");
                      }}
                      className={cn(
                        "block w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
                        selectedCategory === "all"
                          ? "bg-brand-light text-brand font-medium"
                          : "text-text-secondary hover:bg-surface-secondary"
                      )}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          setSelectedSubCategory("all");
                        }}
                        className={cn(
                          "block w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
                          selectedCategory === cat.slug
                            ? "bg-brand-light text-brand font-medium"
                            : "text-text-secondary hover:bg-surface-secondary"
                        )}
                      >
                        {cat.name}
                        <span className="text-text-disabled ml-1">
                          ({cat.productCount})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-Categories (only shown when a category is selected) */}
                {availableSubCategories.length > 0 && (
                  <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold text-navy mb-3">
                      Sub-Categories
                    </h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedSubCategory("all")}
                        className={cn(
                          "block w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
                          selectedSubCategory === "all"
                            ? "bg-brand-light text-brand font-medium"
                            : "text-text-secondary hover:bg-surface-secondary"
                        )}
                      >
                        All Sub-Categories
                      </button>
                      {availableSubCategories.map((subCat) => (
                        <button
                          key={subCat.id}
                          onClick={() => setSelectedSubCategory(subCat.slug)}
                          className={cn(
                            "block w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
                            selectedSubCategory === subCat.slug
                              ? "bg-brand-light text-brand font-medium"
                              : "text-text-secondary hover:bg-surface-secondary"
                          )}
                        >
                          {subCat.name}
                          <span className="text-text-disabled ml-1">
                            ({subCat.productCount})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Stock Status */}
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-navy mb-3">
                  Availability
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedStock("all")}
                    className={cn(
                      "block w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
                      selectedStock === "all"
                        ? "bg-brand-light text-brand font-medium"
                        : "text-text-secondary hover:bg-surface-secondary"
                    )}
                  >
                    All
                  </button>
                  {stockStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStock(status)}
                      className={cn(
                        "block w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors",
                        selectedStock === status
                          ? "bg-brand-light text-brand font-medium"
                          : "text-text-secondary hover:bg-surface-secondary"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                    No products found
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Try adjusting your search or filters to find what you're
                    looking for.
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
                    Clear all filters
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