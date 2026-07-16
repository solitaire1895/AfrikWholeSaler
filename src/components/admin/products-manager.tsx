"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { createProduct, updateProduct, deleteProduct, uploadProductImages } from "@/app/actions/crud";
import type { Product, Category } from "@/types";

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
}

export function ProductsManager({ products: initialProducts, categories }: ProductsManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Image management state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.categorySlug !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  function openAddForm() {
    setEditingProduct(null);
    setImageUrls([]);
    setManualUrl("");
    setShowForm(true);
    setError(null);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setImageUrls(product.images);
    setManualUrl("");
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setError(null);
    setImageUrls([]);
    setManualUrl("");
  }

  function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product? It will be deactivated.")) return;
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        setError(result.error || "Failed to delete product");
      }
    });
  }

  // --- Image upload handlers ---

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const fileArray = Array.from(files);
      const result = await uploadProductImages(fileArray);

      if (result.success && result.data?.urls) {
        setImageUrls((prev) => [...prev, ...result.data!.urls]);
      }

      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImageLeft(index: number) {
    if (index === 0) return;
    setImageUrls((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveImageRight(index: number) {
    setImageUrls((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function addManualUrl() {
    const url = manualUrl.trim();
    if (!url) return;
    setImageUrls((prev) => [...prev, url]);
    setManualUrl("");
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const categoryName = formData.get("category") as string;
      const categoryObj = categories.find((c) => c.name === categoryName);
      const input = {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string || (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
        description: formData.get("description") as string,
        category: categoryName,
        categorySlug: categoryObj?.slug || "",
        categoryId: categoryObj?.id,
        originCountry: formData.get("originCountry") as string || "China",
        images: imageUrls,
        moq: parseInt(formData.get("moq") as string) || 1,
        priceTiers: [
          { minQuantity: parseInt(formData.get("moq") as string) || 1, maxQuantity: null, price: parseFloat(formData.get("price") as string) || 0, currency: "USD" },
        ],
        stockStatus: formData.get("stockStatus") as string || "In Stock",
        stockQuantity: parseInt(formData.get("stockQuantity") as string) || 0,
        badges: [] as string[],
        specs: [] as Array<{ label: string; value: string }>,
        featured: formData.get("featured") === "on",
      };

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, input);
        if (result.success) {
          setShowForm(false);
          setEditingProduct(null);
          // Refresh the page to get updated data
          window.location.reload();
        } else {
          setError(result.error || "Failed to update product");
        }
      } else {
        const result = await createProduct(input);
        if (result.success) {
          setShowForm(false);
          window.location.reload();
        } else {
          setError(result.error || "Failed to create product");
        }
      }
    });
  }

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
          <button
            onClick={openAddForm}
            className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-secondary">
                          {product.images[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-5 w-5 text-text-disabled" />
                            </div>
                          )}
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
                      {product.priceTiers.length > 1 && (
                        <p className="text-xs text-text-secondary">to {formatPrice(product.priceTiers[product.priceTiers.length - 1]?.price ?? 0)}</p>
                      )}
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
                        <button
                          onClick={() => openEditForm(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-brand"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-error disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="h-10 w-10 text-text-disabled mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">No products found. Add your first product to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-navy">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name || ""}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Slug (optional)</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={editingProduct?.slug || ""}
                    placeholder="auto-generated from name"
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description || ""}
                  rows={3}
                  required
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || ""}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Origin Country</label>
                  <input
                    type="text"
                    name="originCountry"
                    defaultValue={editingProduct?.originCountry || "China"}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Product Images
                  {imageUrls.length > 0 && (
                    <span className="ml-1 text-text-disabled">({imageUrls.length} image{imageUrls.length !== 1 ? "s" : ""})</span>
                  )}
                </label>

                {/* Upload dropzone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-input)] border-2 border-dashed border-border bg-surface-secondary/30 px-4 py-6 cursor-pointer transition-colors hover:border-brand hover:bg-brand-light/20",
                    isUploading && "border-brand bg-brand-light/20"
                  )}
                >
                  {isUploading ? (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      <p className="text-xs text-text-secondary">Uploading images...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-text-disabled" />
                      <p className="text-xs text-text-secondary text-center">
                        <span className="font-medium text-brand">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-text-disabled">PNG, JPG, WebP up to 10MB each</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                {/* Image previews with reorder/remove */}
                {imageUrls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-3">
                      {imageUrls.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="group relative h-24 w-24 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-secondary"
                        >
                          <Image
                            src={url}
                            alt={`Product image ${index + 1}`}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-brand/90 px-1 py-0.5 text-center text-[10px] font-semibold text-white">
                              Main
                            </div>
                          )}
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-error"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {/* Reorder buttons */}
                          <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImageLeft(index);
                              }}
                              disabled={index === 0}
                              className="flex h-5 w-5 items-center justify-center rounded bg-navy/70 text-white hover:bg-navy disabled:opacity-30"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImageRight(index);
                              }}
                              disabled={index === imageUrls.length - 1}
                              className="flex h-5 w-5 items-center justify-center rounded bg-navy/70 text-white hover:bg-navy disabled:opacity-30"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-text-disabled">
                      Drag arrows to reorder. First image is the main display image.
                    </p>
                  </div>
                )}

                {/* Manual URL input for external images */}
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                    <input
                      type="url"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addManualUrl();
                        }
                      }}
                      placeholder="Paste an image URL (e.g. https://images.unsplash.com/...)"
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addManualUrl}
                    disabled={!manualUrl.trim()}
                    className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">MOQ</label>
                  <input
                    type="number"
                    name="moq"
                    defaultValue={editingProduct?.moq || 1}
                    min={1}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Base Price (USD)</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingProduct?.priceTiers[0]?.price || 0}
                    min={0}
                    step="0.01"
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Stock Quantity</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    defaultValue={0}
                    min={0}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Stock Status</label>
                  <select
                    name="stockStatus"
                    defaultValue={editingProduct?.stockStatus || "In Stock"}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Pre-Order">Pre-Order</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={editingProduct?.featured || false}
                      className="h-4 w-4 rounded border-border"
                    />
                    Featured Product
                  </label>
                </div>
              </div>

              {/* Hidden category slug - will be set from the selected category */}
              <input type="hidden" name="categorySlug" value="" />

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading}
                  className="flex h-10 items-center rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : isUploading ? "Uploading..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}