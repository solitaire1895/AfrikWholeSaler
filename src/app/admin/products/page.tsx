"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { products, categories } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.categorySlug !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your product catalog, pricing, and inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors">
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden lg:table-cell">Rating</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                        <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">{product.name}</p>
                        <p className="text-xs text-text-secondary">MOQ: {product.moq}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-text-secondary">{product.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-navy">{formatPrice(product.priceTiers[0]?.price ?? 0)}</p>
                    <p className="text-xs text-text-secondary">to {formatPrice(product.priceTiers[product.priceTiers.length - 1]?.price ?? 0)}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      product.stockStatus === "In Stock" ? "bg-success/10 text-success" :
                      product.stockStatus === "Low Stock" ? "bg-warning/10 text-warning" :
                      "bg-surface-secondary text-text-secondary"
                    )}>
                      {product.stockStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      <span className="text-sm font-medium text-text-primary">{product.rating}</span>
                      <span className="text-xs text-text-secondary">({product.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-brand">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-error">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}