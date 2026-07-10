"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Package, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { products, categories, subCategories } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const category = categories.find((c) => c.slug === slug);
  const categorySubCategories = subCategories.filter((sc) => sc.categorySlug === slug);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const categoryProducts = products.filter((p) => {
    if (p.categorySlug !== slug) return false;
    if (selectedSubCategory !== "all" && p.subCategorySlug !== selectedSubCategory) return false;
    return true;
  });

  if (!category) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy mb-2">
              Category not found
            </h1>
            <p className="text-text-secondary mb-4">
              The category you're looking for doesn't exist.
            </p>
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
            >
              Browse all products
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Link href="/" className="hover:text-brand">
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/products" className="hover:text-brand">
                Products
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-text-primary font-medium">
                {category.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Category Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="relative h-48 sm:h-64">
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-navy/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-white/10 backdrop-blur-sm">
                    <Package className="h-6 w-6 text-gold" />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {category.name}
                </h1>
                <p className="mt-2 text-white/70 text-sm sm:text-base">
                  {category.productCount} products available · Sourced from
                  China, delivered across Africa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Categories Filter Bar */}
        {categorySubCategories.length > 0 && (
          <div className="border-b border-border bg-surface">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-navy mr-2">Sub-Categories:</span>
                <button
                  onClick={() => setSelectedSubCategory("all")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedSubCategory === "all"
                      ? "bg-brand text-white"
                      : "bg-surface-secondary text-text-secondary hover:bg-border"
                  )}
                >
                  All
                </button>
                {categorySubCategories.map((subCat) => (
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
                    {subCat.name}
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
                  Showing {categoryProducts.length}{" "}
                  {categoryProducts.length === 1 ? "product" : "products"}
                </p>
                <Link
                  href="/products"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
                >
                  View all products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                No products in this category yet
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                We're sourcing new products for this category. Check back soon or
                request a custom quote.
              </p>
              <Link
                href="/quote"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
              >
                Request a Quote
              </Link>
            </div>
          )}

          {/* Other Categories */}
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-lg font-bold text-navy mb-4">
              Browse other categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {categories
                .filter((c) => c.slug !== slug)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-brand/30 hover:shadow-[var(--shadow-card)] transition-all"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-[var(--radius-sm)]">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-text-primary text-center group-hover:text-brand transition-colors">
                      {cat.name}
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