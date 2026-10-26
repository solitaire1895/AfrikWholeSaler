"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
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
  Video,
  Trash,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice, cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductVideo,
} from "@/app/actions/crud";
import type { Product, Category, SubCategory, PriceTier } from "@/types";
import { uploadProductImage, uploadProductVideoFile, type MediaResult } from "@/lib/product-media";
import { slugify } from "@/lib/slug";
import { useI18n } from "@/i18n/client";
import { categoryName, subCategoryName } from "@/i18n/names";

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
}

export function ProductsManager({
  products: initialProducts,
  categories,
  subCategories,
}: ProductsManagerProps) {
  const { formatPrice: formatCurrencyPrice } = useCurrency();
  const { t, format } = useI18n();
  const P = t.adminCatalog.products;
  const C = t.admin.common;
  const stock = t.catalog.stock as Record<string, string>;
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // When the server sends a fresh list (after router.refresh), start from it.
  // Done during render rather than in an effect, which would render twice.
  const [syncedFrom, setSyncedFrom] = useState(initialProducts);
  if (syncedFrom !== initialProducts) {
    setSyncedFrom(initialProducts);
    setProducts(initialProducts);
  }
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Image management state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video management state
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Pricing tiers state
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([
    { minQuantity: 1, maxQuantity: null, price: 0, currency: "USD" },
  ]);

  // Sub-category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string>("");

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.categorySlug !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter sub-categories based on selected category
  const availableSubCategories = selectedCategoryId
    ? subCategories.filter((sc) => sc.categoryId === selectedCategoryId)
    : [];

  function openAddForm() {
    setEditingProduct(null);
    setImageUrls([]);
    setManualUrl("");
    setVideoUrl(null);
    setPriceTiers([{ minQuantity: 1, maxQuantity: null, price: 0, currency: "USD" }]);
    setSelectedCategoryId("");
    setSelectedSubCategorySlug("");
    setShowForm(true);
    setError(null);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setImageUrls(product.images);
    setManualUrl("");
    setVideoUrl(product.videoUrl);
    setPriceTiers(
      product.priceTiers.length > 0
        ? product.priceTiers
        : [{ minQuantity: product.moq, maxQuantity: null, price: 0, currency: "USD" }]
    );
    // Find the category ID from the categories list
    const cat = categories.find((c) => c.slug === product.categorySlug);
    setSelectedCategoryId(cat?.id || "");
    setSelectedSubCategorySlug(product.subCategorySlug || "");
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setError(null);
    setImageUrls([]);
    setManualUrl("");
    setVideoUrl(null);
    setPriceTiers([{ minQuantity: 1, maxQuantity: null, price: 0, currency: "USD" }]);
    setSelectedCategoryId("");
    setSelectedSubCategorySlug("");
  }

  function handleDelete(productId: string) {
    if (!confirm(P.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        setError(result.error || C.failed);
      }
    });
  }

  const mediaError = useCallback(
    (result: Exclude<MediaResult, { url: string }>, name: string) => {
      if (result.error === "failed") return `${name}: ${result.detail ?? C.failed}`;
      return format(P[result.error], { name });
    },
    [P, C.failed, format]
  );

  // --- Image upload handlers ---

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      // Straight to Supabase Storage, one file at a time (no server size limit).
      const problems: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadProductImage(file);
        if ("url" in result) setImageUrls((prev) => [...prev, result.url]);
        else problems.push(mediaError(result, file.name));
      }
      if (problems.length) setError(problems.join(" "));
    } catch {
      setError(P.uploadImagesFailed);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [P.uploadImagesFailed, mediaError]);

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

  // --- Video upload handlers ---

  const handleVideoSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploadingVideo(true);
    setError(null);

    try {
      const result = await uploadProductVideoFile(file);
      if ("url" in result) setVideoUrl(result.url);
      else setError(mediaError(result, file.name));
    } catch {
      setError(P.uploadVideoFailed);
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  }, [P.uploadVideoFailed, mediaError]);

  async function handleRemoveVideo() {
    if (!videoUrl) return;
    // Extract file path from URL for deletion
    const urlParts = videoUrl.split("/");
    const filePath = urlParts.slice(-2).join("/"); // user_id/filename.ext

    startTransition(async () => {
      const result = await deleteProductVideo(filePath);
      if (result.success) {
        setVideoUrl(null);
      } else {
        setError(result.error || C.failed);
      }
    });
  }

  // --- Pricing tier handlers ---

  function addPriceTier() {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier?.maxQuantity ? lastTier.maxQuantity + 1 : (lastTier?.minQuantity || 1) + 1;
    setPriceTiers([...priceTiers, { minQuantity: newMin, maxQuantity: null, price: 0, currency: "USD" }]);
  }

  function removePriceTier(index: number) {
    if (priceTiers.length === 1) return; // Keep at least one tier
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  }

  function updatePriceTier(index: number, field: keyof PriceTier, value: string | number | null) {
    setPriceTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const categoryName = formData.get("category") as string;
      const categoryObj = categories.find((c) => c.name === categoryName);
      const subCategorySlug = formData.get("subCategorySlug") as string;
      const subCategoryObj = subCategories.find((sc) => sc.slug === subCategorySlug);

      const moq = parseInt(formData.get("moq") as string) || 1;

      // Ensure first tier's minQuantity matches MOQ
      const finalPriceTiers = priceTiers.map((tier, idx) => ({
        ...tier,
        minQuantity: idx === 0 ? moq : tier.minQuantity,
        price: parseFloat(String(tier.price)) || 0,
      }));

      const input = {
        name: formData.get("name") as string,
        slug: slugify((formData.get("slug") as string) || (formData.get("name") as string)),
        description: formData.get("description") as string,
        category: categoryName,
        categorySlug: categoryObj?.slug || "",
        categoryId: categoryObj?.id,
        subCategory: subCategoryObj?.name || null,
        subCategorySlug: subCategoryObj?.slug || null,
        subCategoryId: subCategoryObj?.id || null,
        originCountry: formData.get("originCountry") as string || "China",
        images: imageUrls,
        videoUrl: videoUrl,
        moq,
        priceTiers: finalPriceTiers,
        stockStatus: formData.get("stockStatus") as string || "In Stock",
        stockQuantity: parseInt(formData.get("stockQuantity") as string) || 0,
        badges: [] as string[],
        specs: [] as Array<{ label: string; value: string }>,
        featured: formData.get("featured") === "on",
      };

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, input);
        if (result.success) {
          // Update local state immediately
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id
                ? {
                    ...p,
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    category: input.category,
                    categorySlug: input.categorySlug,
                    subCategory: input.subCategory,
                    subCategorySlug: input.subCategorySlug,
                    originCountry: input.originCountry,
                    images: input.images,
                    videoUrl: input.videoUrl,
                    moq: input.moq,
                    priceTiers: input.priceTiers,
                    stockStatus: input.stockStatus as Product["stockStatus"],
                    featured: input.featured,
                  }
                : p
            )
          );
          setShowForm(false);
          setEditingProduct(null);
        } else {
          setError(result.error || C.failed);
        }
      } else {
        const result = await createProduct(input);
        if (result.success) {
          // The server action returns the created product; reload to get fresh data
          setShowForm(false);
          window.location.reload();
        } else {
          setError(result.error || C.failed);
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">{P.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {P.lead}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddForm}
            className="flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            {P.add}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label={C.dismiss} className="text-error/70 hover:text-error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder={P.search}
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
          <option value="all">{P.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{categoryName(t, c.slug, c.name)}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{P.colProduct}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden sm:table-cell">{P.colCategory}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{P.colPrice}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden md:table-cell">{P.colStock}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide hidden lg:table-cell">{P.colRating}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{C.actions}</th>
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
                          <p className="text-xs text-text-secondary">{format(P.moq, { n: product.moq })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-text-secondary">{categoryName(t, product.categorySlug, product.category)}</span>
                      {product.subCategory && (
                        <span className="text-xs text-text-disabled block">{subCategoryName(t, product.subCategorySlug, product.subCategory)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy">{formatCurrencyPrice(product.priceTiers[0]?.price ?? 0)}</p>
                      {product.priceTiers.length > 1 && (
                        <p className="text-xs text-text-secondary">{format(P.to, { price: formatCurrencyPrice(product.priceTiers[product.priceTiers.length - 1]?.price ?? 0) })}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        product.stockStatus === "In Stock" ? "bg-success/10 text-success" :
                        product.stockStatus === "Low Stock" ? "bg-warning/10 text-warning" :
                        "bg-surface-secondary text-text-secondary"
                      )}>
                        {stock[product.stockStatus] ?? product.stockStatus}
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
                          aria-label={C.edit}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary hover:text-brand"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={isPending}
                          aria-label={C.delete}
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
                    <p className="text-sm text-text-secondary">{P.none}</p>
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
                {editingProduct ? P.editTitle : P.add}
              </h2>
              <button
                onClick={closeForm}
                aria-label={C.close}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.name}</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProduct?.name || ""}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.slug}</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={editingProduct?.slug || ""}
                    placeholder={P.slugPlaceholder}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.description}</label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description || ""}
                  rows={3}
                  required
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>

              {/* Category & Sub-Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.category}</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || ""}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.name === e.target.value);
                      setSelectedCategoryId(cat?.id || "");
                      setSelectedSubCategorySlug("");
                    }}
                    required
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="">{P.selectCategory}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{categoryName(t, c.slug, c.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.subCategory}</label>
                  <select
                    name="subCategorySlug"
                    value={selectedSubCategorySlug}
                    onChange={(e) => setSelectedSubCategorySlug(e.target.value)}
                    disabled={!selectedCategoryId || availableSubCategories.length === 0}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{P.noSubCategory}</option>
                    {availableSubCategories.map((sc) => (
                      <option key={sc.id} value={sc.slug}>{subCategoryName(t, sc.slug, sc.name)}</option>
                    ))}
                  </select>
                  {!selectedCategoryId && (
                    <p className="text-xs text-text-disabled mt-1">{P.categoryFirst}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.origin}</label>
                  <input
                    type="text"
                    name="originCountry"
                    defaultValue={editingProduct?.originCountry || "China"}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.stockQuantity}</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    defaultValue={0}
                    min={0}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {P.images}
                  {imageUrls.length > 0 && (
                    <span className="ml-1 text-text-disabled">{format(P.imageCount, { n: imageUrls.length })}</span>
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
                      <p className="text-xs text-text-secondary">{P.uploadingImages}</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-text-disabled" />
                      <p className="text-xs text-text-secondary text-center">
                        <span className="font-medium text-brand">{P.clickUpload}</span> {P.orDrag}
                      </p>
                      <p className="text-xs text-text-disabled">{P.imageFormats}</p>
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
                            alt={format(P.imageAlt, { n: index + 1 })}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-brand/90 px-1 py-0.5 text-center text-[10px] font-semibold text-white">
                              {P.main}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            aria-label={P.removeImage}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-error"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImageLeft(index);
                              }}
                              disabled={index === 0}
                              aria-label={P.moveLeft}
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
                              aria-label={P.moveRight}
                              className="flex h-5 w-5 items-center justify-center rounded bg-navy/70 text-white hover:bg-navy disabled:opacity-30"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-text-disabled">
                      {P.reorderHint}
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
                      placeholder={P.urlPlaceholder}
                      className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface pl-10 pr-4 text-sm focus:border-brand focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addManualUrl}
                    disabled={!manualUrl.trim()}
                    className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                  >
                    {P.addUrl}
                  </button>
                </div>
              </div>

              {/* Video Upload Section */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {P.video}
                </label>

                {videoUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-[var(--radius-sm)] border border-border bg-surface-secondary overflow-hidden">
                      <video
                        src={videoUrl}
                        controls
                        className="w-full max-h-64 object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        disabled={isPending}
                        aria-label={P.removeVideo}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy/70 text-white hover:bg-error transition-colors disabled:opacity-50"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-text-disabled">
                      {P.videoUploaded}
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-input)] border-2 border-dashed border-border bg-surface-secondary/30 px-4 py-6 cursor-pointer transition-colors hover:border-brand hover:bg-brand-light/20",
                      isUploadingVideo && "border-brand bg-brand-light/20"
                    )}
                  >
                    {isUploadingVideo ? (
                      <>
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                        <p className="text-xs text-text-secondary">{P.uploadingVideo}</p>
                      </>
                    ) : (
                      <>
                        <Video className="h-6 w-6 text-text-disabled" />
                        <p className="text-xs text-text-secondary text-center">
                          <span className="font-medium text-brand">{P.clickUpload}</span> {P.aVideo}
                        </p>
                        <p className="text-xs text-text-disabled">{P.videoFormats}</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* MOQ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.moqLabel}</label>
                  <input
                    type="number"
                    name="moq"
                    defaultValue={editingProduct?.moq || 1}
                    min={1}
                    required
                    onChange={(e) => {
                      const newMoq = parseInt(e.target.value) || 1;
                      // Update first tier's minQuantity to match MOQ
                      setPriceTiers((prev) => {
                        if (prev.length === 0) return prev;
                        const next = [...prev];
                        next[0] = { ...next[0], minQuantity: newMoq };
                        return next;
                      });
                    }}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{P.stockStatus}</label>
                  <select
                    name="stockStatus"
                    defaultValue={editingProduct?.stockStatus || "In Stock"}
                    className="w-full h-10 rounded-[var(--radius-input)] border border-border bg-surface px-4 text-sm focus:border-brand focus:outline-none cursor-pointer"
                  >
                    <option value="In Stock">{stock["In Stock"]}</option>
                    <option value="Low Stock">{stock["Low Stock"]}</option>
                    <option value="Out of Stock">{stock["Out of Stock"]}</option>
                    <option value="Pre-Order">{stock["Pre-Order"]}</option>
                  </select>
                </div>
              </div>

              {/* Price Tiers Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-secondary">
                    {P.tiers}
                    <span className="ml-1 text-text-disabled">{format(P.tierCount, { n: priceTiers.length })}</span>
                  </label>
                  <button
                    type="button"
                    onClick={addPriceTier}
                    className="flex h-7 items-center gap-1 rounded-[var(--radius-sm)] border border-border px-2 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {P.addTier}
                  </button>
                </div>

                <div className="space-y-2">
                  {priceTiers.map((tier, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center rounded-[var(--radius-sm)] border border-border bg-surface-secondary/30 p-2"
                    >
                      <div className="col-span-3">
                        <label className="block text-[10px] font-medium text-text-disabled mb-0.5">{P.minQty}</label>
                        <input
                          type="number"
                          value={tier.minQuantity}
                          onChange={(e) => updatePriceTier(index, "minQuantity", parseInt(e.target.value) || 0)}
                          min={0}
                          className="w-full h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs focus:border-brand focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-medium text-text-disabled mb-0.5">{P.maxQty}</label>
                        <input
                          type="number"
                          value={tier.maxQuantity ?? ""}
                          onChange={(e) => updatePriceTier(index, "maxQuantity", e.target.value ? parseInt(e.target.value) : null)}
                          min={0}
                          placeholder="∞"
                          className="w-full h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs focus:border-brand focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-medium text-text-disabled mb-0.5">{P.price}</label>
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) => updatePriceTier(index, "price", parseFloat(e.target.value) || 0)}
                          min={0}
                          step="0.01"
                          className="w-full h-8 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-xs focus:border-brand focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3 flex items-end justify-end pb-0.5">
                        <button
                          type="button"
                          onClick={() => removePriceTier(index)}
                          disabled={priceTiers.length === 1}
                          aria-label={P.removeTier}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-error/10 hover:text-error transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-disabled mt-1.5">
                  {P.tiersHint}
                </p>
              </div>

              {/* Featured checkbox */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={editingProduct?.featured || false}
                    className="h-4 w-4 rounded border-border"
                  />
                  {P.featured}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-10 items-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  {C.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending || isUploading || isUploadingVideo}
                  className="flex h-10 items-center rounded-[var(--radius-button)] bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? C.saving : isUploading ? P.uploadingImages : isUploadingVideo ? P.uploadingVideo : editingProduct ? P.update : P.create}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}