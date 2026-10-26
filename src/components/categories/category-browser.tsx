"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { Product, Category, SubCategory } from "@/types";
import { useI18n } from "@/i18n/client";
import { categoryName, subCategoryName } from "@/i18n/names";

export function CategoryBrowser({
  category,
  subCategories,
  products,
  allCategories,
}: {
  category: Category;
  subCategories: SubCategory[];
  products: Product[];
  allCategories: Category[];
}) {
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const { t, format } = useI18n();
  const C = t.catalog.category;
  const name = categoryName(t, category.slug, category.name);

  const categoryProducts = products.filter((p) => {
    if (p.categorySlug !== category.slug) return false;
    if (selectedSubCategory !== "all" && p.subCategorySlug !== selectedSubCategory) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Link href="/" className="hover:text-brand">
                {t.catalog.list.home}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/products" className="hover:text-brand">
                {t.catalog.list.products}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-text-primary font-medium">
                {name}
              </span>
            </nav>
          </div>
        </div>

        {/* Category Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="relative h-48 sm:h-64">
            {category.image ? (
              <Image
                src={category.image}
                alt={name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 gradient-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-navy/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10 backdrop-blur-sm">
                    <Package className="h-6 w-6 text-gold" />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {name}
                </h1>
                <p className="mt-2 text-white/70 text-sm sm:text-base">
                  {format(C.available, { n: category.productCount })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Categories Filter Bar */}
        {subCategories.length > 0 && (
          <div className="border-b border-border bg-surface">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-navy mr-2">{C.subCategories}</span>
                <button
                  onClick={() => setSelectedSubCategory("all")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedSubCategory === "all"
                      ? "bg-brand text-white"
                      : "bg-surface-secondary text-text-secondary hover:bg-border"
                  )}
                >
                  {C.all}
                </button>
                {subCategories.map((subCat) => (
                  <button
                    key={subCat.id}
                    onClick={() => setSelectedSubCategory(subCat.slug)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      selectedSubCategory === subCat.slug
                        ? "bg-brand text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-border"
                    )}
                  >
                    {subCategoryName(t, subCat.slug, subCat.name)}
                    <span className="ml-1 opacity-60">({subCat.productCount})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {categoryProducts.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-text-secondary">
                  {categoryProducts.length === 1 ? C.showingOne : format(C.showing, { n: categoryProducts.length })}
                </p>
                <Link
                  href="/products"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
                >
                  {C.viewAll}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary mb-4">
                <Package className="h-8 w-8 text-text-disabled" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-1">
                {C.emptyTitle}
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                {C.emptyText}
              </p>
              <Link
                href="/quote"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
              >
                {C.requestQuote}
              </Link>
            </div>
          )}

          {/* Other Categories */}
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-lg font-bold text-navy mb-4">
              {C.browseOther}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {allCategories
                .filter((c) => c.slug !== category.slug)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-[var(--radius-sm)]">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={categoryName(t, cat.slug, cat.name)}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-surface-secondary">
                          <Package className="h-6 w-6 text-text-disabled" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-text-primary text-center group-hover:text-brand transition-colors">
                      {categoryName(t, cat.slug, cat.name)}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function CategoryNotFound() {
  const { t } = useI18n();
  const C = t.catalog.category;
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">
            {C.notFoundTitle}
          </h1>
          <p className="text-text-secondary mb-4">
            {C.notFoundText}
          </p>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            {C.browseAll}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}